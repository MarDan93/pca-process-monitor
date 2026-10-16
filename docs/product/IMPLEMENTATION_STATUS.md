# Implementation status

Updated 2026-10-16. **P0 is documented; P1 is not implemented.** Current work is on the development branch `demo/progettazione-stampi-2026-10-15`, not on `main`. This file is the status reference; the [roadmap](ROADMAP.md) describes target deliveries.

| Area | Available | Still required |
| --- | --- | --- |
| Customer brief | Local forms, export, press catalogue | Generic commercial home/chat, real AI and server persistence |
| Product | Example shell, OBJ/STL viewer with units/bounds, photo references | Generic model, STEP solids, extensible features and assisted reconstruction |
| Mould | Example requirements only | Cavities, geometry, ejection, cooling and alternatives |
| Cell | Candidate press records | Press/mould/Cartesian robot/end-effector/conveyor/auxiliary layout and kinematics |
| Process | No complete time-based engine | Events, material flow, parameters, animation and L0/L1/L2 models |
| Data/ML | Original Python PCA library and notebook | Verification/correction, PLS and application integration |
| Distribution | Local HTML demo and development sources | Hosted application, persistence and project access |
| AI | Limited local geometric command parser | Open-source models and module tools |
| Languages | English source/documentation; demo EN/IT/FR/ES with English default | Reuse this policy in the P1 application |

The original PCA Q-limit normalisation issue found during onboarding must be reproduced and corrected before production recommendations.

Verification for this maintenance increment: 25 unit checks passed; Chromium development and single-file workflows passed, including four UI languages, preference persistence, user-content preservation, pending/invalid form input, actual 3D and file exports. The packaged HTML was tested with networking disconnected during interactions. These checks do not complete any platform acceptance milestone.

## Current maintenance increment

English repository content and explicit UI languages are maintenance of the existing demo. The language preference is separate from project data. Language changes must retain user text, saved values, unsaved fields and validation errors. The browser checks cover these behaviours as well as geometry/import/export. This is not an AI or simulation implementation.

The ZIP exists on the remote development branch. On 2026-10-16 the previously supplied GitHub file and raw-download URLs returned HTTP 200 from the execution environment; the user-reported 404 was not reproduced. New delivery links use an English filename and include a file-page alternative. Package integrity and remote content are checked during publication; reachability from a different browser/account cannot be inferred solely from a local check.

The legacy schema and example are documented in [archive/DEMO_02_SPECIFICATION.md](archive/DEMO_02_SPECIFICATION.md) and [REFERENCE_CASE.md](REFERENCE_CASE.md). Neither defines mandatory fields for new platform projects.

## Next implementation

P1/B01–B04: generic project data → API/server storage → commercial chat UI → actual open-source AI tools. The completion evidence is A01–A05 and A14 from [BACKLOG.md](BACKLOG.md). Hosting decisions follow a concrete runnable deployment.
