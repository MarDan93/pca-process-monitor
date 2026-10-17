"""Reproduce PCA audit observations on declared synthetic data; do not modify the model.

Run with the repository's numerical environment. A completed diagnostic is not a
production-readiness test and does not mean the observed defects are fixed.
"""
from pathlib import Path
import argparse
import json
import os
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("MPLCONFIGDIR", str(ROOT / ".cache/matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(ROOT / ".cache"))


def main():
    import numpy as np
    from data.generate_datasets import generate_continuous
    from pca_monitor import NIPALS, ContinuousMonitor

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / ".cache/audit-2026-10-17/numerical-findings.json")
    args = parser.parse_args()
    calibration, test = generate_continuous()
    columns = [name for name in calibration if name != "split"]
    x = calibration[columns].to_numpy()
    y = test[columns].to_numpy()
    model = NIPALS(n_components=6).fit(x)
    result = ContinuousMonitor(model, n_components=2).monitor(y)
    _, singular, vt = np.linalg.svd(model._X_scaled, full_matrices=False)
    variances = singular ** 2 / (len(x) - 1)
    scaled_y = (y - model.mean_) / model.std_
    scores = scaled_y @ vt[:2].T
    q_reference = np.sum((scaled_y - scores @ vt[:2]) ** 2, axis=1)
    t2_reference = np.sum(scores ** 2 / variances[:2], axis=1)
    partial = NIPALS(n_components=2).fit(x)
    missing = ContinuousMonitor(model, n_components=2).monitor(np.full((1, x.shape[1]), np.nan))
    cv, optimum = model.rmsecv(x[:60], max_components=3, cv_folds=3)
    covariance_factor = len(x) - 1
    report = {
        "audit_id": "AUD-2026-10-17",
        "data": "repository synthetic continuous generator, seed 42; no measured/private data",
        "n_calibration": len(x), "retained_components": 2, "fitted_components": 6,
        "all_converged": all(model.converged_),
        "T2_current_max": float(result["T2"].max()), "T2_limit_current": float(result["T2_limit"]),
        "T2_reference_max": float(t2_reference.max()),
        "T2_reference_to_current_median_ratio": float(np.median(t2_reference / result["T2"])),
        "T2_expected_covariance_scale_factor": covariance_factor,
        "Q_current_max": float(result["Q"].max()), "Q_limit_current": float(result["Q_limit"]),
        "Q_limit_rescaled_full_spectrum": float(result["Q_limit"] / covariance_factor),
        "Q_reference_max_abs_difference": float(np.max(np.abs(result["Q"] - q_reference))),
        "T2_normalized_reference_max_abs_difference": float(np.max(np.abs(covariance_factor * result["T2"] - t2_reference))),
        "current_injected_thermal_spike_flags": int(result["anomaly_any"][10:21].sum()),
        "Q_rescaled_injected_thermal_spike_flags": int((result["Q"][10:21] > result["Q_limit"] / covariance_factor).sum()),
        "Q_limit_two_components_fitted": float(partial.Q_limit(n_components=2)),
        "all_missing_sample": {"T2": missing["T2"].tolist(), "Q": missing["Q"].tolist(), "anomaly_any": missing["anomaly_any"].tolist()},
        "rmsecv_example": cv.tolist(), "rmsecv_selected_components": optimum,
        "interpretation": "Diagnostic comparison only. Rescaled values are not deployed fixes or experimental validation. Inspect outputs again after any correction.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    print("DIAGNOSTIC COMPLETE; this is not a production-correctness pass.")


if __name__ == "__main__":
    main()
