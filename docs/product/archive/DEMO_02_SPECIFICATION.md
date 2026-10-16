# Archived demo 02 specification

Historical documentation, translated into English on 2026-10-16. The [platform specification](../SPECIFICATION.md) supersedes its product scope. This file documents legacy schema v4 and the optional enclosure, not the new platform data contract.

## Reference case

Mould designer; indoor electronic device with paired cosmetic shells. Assembled dimensions 120 × 80 × 35 mm; initial equal 17.5 mm heights and R8 outline. Compare 1.5/2/2.5 mm walls without choosing a final nominal thickness. Material candidates are ABS, PC/ABS, PP, PE and unspecified copolymers; grade-specific properties are missing.

Glossy front/side surfaces; six tool-removable clips, three per long side; target 1,000 cycles without damage. Four PCBs are 40 × 25 × 8 mm including components, arranged two by two on one level. Sealed connector cover, protected pressure vent and IP65 target also with cable connected. Seals, geometry, dissipation and qualification remain unresolved.

Both existing and purchase-candidate presses are supported. Demand is user-defined without predetermined bands. The initial five-year programme is illustrative/editable. Cost begins exploratory and can later have a fixed target. Selling price and mould budget are separate inputs.

## Legacy export contract

- `schema_version: 4`; `id`, `created_at`, `updated_at`, `dataset_kind`, `currency`, `units`.
- `brief`, `part`, `machines`; missing numerical inputs are `null`.
- `part.wall_options_mm` contains positive candidate thicknesses; `nominal_wall_mm` is a distinct final selection.
- Finish/fastening: `surface_finish`, `fastening`.
- Geometry: dimensions, `opening`, `dimension_basis`, `front_share_percent`, `corner_radius_mm`.
- Clips/appearance: `aesthetic_surfaces`, `snap_service`, `snap_count`, `snap_layout`, `snap_cycles`.
- Optional functional fields: `electronics_configuration`, `pcb_count`, `external_openings`, `ip_target`, `thermal_strategy`, `connector_strategy`, `ip_in_use`, `pcb_layout`, `pcb_length_mm`, `pcb_width_mm`, `pcb_height_mm`.
- `concept_preview.wall_mm` is the displayed candidate, not an implicit nominal selection.
- `sources` retains demo requirements, user input and illustrative provenance.
- Export adds timestamp, actual prototype capabilities and `engineering_validation: not_performed`.

Migration from v1/v2/v3 retains data, notes and selections. An existing nominal wall also becomes a candidate. New requirements remain unspecified; old radius remains R0. Completing example requirements fills only missing fields without replacing valid choices, including zero radius. Backups use the same migration.

## Geometry and acceptance

Uniform-wall rectangular shells with a rounded 2D outline, rear opening, short-side opening or paired halves. Inner radius is external radius minus wall, limited to zero. Arcs use 24 segments per quarter circle. Volume is computed from the polygonal mesh; R8 cases differ by less than 0.01% from ideal rounded-outline volume in existing geometry tests.

Geometry does not include draft, shrinkage, clips, out-of-plane fillets, ribs, mating details, tool access, runners, ejectors or moulds. OBJ coordinates use a documented millimetre convention; the export is not STEP or executable tooling. Volume alone does not establish mass, cycle time or shot requirements.

Original checks cover explicit units/ranges, preserving last valid inputs, refusing invalid navigation/export, separate existing/purchase presses, local persistence and backups, positive unique wall candidates, responsive layout, geometric invalidation, actual OBJ download with separate assembled components and truthful planned-module labels.

IP65 is a requested qualification, not a property produced by the mesh. Shell joint, cover, cable entry and vent need seals and tests. Pressure equalisation does not provide cooling airflow. Thermal study needs power dissipation, ambient conditions, temperature limits, board position and material properties. Snap-fit life requires material/geometry, forces, conditions and acceptance tests.
