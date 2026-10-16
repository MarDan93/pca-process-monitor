# Product roadmap

Updated 2026-10-16. The target is an online commercial/technical feasibility and process-simulation platform. The shell demo is a separate experiment, not progress through the platform milestones. See [implementation status](IMPLEMENTATION_STATUS.md).

## Current position

| Milestone | Scope | Status |
| --- | --- | --- |
| P0 | Agreed system specification, UX, architecture and acceptance criteria | Complete as documentation |
| P1 | Generic customer brief, actual open-source AI, server persistence and web application | Incomplete; browser-AI experiment implemented, browser inference verified with self-hosted assets |
| P2 | Generic product geometry, STEP and supported CAD operations | Not started; reusable demo viewer exists |
| P3 | Mould concepts and functional press/robot/conveyor cell | Not started |
| P4 | Complete L0 material-to-conveyor sequence, animation, capacity and costs | Not started |
| P5 | Verified L1 material, plasticisation and cooling models | Not started |
| P6 | Integrated real-data PCA/PLS and constrained optimisation | Not started; original PCA library requires verification |
| P7 | Full-path validation and online release | Not started |

Current increment: experimental browser AI for B04 and a FreeCAD-inspired demo workbench; EN/IT/FR/ES support and download verification continue. This does not complete P1. No numerical completion percentage or delivery date is asserted without an implementation estimate.

## Delivery order

### P0 — System specification

Generic requirements, commercial workflow, shared entities, model fidelity and acceptance scenarios are documented. The electronic enclosure is optional; its dimensions, material, IP target, clips and five-year programme are not global defaults.

### P1 — Web foundation and conversational commercial brief

Deliver empty projects, server persistence, files/revisions, Customer and market home, actual open-source AI integration and contextual properties. Capture demand/commercial unit, market, prices/costs/budgets, production conditions and constraints. Show corrections, sources and missing information.

Start with B01 generic data, B02 API/storage, B03 briefing UI and B04 real AI tools. A small Qwen model is wired into the demo; extend inference evaluation and extraction-quality checks before accepting B04. Develop the stack locally before choosing hosting. Verify A01–A05 and A14; two different customer requests must remain independent and survive reopening. No simulation results are generated for missing inputs.

**This is the next implementation milestone.** A reachable HTTPS address, persistence and access will be tested for a concrete deployment. The ZIP is not the final distribution.

### P2 — Generic product and geometry tools

STEP/mesh import with units/frames/components, extensible requirements, measurements and supported operations shared by chat/properties. Keep photos/known dimensions as reconstruction references; automatic generation from images is a separate, metrically checked capability.

Depends on P1 and a kernel trial with different geometries. Exit: A06–A07 and S01–S02. Flange, bracket and enclosure retain their own features; unsupported operations preserve requirements without fabricated outputs.

### P3 — Mould and functional cell alternatives

Cavity position/orientation, parting/ejection, mould envelopes; press, Cartesian robot, end effector, conveyor and auxiliaries with actual frames/strokes. Initial cooling paths and available geometric checks. Compare existing resources with purchases.

Depends on P2 and sourced or explicitly illustrative asset data. Exit: A08–A10 and S03. Layout changes identify effects on access, pose and stale results. Full executable detail of every commercial component is not required.

### P4 — Complete L0 simulation and economics

Configured material/conditioning, feed, press/mould cycle, pickup/transfer/deposit and conveyor with events, resources and overlap. Synchronise animation and parameters. Timing is configured or movement-based with sources. Calculate capacity per article and cost per commercial unit from the scenario and explicit assumptions.

Depends on P1–P3, recipe and initial state. Exit: A11–A13, A15 and S03–S06. This closes the first integrated technical/economic and animated-cycle delivery. L0 is not detailed physics of melting, filling or warpage.

### P5 — Reduced material/plasticisation/cooling models

Add documented balances/correlations for conditioning/inventories, plasticisation and thermal behaviour. Compare circuits/ejection criteria with grade-specific properties. Link charts to actually modelled phenomena.

Depends on P4 and technical validation references. Exit: S07 and model-specific criteria defined before implementation, including accuracy, domain and runtime. L2 enters phenomenon by phenomenon where a verified solver is justified.

### P6 — Real-data analysis and optimisation

Import process/quality data, associate cycles/lots/articles, version preprocessing and PCA/PLS, and propose constrained trials with coverage evidence. Keep measured and simulated data separate.

Depends on suitable real datasets and correction/verification of the original PCA implementation. Validate on separated campaigns, against baselines and target-specific criteria; complete A15.

### P7 — Validation and online release

Verify the full workflow, saves/restoration, background jobs, access, reproducible deployment, guide and exports. Size hosting/hardware from measured workloads. Pass applicable backlog criteria on different cases and a real case when available.

An early test deployment can accompany P1. It does not imply completion of all modules.

## Scope discipline

Every implementation increment identifies a milestone, backlog items and evidence. Cosmetic/demo maintenance is recorded separately. New shell details do not take priority over B01–B04. Provider/domain, users and AI hardware are clarified when they affect a concrete deployment; product/mould/cell details belong to each project.

Repository language: English. UI: English by default with Italian, French and Spanish selections. This policy applies throughout future milestones.
