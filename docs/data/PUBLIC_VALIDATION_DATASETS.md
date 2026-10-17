# Public validation dataset register

`AUD-2026-10-17`, 17 October 2026. **No external dataset has been admitted or downloaded.** The descriptions below were supplied by the user and are candidates, not verified facts about the records.

## Access result and evidence boundary

Attempted primary metadata reads:

- `https://zenodo.org/api/records/22967320`
- `https://api.figshare.com/v2/articles/29039676`
- `https://zenodo.org/api/records/20744054`
- `https://zenodo.org/api/records/20309380` — metadata only; no embargoed file request.

All returned a proxy tunnel **403 Forbidden**, not a record-level 404 or a licence decision. The existing egress policy lacked the record hosts. A draft addition for `zenodo.org`, `api.figshare.com` and `tandf.figshare.com` preserves the existing hosts/package-manager preset, but saving a draft did not establish runtime access. No mirror, paywall/embargo bypass or private authentication was attempted. This prevents independent confirmation of metadata, not completion of the remaining local audit.

The machine-readable [register](PUBLIC_VALIDATION_DATASETS.json) uses `null` for unknown author, DOI, licence and experimental facts. These are not empty permissions or implied commercial grants.

## Candidate register

| ID and original record | Supplied description | Potential purpose, if verified | Current admission |
| --- | --- | --- | --- |
| A — [Zenodo 22967320](https://zenodo.org/records/22967320) | Anonymised injection-moulding production lots/warehouse space and reproducibility code | Scheduling/lot/storage constraints and industrial planning; not material rheology, filling or plasticisation validation | Metadata blocked; no files; no licence/commercial-use decision |
| B — [T&F Figshare 29039676](https://tandf.figshare.com/articles/dataset/29039676) | Processing parameters and warpage materials | Candidate target-variable/warpage benchmark only after identifying measured versus externally simulated results, geometry, grade and conditions | Metadata blocked; no files; no licence/commercial-use decision |
| C — [Zenodo 20744054](https://zenodo.org/records/20744054) | Machine/sensor signals from a specific hybrid process | Candidate process-monitoring/time alignment example; not evidence of transfer to conventional injection moulding or arbitrary materials | Metadata blocked; no files; no licence/commercial-use decision |
| D — [Zenodo 20309380](https://zenodo.org/records/20309380) | STEP geometry plus cycle/energy/weight data; supplied embargo through 2027-12-31 | Potential future geometry/energy/cycle benchmark if release and rights are verified | **Excluded under user restriction.** Metadata only attempted; no file request/download. Recheck actual release/licence after the stated embargo, not an automatic permission on a calendar date |

For **each** record, the following remain unverified: authors, institution, DOI, record version/date, dataset/code/CAD-specific licences, commercial-use conditions, attribution requirements, availability/file hashes, measured/simulated category, variable definitions, units, machine/material/geometry/recipe conditions, experimental splits, missingness and uncertainty. Do not fabricate a Zenodo/Figshare DOI from a record number.

## Admission procedure

1. Retrieve the official metadata after access is available; retain URL, retrieval date, version/DOI and metadata hash. Inspect record-level and file-level restrictions separately.
2. Confirm permissions for data, code, CAD and supplementary material. Resolve ambiguous, missing, noncommercial or inconsistent licences before commercial use. Record required attribution/citation and any share-alike/source obligations.
3. Confirm that files are actually open and permitted; no attempts against D's files while the restriction applies. Preserve metadata-only evidence for inaccessible records.
4. Download only authorised, necessary files into an isolated data area; verify publisher checksums when provided and record SHA-256. Do not automatically execute reproduction scripts/notebooks or unsafe serialised models.
5. Inspect variables/units, grade and machine/geometry/recipe coverage, experimental campaign/lot/cavity/cycle identifiers, timestamps, calibration and uncertainty. Flag anonymisation that removes needed conditioning information.
6. Classify each table/target as measured, another simulator's result, synthetic or explicitly assumed. A simulated warpage target is not independent experimental validation.
7. Define the model/question and prospective test split **before** calibration. Keep campaign/batch/article/geometry groups separate; adjacent cycles from the same experiment must not leak across evaluation partitions.
8. Run the relevant [validation protocol](VALIDATION_PROTOCOL.md), retain baselines/errors/domain limits and link the exact dataset/run versions. Only then mark the record `admitted_for_<specific_use>`.

Admission is use-specific: permission to use a planning table does not make it a thermal benchmark, and permission to read an article does not automatically permit redistribution of its STEP files. Dataset quality and licence clearance are separate decisions.

## Useful checks before real datasets are available

| Check | Source/category | What it can establish | What it cannot establish |
| --- | --- | --- | --- |
| Existing shell volume and oriented mesh tests | Original repository code, MIT; geometric/analytical | Numerical geometry and export consistency for that template | Mouldability or part performance |
| PCA versus NumPy SVD | Repository synthetic generator; declared seed and dimensions | Algebraic scale/residual correctness; currently reproduces defects | Real process detection rate or causal diagnosis |
| L0 independent/shared resource schedules | Future original synthetic fixture and manually derived event table | Timing, overlap, deterministic replay and waiting semantics | Physical injection/cooling/plasticisation accuracy |
| Pose support-transfer/XYZ reachability | Future original frames/transforms and analytical fixtures | Pose continuity, axis limits and no invented rotary axis | Certified collision freedom or functional safety |
| Capacity/cost accounting fixture | Future declared rates, counts, units and arithmetic reference | No double counting and comparable good-unit accounting | Customer price, production cost or manufacturing cycle forecasts |
| L1 ideal balances/cooling ODE | Future analytical reference with explicit ideal assumptions | Implementation/convergence/unit correctness | Experimental agreement for a polymer grade or mould |

Generate bracket/flange/enclosure fixtures from original code or properly licensed sources with their own rights records. Keep all production-like prices, times, properties and rates labelled hypothetical unless independently sourced. No current employer or other private company data is required or authorised for development/validation.

## Next action when metadata access is available

Re-read the four original records without touching D's restricted files; fill the currently unknown fields from evidence, not the supplied summaries. Choose one dataset based on licence and suitability for a specific model, not on an attractive title. If none is suitable, proceed with explicitly analytical/synthetic software tests and leave experimental validation open.
