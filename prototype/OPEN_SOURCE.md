# Open-source components and CAD reference

Checked 2026-10-16. The demo does not require paid CAD, an account, an API key or a hosted inference subscription. Open-source licences still apply; local hardware, browser support and model-host network access constrain execution. No unrestricted-use or zero-infrastructure-cost promise is made.

| Component | Selected version | Licence | Actual use |
| --- | --- | --- | --- |
| [FreeCAD](https://github.com/FreeCAD/FreeCAD/releases/tag/1.1.4) | 1.1.4 stable reference | [LGPL-2.1](https://github.com/FreeCAD/FreeCAD/blob/main/LICENSE) | UI research: model tree, properties, standard views and workbench conventions. Its CAD kernel, application, icons and code are not embedded or redistributed. |
| [Three.js](https://github.com/mrdoob/three.js/tree/r180) | 0.180.0 | MIT | Actual WebGL2 geometry display and camera controls. |
| [Lucide](https://github.com/lucide-icons/lucide/tree/0.468.0) | 0.468.0 | ISC | Actual open-source SVG icons in the CAD ribbon. |
| [Transformers.js](https://github.com/huggingface/transformers.js/tree/3.7.2) | 3.7.2 | Apache-2.0 | Actual text-generation pipeline in a Web Worker. |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | 1.22.0-dev.20250409-89f8206ba4, pinned by Transformers.js | MIT | WebAssembly inference, one CPU thread; no WebGPU requirement. WASM loader/binary fetched from the pinned Transformers.js npm distribution on jsDelivr. |
| [Qwen2.5-0.5B-Instruct](https://github.com/QwenLM/Qwen2.5) | 0.5B instruct, q4 ONNX | Apache-2.0 in the upstream release | Small local language model; [ONNX conversion/model card](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct). Weights are downloaded from Hugging Face, not included in the ZIP. |
| [esbuild](https://github.com/evanw/esbuild) | 0.25.12 | MIT | Build tooling only. |

The Qwen conversion is pinned to commit `22942cb7d7ba4cc81bb4673549ca4d4614469b5e`. The conversion card identifies the upstream Qwen model; its upstream Apache-2.0 licence and the conversion metadata were inspected. Extend real inference checks and extraction evaluation before treating this as a production dependency. Runtime npm packages are version-pinned in the lockfile.

This is an independent interface following CAD conventions. It is not SolidWorks or an embedded FreeCAD installation. Supported geometry remains the reference shell and imported OBJ/STL meshes. STEP solids and generic CAD operations belong to P2.

## AI execution and data

Click **Load AI model** explicitly; ordinary geometry/brief use makes no model requests. First use downloads about 800 MB and initialises the model, possibly taking minutes. The browser may cache files, but offline AI availability is not guaranteed. CPU speed and available memory determine latency. **Stop** terminates the worker. Requests are limited to 2,000 characters and short conversation/context windows for this small model.

Project context is supplied to the local worker. Application code does not POST prompts/files to an external inference API. Model/runtime hosts still receive normal file requests and browser request metadata. Chat is session-only; accepted field changes use existing browser persistence and JSON export.

**Conversation** returns plain-language answers without proposing field changes. **Propose changes** requests structured updates; this explicit mode keeps ordinary questions separate from edits. A strict field/type contract rejects unsupported fields, invalid quantities and malformed JSON. Unstructured replies remain visible without changing the project. Explicit **Apply AI proposal** checks the project revision and geometric consistency; it records model provenance and user acceptance. It does not constitute engineering validation or establish model accuracy.

The deterministic **Commands** tab is separate and remains available offline. There is no fallback that labels command parsing as AI. Photos are references, not input to this text-only model.

## Verification and environment access

- `npm test`: 28 checks pass. Contract/worker unit tests use test doubles and do not establish inference quality.
- `npm run test:browser` and `npm run test:standalone`: actual WebGL, CAD tools, four languages, files, persistence and offline core workflows pass.
- `npm run test:ai-model`: actual pinned Qwen/q4 inference on ONNX Runtime Node CPU; commercial extraction/apply and plain-language material question. This is separate from browser verification.
- `npm run test:ai-local`: actual bundled worker in Chromium, one-thread WASM, self-hosted pinned model/runtime files. The commercial request sets annual demand to 80,000 and market to Appliances. Review/apply persists the two fields and provenance while preserving other project data. This does not use fake responses. Natural-language conversation runs without changing fields.
- `npm run test:ai-real`: the default remote-host route reaches an environment limitation, `net::ERR_CERT_AUTHORITY_INVALID`. It has **not** passed in this managed Chromium instance. System-trusted downloads succeed; the same files run successfully through the same-origin route. Initial domain denials were resolved.

This is smoke coverage, not extraction-accuracy or engineering validation. Earlier prompt trials produced malformed JSON and invented fields; these were rejected by the contract. The final demo uses a separate conversation mode and reviewable change mode, but the small model can still make mistakes. The known commercial smoke does not establish reliable handling of all requests or languages. CPU/wasm latency varies; one measured commercial generation took about 38 seconds in the cloud browser.

The saved environment draft preserves the package-manager preset and adds `huggingface.co`, `cas-bridge.xethub.hf.co`, `cdn-lfs.hf.co`, `cdn-lfs.huggingface.co` and the observed weights destination `us.aws.cdn.hf.co`. jsDelivr is already in the preset. Metadata, upstream licence and pinned weights were downloaded using normal TLS validation. The weights SHA-256 matches the upstream LFS ETag (`09235a3b1c135cd04ef570e5053b5c079e028078a2cc5f76ba6a251e91bf3296`); preparation checks it again. The existing Chromium legacy NSS store takes precedence over the isolated XDG trust store. Permission to update that store was not granted; its contents were not changed. No certificate checks were disabled.

Reusable install/start instructions and domain additions are saved in the environment draft. Review and save them in environment settings, then publish as required by the configuration tool. Saving the draft is not evidence of publication or fresh-task restoration.

Detailed run evidence: [AI demo verification](../docs/verification/AI_DEMO_2026-10-16.md).

## Supported same-origin static hosting

The ZIP defaults to remote asset downloads. A static deployment can serve model/runtime files with the application, without an inference server or API subscription. This is also how the complete worker was tested in the cloud despite its browser certificate-store limitation.

With Node 24+ (for the environment-proxy flag), run from `prototype`:

```bash
npm run build:standalone
npm run test:ai-model
npm run prepare:ai-assets
npm run test:ai-local
python -m http.server 4175 --bind 127.0.0.1 --directory ../.cache/ai/static
```

`prepare:ai-assets` copies the version-pinned npm WASM loader/binary and links the pinned cached model files into `.cache/ai/static`. It writes an HTML deployment configured with `ai-model-host` and `ai-wasm-base` metadata. Relative URLs resolve against the application URL and must become HTTP/HTTPS URLs. The worker still executes the actual model locally. This directory contains about 800 MB of assets and is excluded from Git and the demo ZIP. A production static host must support their file size, bandwidth, MIME types and licence notices; no hosted public URL is claimed here.
