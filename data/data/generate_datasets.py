"""
generate_datasets.py
Genera dataset sintetici realistici per testare pca-process-monitor.
- Processo continuo: impianto chimico con 6 variabili di processo
- Processo batch: processo di polimerizzazione con 5 variabili, 40 batch, 60 istanti temporali
Entrambi includono set di calibrazione e test, con anomalie controllate nel test.
"""

import numpy as np
import pandas as pd
from pathlib import Path

SEED = 42
rng = np.random.default_rng(SEED)


def generate_continuous(n_cal=300, n_test=80):
    """
    Processo continuo: impianto chimico.
    Variabili: T_reactor, P_reactor, F_feed, conc_A, conc_B, pH
    Struttura di covarianza realistica basata su 2 fattori latenti.
    Anomalie nel test set:
      - obs 10-20 : spike temperatura (+12 gradi)
      - obs 40-45 : deriva portata
      - obs 65    : outlier multivariato isolato
    """
    def _make_samples(n, rng, anomaly=False):
        f1 = rng.normal(0, 1, n)
        f2 = rng.normal(0, 1, n)

        T  = 85  + 4.0*f1                    + rng.normal(0, 0.8,  n)
        P  = 2.5 + 1.2*f1 + 0.3*f2          + rng.normal(0, 0.15, n)
        F  = 120          + 5.0*f2          + rng.normal(0, 1.2,  n)
        cA = 0.8 - 0.05*f1 + 0.02*f2        + rng.normal(0, 0.02, n)
        cB = 0.15 + 0.04*f1 + 0.03*f2       + rng.normal(0, 0.015,n)
        pH = 7.2 - 0.3*cA                    + rng.normal(0, 0.05, n)

        df = pd.DataFrame({
            "T_reactor": T,
            "P_reactor": P,
            "F_feed":    F,
            "conc_A":    cA,
            "conc_B":    cB,
            "pH":        pH,
        })

        if anomaly:
            df.loc[10:20, "T_reactor"] += 12
            df.loc[40:45, "F_feed"]   -= np.linspace(0, 15, 6)
            df.loc[65, ["T_reactor", "P_reactor"]] += [8, 0.9]

        return df

    cal  = _make_samples(n_cal, rng, anomaly=False)
    test = _make_samples(n_test, rng, anomaly=True)
    cal["split"]  = "calibration"
    test["split"] = "test"
    cal.index.name  = "obs_id"
    test.index.name = "obs_id"
    return cal, test


def generate_batch(n_cal=40, n_test=10, n_time=60):
    """
    Processo batch: polimerizzazione.
    Variabili: T_batch, P_batch, conc_M, viscosity, rpm
    Struttura: K batch x J istanti temporali x V variabili
    Anomalie nel test set:
      - test_002: anomalia termica t=20-35
      - test_006: deriva viscosita t=45-60
      - test_009: outlier multivariato a t=30
    """
    t = np.linspace(0, 1, n_time)

    T_ref    = 70 + 25*t - 5*t**2
    P_ref    = 1.5 + 0.8*np.sin(np.pi*t)
    cM_ref   = 1.0 - 0.85*t
    visc_ref = 0.5 + 2.5*t**1.5
    rpm_ref  = 200 - 30*t

    refs     = np.stack([T_ref, P_ref, cM_ref, visc_ref, rpm_ref], axis=1)
    varnames = ["T_batch", "P_batch", "conc_M", "viscosity", "rpm"]
    noise_sd = [0.6, 0.03, 0.008, 0.05, 3.0]
    batch_sd = [1.5, 0.08, 0.030, 0.12, 8.0]

    records = []

    def _make_batch(batch_id, split, rng, anomaly_type=None):
        offset = rng.normal(0, batch_sd, size=(1, 5))
        noise  = rng.normal(0, noise_sd, size=(n_time, 5))
        data   = refs + offset + noise

        if anomaly_type == "thermal":
            data[20:35, 0] += 8.0
            data[20:35, 1] += 0.3
        elif anomaly_type == "viscosity_drift":
            data[45:, 3]   += np.linspace(0, 1.2, n_time - 45)
        elif anomaly_type == "isolated":
            data[30, :]    += [5.0, 0.2, -0.05, 0.4, -20.0]

        for j in range(n_time):
            row = {"batch_id": batch_id, "time": j, "split": split}
            for k, v in enumerate(varnames):
                row[v] = round(float(data[j, k]), 4)
            records.append(row)

    for i in range(n_cal):
        _make_batch(f"batch_{i+1:03d}", "calibration", rng)

    anomaly_map = {2: "thermal", 6: "viscosity_drift", 9: "isolated"}
    for i in range(n_test):
        _make_batch(f"test_{i+1:03d}", "test", rng,
                    anomaly_type=anomaly_map.get(i))

    df      = pd.DataFrame(records)
    df_cal  = df[df["split"] == "calibration"].reset_index(drop=True)
    df_test = df[df["split"] == "test"].reset_index(drop=True)
    return df_cal, df_test


if __name__ == "__main__":
    out = Path(__file__).parent

    print("Generazione dataset continuo...")
    cont_cal, cont_test = generate_continuous()
    cont_cal.to_csv(out  / "continuous_calibration.csv")
    cont_test.to_csv(out / "continuous_test.csv")
    print(f"  calibrazione : {cont_cal.shape}")
    print(f"  test         : {cont_test.shape}")

    print("Generazione dataset batch...")
    batch_cal, batch_test = generate_batch()
    batch_cal.to_csv(out  / "batch_calibration.csv",  index=False)
    batch_test.to_csv(out / "batch_test.csv",         index=False)
    print(f"  calibrazione : {batch_cal.shape}")
    print(f"  test         : {batch_test.shape}")

    print("\nDone. File CSV salvati in /data/")
