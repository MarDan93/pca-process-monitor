# FABRIVRA V2 — current product contract

26 October 2026. The owner-supplied V2 package replaces the earlier master prompt. All its text files and three brand images were read before implementation, and its 12 declared file hashes checked. This English contract describes the implemented increment and remaining scope. Older dated specifications remain history, not an alternative active roadmap.

**The product core is a System Simulation Engine for coupled production configurations.** Product geometry, moulds, material preparation, the press, EOAT/robot, finite conveyor, operational packaging, economics and future data models are subsystems/adapters. Mould design is not the organisational owner of production state.

## Implemented first increment

- Root `ProductionSystem` and revisioned `ProductionSystemScenario` objects, owner/project isolation, retained source inputs, versioned manifests and immutable run snapshots.
- Deterministic L0 complete-cell resource reservations from configured batch conditioning/feed/plasticising through finished packaging. Finite conveyor capacity, travel and pitch cause blocking of a loaded robot and subsequent press reuse. EOAT slots can require multiple explicitly permitted trips.
- Necessary declared press shot/clamp/dimensional checks, injection/plasticising capacity minimum times, EOAT payload/pitch/reach/orientation statuses. Failed necessary checks block a run; missing critical data is exploratory or blocks under the selected policy. Collision/real geometric reach is **unknown**.
- Explicit two-/four-cavity comparison on the same finished-part campaign, observed resource waiting, completed output rate, campaign costs and a cost/throughput Pareto calculation. No automatic preference for maximum cavitation. This is a bounded comparator, not a global search optimiser.
- One stored-run clock for generic 3D equipment/part playback, timeline, selectable available traces, individual packaging/output counts and CSV export. A container change is an event, not a decorative animation disconnected from the schedule.
- Exact decimal cost inputs, declared machine hourly rates, consumed material including runner, paid machine/robot/packaging campaign time, containers and tooling allocation. Unknown costs are not zero; energy is charged once only. Annual projection assumes repeated identical campaigns, 100% acceptance and declared hours; no quality/OEE forecast is inferred.
- Existing generic commercial projects, original OBJ/STL bytes/units/hash, reusable manual/CSV machine/material libraries, approval/undo/revisions and old cycle workflow retained.
- Separate-project portable backup/restore, fresh IDs, retained evidence/history, private verified SQLite backup helper; neither export path overwrites the user's project.
- Compact original modular-F SVG branding, light peach/terracotta palette, one module rail, contextual export/import ribbon, persistent scene, dockable/resizable copilot and EN/IT/FR/ES (English default). No screenshot KPI is a model input.

[Browser instructions and example files](../deployment/CODESPACES.md) · [Algorithm/contracts](../architecture/SYSTEM_SIMULATION.md) · [Actual checks and model failures](../verification/FABRIVRA_V2_2026-10-26.md).

## Separate modules and present limitations

| Capability | Current status | Required next gate |
|---|---|---|
| System Simulation L0 | Implemented for declared finite campaigns | Real-cell timestamp/queue calibration, larger job limits and performance measurements on an actual private Codespace |
| System Optimization | Partial: manual alternatives and cost/throughput frontier | Constrained search, sensitivity/uncertainty, robust feasibility and explainable recommendations |
| Product / mould design | Partial: imported mesh and cavity-row/plate envelopes | STEP/B-rep/kernel licence review, mouldability, parting/slides/ejection/cooling geometry and actual EOAT/tooling checks |
| Mold CAE L2 | Unavailable; separate typed output contract and explicit module screen | Scientific use case, licensed solver/mesh stack, convergence, mesh/time-step studies and independent experimental/reference benchmarks |
| Material physics L1 | Unavailable | Grade/screw/nozzle/drying/thermal data, equations and independent validation; no invented pressure/temperature/moisture/torque curves |
| Timestral / time-series forecasting | Unavailable; separate probabilistic-array output contract | Measured multivariate ingestion, timezones/covariates/missingness, temporal holdouts/baselines/calibration and separate code/weights licence review |
| Packaging Design CAD | Unavailable; separate module screen | Supported package geometry, orientation/fit, handling and materials. Operational packaging already constrains L0 |
| PCA/PLS / measured process optimisation | Not integrated as trusted recommendations | Correct known legacy T²/Q/missingness defects, real-data rights/quality and statistical reference tests |
| AI | Partial: free CPU workflow/extraction and approved typed changes | Improve the measured 5/50 failures; broader tool/data/CAD eval. Official ChatGPT-plan eligibility remains unverified |
| Runtime | Build/browser/launcher tested on this runner | Actual private Codespace creation/forwarding/account quota verification by its owner; no new infrastructure provisioned |

The generic 3D cell is an interpretation of declared poses/times, not a collision-qualified digital twin. Mould plates are not shaped cavities or production-ready CAD. Finite-campaign results are neither scientific polymer predictions nor a commitment to real annual good output. No external numerical OEM/grade dataset was added without verification.

## Active delivery order

| V2 phase | Outcome | Status now |
|---|---|---|
| P0 | Audit, continuity/data protection and rename preparation | Done on this runner; actual rename pending |
| P1 | Working accessible private Codespace, persistence and approved brand | Build/browser/real launcher with synthetic variables pass; external Codespace/private forwarding and account quota remain unverified |
| P2 | ProductionSystem, typed interfaces, events and dependency graphs | L0 root/scenarios implemented; arbitrary assemblies and full multi-fidelity orchestration remain future |
| P3 | First integrated 2 vs 4 cavity comparison | Demonstrable L0 cell/packaging/cost increment implemented; moulds/poses are preliminary envelopes, not production tooling or collision-qualified motion |
| P4 | Operational AI, eligible provider, approved tools and measured benchmark | Partial existing CPU proposals and 50-case evaluation; ChatGPT eligibility blocked, autonomous CAD/simulation tools absent |
| P5 | STEP/B-rep/DFM and verified parametric Mold Design | Not implemented; kernel/licence/geometry-family gates retained |
| P6 | Incremental validated L1 physics and costing | L0 configured costing implemented; physical models/data/independent validation absent |
| P7 | Separate specialist Mold CAE | Contracts only; no solver installed |
| P8 | Optimisation and analytics: DOE, Pareto, sensitivity, correct PCA/PLS/SPC | Partial finite cost/throughput comparator; constrained search, uncertainty and corrected statistical integration absent |
| P9 | Packaging Design, Timestral/time-series AI, factory logistics and other distributions | Separate future workstreams; operational packaging is already in the core |

Next useful increment: calibrate this cell with a real press/robot/packaging dataset and timestamp trace, then add explicit EOAT layout/orientation and geometric motion checks. Installing heavy solvers or new hosting before that evidence would not improve the demonstrated L0 comparison.
