# Repository and application languages

Use English for repository documentation, code comments, identifiers, test descriptions and new file names. Preserve historical public identifiers where compatibility requires it.

The application supports English (`en`), Italian (`it`), French (`fr`) and Spanish (`es`). English is the default, regardless of browser language. Persist an explicit user selection independently from project data.

Translation catalogues and deliberate multilingual test inputs are exceptions to English source content. Keep catalogue keys aligned, preserve interpolation parameters and localise accessibility text and messages as well as visible labels.

Never translate user-authored project values when changing UI language. Preserve numerical values, filenames, pending edits and validation state. Verify languages in both development and packaged builds.

Use [the roadmap](docs/product/ROADMAP.md) and [implementation status](docs/product/IMPLEMENTATION_STATUS.md) to scope work. Record demo maintenance separately from platform milestones; do not claim planned modules are implemented.


## Development and review

Read the [audit](docs/architecture/CURRENT_STATE.md), [target architecture](docs/architecture/TARGET_ARCHITECTURE.md) and [increment plan](docs/planning/IMPLEMENTATION_PLAN.md) before broad changes. Reuse the existing viewer/geometry/import/AI modules where appropriate; keep the legacy demo working while generic projects and application operations are introduced. Do not present documented tools, animated placeholders or mocked AI tests as implemented engines.

Run relevant checks from `prototype`: `npm test`, `npm run test:browser`, `npm run build:standalone`, `npm run test:standalone`. Actual inference is a separate optional check; see `prototype/OPEN_SOURCE.md`. Scientific verification follows `docs/data/VALIDATION_PROTOCOL.md`; a reproduction of a known defect is not a successful production validation.

Every new dependency/model/dataset needs source/version, licence scope and provenance. Record own code, reused open-source code, generated fixtures and third-party assets separately. No employer/private data, unchecked dataset licences, embargo bypass, competitor asset tracing or proprietary decompilation is authorised by this project. Use synthetic/analytical fixtures explicitly when experimental evidence is unavailable.

The existing MIT licence remains unchanged. Confirm contribution provenance/rights; Git author labels are not ownership proof. A formal contributor agreement, relicense, paid commitment, security exception or publication requires an explicit owner decision, not an assumption made by this guide. Keep protected issue details in a private reporting process described in [SECURITY.md](SECURITY.md).

During the current audit/development workflow, do not push, merge, publish or deploy without explicit authorisation. Local reversible implementation and meaningful regression checks can proceed within the agreed increment. Summarise what changed, why, tests actually executed, remaining failures and material limitations.
