# Requirements and decision register

Updated 2026-10-16. Later clarifications govern the current scope; historical answers remain below. See [specification](SPECIFICATION.md), [roadmap](ROADMAP.md) and [actual status](IMPLEMENTATION_STATUS.md).

## Current scope

The platform starts from commercial customer requirements, uses chat as primary input and connects generic product, mould, cell and material-to-conveyor simulation. AI and functional/graphics components must be open source. Modelling supports technical/economic and process decisions rather than complete executable CAD design.

Enclosure dimensions, finish, candidate materials, clips, electronics, IP target and initial five-year duration are properties of an optional demonstration case. They are not new-project defaults. Free demand entry, price/cost separation and existing-versus-purchase resource comparison are general requirements.

## Decision register

| ID | Decision | Scope/status |
| --- | --- | --- |
| D01 | Injection moulding | Confirmed platform scope |
| D02 | Start with technical and commercial customer requirements | Confirmed |
| D03 | Demand, cost and press influence mould alternatives | Confirmed |
| D04 | Include plasticisation, cycle and robot simulation | Confirmed target |
| D05 | Analysis/optimisation uses real user data | Confirmed |
| D06 | Professional UX and AI integration | Confirmed |
| D07 | No real CAD or production data available at project start | Initial condition |
| D08 | Initial main user: mould designer | Confirmed |
| D09 | Complex initial example with undercuts/slides | Example only |
| D10 | Existing presses and purchase candidates from the first version | Confirmed |
| D11 | Cosmetic enclosure with fasteners/undercuts | Optional example |
| D12 | STEP input or guided parametric creation | Confirmed target |
| D13 | Useful output: mould concept, costs and press compatibility | Confirmed target |
| D14 | Indoor electronic device | Example only |
| D15 | Indicative 120 × 80 × 35 mm envelope | Example only |
| D16 | ABS, PC/ABS, PP, PE and copolymer alternatives | Example; grades missing |
| D17 | User-defined annual demand without commercial bands/ceiling | Confirmed general requirement |
| D18 | Initial five-year programme, editable | Example only |
| D19 | Derive cost through comparison, optionally set a target later | Confirmed approach |
| D20 | Glossy finish and high cosmetic requirements | Example only |
| D21 | Snap fits only | Example only |
| D22 | Compare 1.5/2/2.5 mm; no final wall selected | Example only |
| D23 | Paired front/rear shells | Example only |
| D24 | Front and side cosmetic surfaces | Example only |
| D25 | Tool disassembly without damage | Example only |
| D26 | Dimensions describe the complete assembled product | Example only |
| D27 | Initial 50/50 height split | Example only |
| D28 | Six snap fits | Example only |
| D29 | Three snap fits per long side | Example only |
| D30 | Target 1,000 assembly/disassembly cycles | Unverified example requirement |
| D31 | Initial external corner radius 8 mm | Example only |
| D32 | Multiple electronic boards | Example only |
| D33 | Connector/ventilation openings, refined by D35 | Historical example request |
| D34 | IP65 target | Unverified example requirement |
| D35 | Closed enclosure with protected pressure-equalisation vent | Example clarification |
| D36 | Four PCBs | Example only |
| D37 | Connector behind a sealed cover | Example only |
| D38 | IP65 also with cable connected | Unverified example requirement |
| D39 | PCBs two by two on one level | Example only |
| D40 | Each PCB including components: 40 × 25 × 8 mm | Example only |
| D41 | Professional modern modelling-style visual experience | Requested UX |
| D42 | Description, 3D file and photo inputs | Confirmed target |
| D43 | Explicit path from product creation to mould work | Requested workflow |
| D44 | Prefer online use | Confirmed target distribution |
| D45 | Generic products and flexible descriptions; enclosure is only a demo | Confirmed scope correction |
| D46 | Feasibility/process platform, not focused on executable CAD design | Confirmed scope correction |
| D47 | Prioritise customer, market, quantities, price and commercial information | Confirmed |
| D48 | Integrated product, mould and production-cell modules | Confirmed |
| D49 | Press/mould, Cartesian robot and conveyor with tracked part orientation | Confirmed |
| D50 | Complete granule-to-conveyor process with optional drying | Confirmed |
| D51 | Time-based animation with graphics and parameters in all phases | Confirmed target |
| D52 | Model cooling circuit placement | Confirmed |
| D53 | Chat first; detailed fields contextual and secondary | Confirmed |
| D54 | Open-source AI across modules and open-source graphics/functions | Confirmed |
| D55 | Sufficient functional precision without every executable component detail | Confirmed |
| D56 | GetcraftAI as an experience reference | Requested; service not verified |
| D57 | Official repository language: English | Confirmed 2026-10-16 |
| D58 | UI selectable EN/IT/FR/ES, English default | Confirmed 2026-10-16 |
| D59 | Keep progress aligned with the roadmap and make actual status explicit | Confirmed 2026-10-16 |

## Next investigation

Implement P1/B01–B04: generic commercial brief, shared chat/properties and server state with actual open-source AI. Details of each product, mould and cell belong inside that project. Enclosure-specific questions do not block the general foundation.

## Working rules

Retain confirmed requirements without repeatedly asking them. Mark assumptions and missing information explicitly. Keep measured production data separate from examples/simulation. Use verifiable tools for geometry/calculations. Compare alternative scenarios and retain versions/sources. Hosting, hardware, AI model and budget remain concrete deployment decisions, not reasons to postpone independent implementation.
