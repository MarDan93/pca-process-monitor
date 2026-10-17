# Dependency and licence inventory

Snapshot: `AUD-2026-10-17`, baseline `0fe5efe3e626edf7c93138efa83be821bfcea8a0`. English metadata report. [Machine-readable inventory](DEPENDENCY_INVENTORY.json).

## Scope and evidence

The npm inventory covers 107 locked entries, including platform-optional packages; 60 are installed here. Python lists 55 observed distributions from the project virtual environment, of which eight are directly declared. It is not a complete distribution SBOM, licence compatibility decision or evidence that every native/bundled notice has been checked. No new engine is adopted by listing it.

Sources: `prototype/package.json`, `prototype/package-lock.json`, installed `package.json` files and Python `importlib.metadata`. SPDX fields/classifiers are package metadata; native subcomponents need separate review. Candidate-only PyPI/source reads are in [research provenance](RESEARCH_PROVENANCE.md), not this installed/locked list.

The lockfile integrity hashes remain intact. Python requirements use lower bounds, so a reproducible server/numerical lock remains work to do. This audit does not rewrite either dependency declaration or lockfile.

## Significant findings

- Installed/locked native libvips packages declare **LGPL-3.0-or-later**; some sharp platform packages declare compound Apache/LGPL/MIT terms. Container or native binary redistribution needs exact-version notices/source obligations checked.
- Current browser worker uses the Transformers.js web distribution; installed native dependencies are not automatically proven part of the delivered HTML. Reachability/artefact composition remains to be assessed.
- `npm audit` reports **six affected dependency entries: 2 high, 4 moderate**, including inherited nodes. No automatic fix was applied; see [threat model](../security/THREAT_MODEL.md).
- `pip check` passed, but no Python CVE scanner was run; package consistency is not a security audit.
- Optional legacy Gemini/Claude SDK licences do not license the providers’ model services; exclude them from essential self-hosted inference.

## npm locked packages

| Package | Version | Metadata licence | Local / dev / optional |
| --- | --- | --- | --- |
| `@emnapi/runtime` | 1.11.3 | MIT | not installed / production graph / optional |
| `@esbuild/aix-ppc64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/android-arm` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/android-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/android-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/darwin-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/darwin-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/freebsd-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/freebsd-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-arm` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-ia32` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-loong64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-mips64el` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-ppc64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-riscv64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-s390x` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/linux-x64` | 0.25.12 | MIT | installed / dev / optional |
| `@esbuild/netbsd-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/netbsd-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/openbsd-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/openbsd-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/openharmony-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/sunos-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/win32-arm64` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/win32-ia32` | 0.25.12 | MIT | not installed / dev / optional |
| `@esbuild/win32-x64` | 0.25.12 | MIT | not installed / dev / optional |
| `@huggingface/jinja` | 0.5.10 | MIT | installed / production graph / required edge |
| `@huggingface/transformers` | 3.7.2 | Apache-2.0 | installed / production graph / required edge |
| `@img/colour` | 1.1.0 | MIT | installed / production graph / required edge |
| `@img/sharp-darwin-arm64` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-darwin-x64` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-libvips-darwin-arm64` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-darwin-x64` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linux-arm` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linux-arm64` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linux-ppc64` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linux-riscv64` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linux-s390x` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linux-x64` | 1.2.4 | LGPL-3.0-or-later | installed / production graph / optional |
| `@img/sharp-libvips-linuxmusl-arm64` | 1.2.4 | LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-libvips-linuxmusl-x64` | 1.2.4 | LGPL-3.0-or-later | installed / production graph / optional |
| `@img/sharp-linux-arm` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-linux-arm64` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-linux-ppc64` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-linux-riscv64` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-linux-s390x` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-linux-x64` | 0.34.5 | Apache-2.0 | installed / production graph / optional |
| `@img/sharp-linuxmusl-arm64` | 0.34.5 | Apache-2.0 | not installed / production graph / optional |
| `@img/sharp-linuxmusl-x64` | 0.34.5 | Apache-2.0 | installed / production graph / optional |
| `@img/sharp-wasm32` | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later AND MIT | not installed / production graph / optional |
| `@img/sharp-win32-arm64` | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-win32-ia32` | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later | not installed / production graph / optional |
| `@img/sharp-win32-x64` | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later | not installed / production graph / optional |
| `@isaacs/fs-minipass` | 4.0.1 | ISC | installed / production graph / required edge |
| `@protobufjs/aspromise` | 1.1.2 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/base64` | 1.1.2 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/codegen` | 2.0.5 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/eventemitter` | 1.1.1 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/fetch` | 1.1.1 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/float` | 1.0.2 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/path` | 1.1.2 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/pool` | 1.1.0 | BSD-3-Clause | installed / production graph / required edge |
| `@protobufjs/utf8` | 1.1.2 | BSD-3-Clause | installed / production graph / required edge |
| `@types/node` | 26.6.5 | MIT | installed / production graph / required edge |
| `boolean` | 3.2.0 | MIT | installed / production graph / required edge |
| `chownr` | 3.0.0 | BlueOak-1.0.0 | installed / production graph / required edge |
| `define-data-property` | 1.1.4 | MIT | installed / production graph / required edge |
| `define-properties` | 1.2.1 | MIT | installed / production graph / required edge |
| `detect-libc` | 2.1.2 | Apache-2.0 | installed / production graph / required edge |
| `detect-node` | 2.1.0 | MIT | installed / production graph / required edge |
| `es-define-property` | 1.0.1 | MIT | installed / production graph / required edge |
| `es-errors` | 1.3.0 | MIT | installed / production graph / required edge |
| `es6-error` | 4.1.1 | MIT | installed / production graph / required edge |
| `esbuild` | 0.25.12 | MIT | installed / dev / required edge |
| `escape-string-regexp` | 4.0.0 | MIT | installed / production graph / required edge |
| `flatbuffers` | 25.9.23 | Apache-2.0 | installed / production graph / required edge |
| `global-agent` | 3.0.0 | BSD-3-Clause | installed / production graph / required edge |
| `globalthis` | 1.0.4 | MIT | installed / production graph / required edge |
| `gopd` | 1.2.0 | MIT | installed / production graph / required edge |
| `guid-typescript` | 1.0.9 | ISC | installed / production graph / required edge |
| `has-property-descriptors` | 1.0.2 | MIT | installed / production graph / required edge |
| `json-stringify-safe` | 5.0.1 | ISC | installed / production graph / required edge |
| `long` | 5.3.2 | Apache-2.0 | installed / production graph / required edge |
| `lucide` | 0.468.0 | ISC | installed / production graph / required edge |
| `matcher` | 3.0.0 | MIT | installed / production graph / required edge |
| `minipass` | 7.1.3 | BlueOak-1.0.0 | installed / production graph / required edge |
| `minizlib` | 3.1.0 | MIT | installed / production graph / required edge |
| `object-keys` | 1.1.1 | MIT | installed / production graph / required edge |
| `onnxruntime-common` | 1.21.0 | MIT | installed / production graph / required edge |
| `onnxruntime-node` | 1.21.0 | MIT | installed / production graph / required edge |
| `onnxruntime-web` | 1.22.0-dev.20250409-89f8206ba4 | MIT | installed / production graph / required edge |
| `onnxruntime-common` | 1.22.0-dev.20250409-89f8206ba4 | MIT | installed / production graph / required edge |
| `platform` | 1.3.6 | MIT | installed / production graph / required edge |
| `protobufjs` | 7.6.6 | BSD-3-Clause | installed / production graph / required edge |
| `roarr` | 2.15.4 | BSD-3-Clause | installed / production graph / required edge |
| `semver` | 7.8.5 | ISC | installed / production graph / required edge |
| `semver-compare` | 1.0.0 | MIT | installed / production graph / required edge |
| `serialize-error` | 7.0.1 | MIT | installed / production graph / required edge |
| `sharp` | 0.34.5 | Apache-2.0 | installed / production graph / required edge |
| `sprintf-js` | 1.1.3 | BSD-3-Clause | installed / production graph / required edge |
| `tar` | 7.5.22 | BlueOak-1.0.0 | installed / production graph / required edge |
| `three` | 0.180.0 | MIT | installed / production graph / required edge |
| `tslib` | 2.8.1 | 0BSD | not installed / production graph / optional |
| `type-fest` | 0.13.1 | (MIT OR CC0-1.0) | installed / production graph / required edge |
| `undici-types` | 8.9.0 | MIT | installed / production graph / required edge |
| `yallist` | 5.0.0 | BlueOak-1.0.0 | installed / production graph / required edge |

Flags describe the lock entry, not a claim about runtime reachability or every parent edge. The JSON retains paths, resolved locations and integrity-presence observations.

## Observed Python environment

| Distribution | Version | Licence expression/classifier or summary | Direct requirement |
| --- | --- | --- | --- |
| `annotated-types` | 0.8.0 | MIT | no / environment-transitive |
| `anthropic` | 1.13.0 | License :: OSI Approved :: MIT License | yes |
| `anyio` | 4.15.1 | MIT | no / environment-transitive |
| `certifi` | 2026.7.22 | License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0) | no / environment-transitive |
| `cffi` | 2.1.1 | MIT-0 | no / environment-transitive |
| `charset-normalizer` | 3.5.2 | MIT | no / environment-transitive |
| `contourpy` | 1.4.0 | BSD-3-Clause | no / environment-transitive |
| `cryptography` | 50.0.2 | Apache-2.0 OR BSD-3-Clause | no / environment-transitive |
| `cycler` | 0.12.1 | License :: OSI Approved :: BSD License | no / environment-transitive |
| `docstring_parser` | 0.18.0 | License :: OSI Approved :: MIT License | no / environment-transitive |
| `fonttools` | 4.66.1 | MIT | no / environment-transitive |
| `google-ai-generativelanguage` | 0.6.15 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `google-api-core` | 2.33.0 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `google-api-python-client` | 2.201.0 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `google-auth` | 2.62.0 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `google-auth-httplib2` | 0.4.4 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `google-generativeai` | 0.8.6 | License :: OSI Approved :: Apache Software License | yes |
| `googleapis-common-protos` | 1.75.0 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `grpcio` | 1.84.0 | Apache-2.0 | no / environment-transitive |
| `grpcio-status` | 1.71.2 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `h11` | 0.16.0 | License :: OSI Approved :: MIT License | no / environment-transitive |
| `httpcore2` | 2.13.1 | BSD-3-Clause | no / environment-transitive |
| `httplib2` | 0.32.0 | License :: OSI Approved :: MIT License | no / environment-transitive |
| `httpx2` | 2.13.1 | BSD-3-Clause | no / environment-transitive |
| `idna` | 3.20 | BSD-3-Clause | no / environment-transitive |
| `jiter` | 0.17.0 | MIT | no / environment-transitive |
| `kiwisolver` | 1.5.1 | License :: OSI Approved :: BSD License | no / environment-transitive |
| `matplotlib` | 3.11.2 | License :: OSI Approved :: Python Software Foundation License | yes |
| `narwhals` | 2.27.1 | MIT | no / environment-transitive |
| `numpy` | 2.5.4 | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 | yes |
| `packaging` | 26.3 | Apache-2.0 OR BSD-2-Clause | no / environment-transitive |
| `pandas` | 3.0.6 | License :: OSI Approved :: BSD License | yes |
| `pillow` | 12.3.0 | MIT-CMU | no / environment-transitive |
| `pip` | 25.0.1 | License :: OSI Approved :: MIT License | no / environment-transitive |
| `plotly` | 7.1.0 | MIT | yes |
| `proto-plus` | 1.28.2 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `protobuf` | 5.29.6 | 3-Clause BSD License | no / environment-transitive |
| `pyasn1` | 0.6.4 | BSD-2-Clause | no / environment-transitive |
| `pyasn1_modules` | 0.4.2 | License :: OSI Approved :: BSD License | no / environment-transitive |
| `pycparser` | 3.11 | BSD-3-Clause | no / environment-transitive |
| `pydantic` | 2.14.1 | MIT | no / environment-transitive |
| `pydantic_core` | 2.50.1 | MIT | no / environment-transitive |
| `pyparsing` | 3.3.3 | MIT | no / environment-transitive |
| `python-dateutil` | 2.9.0.post0 | License :: OSI Approved :: BSD License; License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `python-dotenv` | 1.2.4 | BSD-3-Clause | yes |
| `requests` | 2.34.2 | License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `scipy` | 1.18.1 | License :: OSI Approved :: BSD License | yes |
| `six` | 1.17.0 | License :: OSI Approved :: MIT License | no / environment-transitive |
| `sniffio` | 1.3.1 | License :: OSI Approved :: MIT License; License :: OSI Approved :: Apache Software License | no / environment-transitive |
| `tqdm` | 4.70.1 | MPL-2.0 AND MIT | no / environment-transitive |
| `truststore` | 0.10.5 | MIT | no / environment-transitive |
| `typing-inspection` | 0.4.4 | MIT | no / environment-transitive |
| `typing_extensions` | 4.16.0 | PSF-2.0 | no / environment-transitive |
| `uritemplate` | 4.2.0 | BSD 3-Clause OR Apache-2.0 | no / environment-transitive |
| `urllib3` | 2.8.0 | MIT | no / environment-transitive |

Do not apply a top-level licence label to all libraries shipped in a wheel. Full licence texts, native dependencies, model/data licences and distribution notices require release-specific review. [LEGAL_AND_LICENSE_AUDIT.md](LEGAL_AND_LICENSE_AUDIT.md) records the decision gates.
