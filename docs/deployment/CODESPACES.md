# FABRIVRA in a private GitHub Codespace

Current trial: **`trial/codespaces-process`**. FABRIVRA runs as a browser application on the Codespace CPU, with SQLite persistence and the existing compact free model. No desktop installer, new hosting service, GPU or paid API is needed. The implemented V2 increment is a configured L0 **production-system simulator**, not a certified polymer/CAE solver. [Current scope](../product/FABRIVRA_V2.md) · [Verification](../verification/FABRIVRA_V2_2026-10-26.md).

## Update an existing Codespace

Run these commands separately from the repository root. Stop on errors; preserve local changes instead of resetting or cleaning them.

```sh
git pull --ff-only origin trial/codespaces-process
python scripts/backup_workspace.py
npm --prefix web run build
python scripts/start_codespaces.py --restart
```

No new application dependency is added in V2. The private SQLite backup is verified and saved under ignored `.cache/backups/`; the original database and generated credentials are retained. The restart checks its own recorded PID, exact command and working directory; it refuses to stop unrelated processes.

Open **Ports → 8000 → Open in Browser**. Verify **Visibility: Private**. Use the forwarded **HTTPS** address, not desktop forwarding. To print only that address:

```sh
python scripts/start_codespaces.py --url
```

Sign in as **`owner`** with the password already in your private `.cache/codespaces/owner-credentials.json`. Open the file in the Codespaces editor; do not paste it into chat/issues or commit it. V2 does not rotate it. The app keeps its own authenticated session and CSRF/origin checks in addition to GitHub's private port protection.

## If no Codespace exists

Open [the trial creation screen](https://github.com/codespaces/new?repo=1262022691&ref=trial%2Fcodespaces-process), verify the branch, account allowance and spending controls, then choose the smallest two-core machine. This is a creation screen, not a live app link. No Codespace was provisioned by the V2 work: the authenticated list returned zero instances on 26 October.

The dev container provisions Python 3.12/Node 24, installs hash/lock-pinned dependencies, builds the app and prepares/verifies the approximately 786 MB compact model. If automatic preparation fails, use:

```sh
python scripts/setup_codespaces.py --with-ai
python scripts/start_codespaces.py
```

Preparation can download open-weight files; inference thereafter is cache-only on CPU. Existing setup/model caches are reused. Logs: **Output → Dev Containers** and `.cache/codespaces/workspace.log`. Neither a running PID nor a successful local launcher test proves that GitHub's external forwarded port works.

## First reproducible complete-system comparison

1. The app opens empty. Choose an existing project in the header, create one, or explicitly choose **Load 2 vs 4 cavity benchmark** in **System Simulation**. No flange or other geometry loads by default. The benchmark creates a *separate* project with an original consumer-tray OBJ, fictional machine/material data and two saved configurations; it retains existing projects.
2. Choose **Run & compare scenarios**. Both alternatives produce **160 finished parts**: 80 two-cavity shots versus 40 four-cavity shots. The same finite conveyor and operational packaging serve both cells. All input times, capacities, prices and geometry are declared synthetic test inputs.
3. Inspect the two result cards. The finite-campaign baseline computes approximately **805.7 parts/h** for two cavities and **752.2 parts/h** for four. Configured unit costs are **EUR 0.183540** and **EUR 0.199605**. These figures come from events/cost inputs, not the reference screenshot, and are not production predictions.
4. Select **Configuration B · 4 cavities** in Properties. Under **Operational packaging**, change **Parts per container** from 12 to **48**. Choose **Preview changes → Approve and apply**. The existing run remains immutable and is marked outdated where dependencies changed.
5. Rerun the comparison. Four-cavity output increases to approximately **954.0 parts/h** for this campaign. Waiting, finished counts and campaign costs are recalculated. **Undo last change** appends a compensating revision; it does not erase history.
6. Click a result card to select its saved run. **Play**, **Next event**, timeline bars, the time slider and the time-series cursor sample the same run ID and simulation clock. Container changes animate at the conveyor end. Use **Conveyor buffer occupancy**, material bins, robot XYZ and output counts to inspect the schedule. Expand/collapse **Signals & event timeline** and **Constraints, costs & provenance** as needed.
7. Unknown pressure, temperature, torque and moisture channels show **Unavailable** without a fabricated curve. Generic equipment, plate envelopes and robot paths are visual interpretations; collision/actual EOAT/container fit and product quality remain unverified.
8. **System Optimization** exposes the same complete-cell alternatives and configurable downstream constraints. There is no automatic “more cavities is best” selection or validated global optimiser.

For a counterexample, configure both alternatives with 1000 conveyor slots, zero container-change time and 0.01 s/part handling. Four cavities then outperform two. Do not treat that deliberately unconstrained test as a recommendation for a real buffer or packaging station.

## Import your own information

- **Customer brief:** commercial unit, annual demand, programme duration, target costs and business context. Scenario cost assumptions are separately approved snapshots. **Copy declared customer brief** transfers part demand/duration/currency into a draft; approve it before calculation. Kits/assemblies need an explicit parts conversion.
- **Product:** OBJ/STL, original source units and retained original bytes/hash. Mass and projected area require declared data; mesh bounding dimensions are not solid volume or projected area. STEP/photo reconstruction is unavailable in this release.
- **Machine park / Materials:** add owner-scoped records manually or validate/import the CSV template. Maximum injection rate (cm³/s), plasticising capacity (g/s) and actual company hourly costs can be supplied. Selecting a record freezes it into the scenario. No verified numerical OEM/grade catalogue is fabricated.
- **System Simulation:** create/duplicate a scenario, import its JSON, select the imported machine/material, enter mould envelope/robot/EOAT/conveyor/packaging/timing/cost inputs, then preview/approve/run. Unknown prices remain unknown; an incomplete unit cost stays blank. A changed product geometry requires rebinding/approving the scenario before rerunning.
- **Benchmark kit:** **Download benchmark files** supplies OBJ, CSVs, both scenario JSON files, README and SHA-256 manifest. The same original files live in [`examples/system-benchmark`](../../examples/system-benchmark). Select your newly imported resource IDs after manual import; JSON files do not assume IDs from somebody else's database.

The earlier cycle-only workflow remains under **Legacy cycle worksheet** for compatibility. Its old numerical oracle is unchanged; it is not the new complete-system comparison.

## AI: optional, bounded and reviewable

In the right copilot, **Conversation** is read-only checked workflow advice. **System settings** selects a saved scenario and extracts an explicit supported field update. Try:

```text
Set container_change_s to 5 seconds and parts_per_container to 24.
```

Review the proposal, preview its exact effects, approve it, rerun and optionally undo. The model does not execute shell/CAD operations, provision services or silently edit the project. Manual controls complete the entire benchmark without AI. The 50-case native evaluation passed 45 cases: 19/24 requested extractions and 26/26 refusal checks after typed validation. Five malformed/misspelled proposals were rejected, not applied. This is not a broadly reliable autonomous engineering agent.

ChatGPT-plan integration remains **blocked/unverified**, not enabled or declared ineligible: there is no accessible Codespace whose private forwarding/eligibility can be confirmed, and current official documentation fetches were denied by this environment's egress proxy. No OAuth client/callback, token sharing or API billing was introduced. [Access evidence and provider decision](AI_CODESPACES_ELIGIBILITY.md).

## Persistence, limits and costs

The live database is `.cache/workspace/projects.sqlite3`. It survives app/Codespace restarts, **not Codespace deletion**. Git does not store private projects. **Reports → Export project** creates a portable JSON backup of geometry, scenario inputs, revisions and legacy/system runs. **Restore project backup → Approve and restore** creates a separate project with fresh IDs and preserves existing projects. Credentials, sessions and pending approvals are excluded. The checksum checks integrity, not authorship/physical truth. Keep private full SQLite backups/credentials securely outside a Codespace before deleting it.

Trial bounds: 200 projects, 2000 library records, 20 scenarios/project, 1–8 cavities, 1–100 shots/run, up to 6 alternatives/comparison, 120 immutable system runs/project, 32 MiB portable backup. These are explicit software trial bounds, not manufacturer/productivity limits. Use a separate project/campaign and retain exports at the immutable-run limit.

No new provider charge, GPU, external AI API or hosting resource was activated. Codespaces compute and retained storage can still consume your GitHub allowance or cost money under account billing settings. Current allowance/prices were not verified; no unlimited-free claim is made. Stop the Codespace to stop compute; closing a browser tab is insufficient. Retained storage remains billable according to GitHub/account terms.

## Reproduce checks

```sh
PYTHONPATH=server .venv-app/bin/python -m unittest discover -s server/tests -v
npm --prefix prototype test
npm --prefix web run build
npm --prefix web run test:browser -- --server-ai --engineering
node web/tests/system-workflow.mjs --server-ai
.venv-app/bin/python scripts/test_codespaces.py
.venv-app/bin/python scripts/evaluate_system_assistant.py
```

The last evaluation intentionally returns failure while native model quality is 45/50; full results identify the five rejected extractions. It downloads no weights. The launcher test uses owned temporary data and synthetic Codespaces variables; external forwarding/privacy remains unverified. The [19 October guide](archive/CODESPACES_2026-10-19.md) is retained as historical evidence, not current product direction.
