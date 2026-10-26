# Official ChatGPT-plan eligibility — blocked/unverified

Checked 26 October 2026. This release does not connect an OAuth account, share tokens, activate a paid API or infer entitlement from a ChatGPT subscription.

## Observed evidence

- Existing platform GitHub authentication works. Read-only repository API checks report owner/admin access to `MarDan93/pca-process-monitor`; no new GitHub credential was requested or printed.
- The authenticated `GET /user/codespaces` request now returns **HTTP 200, zero instances**. The older 19 October 403 finding is historical. No current Codespace/private forwarded origin is available to verify deployment identity, session ownership, callback eligibility or provider restrictions.
- Attempts to read the official documents below failed at the **egress proxy tunnel with 403**. This is not an origin-server statement that Codespaces is eligible/ineligible, nor proof that a preview feature is generally available.
- Exact domains `developers.openai.com` and `docs.github.com` were added to the existing restricted **environment draft**, preserving prior domains/presets. Saving a draft does not activate network changes. Review/save in environment settings and publish if access is needed, then retry the affected official checks. No broader network permission or secret was added.

Sources requested (not successfully retrieved):

- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- https://docs.github.com/en/billing/reference/product-usage-included
- https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository

[Raw access outcomes](../verification/FABRIVRA_V2_OFFICIAL_ACCESS_2026-10-26.json). User-supplied document URLs/claims are research leads; they are not independently verified current policy. No reverse-engineered OAuth route, copied client ID or use of editor/Codex credentials as an application login was attempted.

## Provider now

The existing compact `onnx-community/Qwen2.5-0.5B-Instruct` ONNX q4 profile remains the default. Model revision, file size and SHA-256 remain unchanged; inference is CPU/cache-only, one server job at a time, bounded input/output, timeout and cancellation. Code/weights/licences have separate provenance; [prior rights audit](../compliance/LEGAL_AND_LICENSE_AUDIT.md). No new weights are downloaded for V2, and optional larger old experimental weights are not promoted.

The copilot exposes read-only checked Conversation and bounded commercial/legacy-process/**System settings** proposals. A scenario proposal is strict JSON, contains only explicitly requested whitelisted fields/values, is scoped to a saved scenario/current project revision, and requires preview/approval before persistence. It cannot execute shell/CAD code or establish physics facts. Five native extraction failures in the 50-case suite were rejected; 45/50 overall passed. The manual UI remains independent.

A future official provider adapter needs verified deployment/account eligibility, documented approved OAuth flow/token isolation, model discovery and inference fields, consent, quotas, secure storage/session lifecycle, error handling and live tests. It must use the same typed tool/approval boundary. These prerequisites are open; no inference API endpoint or billing assumption is hardcoded in this release.
