# Online platform user experience

Current design authority (2026-10-17): [ORIGINAL_UI_SPEC.md](../design/ORIGINAL_UI_SPEC.md), two independent studies with Process spine selected. Require original dark design, persistent 3D/copilot and collapsible/resizable panels; this document retains earlier workflow context, not an implemented UI claim.

Updated 2026-10-16. Start from the customer request and develop technical/economic production scenarios. Geometry is a project view; the initial home prioritises enquiry, market, demand and objectives.

## Start a project

Offer New study and existing projects, with optional examples separated. A new project has no implicit shell, material, demand or programme length.

Open with: “What does the customer need, and which decision are you preparing?” Accept text, documents, photographs and geometry. Structure the brief, then ask a small number of high-impact questions about application/market, demand/commercial unit, delivery and economics.

Illustrative request: “The customer needs 600,000 appliance brackets a year, with a 0.40 euro target, preferably on existing presses.” Preserve what was said; clarify cost meaning, material, geometry, calendar and quality rather than assuming enclosure requirements.

## Shared workspace

- Project/scenario/revision, server save state and jobs in the header.
- Modules: Customer and market; Product; Mould; Cell; Process; Comparison and data.
- Persistent primary conversation, scoped to the module or selected object.
- Results area: commercial summary, product/mould/cell 3D, timeline, charts or comparison.
- Optional contextual properties with units, sources, requirements and corrections.
- Visible missing inputs, assumptions, available checks and stale results.

Use a modern, professional and legible visual language. Statuses have labels as well as colours. Technical panels must not push the conversation into a secondary role.

## Main workflow

| Stage | Conversation | Visible result |
| --- | --- | --- |
| Customer | Demand, market, price/cost and constraints | Structured brief and high-impact missing data |
| Product | Description, geometry or photographs/measurements | Scaled model/reference, properties and analysis state |
| Mould | Alternatives consistent with demand and product | Cavities, extraction, cooling and comparison rationale |
| Cell | Existing/candidate press, robot, conveyor and auxiliaries | Layout, actual axes, poses and available compatibility checks |
| Process | Recipe and material-to-deposit simulation | Sequence, timeline, component/material states |
| Comparison | Change demand, layout, cycle or assumptions | Capacity, costs, constraints and results requiring recalculation |
| Real data | Upload datasets and define targets | PCA exploration, PLS prediction and constrained trial proposals |

Users can revisit modules without losing scenario/context. Dependencies block only operations that lack sufficient inputs.

## Product inputs

**Text:** AI interprets requirements and supported operations, shows changes, supports correction/undo and retains the request. Chat and properties share update operations.

**3D file:** identify format, units, revision, components and available integrity checks. Clarify missing units before metric measurements. A mesh is not a verified CAD solid.

**Photos/sketches:** collect known scale and useful views. Show unobserved regions and assumptions. Generated concept images remain distinguishable from geometry used for engineering analysis.

## Interactive simulation

Combine cell 3D, material flow and tracks for dryer, feeding, screw, press/mould, robot and conveyor. Selecting an event highlights components/parts and exposes timing, parameters, sources and results.

Queries such as “Why is the robot waiting?”, “Show deposit orientation” or “Compare another cavity layout” use the selected run. Controls include play, pause, event step, rewind and playback speed. Playback speed does not alter simulation time. Long calculations expose progress, cancellation and waiting reasons.

Configure target belt pose and actual robot rotations. Explain unreachable poses and derive alternative scenarios. Isolate trajectories, parting surfaces and cooling circuits. Changing inputs retains old runs with a clear revision/stale marker.

## Language and data

Default UI language is English. Offer English, Italiano, Français and Español in a persistent selector. Store the preference independently from projects. Switching language preserves user-authored text, filenames, numbers, unsaved input and validation state. Localise labels, choices, help, errors, accessibility text and number/currency presentation.

## GetcraftAI reference

The user requested GetcraftAI as an interaction reference. Its features, technology, licensing and performance have not been verified. The earlier request to the candidate site was denied by the environment proxy. No undocumented service behaviour is treated as a product requirement.

See [acceptance criteria](BACKLOG.md) and [actual implementation status](IMPLEMENTATION_STATUS.md). An unavailable AI engine must be reported honestly; a local parser is not a conversational model.
