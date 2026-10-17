# Scientific and engineering validation protocol

Status: required protocol and analytical test design, 17 October 2026. Only the existing geometric/PCA comparison checks have executed; process/thermal/economic/ML acceptance below is planned. Software correctness, numerical verification, empirical calibration and independent experimental validation are distinct evidence levels.

## Model card required for every engine

Record model ID/version and code hash; phenomenon/fidelity (L0/L1/L2); published equation/source and rights; assumptions and validity domain; parameters and units; material grade/machine/geometry conditions; initial/boundary conditions; numerical method/tolerances; input hashes; uncertainty; execution time/peak memory; available/unavailable checks; benchmark and calibration/test dataset versions. A family name such as PP/PE does not supply grade-specific rheology, moisture or thermal coefficients.

No model is enabled merely because a library imports successfully. A solver gate includes reproducible installation, licence review, API execution, trusted reference, justified error tolerances, convergence/sensitivity, performance and timeout/cancellation. Unknown inputs produce `incomplete`, not invented values or a colour field.

## V-GEO — geometry and frames

- Verify units and exact original transforms. Use independent analytical solids, oriented-surface checks, bounds and topology diagnostics. A mesh's bounding box is not its solid volume or projected clamping area.
- Existing shell tests check closed/oriented topology and geometric volume, including the polygonal approximation of R8; this is a template-specific check.
- CAD adoption must round-trip permitted STEP test solids, preserve units/frame/components, reject malformed files and compare expected volume/features within kernel-appropriate tolerances. Record tessellation error independently.
- Verify world/local pose composition and support handoff using transform equality; reject unreachable rotations for an XYZ-only robot. Include distinct cavity IDs and multiple simultaneous parts.

## V-L0 — events, resources, material and playback

Use declared configured or analytic movement durations. Fixtures must have manually derived timestamps/counts, not expected values copied from the implementation.

1. Independent operations of 10 s and 6 s starting at zero finish by 10 s; a single shared exclusive resource makes them finish by 16 s. These are **future test expectations**, not existing simulation outputs.
2. Compare empty feed with explicitly qualified initial stock. Verify starvation/waiting, lot identity, FIFO/mixing assumptions, nonnegative inventory and incoming−outgoing mass balance.
3. Cool/hold/meter/robot events overlap only under declared dependencies/resources. Distinguish consecutive press reference-event period from transfer time and part lead time.
4. Belt blockage propagates waiting; no duplicated/lost parts. Verify one current support per part and unchanged global pose at pickup/deposit.
5. Pause, seek, speed change and independent chart sampling reproduce the same event timestamps/state at time t. A replay speed multiplier cannot change capacity or costs.
6. Bound run horizon, events and instances; test deterministic equal-time ordering, cancellation and partial-run labels.

Choose floating-point tolerances from time/length scales and record their rationale. Count/resource/mass invariants must pass exactly where quantities are discrete/exact. L0 success validates sequence logic, not plastic melting/filling physics.

## V-ECON — preliminary compatibility, capacity and costs

- Press checks need declared shot basis/units, material state where conversion is used, mounting/envelope limits, strokes and clamp requirement. Test exact boundary, beyond boundary and missing-input cases. Do not equate hydraulic pressure with cavity pressure.
- Check output per article and commercial unit/BOM; test mismatched family-mould ratios. Define steady-state versus finite-horizon/startup capacity separately.
- Compare simple hand calculations for material/runners/rejects, productive time, rates, energy and investment allocation. Rate inclusion flags prevent energy/depreciation/OEE duplication.
- Missing investment, useful output/duration or rates blocks only the affected total. Never make a missing cost zero implicitly. Currency/basis and assumed/sourced/measured state travel with the result.
- Separate configured estimates from results based on actual event runs. No production accuracy claim follows from matching an arithmetic fixture.

## V-L1/L2 — physical models

Start with ideal mass/energy balances and ODEs with analytical limits; then use permitted experimental references with material-grade/geometry/recipe conditions. For a simple ideal cooling ODE, verify `T(t)=Tc+(T0−Tc)exp(−kt)` with defined k units and assumptions before any more detailed model. That ideal reference is not a polymer cooling calibration.

Specify the published model source before enabling each process equation. Separate drying from simple residence: mass/throughput does not certify a minimum drying time for every particle. Separate plasticisation thermal/mechanical energy and available material transport; pressure/speed units and limits stay explicit. Check conservation, time-step/mesh refinement, parameter sensitivity and failure outside the domain.

Detailed fields require a converged executed solver and known association to geometry/time/units. Verify mesh/step convergence and independent temperature/pressure/warpage references as applicable. A general CFD/FEM installation is not a validated injection-moulding solver. Coolant libraries do not replace a polymer material model.

## V-ML — PCA/PLS and optimisation

Calibrate preprocessing only on training campaigns; group/chronologically separate cycles/lots/articles and keep an untouched independent test set. Record missing-data treatment, time alignment, variable/target units and operating-domain coverage. Compare against simple mean/linear/reference-model baselines. Report target MAE/RMSE/bias and condition-wise errors; quantify uncertainty and avoid target leakage. PLS is not currently implemented.

For PCA, first fix/retest SCI-01–SCI-03: covariance-normalised eigenvalues, coherent T²/limits, residual spectrum availability and unknown-data status. Include NIPALS-versus-SVD, scaling, near-singular/constant columns, missingness, insufficient calibration and fitted-versus-retained component cases. A currently passing reproduction of a defect does not close it. Revisit RMSECV's component-selection purpose; held-out-row reconstruction alone is not predictive validation.

Correlations/loadings/classes do not establish causation. Optimisation candidates must respect engineering/coverage constraints; every recommendation retains its model/data version, domain and an experimental trial plan. Public data from another simulator is not independent process validation, and synthetic data must not be presented as measured production evidence.

## Evidence record and release gate

For each run retain input/dataset/model hashes, split definitions, source licences, executable command/environment, expected reference, observed outputs, metric/tolerance justification, failure cases and performance. Freeze calibration and benchmark definitions before evaluating held-out cases. Failed, blocked, unrun and passed gates remain separate. Validate software with analytical/synthetic fixtures while experimental data access is blocked; leave experimental/production claims open.
