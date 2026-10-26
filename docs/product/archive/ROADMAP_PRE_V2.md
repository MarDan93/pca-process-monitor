> Historical pre-V2 record. [Active V2 contract](../FABRIVRA_V2.md) supersedes these product/deployment assumptions.

# Roadmap update — 19 October 2026

The active path is customer brief → generic product mesh → preliminary mould envelope/cavity row → reusable press/material selection and necessary checks → configured process run → shared-clock 3D, timeline and traces. [Current implementation and data guide](../../data/ENGINEERING_LIBRARY.md). I02 is now **partially implemented**: arbitrary tooling, slides, cooling channels and full mouldability remain open. I03–I04 has synchronized channel plots/CSV in addition to its existing L0 schedule; cost accounting and physical fields remain open. The server copilot is bounded workflow routing and explicit extraction, not an autonomous mould designer.

Next dependencies: verified official machine/grade catalogue and actual user data; richer extraction/tooling/robot constraints and cost alternatives; then independently validated reduced physical models and corrected PCA/PLS. Do not label the full V1 complete or use the earlier illustrative cell as evidence of solved physics.

The dated plan below describes the earlier baseline; its unimplemented I02 references are superseded by this update.

# Product roadmap

Updated 2026-10-17 after [AUD-2026-10-17](../../architecture/CURRENT_STATE.md). Goal: an original online open-source engineering platform, with customer/commercial requirements driving product, mould, cell, process, cost and optimisation decisions. [Implementation status](../IMPLEMENTATION_STATUS.md) records actual code; [the increment plan](../../planning/IMPLEMENTATION_PLAN.md) supplies concrete files/tests/acceptance.

## Current position

**19 October update:** the current trial is the server-backed app in [GitHub Codespaces](../../deployment/CODESPACES.md), including a bounded L0 process and server CPU AI. This follows the owner's request to prioritise a visible working process run; it does not imply I02 mould/press checks or the full V1 are complete. Actual Codespaces provisioning needs the owner's account because the available integration lacks API scope. The earlier managed container remains optional; local development remains supported. [Current evidence](../../verification/PROCESS_CODESPACES_2026-10-19.md).

| Milestone | Scope | Actual status / delivery mapping |
| --- | --- | --- |
| P0 | Requirements and architecture/security/rights/data/design baseline | Specification plus audit recorded; data/rights/security gates remain open, not certified |
| P1 | Generic projects, durable commercial brief, approved AI operations and web foundation | I01a and bounded I01b implemented locally; real AI/server approval path passes. Wider evaluation, migration and online identity/recovery remain open |
| P2a | Persistent original geometry assets, supported meshes, frames and scene | Original OBJ/STL bytes/units/hash, worker parsing and persistent CAD scene implemented. Rich frame/ejection features, STEP and legacy migration remain open |
| P3a | Restricted mould configurations and preliminary press/cell checks | Not implemented; I02 followed by cell/pose work in I03 |
| P4 | Complete L0 material-to-belt events, playback, capacity and costs | First bounded events/inventory/XYZ/belt/clock/run persistence and configured output implemented; complete geometric/capability checks and cost accounting remain open |
| P2b/P3b | STEP/B-rep, supported CAD/parametric mould families, cooling geometry | Not implemented; kernel installation/licence/reference spike and I05 |
| P5 | Reduced L1 material/plasticisation/cooling models | Not implemented; equations/data/reference/performance gates, I06 |
| P6 | Corrected PCA, PLS, licensed real data and constrained trials | Original PCA library has reproduced correctness defects; I00-N then I07 |
| P7 | Optional verified L2 and full secure/recoverable online release | Not implemented; I08 plus progressive identity/deployment gates |

This splits the earlier P2 dependency: supported mesh/file/frame handling can support an explicitly preliminary mould envelope and L0 sequence before STEP/B-rep tooling is ready. STEP is retained, not silently dropped. Mesh bounds do not replace solid measurements or necessary shot/clamp data. A first configured L0 flow is not completion of detailed CAD or physical validation.

## Delivery order and exit evidence

### I00 — audit and prerequisites

The seven requested audit documents, provenance, inventory, two original design studies and validation protocols are present. Regression checks and actual browser inference pass. Reproduced PCA defects, native dependency advisories and blocked dataset metadata remain open findings. Keep MIT, all existing engines and the delivered demo. No proprietary analysis, employer data, push, merge or publication is authorised.

I00-S triages native dependencies/security and distribution obligations before online/native exposure. I00-N corrects scientific indices/missingness before production statistical recommendations. These independent follow-ups do not prevent generic project implementation.

### I01a — implemented local foundation

Generic project/brief objects, sources, explicit quantities/commercial units, transactional storage/API, integer revisions, one typed commercial preview/approval/execute/compensating-undo operation. Reopen two independent projects, reject invalid/stale/replayed/foreign-project effects and preserve history. Start in a bounded loopback-only synthetic development mode; do not claim test principals are production authentication. Exact files and tests are in [the plan](../../planning/IMPLEMENTATION_PLAN.md).

This boundary now runs in `server/`, with 12 passing contract tests. See [the coding increment](../../verification/WORKSPACE_2026-10-17.md); the service is local development only.

### I01b — integrated user foundation, partially implemented

A persistent viewer/camera/selection, contextual commercial inputs, permanently accessible copilot, original dark Process spine shell, collapsible/resizable panels, supported OBJ/STL assets with original bytes/units/frames and real AI-driven approved commercial updates. Preserve tested geometry/import/AI/i18n through adapters; do not restart the project. Production identity/project isolation must precede private/public hosting.

The CAD shell, generic projects, original mesh persistence, four UI languages and actual commercial AI operation now pass browser checks in `web/`. Legacy-v4 import, further source/frame workflows, broad model evaluation and production identity/recovery are not complete. The next engineering increment is I02; no simulation or cost engine has been added by the UI work.

### I02 — preliminary mould and press alternatives

Implement a bounded family of cavity/envelope alternatives and declared dimensional/shot/clamp/stroke checks. Distinguish failed/incomplete/performed checks and unsupported undercut/mouldability/CAD operations. Changes invalidate downstream results. No automatic universal mould design or arbitrary cooling optimum is promised.

### I03–I04 — first complete L0/economic path

**Implemented subset, 19 October:** configured single-feed/single-press/ganged-XYZ/belt scheduling, batch drying, material balances, overlapping resources/waits, basic fixed-yaw rejection, persistent runs and shared-clock 3D/timeline controls. Actual server AI proposes reviewed scenario changes. [Trial guide](../../deployment/CODESPACES.md). This precedes I02 at the owner's request; functional envelopes and configured times are explicit assumptions. Richer resource/geometry checks, trajectories, commissioning data and economic totals remain unimplemented.

Actual event/resource/inventory/motion/part-support engine across configured material-to-conveyor phases; one clock for run-driven animation/charts/events; valid axis/orientation constraints; capacity by article/commercial unit; documented rate/energy/material/investment accounting. Use explicit analytical/synthetic benchmarks and configured times, never invented physics fields.

The first integrated V1 must demonstrate all eleven master-request steps, including save/reopen and a real approved AI change. Its acceptance and failure branches are in the plan. Matching an analytical schedule or cost fixture establishes software/accounting correctness, not experimental injection/cooling accuracy. A public online pilot additionally requires security, rights and recovery evidence plus explicit publication authorisation.

### I05–I08 — CAD, physical validation, data and release

Compare/pin/test CAD wrappers and STEP operations, then add supported mould/cooling families. Source and verify reduced physical equations before enabling them; evaluate detailed solvers only against phenomenon-specific references and budgets. Fix/retest the original PCA, admit only licensed suitable data, implement grouped PLS validation and constrained trials. Complete recoverable deployment and independent security review before production claims.

## Scope discipline

Each increment identifies reused code, dependencies, changed files, executed/passed/failed/blocked/unrun gates and evidence. Do not add functioning-looking commands ahead of the engine. No completion percentage, schedule, free-hosting promise or real-time physical accuracy claim without a measured scope/hardware configuration. Licence/rights/security exceptions, expenses, irreversible decisions and publication need concrete owner approval; ordinary reversible implementation does not.

English remains the repository language; UI remains EN/IT/FR/ES with English default. The new specification requires an original dark workflow, not a clone of SolidWorks/FreeCAD or any competitor. The existing light demo remains a legacy artefact, not the final application design.
