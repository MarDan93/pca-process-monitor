# Security policy

Status, 17 October 2026: this repository contains a local development/demo application and a separate scientific library. There is no audited production online platform or supported security SLA. Do not treat a passing geometry/AI smoke test as security or engineering certification.

## Protected hosted pilot

The subsequent hosted increment adds a fail-closed, single-owner mode with server-side sessions, exact origin/Host rules, Secure/HttpOnly cookies, session-derived CSRF tokens and a persistent volume. [Deployment controls and limits](docs/deployment/MANAGED_WEB.md) are explicitly separate from the local developer mode. The current image and authentication/persistence checks are recorded in [hosted verification](docs/verification/HOSTED_2026-10-17.md). This is not a production multi-user security certification or a verified hosted recovery service. No public service is active until the owner connects a hosting account and accepts its costs.

## Reporting

Do not post credentials, personal/company information, exploitable private-project details or unpublished exploit material in public issues. If this repository's GitHub private vulnerability-reporting feature is enabled, use **Security → Report a vulnerability**. Otherwise request a private reporting channel from the maintainer without publishing sensitive details. This policy does not enable that GitHub feature, promise a response deadline or authorise contact/messages on anyone's behalf.

Provide affected commit/version, scope, reproduction using synthetic/permitted input, expected versus observed behaviour and a suggested mitigation if known. Do not test systems/data that you are not authorised to assess.

## Current review status

The [threat model](docs/security/THREAT_MODEL.md) records missing online controls, native dependency advisories and integrity/compute/AI risks. `npm audit` currently reports six affected dependency entries; no blanket exploitability or safety claim is made. Python dependency consistency was checked, not a Python CVE scan. Known PCA normalisation/missing-data issues also prevent trusted engineering recommendations until corrected and validated.

Until release gates pass, keep the existing demo in a controlled local/synthetic workflow. Do not expose the development HTTP server, unauthenticated numerical jobs, arbitrary file processing or private project state publicly. Do not disable TLS verification, put secrets in browser/exported data, or execute code from model output/uploaded reproduction scripts.

Before public/private multiuser hosting: verify authenticated project/asset/job access, isolated bounded parsing/compute, safe output rendering, CSRF/CORS/session controls, dependency remediation, licence/data rights, backups/restoration and independent security review. Account-free demo functionality must be separated from private project and privileged compute routes.

MIT licensing does not imply production security, scientific accuracy or a maintained commercial service. Any publication/deployment still needs explicit owner authorisation.
