"""Mesh-bound cavity layouts and necessary (not sufficient) press checks, in SI/mm.

This is an envelope layout calculator, not a CAD kernel, filling solver or tool design.
"""
import math
import re
import struct
from typing import Annotated, Literal

from pydantic import Field

from .schemas import Provenance, StrictModel
from .store import DomainError

Length = Annotated[float, Field(gt=0, le=100000, allow_inf_nan=False)]


class LayoutSpec(StrictModel):
    machine_id: str | None = None
    material_id: str | None = None
    cavities: Annotated[int, Field(ge=1, le=8)] = 1
    ejection_axis: Literal['x', 'y', 'z'] = 'z'
    cavity_gap_mm: Length = 40
    edge_allowance_mm: Length = 60
    plate_thickness_mm: Length = 80
    opening_mm: Length = 200
    projected_area_mm2: Annotated[float, Field(gt=0, le=1e10, allow_inf_nan=False)] | None = None
    cavity_pressure_mpa: Annotated[float, Field(gt=0, le=500, allow_inf_nan=False)] | None = None
    clamp_safety_factor: Annotated[float, Field(ge=1, le=3, allow_inf_nan=False)] = 1.2


class LayoutRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=0)]
    changes: LayoutSpec
    source: Provenance


def mesh_bounds(content, name, units):
    """Read coordinates only. No solid-volume or silhouette-area inference."""
    vertices = []
    if name.lower().endswith('.obj'):
        for line in content.decode('utf-8', errors='strict').splitlines():
            fields = line.split()
            if fields and fields[0] == 'v':
                vertices.append(tuple(float(v) for v in fields[1:4]))
                if len(vertices) > 300000:
                    raise ValueError('Mesh vertex limit exceeded.')
    elif len(content) >= 84 and 84 + struct.unpack_from('<I', content, 80)[0] * 50 == len(content):
        count = struct.unpack_from('<I', content, 80)[0]
        if count > 100000:
            raise ValueError('Mesh triangle limit exceeded.')
        for i in range(count):
            vertices.extend(struct.unpack_from('<fff', content, 84 + i * 50 + 12 + j * 12) for j in range(3))
    else:
        for match in re.finditer(rb'\bvertex\s+([^\r\n]+)', content):
            vertices.append(tuple(float(v) for v in match[1].split()))
            if len(vertices) > 300000:
                raise ValueError('Mesh vertex limit exceeded.')
    if not vertices or any(len(v) != 3 or any(not math.isfinite(x) for x in v) for v in vertices):
        raise ValueError('No finite three-dimensional mesh coordinates.')
    scale = {'mm': 1, 'cm': 10, 'm': 1000, 'in': 25.4}[units]
    bounds = [(max(v[i] for v in vertices) - min(v[i] for v in vertices)) * scale for i in range(3)]
    if any(not math.isfinite(b) or b <= 0 or b > 100000 for b in bounds):
        raise ValueError('Mesh bounds must be positive and within 100 m.')
    return bounds


def build_layout(store, db, project, spec):
    from .resources import Resources
    asset = project['asset']
    if not asset:
        raise DomainError(422, 'Import a product mesh first (OBJ/STL with declared units).')
    row = db.execute('SELECT content FROM assets WHERE id=? AND project_id=?', (asset['id'], project['id'])).fetchone()
    try:
        bounds = mesh_bounds(bytes(row[0]), asset['name'], asset['source_units'])
    except (ValueError, UnicodeError, struct.error) as error:
        raise DomainError(422, 'Cannot calculate mesh bounds: ' + str(error)) from error
    # Right-handed rotation to put the declared extraction axis along cell X.
    indices = {'x': [0, 1, 2], 'y': [1, 0, 2], 'z': [2, 1, 0]}[spec.ejection_axis]
    depth, width, height = [bounds[i] for i in indices]
    pitch = width + spec.cavity_gap_mm
    mould = {'depth_mm': 2 * spec.plate_thickness_mm + depth,
             'width_mm': spec.cavities * width + (spec.cavities - 1) * spec.cavity_gap_mm + 2 * spec.edge_allowance_mm,
             'height_mm': height + 2 * spec.edge_allowance_mm}
    library = Resources.__new__(Resources); library.store = store
    machine = library.get(db, spec.machine_id, 'machine') if spec.machine_id else None
    material = library.get(db, spec.material_id, 'material') if spec.material_id else None
    return {'spec': spec.model_dump(), 'asset_sha256': asset['sha256'], 'asset_id': asset['id'],
            'mesh_bounds_mm': bounds, 'part_cell_bounds_mm': [depth, width, height], 'mould': mould,
            'cavity_positions_mm': [[0, (i - (spec.cavities - 1) / 2) * pitch, 0] for i in range(spec.cavities)],
            'machine': machine, 'material': material, 'fidelity': 'envelope_layout',
            'limitations': ['Plate envelopes only: no shaped cavities, parting surfaces, slides, ejectors or cooling channels.',
                            'Mesh bounds do not establish mouldability, solid volume or projected area.',
                            'Press checks are necessary conditions; collision, tooling interfaces and robot reach remain unverified.']}


def press_checks(layout, scenario=None):
    s, mould = layout['spec'], layout['mould']
    m = layout['machine']['data'] if layout['machine'] else {}
    results = []

    def check(code, required, available, relation='max'):
        passed = None if required is None or available is None else (required <= available if relation == 'max' else required >= available)
        results.append({'code': code, 'status': 'incomplete' if passed is None else 'passed' if passed else 'failed',
                        'required': required, 'available': available})

    check('tiebar_width_mm', mould['width_mm'], m.get('tiebar_x_mm'))
    check('tiebar_height_mm', mould['height_mm'], m.get('tiebar_y_mm'))
    check('minimum_mould_mm', mould['depth_mm'], m.get('mould_min_mm'), 'min')
    check('maximum_mould_mm', mould['depth_mm'], m.get('mould_max_mm'))
    check('opening_stroke_mm', s['opening_mm'], m.get('opening_stroke_mm'))
    check('daylight_mm', mould['depth_mm'] + s['opening_mm'], m.get('max_daylight_mm'))
    check('part_extraction_mm', layout['part_cell_bounds_mm'][0], s['opening_mm'])
    force = s['projected_area_mm2'] * s['cavity_pressure_mpa'] * s['cavities'] * s['clamp_safety_factor'] / 1000 if s['projected_area_mm2'] and s['cavity_pressure_mpa'] else None
    check('clamp_force_kn', force, m.get('clamp_force_kn'))
    density = layout['material']['data'].get('melt_density_kg_m3') if layout['material'] else None
    volume = (scenario['part_mass_g'] * scenario['cavities'] + scenario['runner_mass_g']) * 1000 / density if density and scenario else None
    check('shot_volume_cm3', volume, m.get('max_shot_cm3'))
    return results
