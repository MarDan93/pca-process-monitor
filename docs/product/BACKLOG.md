# Implementation backlog and acceptance

Updated 2026-10-17. The [increment plan](../planning/IMPLEMENTATION_PLAN.md) now defines I01a–I08 and the first eleven-step integrated flow; platform criteria remain planned. Platform criteria below are **planned, not passed tests**. P1 is incomplete. A client-side B04 AI experiment and CAD-style demo are implemented; B04 acceptance is pending broader evaluation and platform integration; actual browser inference is verified. Progress is tracked in [implementation status](IMPLEMENTATION_STATUS.md).

## Ordered work

| ID | Work | Dependencies | Observable outcome |
| --- | --- | --- | --- |
| B01 | Generic projects, products/requirements and commercial units | Specification | Empty projects independent of product shape |
| B02 | API, server storage, files, revisions and operations | B01 | Reopening and versioned changes |
| B03 | Customer/market home, primary chat, contextual properties | B01–B02 | Commercial brief without starting in a geometry editor |
| B04 | Actual open-source inference and brief tools | B02–B03 | Real conversation, sources, corrections and declared model |
| B05 | CAD/mesh input, frames and extensible features | B02, B04 | Different products and unit-aware measurements |
| B06 | Mould alternatives, cavities/ejection and geometric cooling paths | B05a for preliminary envelopes; B05b for solid CAD/cooling checks | Concepts linked to demand/product |
| B07 | Press/Cartesian robot/end-effector/conveyor/auxiliary cell | B05–B06 | Explicit poses, axes and available access/compatibility checks |
| B08 | Events, inventories and L0 recipes | B06–B07 | Material-to-conveyor sequence, waiting and overlap |
| B09 | Synchronous animation/charts and pose analysis | B08 | Reproducible timeline and explained constraints |
| B10 | Scenario capacity/cost comparison | B01, B08 | Cost per sold unit and per-article capacity without double counting |
| B11 | Verified reduced thermal/plasticisation models | B08–B09, references | Estimates compared to known cases within explicit limits |
| B12 | Real data, PCA/PLS and constrained optimisation | B02, B10, datasets | Validated predictions and constrained trial plans |
| B13 | Online deployment, access and recovery | B02; progressive | Reachable HTTPS and recoverable persistent data |

B05 is split into B05a (durable mesh/files/frames and persistent scene) and B05b (verified STEP/B-rep kernel/operations). A restricted configured L0 loop can follow B05a; B05b remains required for solid-CAD claims. The first increment I01a implements data/API operations, not the whole platform.

A test deployment can accompany B01–B04; detailed physics is not a prerequisite for online commercial briefing. Every future UI follows English-default EN/IT/FR/ES support and English repository conventions.

## Acceptance criteria

| ID | Given/action | Required outcome |
| --- | --- | --- |
| A01 | Create a new project | No implicit shell/material/IP/demand/programme; optional marked examples |
| A02 | Describe demand, market, price, cost and budgets | Separate unit-bearing values; clarify cost/commercial-unit ambiguity |
| A03 | Correct through chat then properties | Shared value/revision, source and undo |
| A04 | Reopen and edit concurrently | Server persistence; no silent overwrite of a newer revision |
| A05 | Required data missing | Identify blocked calculation/input while other work remains possible |
| A06 | Import flange, bracket and enclosure | Preserve geometry, units and features; no mandatory global PCB/clip fields |
| A07 | Photo without scale or geometry without units | No verified metric claim; distinguish reference, mesh and solid |
| A08 | Change cavities/orientation | New revision and stale grip/trajectory/cycle/cost checks |
| A09 | XYZ robot without wrist; flipped deposit requested | Explained unreachable pose; no implicit animated rotary capability |
| A10 | Cooling path intersects an ejector | Explain geometric conflict; lack of collision is not thermal validation |
| A11 | Replay, pause, step and change playback speed | Same simulation timestamps, event log and event poses |
| A12 | Cooling/metering/transfer can overlap | Respect resource dependencies; derive cadence from events |
| A13 | Multicavity pickup/release on moving belt | Preserve each part identity/cavity/pose without support-transfer jumps |
| A14 | AI unavailable or unsupported operation | Honest state and retained data; no fabricated AI/calculation |
| A15 | Economic comparison or real-data prediction | Source, commercial unit, input/model versions and validity; visible missing/stale results |

Additional master-request criteria (planned, not passed):

| ID | Required evidence |
| --- | --- |
| A16 | Same canvas/camera/selection across modules; copilot availability; panels fully close/resize; original dark design and keyboard/locale checks |
| A17 | Exact typed effect preview, principal/revision/digest-bound approval, replay/idempotency rejection and compensating undo |
| A18 | Authenticated project/asset/job isolation, bounded compute/parsing, CSRF/CORS/session controls and tested recovery before online/private use |
| A19 | Recorded dependency/model/data rights and original design provenance; no unchecked/embargoed/private validation sources or automatic relicense |
| A20 | PCA covariance/residual/missingness reference tests and independent grouped validation before statistical production recommendations |

## Cross-module scenarios

### S01 — Generic customer request

Use independent flange and bracket enquiries; the enclosure is an optional third case. Describe demand/market/economic target, correct from chat and properties, reopen and verify independence/provenance. Illustrative scenario inputs never become defaults.

### S02 — Family mould and sold unit

An assembly needs two articles; cavity counts do not match their BOM ratio. Verify article and good-assembly demand/capacity/cost. Total cavities alone cannot determine saleable capacity. Demand changes invalidate relevant comparisons.

### S03 — Pickup-to-conveyor orientation

Configure multiple cavities and an XYZ robot without rotation; request a flipped deposit. Explain the constraint and alternatives. Add an actual wrist or revise mould/grip in another scenario. Verify pose continuity, strokes and the declared limits of collision checking.

### S04 — Empty plant versus conditioned stock

Compare required drying with empty inventories to preloaded qualified material with known mass/age. Injection waits for dose and qualified feed. Verify lot identity, mass conservation and nonnegative inventory. Nominal residence does not certify each portion.

### S05 — Overlap and conveyor blockage

Meter during cooling and place parts while the next press cycle runs when allowed. Verify event cadence, resources and part count. Block belt availability: waiting propagates without overlapping or duplicated parts.

### S06 — Revisions, costs and replay

Run a scenario, change stroke/time and compare. Old runs retain old inputs. Energy/depreciation included in a rate are not added again. Playback speed never changes capacity/cost.

### S07 — Cooling and reduced models

Compare an intersecting circuit with one meeting the available geometric constraints. Thermal/hydraulic calculations require sufficient inputs. Geometric feasibility does not establish optimal cooling. Define reference cases, justified tolerances and validity before implementing each L1 model.

## Completion evidence

Each delivery lists executed/passed/failed/unrun criteria, input/model versions, limits and reproducible results. Illustrative screens do not demonstrate engine implementation. Engineering validation needs technical evidence beyond software checks.
