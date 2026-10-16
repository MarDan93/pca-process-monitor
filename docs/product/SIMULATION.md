# Simulation specification: granules to conveyor

Technical proposal for M03–M05, updated 2026-10-16. These models are planned, not an implemented simulation engine.

## Decisions to support

Determine whether material arrives in sufficient quantity and condition; identify cycle constraints and overlapping operations; check mould opening, ejection, robot access and deposit orientation; compare layout, cooling, feed and motion changes; distinguish preliminary estimates from results checked against technical references or measurements.

## Model fidelity

| Level | Content | Valid outputs |
| --- | --- | --- |
| L0 — Sequence/kinematics | Functional geometry, events, resources, configured times or movement-based durations | Timeline, poses, strokes, waiting, scenario capacity and movement animation |
| L1 — Reduced process | Inventories/flows, documented correlations, mass/energy balances, lumped or 1D models | Evolutions/estimates within available assumptions and material properties |
| L2 — Detailed physics | Suitable solvers/discretisation for filling, heat, shrinkage/warpage or specific interactions | Physical fields only for calculations actually executed and verified |

Fidelity is assigned per phenomenon. One run can have checked kinematics and configured cooling. The first complete simulation is L0, adding L1 phenomenon by phenomenon. Accuracy, limits and runtime must be measured before promising detailed real-time physics.

## Phases and parameters

| Phase/resource | Inputs/state | Outputs and visualisation |
| --- | --- | --- |
| Incoming material | Grade, lot, composition/regrind, mass, temperature, relevant moisture | Lot identity/availability and symbolic flow |
| Optional drying | Capacity/load, material age, time, temperature, air conditions, initial/target moisture | Conditioned inventory, waiting, energy if modelled, temperature/moisture history |
| Transport | Route, flow or batch mass, latency, continuous/cyclic operation, capacity | Arrivals, delays, inventories and animated routes |
| Hopper/feed | Capacity, initial level, refill thresholds, flow, material origin | Levels, refills and starvation |
| Plasticisation/metering | Screw/barrel geometry available, thermal zones, speed, back pressure, stroke/dose, grade and residence | Available mass, screw movement and solid/melt/temperature states according to the selected model |
| Injection | Speed/flow profile, pressure limit, dose, feed/cavity geometry, rheology and temperature | Filling time/state; spatial flow fronts need an appropriate solver |
| Holding | Pressure/time, switchover, cushion, gate closure if modelled | Applied recipe, duration and calculated quantities |
| Cooling/control | Part/mould/circuit geometry, thermal properties, fluid/flow, temperatures and ejection criterion | Configured/estimated/calculated thermal state and circuit flow directions |
| Mould movements | Strokes/profiles, parting, slides, end positions and dependencies | Positions, timing and interference envelopes/checks |
| Ejection/pickup | Ejectors, direction/stroke, sequence, grip points/end effector, grip confirmation | Detachment and part support transfer, access constraints |
| Robot transfer | Actual axes, limits, speeds/accelerations, payload, trajectories, grip times/poses | Movement duration, waiting, reachable poses and available interference checks |
| Placement/conveyor | Target pose, free zone, spacing, belt speed, sensors/logic and accumulation | Part identities/orientations, travel and blocking |

Specific injection pressure, hydraulic pressure and cavity pressure remain distinct. Conversion requires machine data. Polymer-family properties do not replace grade-specific coefficients required by a model.

## Material timescale and initial conditions

Model bulk material lots/portions with provenance and conditioning state, not individual grain dynamics. Animated particles are a representation of an aggregate model. Material supply and repeated machine cycles share a simulation clock but operate over different time horizons.

Initial inventories include material age and condition. Empty startup and a plant preloaded with qualified material produce different transients. An ideal FIFO or mixed residence model must be declared. Inventory mass/throughput provides nominal residence, not a guarantee that every portion has met minimum drying time. Conditioning requirements come from the grade and initial state.

Inventory change equals incoming minus outgoing mass. Availability and balances prevent negative stocks or shots without material. Rejects/runners have explicit destinations; recycling has its own route, delay and limits.

L1 plasticisation distinguishes zone heating, mechanical energy, losses and transport. Melting/thermal properties include relevant semicrystalline phenomena where applicable. Drying/rheology correlations are enabled only with documented coefficients and validity ranges.

## Events, overlap and cycle time

An operation has ID, preconditions, resources, duration model, state updates and completion conditions. Events share one simulation time; simultaneous events use a documented deterministic order. Playback speed is independent.

Examples to adapt to the configured cell:

- Injection requires the mould configuration, injection unit and qualified material/dose to be ready.
- Cooling starts with melt/mould contact and may overlap holding and metering; it is not automatically a wholly subsequent duration.
- The next metering operation starts when the recipe/machine and resources allow it.
- Opening/pickup depend on relevant process completion and compatible mould/ejector/robot positions.
- Transfer/deposit may continue during the next press cycle when the robot has cleared required zones/resources and other conditions hold.
- A full conveyor or insufficient feed introduces waiting that propagates through dependencies.

Press cycle time is measured between identical consecutive reference events, such as closing starts. Material/part lead time, robot cycle and deposit cadence are different metrics. Total duration is not the sum of overlapping operations. The engine reports occupied resources, waiting and the sequence controlling cadence.

## Part pose: cavity → robot → conveyor

Define a global cell frame and local frames for press, mould halves, cavities, ejectors, robot, end effector, product and conveyor. Store rigid transforms with explicit units/orientation conventions. Exploded display poses are not operational poses.

Global part pose composes the current support frame pose with the local part transform. On support transfer, calculate the new local transform from the current global pose, preserving position/orientation without a jump.

Each part/runner records identity, article, cavity, cycle and one current support. Transitions can be cavity/ejector → end effector → belt, according to the configured sequence. Multicavity pickup keeps every part pose relative to the end effector.

An XYZ robot without a wrist cannot flip a part by translation. Explain the constraint and compare actual wrist/actuator, orienting station, different grip/layout or mould cavity/ejection alternatives. Never silently add robot capabilities.

Initial checks use strokes, envelopes, distances and sampled paths/swept volumes according to available methods. A sampled trajectory retains that limitation; it is not proof of continuous collision freedom. Preliminary simulation is not functional-safety certification.

## Initial movement models

Measured/manufacturer durations retain their source. Otherwise a triangular/trapezoidal profile can estimate rest-to-rest movements. For distance d, maximum speed v and symmetric acceleration a: duration is 2√(d/a) when d ≤ v²/a, otherwise d/v + v/a. Parameters must be positive and travel within limits.

Synchronised axes can share the maximum individual-axis duration when the controller allows it. Sequential movements have separate dependencies. Jerk, blended paths, grip delays, settling and payload limits are added when relevant/provided; the estimate does not replace actual robot specifications.

## Mould cooling circuits

Store 3D paths/branches, diameters/sections, inlet/outlet, fluid, temperature, flow or pressure conditions, materials and geometric references. Conventional or conformal alternatives require suitable representation and manufacturing feasibility.

AI proposes regions and routes; geometric tools check intersections, access and distances to cavities, surfaces, inserts, fasteners, slides and ejectors according to scenario constraints. There is no universal diameter or spacing imposed on all moulds.

An L1 lumped/resistance-network model requires masses, heat capacities, exchange paths and sourced properties. Hydraulic networks require fluid properties, geometry and applicable loss/heat-transfer correlations. Prescribed flow can determine pressure demand; prescribed available pressure requires solving flow. They cannot be imposed as inconsistent independent inputs.

Report estimated ejection criterion/time, uniformity at the supported resolution and candidate sensitivity. Local hotspots, stresses and warpage require corresponding models. Average temperature is not converted into an unsupported detailed 3D heat map.

## Capacity, economics and run outputs

Retain input snapshot/revision, model versions, initial state, event log, poses/states, unit-bearing signals, balances, metrics, assumptions and checks. Interrupted runs remain visibly partial.

Capacity comes from simulated good output or a documented steady-state estimate using productive time, cadence, active cavities and yield. Losses already included in events/times are not counted again through OEE factors. Startup and steady operation remain distinct.

Family moulds compare output by article against the BOM and demand; total cavity count alone does not determine saleable assembly capacity. Costs distinguish the commercial unit, material/runners/rejects, energy, rates, personnel, investments and allocation basis.

Acceptance scenarios S01–S07 and criteria A01–A15 are in [BACKLOG.md](BACKLOG.md). Before implementing L1/L2, each model needs source/equations, units, required data, domain, reference case and justified comparison tolerances. Numerical accuracy and runtime will be demonstrated by implementation, not by this specification.
