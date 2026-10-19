# Engineering library and model coverage — 19 October 2026

The machine/material library is owner-scoped SQLite data reusable across projects. It supports manual entry and staged CSV validation/import. Unknown specifications remain null. A supplied manufacturer URL is a reference awaiting independent checking; it is not an application verification seal. No numerical OEM catalogue has been admitted in this increment.

## Load your own information

Open **Machine park** or **Materials** on the left. Expand **Add entry**, or download the CSV template. Use UTF-8, a comma delimiter and a decimal point. Headers carry units; do not translate or rename them. Empty cells stay unknown. Downloaded templates list every supported column, including `name` and required `source_kind` (`user_declared`, `manufacturer_reference`, `synthetic`). Select **Validate CSV**, inspect errors/count, then **Import validated rows**. Invalid batches commit nothing. Imports append entries; they do not overwrite existing records. Editing/deleting existing library entries is not implemented yet; add a clearly named replacement and explicitly select it in a fresh layout.

Money is an exact decimal string with an explicit currency, never silently converted. Machine hourly costs belong to the company and costing basis; an OEM normally cannot supply the factory's effective hourly rate. Record assumptions in notes. Force uses **kN**: one metric tonne-force is exactly **9.80665 kN**. A nominal “280” or “1100” without a unit and an actual machine/injection-unit configuration is insufficient.

| Machine input | Purpose / missing-data rule |
| --- | --- |
| Manufacturer, model, injection unit, screw diameter | Identify the actual configuration; an identical press family may have different injection units |
| Clamp force, tie-bar width/height | Necessary clamp and rectangular envelope checks; mould rotation between columns is not searched |
| Minimum/maximum mould height, opening stroke, daylight | Necessary thickness/opening checks; mounting, nozzle/ejector interfaces and moving-envelope collisions remain unchecked |
| Maximum usable shot volume in cm³ | Volumetric screen only; PS-rated shot mass is not substituted. Use the applicable real volume and record reserve/limit basis in notes |
| Hourly cost and currency | User-supplied costs only; no unit-cost recommendation is computed |

Material families include ABS, PC, PC/ABS, PP homopolymer/copolymer, PE-HD/LD/LLD, PA6/PA66, PBT, POM, PET, PMMA and TPE. These are taxonomy entries, not validated grades. Supply a real grade, supplier and dated datasheet/reference. Optional stored fields are solid/melt density, heat capacity, thermal conductivity and melt-temperature range. They do not yet form a complete rheological/PVT/drying dataset. Melt density is used only for the explicit shot-volume screen; thermal properties are stored for future models, not currently used to generate temperature curves.

## Product → mould → press → process

1. Create a generic project and confirm the customer/business case. Annual and total order quantities are distinct; do not infer one from the other.
2. Import an OBJ/STL with declared units (or choose the explicitly synthetic reference). STEP/B-rep and photo reconstruction are still future work.
3. Populate Machine park and Materials. In **Mould**, choose entries, an extraction axis and 1–8 cavities in a single transverse row. Gap, edge allowances, plate thickness and opening are editable assumptions.
4. Select **Preview mould layout → Approve and apply**. The server reads original mesh bytes, converts declared units to mm, places product copies and creates two plate envelopes. It does not cut a negative cavity, discover undercuts or design slides, ejection or cooling.
5. Read failed/incomplete/passed preliminary checks. Compare every registered press against the same layout/recipe in **Compare machine park**. All passed means only these necessary conditions pass; it is not a press/mould compatibility certification.
6. In **Process**, load the synthetic timing template. It takes the approved cavity count and material label when a layout exists; other template times/masses remain synthetic. Replace them with confirmed inputs, preview and approve. Load the template again after selecting a material if needed: changing a library selection does not silently rewrite an existing recipe.
7. Run. Cavities must match the layout; geometry replacements invalidate it even if original bytes have the same hash but units changed. Failed press checks block a linked run. Missing press data allows an explicitly exploratory L0 run, with an incomplete-compatibility notice. A linked layout currently keeps mould yaw at 0° in its declared extraction frame.
8. In **Time series**, choose mass compartments, robot X/Y/Z, opening percentage or output count. Seek/play/step and click the graph; animation, timeline and curve cursor share one clock. Export available channels as CSV, or download the full immutable run JSON. Pressure, melt temperature, moisture and torque are visibly unavailable, not flat zero traces.

Layout revisions copy selected library data, including exact money/source metadata. Later library additions do not silently change an approved layout. A run retains this snapshot and recalculates press checks using its actual saved recipe. The material name in a legacy recipe is a label; the selected grade snapshot is authoritative for the limited shot-density calculation. The operator must confirm that their recipe's mass/material inputs correspond to that grade.

## Equations currently executed

- Cavity-row pitch = transverse part bound + declared gap. Plate width = `cavities × bound + (cavities − 1) × gap + 2 × edge`. Thickness = two declared plate thicknesses + axial part bound. These are envelopes, not a manufacturing design.
- Preliminary clamp requirement: `F[kN] = projected_area_per_cavity[mm²] × cavity_pressure[MPa] × cavities × safety_factor / 1000`. The entered per-cavity area must include the allocated runner/sprue projected area. Pressure is an explicit uniform screening assumption, not hydraulic pressure or a solved cavity field. Bounds are never substituted for projected area.
- Shot volume: `V[cm³] = (part_mass[g] × cavities + runner_mass[g]) × 1000 / melt_density[kg/m³]`. Missing melt density or mass leaves this check incomplete. Cushion, residence time, plasticising capacity and pressure-dependent PVT effects require further checks.
- Process model `configured-l0/1`: deterministic resource scheduling and completion-time discrete mass transfers. No heat, flow or constitutive equation is solved. Mass is conserved across raw/conditioned/hopper/melt/mould/robot/belt/output/runner bins. Opening ramps and XYZ paths are illustrative interpolations of configured durations.

## Physical-model roadmap and required evidence

These established model families are **not implemented**. This register specifies what must be sourced and validated before they can generate curves; it is not a claim of a researched or calibrated solver.

| Phenomenon | Candidate model / relation | Required data and validation |
| --- | --- | --- |
| Rheology and filling | Cross-WLF viscosity; non-isothermal mass/momentum/energy balance | Grade-specific fitted coefficients and validity range, shear/temperature/pressure data, geometry/mesh and boundary conditions; compare pressure/fill-front measurements |
| Melt compression, packing, shrinkage | Two-domain Tait PVT | Grade-specific coefficients, phase-transition/crystallisation treatment; compare PVT/packing/part-weight data |
| Plasticising | Screw solids-conveying/melting and energy balance (Tadmor/Gogos model family) | Screw/feed geometry, speeds/back pressure, barrel boundary conditions, friction and enthalpy/rheology data; validate throughput, melt homogeneity, torque and temperature |
| Cooling | Transient heat equation `rho cp dT/dt = div(k grad T)`; restricted slab model as a first benchmark | Temperature-dependent properties, geometry, contacts and coolant conditions; independent analytical slab check followed by measured cooling data |
| Drying | Calibrated moisture-diffusion/kinetics model | Grade, initial/equilibrium moisture, pellet size, dew point, air temperature/flow and measured drying curve; a residence timer is not moisture prediction |
| Cooling-channel layout | Thermal/conjugate-flow screen plus geometric tooling constraints | Mould steel, circuits, coolant, pressure loss, clearances, drilling/manufacturing and measured thermal balance; no universal automatic optimum |
| PCA / PLS | Corrected statistical implementation, grouped validation and uncertainty | Real licensed process/quality data with cycle/batch/press/grade IDs, time alignment and independent holdouts; never treat synthetic schedules as experimental calibration |

Foundational literature to consult includes Williams–Landel–Ferry (temperature dependence), Cross (non-Newtonian viscosity), Tadmor & Gogos, *Principles of Polymer Processing*, and standard transient heat-conduction references. Exact variants, publication/licensing metadata, coefficients, domains and independent numerical references must be recorded before implementation. Adding a familiar equation name alone does not validate process prediction.

## Official source access and catalogue coverage

The application links ENGEL, ARBURG, KraussMaffei, Haitian, Sumitomo (SHI) Demag, FANUC, BASF and Covestro in **Manufacturer coverage**. All attempted HTTPS accesses were denied by this development environment's egress proxy on 19 October (HTTP tunnel 403). Autodesk documentation access was also denied. Required exact domains were saved in the environment configuration draft; saving that draft did not activate access. Therefore coverage is **zero independently verified machine configurations**, across all tonnages. No press specifications, material grades/properties, costs or validity ranges have been guessed or copied from inaccessible sources. A reviewed catalogue/import pipeline is still outstanding.
