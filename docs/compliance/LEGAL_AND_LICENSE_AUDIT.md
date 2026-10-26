> **V2 addition, 26 October 2026:** project MIT text is unchanged. The new system scheduler, fixtures, backup code and modular-F SVG assets are original project work; the engine uses only the Python standard library and existing locked dependencies. No GPL/AGPL solver, STEP kernel, Timestral weights, OEM assets or numerical material catalogue is added. The earlier unpublished mesh/FEM experiment is preserved separately and excluded from the V2 runtime/locks. A free/open-weight model does not waive provider terms or establish engineering accuracy. Existing native/dependency/weight-redistribution review findings below remain open; no new legal clearance is claimed. [Current scope](../product/FABRIVRA_V2.md).

# Legal and licence audit

`AUD-2026-10-17`, baseline commit `0fe5efe3e626edf7c93138efa83be821bfcea8a0`. This is an engineering inventory and decision record, **not a legal opinion or a statement of legal compliance**. Professional review remains necessary for rights, licence compatibility and intended distribution. No licence change, publication or proprietary-software investigation is performed.

## Existing project rights

`LICENSE` contains the MIT licence, copyright `(c) 2026 MarDan93`; its tracked history starts at commit `2d6c601`. The examined history contains 21 commits under two author labels, `MarDan93` and `Mari  Posa`. Git labels and repository access do not prove that they represent separate people, employment rights, assignment or permission to relicense. No assignment, CLA or other ownership instrument was found in tracked files.

Preserve the existing MIT text, attribution and previously distributed permissions. Changing a future licence cannot revoke existing MIT grants. Before any relicense: establish ownership of contributed code/assets, contributor permissions, any employer/contractual constraints and the boundary of future modules. No private employment information or company code/data was collected during this audit.

## Licence options to review

| Option | Engineering/distribution implications | Decision now |
| --- | --- | --- |
| MIT | Permissive use/modification/commercial distribution with notice retention; does not require publication of hosted modifications or give an Apache-style explicit patent grant | Keep existing licence |
| Apache-2.0 | Permissive, explicit patent provisions and notice/change obligations; does not require sharing a modified hosted service | Consider only with rights/compatibility review and owner approval |
| GPL-3.0 | Source/corresponding-source obligations for covered distribution; ordinary network use is not the AGPL network clause | Evaluate component/combined-work distribution, not a blanket compatibility assumption |
| AGPL-3.0 | Adds network-source availability requirements for modified covered software interacting with users; may fit an openly maintained web core, affects integrators/combined works | Preferred option to **evaluate** for a future web component, not authorised or adopted |

A separately defined future web component or dual-licensing arrangement may be possible with sufficient rights. A directory name, subprocess, HTTP API or container does not by itself establish a legal separation or remove copyleft obligations. An approved written proposal must identify covered files, dependencies, notices, source-offer mechanism and consequences for published MIT versions before changing anything.

## Dependency and artefact scope

The [inventory](DEPENDENCY_INVENTORY.md) records **107 locked npm entries**, 60 installed in this Linux environment, and 55 observed Python distributions. `requirements.txt` declares eight direct Python dependencies with minimum versions, not a reproducible lock. npm's lock includes optional packages for other platforms; installed does not mean shipped in every artefact. Metadata SPDX/classifier readings do not prove full bundled/native compliance.

| Component/path | Observed licence evidence | Use and unresolved obligation |
| --- | --- | --- |
| Three.js 0.180.0 | MIT; installed licence included in standalone HTML | Keep notices and source/version provenance |
| Lucide 0.468.0 | ISC metadata; full installed licence embedded | Existing ribbon icons are reused open-source assets. Future original icon set must be authored independently, not traced from competitor icons |
| Transformers.js 3.7.2 | Apache-2.0; installed licence embedded | Review full transitive/browser distribution notices before wider packaging |
| ONNX Runtime Web `1.22.0-dev.20250409-89f8206ba4` | MIT package metadata; runtime licence retained | Pinned prerelease runtime; compare upstream notices/version hashes and downloadable WASM artefacts |
| ONNX Runtime Node 1.21.0 | MIT metadata | Native development/inference dependency, distinct from web runtime |
| sharp 0.34.5 and libvips optional packages 1.2.4 | sharp Apache-2.0; installed/locked libvips packages **LGPL-3.0-or-later**, with compound SPDX expressions on some platforms | Not used as a browser upload backend. Native distributions/containers require component/native-binary/source/notice review; security advisories also exist |
| esbuild 0.25.12 | MIT | Build tool; not the application licence |
| NumPy/SciPy/pandas | Package metadata; NumPy reports `BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0`; SciPy/pandas BSD classifiers | Inspect exact wheel/native-library notices when distributing binaries; do not describe the entire numerical environment as a single BSD package |
| Matplotlib/Plotly | Matplotlib PSF-style licence classifier; Plotly MIT metadata | Inspect exact bundled assets/fonts/JS and notices for future report distribution |
| python-dotenv | Installed 1.2.4 metadata reports BSD-3-Clause | Retain exact-version evidence; do not assume a different release's licence |
| Gemini/Anthropic SDKs | Open-source SDK licences (Apache/MIT) | SDK licensing does not make hosted models/services open source or free. Essential platform functions must not depend on them |

`NOTICE` is an attribution entry point and explicitly preliminary, not a substitute for upstream licence texts or a complete legal clearance. The existing HTML embeds four runtime licence texts; that alone is not a complete SBOM/native-distribution review. Do not ship `node_modules`, solver containers or model weights on the assumption that the HTML notices cover them.

## AI weights and conversion provenance

The browser selects `onnx-community/Qwen2.5-0.5B-Instruct`, revision `22942cb7d7ba4cc81bb4673549ca4d4614469b5e`, dtype q4. The selected ONNX file is 786,156,820 bytes and its SHA-256 was checked against the upstream LFS ETag:

`09235a3b1c135cd04ef570e5053b5c079e028078a2cc5f76ba6a251e91bf3296`.

The upstream Qwen model licence was inspected as Apache-2.0 during the implementation. The conversion README links that upstream model but does not itself provide a complete, explicit conversion-rights record. Keep upstream rights, converter contributions, model-card terms, required attributions and redistribution conditions as separate review items. Hash verification establishes artefact identity, not permission or model accuracy.

Weights are absent from the Git repository and demo ZIP. Local tests used downloaded files; a future static model host would redistribute/serve those files and needs a checked notice/licence manifest. Open-weight availability does not establish open training data, reproducible training or full open-source AI status. Local operation does not mean zero hardware/bandwidth cost or unrestricted model-host service terms.

## REA evaluation and independent implementation

Reviewed official `morluto/rea` commit `f1edf0da0c6c897e68664a6ab2637f8f33368bf8`: README, package metadata (version 6.5.0), MIT licence and MCP contract documentation. Details and hashes: [RESEARCH_PROVENANCE.md](RESEARCH_PROVENANCE.md).

REA supports evidence-oriented analysis of applications, JavaScript/Electron and binaries, with native providers such as Ghidra, Hopper or IDA. Its setup registers MCP/workflow configuration and can involve external providers. None of those actions is needed to audit our available source.

**Decision:** do not install or run REA now. Adopt the neutral evidence/provenance discipline using ordinary source inspection, tests and original designs. No target binaries, protected application assets, DRM/authentication bypass, decompilation, proprietary scraping or extraction were performed. REA's MIT licence does not authorise analysis/reuse of a third-party target or license Hopper/IDA.

Follow the requested five stages: lawful observation → neutral functional requirements → independent architecture/UI → permitted original/library implementation → independent tests and attribution review. Keep implementation requirements separate from downloaded artefacts and record what influenced each design. This is a documented independent process, not proof of legal clearance or a formally isolated two-team clean-room procedure. If a target's rights are unclear, stop that investigation and use an open-source alternative.

## CAD and solver candidates

| Candidate | Evidence inspected | Adoption condition |
| --- | --- | --- |
| Open CASCADE | Official LGPL-2.1 text and OCCT exception v1.0 | Review exact version, linking, exception scope, notices and redistribution obligations |
| CadQuery / build123d | Official Apache-2.0 licence files; PyPI metadata | Wrappers do not replace OCCT/OCP/native dependency review; installation/API/benchmark gates remain open |
| FreeCAD | Prior official LGPL-2.1 reference | UI research only in the existing demo; no FreeCAD kernel/application/assets embedded. New interface follows its own requirements/design |
| SimPy / CoolProp | PyPI MIT metadata | Verify distribution/source notices at the version selected for installation; neither is an injection-moulding solver |
| PyBullet | PyPI zlib metadata | Verify exact native package and third-party notices; do not label it MIT |
| pymoo / Pyomo | Apache-2.0 / BSD-3-Clause PyPI metadata | Check optional solver dependencies and their licences separately |
| OpenFOAM | Official GPL v3 licence text | Assess chosen release/components and container/source distribution before optional integration |
| Elmer | Official README and `license_texts/ElmerLicensePolicy.md` | Mixed GPL/LGPL modules. Upstream prose contains inconsistent version wording; examine selected module headers/licence texts rather than granting suite-wide clearance |

These candidates are not installed/validated platform integrations. No dedicated open injection-moulding solver was verified. A legal/technical alternative to a doubtful component is a documented analytical/reduced model using permitted references and independent code, subject to scientific validation.

## Data and research rights

All four requested dataset records remain unverified because primary metadata requests were denied by the environment egress proxy. No author, DOI, commercial-use grant or licence was inferred from a title/URL. Dataset D is excluded in accordance with the user's stated embargo through 31 December 2027; no file access was attempted. The stated embargo is a user-supplied restriction, not independently confirmed metadata.

See [PUBLIC_VALIDATION_DATASETS.md](../data/PUBLIC_VALIDATION_DATASETS.md). Public access, a DOI or an article's open licence does not automatically license its associated data, code, CAD or trained weights. Missing or noncommercial-only rights prevent commercial dataset integration until clarified. Do not use employer/customer/private information as a convenient validation substitute.

Research references such as OWASP ASVS/LLM Top 10 have their own documentation licences (observed CC BY-SA 4.0). Link and independently summarise requirements; do not silently incorporate large protected passages under MIT. Dataset/code/model attributions are tracked independently.

## Open-source sustainability

Keep essential self-hosted capabilities in the same public source: project/geometry/operations, event engine, costs and available analysis. Sustainable paid services can cover managed hosting, metered compute, installation/integration, support/SLA, training and sponsorship. Charge for resources/service rather than hiding algorithms or adding artificial feature locks. Resource quotas protecting a shared host remain legitimate and documented; self-hosted administrators can size them to their hardware within safe limits.

Before launch, publish installation/developer/contributor/scientific guides, a release-specific dependency/model/data manifest, source/notice mechanisms required by the selected licences and a tested support/security process. Existing guides and this audit provide a starting point, not evidence that launch obligations are complete.

## Decisions requiring later explicit approval

A licence change or dual licence; unclear contributor/target rights; paid services/hosting; use of proprietary APIs for an optional feature; release with unresolved security exceptions; public distribution of unchecked model/solver/native artefacts. None is requested merely to complete this audit. Preserve MIT and continue only permitted local development/research.
