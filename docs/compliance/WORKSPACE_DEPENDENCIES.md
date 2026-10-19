# Local workspace dependency supplement — 17 October 2026

**19 October execution-path update:** the Codespaces trial reuses the same pinned Transformers.js/ONNX Node CPU packages in `prototype/server-ai.mjs`; the earlier statement that no server LLM service exists is historical. No dependency/lock version was changed. The model accepts text only, uses a pinned checksum-verified model, runs in a bounded short-lived process and cannot load user models/images or execute generated tools/code. Existing native package advisories and broader reachability/release review remain open; this is not a security clearance. Weights are downloaded by the user's setup, not committed or bundled. [Verification](../verification/PROCESS_CODESPACES_2026-10-19.md).

This records the subsequent I01 implementation, not a revision of the immutable pre-coding audit. Source remains MIT. No relicensing, proprietary assets, model weights, Python wheels or solver binaries are distributed in the local review ZIP. It contains prebuilt browser JavaScript and the required browser licence texts; Python packages are separately installed from the locked requirements.

| Component | Pinned version | Reported licence | Use/evidence |
| --- | --- | --- | --- |
| React / React DOM | 19.3.1 | MIT | New UI; npm metadata and installed licence texts |
| Scheduler | 0.28.0 | MIT | React dependency; installed licence text |
| TypeScript | 5.9.3 | Apache-2.0 | Development type check |
| Vite | 8.3.4 | MIT | Build/dev tooling; Node 20.19+ or 22.12+, verified here on Node 24 |
| FastAPI | 0.143.3 | MIT | Local API/schema boundary |
| Pydantic / core | 2.14.1 / 2.50.1 | MIT | Strict bounded contracts and Decimal amount validation |
| Starlette | 1.8.0 | BSD-3-Clause | HTTP/static host |
| Uvicorn | 0.54.0 | BSD-3-Clause | Loopback development server |
| httpx | 0.28.1 | BSD-3-Clause | Test client; current Starlette deprecates this adapter in favour of httpx2, but the executed tests pass |
| SQLite | Python standard library/system runtime | See Python/SQLite upstream terms | Parameterised transactional storage; no vendored SQLite binary |

The [resolved Python inventory](WORKSPACE_PYTHON_DEPENDENCIES.json) records all 17 installed packages, including certifi (MPL-2.0), typing_extensions (PSF-2.0) and OpenTelemetry API (Apache-2.0). [The web lock inventory](WORKSPACE_WEB_DEPENDENCIES.json) records npm packages, licences and integrity strings. Direct registry metadata was read over verified HTTPS before installation; Python hashes in `server/requirements.lock` come from official version-specific PyPI JSON metadata. Fresh installation validates them. `npm ci --ignore-scripts` preserves lock integrity and avoids optional native install scripts; the packaged Rolldown binary works in this environment. A production binary/container requires its own exact-platform notice review.

Reused browser code still uses Three.js 0.180.0 (MIT), Transformers.js 3.7.2 (Apache-2.0) and ONNX Runtime (MIT). The new module/tool glyphs are original project SVG paths, not competitor artwork. Lucide remains in the older demo but is not used by the new workspace. New browser builds include complete React, React DOM, Scheduler, Three.js, Transformers.js and ONNX Runtime licence texts at `/THIRD_PARTY_NOTICES.txt`. Common CAD ribbon/view conventions were used as references; no SolidWorks/Fusion implementation or graphical asset was copied.

`npm audit` on the new `web` lock graph (including development dependencies) reports **zero advisories** on 17 October. This does **not** clear the separately reused `prototype` graph's six previously recorded affected entries, including optional native sharp/ONNX chains. The browser target does not install a server-side image/LLM execution service. Those native advisories, Python CVE scanning, broader dependency reachability/security review and a hosted distribution gate remain open; no blind upgrades or audit exceptions were approved.

Pinned Qwen ONNX weights are cached/downloaded separately. Their upstream/conversion provenance and redistribution gate remain as recorded in [the original legal audit](LEGAL_AND_LICENSE_AUDIT.md). The local review package excludes them; actual browser inference was verified using the existing checksum-verified same-origin cache. This does not establish universal model accuracy or rights to redistribute a future model bundle. Hosting/compute costs and production policy are not implied free by package licences.
