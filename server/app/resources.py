"""Owner-scoped reusable machines/materials. No inferred OEM specifications."""
import csv
import io
import json
from typing import Annotated, Literal
from uuid import uuid4

from pydantic import Field, field_validator, field_serializer, model_validator

from .schemas import CommercialPatch, Money, StrictModel
from .store import DomainError, encoded

Positive = Annotated[float, Field(gt=0, le=1e10, allow_inf_nan=False)]
Text = Annotated[str, Field(max_length=180)]


class ResourceBase(StrictModel):
    name: Annotated[str, Field(min_length=1, max_length=180)]
    manufacturer: Text | None = None
    source_kind: Literal['user_declared', 'synthetic', 'manufacturer_reference']
    source_url: Annotated[str, Field(max_length=600)] | None = None
    notes: Annotated[str, Field(max_length=2000)] = ''

    @model_validator(mode='after')
    def provenance(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("A non-blank name is required.")
        if self.source_url:
            from urllib.parse import urlsplit
            p = urlsplit(self.source_url)
            if p.scheme != 'https' or not p.hostname or p.username or p.password:
                raise ValueError('Source URLs must be HTTPS without credentials.')
        if self.source_kind == 'manufacturer_reference' and not self.source_url:
            raise ValueError('A manufacturer reference needs its source URL; it remains user-supplied, not independently verified.')
        return self


class Machine(ResourceBase):
    model: Text | None = None
    injection_unit: Text | None = None
    clamp_force_kn: Positive | None = None
    tiebar_x_mm: Positive | None = None
    tiebar_y_mm: Positive | None = None
    mould_min_mm: Positive | None = None
    mould_max_mm: Positive | None = None
    opening_stroke_mm: Positive | None = None
    max_daylight_mm: Positive | None = None
    max_shot_cm3: Positive | None = None
    screw_diameter_mm: Positive | None = None
    max_injection_rate_cm3_s: Positive | None = None
    plasticising_capacity_g_s: Positive | None = None
    hourly_cost: Money | None = None
    currency: Literal['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY'] | None = None

    @model_validator(mode='after')
    def ranges(self):
        if self.hourly_cost is not None and self.currency is None:
            raise ValueError('Choose a currency for the user-defined hourly cost.')
        if self.mould_min_mm and self.mould_max_mm and self.mould_min_mm > self.mould_max_mm:
            raise ValueError('Minimum mould height exceeds maximum.')
        return self

    # Reuse the exact amount contract rather than binary floating-point costs.
    @field_validator("hourly_cost", mode="before")
    @classmethod
    def exact_cost(cls, value):
        return CommercialPatch.exact_amount(value)

    @field_serializer('hourly_cost')
    def cost_string(self, value):
        return None if value is None else format(value, 'f')


class Material(ResourceBase):
    family: Text | None = None
    grade: Text | None = None
    density_kg_m3: Positive | None = None
    melt_density_kg_m3: Positive | None = None
    specific_heat_j_kg_k: Positive | None = None
    conductivity_w_m_k: Positive | None = None
    melt_min_c: Annotated[float, Field(ge=0, le=600, allow_inf_nan=False)] | None = None
    melt_max_c: Annotated[float, Field(ge=0, le=600, allow_inf_nan=False)] | None = None

    @model_validator(mode='after')
    def temperature_range(self):
        if self.melt_min_c is not None and self.melt_max_c is not None and self.melt_min_c > self.melt_max_c:
            raise ValueError('Minimum melt temperature exceeds maximum.')
        return self


MODELS = {'machine': Machine, 'material': Material}
SOURCE_REGISTER = [
    {'manufacturer': name, 'url': url, 'status': 'access_blocked', 'verified_models': 0, 'checked_on': '2026-10-19'} for name, url in [
        ('ENGEL', 'https://www.engelglobal.com/en/products-and-solutions/injection-moulding-machines'),
        ('ARBURG', 'https://www.arburg.com/en/products-and-services/injection-moulding-machines/'),
        ('KraussMaffei', 'https://www.kraussmaffei.com/en/our-products/injection-molding-machinery'),
        ('Haitian', 'https://haitianpm.com/en/products/'), ('Sumitomo (SHI) Demag', 'https://www.sumitomo-shi-demag.eu/'),
        ('FANUC', 'https://www.fanuc.eu/eu-en/roboshot'), ('BASF', 'https://plastics-rubber.basf.com/global/en/performance_polymers/products'),
        ('Covestro', 'https://solutions.covestro.com/en/brands/makrolon')]]
FAMILIES = ['ABS', 'PC', 'PC/ABS', 'PP homopolymer', 'PP copolymer', 'PE-HD', 'PE-LD', 'PE-LLD', 'PA6', 'PA66', 'PBT', 'POM', 'PET', 'PMMA', 'TPE']


class ResourceRequest(StrictModel):
    kind: Literal['machine', 'material']
    data: dict


class ResourceImport(StrictModel):
    kind: Literal['machine', 'material']
    csv_text: Annotated[str, Field(min_length=1, max_length=262144)]
    commit: bool = False


class Resources:
    def __init__(self, store):
        self.store = store
        with store.connection(True) as db:
            db.execute('CREATE TABLE IF NOT EXISTS resources(id TEXT PRIMARY KEY,owner TEXT NOT NULL,kind TEXT NOT NULL,data TEXT NOT NULL,created REAL NOT NULL)')

    def list(self, kind):
        with self.store.connection() as db:
            return [{'id': r['id'], 'kind': r['kind'], 'data': json.loads(r['data'])} for r in db.execute('SELECT * FROM resources WHERE owner=? AND kind=? ORDER BY created DESC', (self.store.principal, kind))]

    def get(self, db, resource_id, kind):
        row = db.execute('SELECT * FROM resources WHERE id=? AND owner=? AND kind=?', (resource_id, self.store.principal, kind)).fetchone()
        if row is None:
            raise DomainError(404, 'The selected library entry was not found.')
        return {'id': row['id'], 'kind': row['kind'], 'data': json.loads(row['data'])}

    def save(self, kind, rows):
        validated = [MODELS[kind].model_validate(row).model_dump(mode='json') for row in rows]
        with self.store.connection(True) as db:
            count = db.execute('SELECT count(*) FROM resources WHERE owner=?', (self.store.principal,)).fetchone()[0]
            if count + len(rows) > 2000:
                raise DomainError(409, 'Trial library limit reached (2,000 entries).')
            records = []
            for row in validated:
                record = {'id': str(uuid4()), 'kind': kind, 'data': row}
                db.execute('INSERT INTO resources VALUES(?,?,?,?,?)', (record['id'], self.store.principal, kind, encoded(row), self.store.clock()))
                records.append(record)
            return records

    def template(self, kind):
        text = io.StringIO(); csv.writer(text).writerow(MODELS[kind].model_fields)
        return text.getvalue()

    def import_csv(self, request):
        try:
            return self._import_csv(request)
        except csv.Error as error:
            raise DomainError(422, 'Malformed CSV quoting or record structure.') from error

    def _import_csv(self, request):
        from pydantic import ValidationError
        reader = csv.DictReader(io.StringIO(request.csv_text.lstrip('\ufeff')), strict=True)
        fields = MODELS[request.kind].model_fields
        if not reader.fieldnames or len(set(reader.fieldnames)) != len(reader.fieldnames) or set(reader.fieldnames) - set(fields):
            raise DomainError(422, 'CSV needs unique known column names. Download the template; units are part of each column name.')
        rows, errors = [], []
        text_keys = {'name', 'manufacturer', 'model', 'injection_unit', 'source_kind', 'source_url', 'notes', 'currency', 'family', 'grade', 'hourly_cost'}
        for number, raw in enumerate(reader, 2):
            if number > 501:
                raise DomainError(413, 'Import at most 500 rows at a time.')
            try:
                if None in raw:
                    raise ValueError('Too many cells in this row.')
                row = {k: (v.strip() if k in text_keys else float(v)) for k, v in raw.items() if v is not None and v.strip()}
                rows.append(MODELS[request.kind].model_validate(row).model_dump(mode='json'))
            except (ValueError, TypeError, ValidationError) as error:
                errors.append({'row': number, 'message': str(error)[:500]})
        if not rows and not errors:
            raise DomainError(422, 'The CSV has no data rows.')
        if errors:
            return {'valid': False, 'rows': [], 'errors': errors, 'saved': []}
        return {'valid': True, 'rows': rows, 'errors': [], 'saved': self.save(request.kind, rows) if request.commit else []}
