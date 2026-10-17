# Original engineering workspace specification

`AUD-2026-10-17`. Design proposal only; no new product UI is claimed implemented. Both variants below were created from the customer's workflow and audited capability gaps. The existing demo remains available. No competitor screenshot, icon set or proprietary layout asset was traced/copied. See the original [design board](ORIGINAL_UI_VARIANTS.html) and [provenance](../compliance/RESEARCH_PROVENANCE.md).

Static previews of the original studies (not product screenshots): [Variant A](Variant-A.png), [Variant B](Variant-B.png).

**Subsequent implementation (17 October):** the original Process spine direction is now implemented in [`web/`](../../web/README.md), using CAD ribbon/icons and a right copilot as requested. [Actual application evidence](../verification/WORKSPACE_2026-10-17.md) is separate from these schematic studies. Only commercial operations, supported mesh handling and revision history are active; proposed simulation controls remain unavailable.

## Shared user tasks

A designer/process engineer starts with customer demand/market/value, develops a product and supported mould alternatives, compares the cell and sees how a sourced L0 sequence affects capacity/cost. The copilot interprets requests and proposes authorised operations; the scene and properties expose the same revision. A part's pose and identity are traceable from cavity through grip to belt. No animated object or scientific colour implies an unexecuted calculation.

New projects show an empty scene with import/brief actions and missing-input guidance. Reference shells are optional examples. A bracket/flange does not acquire PCB/IP65/snap-fit fields. Keep EN/IT/FR/ES with English default, independent of user data. All strings, accessible names and units follow that policy.

## Variant A — Process spine (selected)

A fixed vertical workflow rail provides ten original module symbols. An adjacent collapsible context panel holds relevant objects/requirements; the central scene is always mounted. A compact decision strip above the scene connects the selected scenario, revision and result validity. The right copilot persists in full or compact form. A lower drawer contains timeline, signals, numeric results and event log sharing one simulation time.

```text
 Project / revision / scenario / units / language       project and tool ribbon
 ┌─────┬──────────────────────────────────────────────────────┬───────────────┐
 │Rail │ Context (collapsible) │                              │ Copilot       │
 │10   │ requirements /        │ Persistent 3D scene          │ context and   │
 │areas│ objects / properties  │ product → mould → cell       │ proposals     │
 │     │                      │ selection + validity         │               │
 ├─────┴──────────────────────┴──────────────────────────────┴───────────────┤
 │ Run / t / play-pause / step / speed | timeline / signals / events drawer     │
 └───────────────────────────────────────────────────────────────────────────┘
```

Strengths: stable spatial orientation, clear customer-to-production progression, one scene/camera across modules, direct access to evidence, good laptop use with both panels collapsed. Tradeoff: large scenario comparisons need a dedicated results drawer instead of showing two full scenes at once.

## Variant B — Scenario laboratory

A compact vertical rail and persistent central scene sit beneath a scenario comparison strip. A bottom two-column results deck compares assumptions/capacity/costs; context appears as a docked inspector, while the copilot is an always-accessible side drawer. Scenario selection changes the scene data by stable IDs; it does not remount the viewer.

```text
 Project / tools | Scenario A [revision] ⇄ Scenario B [revision] | language
 ┌─────┬─────────────────────────────────────────────────┬───────────────────┐
 │Rail │ Persistent selected-scenario scene              │ Copilot / compact │
 │     │ selection and context inspector dock            │ proposal drawer   │
 ├─────┴─────────────────────────────────────────────────┴───────────────────┤
 │ Same-clock timeline                                                        │
 ├────────────────────────────────┬───────────────────────────────────────────┤
 │ A: assumptions / checks / cost │ B: assumptions / checks / cost            │
 └────────────────────────────────┴───────────────────────────────────────────┘
```

Strengths: excellent alternative comparison and result traceability after engines exist. Tradeoff: visible comparisons can crowd the initial customer briefing and imply comparable calculated results before inputs/engines are ready. It needs more state management and screen space.

## Selection

Choose **A** for the first integrated delivery because early commercial inputs and missing information are primary, and a single stable scene reduces navigation burden. Adopt B's comparison deck later as a results mode using the same domain/run contracts, not a separate application. This is an ordinary reversible design decision; it does not authorise a rewrite or release.

## Visual language

Original working language: a restrained dark industrial workspace with geometry-neutral symbols and semantically labelled status. Proposed tokens:

| Role | Proposed token | Meaning |
| --- | --- | --- |
| Background / panels / raised surfaces | `#101720` / `#18232F` / `#223242` | Separate working depths without decorative gradients |
| Primary text / secondary text | `#E6EDF5` / `#A8B8C9` | Maintain readable contrast on dark surfaces |
| Selection/action | `#69D5C5` | Selection, focus and permitted primary action |
| Assumption/incomplete | `#F2C16B` | Missing/assumed or needs review, always with a label/icon |
| Failure/conflict | `#FF8B8B` | Failed check, invalid/stale execution constraint |
| Verified result | `#8DDEA0` | Only a named check/reference that actually passed; never a universal engineering approval |
| AI proposal | `#BEA8FF` | Proposed text/effects awaiting review, distinct from measured facts |

Use system UI fonts; reserve monospace for quantities/timestamps/IDs. Space controls on an 8 px rhythm with clear grouping and a visible active area. Keep essential controls at least 32 px high for desktop interaction and larger where touch is supported. Test WCAG 2.2 AA contrast, keyboard order, focus, reduced motion and non-colour status cues before implementation acceptance. Proposed tokens are not an accessibility audit result.

Design a new consistent set of simple module pictograms from original vector paths: enquiry, product, mould, press, automation, process, economics, optimisation, statistics and report. Keep sketches/source history and accessible labels. Do not trace brand marks or competitor icon silhouettes. Existing Lucide assets remain licensed legacy assets until replaced; the design board is original schematic HTML/CSS, not an application build.

## Behaviour and layout contract

| Region | Required behaviour |
| --- | --- |
| Top | Project/revision/scenario, units/language and context ribbon: project, CAD/import-export, assembly, analysis, simulation and optimisation. Only implemented commands are enabled; planned items say why unavailable |
| Left rail | Ten modules listed above, labelled on focus/expand. Navigation changes context/properties while scene/camera/selection persist |
| Left context | Fully closable, reopen handle and accessible shortcut; resizable, with minimum/maximum widths. Prefer context properties rather than a full-screen form replacing the model |
| Centre | Dominant scene with orbit/zoom/pan and selection. Standard views, clip sections, transparency/explosion and visible frame/scale; enable each only when implemented. Scientific legend identifies run, time, unit, field and fidelity |
| Right | Copilot remains available across modules, including compact mode; project/revision/selection scope visible. Drafts preserved on navigation. Streaming/progress/cancel/error states remain understandable |
| Bottom | Collapsible/resizable drawer with run selector, time/play-pause/step/speed, event tracks, charts, values and logs. Controls disabled with `No run available` when no engine result exists |

On large displays, context and copilot can be open simultaneously. On laptops, narrow/collapse panels before shrinking the viewport below its usable minimum. Persist panel sizes/camera preferences independently from engineering data; clamp them to the current window. Resizers support mouse and keyboard with labelled separators. On smaller screens, drawers may overlay temporarily, but switching modules must preserve the scene state. Do not promise full phone CAD editing before usability tests.

Selecting an object synchronises scene highlight, tree row, properties and authorised copilot context. Distinguish display-hidden from excluded-from-simulation; changing one must not silently change the other. Exploded positions are presentation only. Selection of an imported mesh must not imply B-rep feature recognition.

## Copilot and approved change flow

Show request → understood scope → typed plan → checks/missing information → effect preview → user approval → execution progress → new revision/results. A request to change 2→4 cavities previews which compatibility/timing/cost results become stale; it cannot display new results before engines execute. Each failed/incomplete step explains what is missing and offers a manual properties path.

The current small-model demo may keep explicit Conversation and Propose changes modes; the integrated tool workflow must use the same operation service as properties. Show source statements and exact proposed values/units. Include undo/revision navigation after a successful operation. Never show a purely decorative `Run`, section, analysis or optimisation command as functioning.

## Planned acceptance checks

- Switching every implemented module leaves the same renderer/canvas identity and camera/selection. Closing both context panels genuinely increases viewport area; reopening restores values/drafts.
- Resizing panels by keyboard/mouse works at laptop and large-monitor sizes without horizontal overflow or losing the copilot reopen control.
- New projects have no shell/IP/PCB/material/demand defaults; optional examples are clearly marked.
- Forms and chat operate on the same revision; an AI preview is not execution. Stale approval fails visibly without replacing current data.
- Timeline/charts/scene sample the same run/time during pause/seek/speed changes; no animation exists without a real run or explicitly labelled illustrative geometry interaction.
- Tests cover EN/IT/FR/ES, unmodified user text/quantities, focus/labels/contrast, keyboard selection/resizers and reduced motion. A human designer/process-engineer usability review is required in addition to automated checks.

Implementation starts only after the generic project/operation foundation. [IMPLEMENTATION_PLAN.md](../planning/IMPLEMENTATION_PLAN.md) separates foundational UI controls from later engine-dependent features.
