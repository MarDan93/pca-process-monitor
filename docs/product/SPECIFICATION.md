# Platform specification — revision 5

Updated 2026-10-17 after the master-request audit. This is the target product specification. [Implementation status](IMPLEMENTATION_STATUS.md) records what actually works; [the roadmap](ROADMAP.md) records delivery order.

## Purpose and boundaries

An online platform for commercial and technical feasibility studies of injection moulding. It connects customer requirements, products, mould concepts, production cells and simulation from incoming granules to finished parts on a conveyor. The main initial user is a mould designer, supported by commercial and manufacturing information.

Projects support different products. Geometry may be described, imported or reconstructed with assistance from photographs and measurements. Generic project data does not imply automatic, accurate generation or simulation of every possible shape. Supported operations and analysis limits remain explicit.

Models need functional detail sufficient for decisions about orientations, strokes, clearance, timing, cooling and economics. Complete manufacturing drawings and certified machine/robot programming are outside the first release.

## Cross-cutting requirements

- Browser-based use with server persistence for projects, files and revisions. Downloadable HTML is a development demo, not the target distribution.
- Chat is the main input in every module. Contextual properties expose and edit the same structured data.
- New platform projects start without an implicit shell, material, volume, programme length or price. Optional examples retain their illustrative provenance.
- Graphics, functional tools and AI integrations use open-source components. Model licensing must be selected explicitly; available weights alone do not establish an open-source licence.
- Repository documentation, code comments and new identifiers use English. The application supports English, Italian, French and Spanish, defaults to English and remembers an explicit selection. User content is not translated by changing the interface.
- Every value records units, source, revision and whether it was provided, extracted, assumed, estimated, simulated or measured. Requested, proposed and verified are different states.
- Missing inputs block only dependent operations. They are not silently filled with invented measurements.
- Changes mark dependent results as requiring recalculation. Historical results retain their original inputs.

## Original workspace, authorised operations and validation gates

The [current-state audit](../architecture/CURRENT_STATE.md), [target architecture](../architecture/TARGET_ARCHITECTURE.md), [original UI specification](../design/ORIGINAL_UI_SPEC.md), [threat model](../security/THREAT_MODEL.md) and [increment plan](../planning/IMPLEMENTATION_PLAN.md) make these requirements concrete. The interface must be original: one persistent 3D scene across modules, an always-accessible copilot, collapsible/resizable context panels and a shared-clock lower results/timeline drawer. Choose the dark Process spine variant from two original studies; do not clone a competitor or expose unimplemented commands as functioning.

AI tools use validated/unit-aware/authorised inputs, exact effect previews, explicit user approval, atomic versioned execution, provenance and compensating undo. No free execution of model-generated code or arbitrary commands. Public demo and private projects are isolated; unbounded unauthenticated numerical endpoints are prohibited. New dependencies/engines need reproducible install, representative execution, API/licence checks, references and measured resource limits before adoption.

Use only permitted development/validation data with separate measured/simulated/synthetic/assumed status. The four supplied public dataset candidates are unverified and not admitted; D is excluded under the supplied embargo. No employer/private data, protected binary investigation or legal/security/engineering-certification claim is authorised. Preserve the current MIT licence; investigate alternatives including AGPL without changing it automatically. No push, merge or publication without explicit approval.

## M01 — Customer, market and commercial feasibility

The starting point is the customer request: product function, market, commercial objectives and constraints. Questions are ordered by their effect on the current decision.

| Group | Information | Downstream use |
| --- | --- | --- |
| Enquiry | Customer, RFQ, article/revision, function, market, application and sales region | Technical requirements and acceptance criteria |
| Demand | Annual scenarios, lots, seasonality, growth, spares and deadlines | Cavities, mould/cell counts, capacity and delivery |
| Commercial unit | Part, kit or assembly; bill of materials and component quantities | Comparable demand, capacity and unit costs |
| Economics | Selling price, currency, manufacturing target or exploratory mode, required margin and its definition | Alternatives and sensitivity |
| Investment | Separate mould, press, automation and auxiliary budgets, ownership and useful life | Existing-resource versus purchase comparison and allocation |
| Production | Plant, calendar, shifts, changeovers, availability, reject rate and capacity constraints | Good output and lead time |
| Acceptance | Functional/cosmetic quality, tolerances, environment, required tests and documents | Product constraints and technical verification |

Annual demand has no predetermined commercial ceiling. Missing demand is not unlimited demand. Selling price is distinct from manufacturing cost; programme length and currency belong to each project. The original text and additional information remain available beyond the initial structured fields.

Output: structured brief, sources/files, prioritised missing information, demand scenarios and objectives. A commercial brief can be usable before simulation inputs are complete.

## M02 — Product

One or more articles/components with extensible requirements and features: function, geometry, dimensions, material/grade, surfaces, tolerances, appearance, assembly and special properties. Product-specific requirements do not become globally mandatory fields.

Inputs include text, CAD/mesh, photographs, sketches and dimensions. Concept images support exploration. Metric reconstruction from photographs needs a known scale and additional views/information; hidden geometry, material and tolerances are not invented.

Output: geometry with coordinate frames, requirements linked to regions/features where possible, mouldability observations and missing inputs. Solids, meshes and visual references have distinct analysis capabilities. A flange or bracket retains its own geometry rather than being converted to an enclosure template.

## M03 — Mould

Compare cavity count/layout, parting direction/plane, inserts, steels, feeding, venting, slides/lifters, ejection and cooling circuits. Single-cavity, multicavity and family moulds represent output per article separately.

Each cavity links a product, position, orientation, local origin and ejection reference. These affect robot access and the orientation of the extracted part. Cooling circuits retain 3D paths, sections, connections, fluid, flow/pressure/temperature conditions and available geometric/thermal checks.

Output: editable concepts, alternative comparisons, dimensions, strokes, press/cell constraints and verification states. Cooling proposals use explicit geometry and thermal models as described in [the simulation specification](SIMULATION.md).

## M04 — Cell: press, mould, Cartesian robot, conveyor and auxiliaries

Configure existing machines and purchase candidates. Simplified models retain functional envelopes, strokes, speeds/accelerations, capacity, installation frames and interface points.

Resources include press and injection unit, mould, Cartesian robot, end effector, conveyor, optional dryer, material transport/feed and temperature control. Resources are optional according to the process; omitting a dryer does not establish that the material can be processed without conditioning.

Output: 3D layout, installation, available compatibility checks, paths, access, grip and deposit poses. An XYZ robot cannot acquire an unconfigured rotary axis. A required flip needs an actual wrist/actuator, auxiliary orienting station or a different mould/grip/layout solution.

## M05 — Time-based material-to-conveyor process

Incoming material → optional drying/conditioning → transport and hopper → screw feed → plasticisation/metering → injection → holding/cooling → opening and mould movements → ejection/pickup → transfer → placement → conveyor movement.

This is a graph of dependencies and resources, allowing compatible operations to overlap. Drying and replenishment operate on different timescales from a press cycle. Startup, initial inventories and repeated operation are distinct conditions.

Every phase links 3D state, timing, parameters, charts and model/source. Playback, pause, event stepping and scenario comparison share a simulation clock. Part identity and orientation remain traceable from cavity to conveyor. Model fidelity is defined per phenomenon in [SIMULATION.md](SIMULATION.md).

## M06 — Economics, real data and optimisation

Economics receives demand from M01, product/material from M02, investments from M03/M04 and timing/capacity from M05. It returns cost per conforming commercial unit, capacity by article, investment, sensitivities and missing inputs without double-counting rates, energy, depreciation or losses.

PCA explores variability, groups and contributions without establishing causality. PLS predicts measured targets from documented inputs/features. Real user data, cycle/lot identifiers, preprocessing, separated training/validation and condition coverage are prerequisites for production recommendations. Optimisation preserves constraints and a trial plan.

## Shared data contract

| Entity | Content and references |
| --- | --- |
| Projects/revisions | Identity, customer, currency, units, scenarios and immutable input revisions |
| Brief/requirements | Demand, commercial unit/BOM, market, objectives, constraints and sources |
| Products/features | Versioned geometry/files, coordinate frames, material and extensible properties |
| Mould alternatives | Product-linked cavities, actuators, ejection and circuits |
| Cell/resources | Assets, installations, transforms, capacity, availability and rates |
| Recipe/sequence | Parameters, units, limits, events, dependencies, trajectories and resources |
| Simulation run | Input snapshot, model versions, initial conditions, events, signals, parts and checks |
| Economic/ML analyses | Scenario or dataset version, method, results, validity and dependencies |
| Conversation/operations | Original request, structured interpretation, changes, sources and undo |

Object references are stable IDs. A visual exploded view is not an operational pose. The legacy demo export `schema_version: 4` is not the platform contract; its historical description is [archived](archive/DEMO_02_SPECIFICATION.md).

## Delivery and acceptance

The first implementable increment I01a establishes generic project/commercial data, durable API/storage and approved revisioned operations; I01b integrates actual chat, contextual properties, original assets and the persistent workspace, with no implicit sample data. The first simulation increment links imported geometry, simplified mould/cell models and a complete parametric sequence. Different product geometries test extensibility from the beginning.

Acceptance criteria and implementation order are defined in [BACKLOG.md](BACKLOG.md) and [ROADMAP.md](ROADMAP.md). Requirements do not imply that a module is implemented.
