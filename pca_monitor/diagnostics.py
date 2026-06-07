"""
diagnostics.py
Diagnostica del processo: monitoraggio continuo e batch.
Gestisce:
  - Calcolo T², Q e limiti di confidenza
  - Contribution plots per osservazioni anomale
  - Diagnostica post-mortem per batch completati
  - Diagnostica on-line per batch in corso (con imputazione)
  - Identificazione automatica osservazioni anomale
"""

import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Tuple, Union
from scipy import stats


# ------------------------------------------------------------------
# MONITORAGGIO CONTINUO
# ------------------------------------------------------------------

class ContinuousMonitor:
    """
    Monitora un processo continuo usando un modello NIPALS già addestrato.
    Calcola T², Q, limiti di confidenza e contribution plots.

    Parametri
    ----------
    model      : istanza NIPALS già fittata sul set di calibrazione
    n_components : numero di PC da usare per la diagnostica
    alpha      : livello di significatività (default 0.05 = 95%)
    var_names  : nomi delle variabili (per i grafici)
    """

    def __init__(self, model, n_components: int = None,
                 alpha: float = 0.05,
                 var_names: Optional[List[str]] = None):
        self.model        = model
        self.n_components = n_components or model.n_components_fitted_
        self.alpha        = alpha
        self.var_names    = var_names

        # Calcola limiti sul set di calibrazione
        self.T2_lim = model.T2_limit(n_components=self.n_components,
                                      alpha=alpha)
        self.Q_lim  = model.Q_limit(n_components=self.n_components,
                                     alpha=alpha)

        # Riferimento contributi calibrazione (media per variabile)
        # Usato come baseline nei contribution plots
        Q_cal, E_cal          = model.compute_Q(
            model._inverse_scale(model._X_scaled),
            self.n_components)
        self.contrib_Q_ref    = np.mean(model.contributions_Q(
            model._inverse_scale(model._X_scaled),
            self.n_components)[0], axis=0)
        self.contrib_T2_ref   = np.mean(model.contributions_T2(
            model._inverse_scale(model._X_scaled),
            self.n_components), axis=0)

    def monitor(self, X_new: np.ndarray) -> Dict:
        """
        Calcola T², Q e flag anomalie per un nuovo set di osservazioni.

        Ritorna
        -------
        result : dict con chiavi:
            'T2'          : ndarray (n,)
            'Q'           : ndarray (n,)
            'T2_limit'    : float
            'Q_limit'     : float
            'anomaly_T2'  : ndarray bool (n,)
            'anomaly_Q'   : ndarray bool (n,)
            'anomaly_any' : ndarray bool (n,) — anomalo in T2 o Q
            'n_anomalies' : int
        """
        T2 = self.model.compute_T2(X_new, self.n_components)
        Q, E = self.model.compute_Q(X_new, self.n_components)

        anomaly_T2  = T2 > self.T2_lim
        anomaly_Q   = Q  > self.Q_lim
        anomaly_any = anomaly_T2 | anomaly_Q

        return {
            "T2":          T2,
            "Q":           Q,
            "E":           E,
            "T2_limit":    self.T2_lim,
            "Q_limit":     self.Q_lim,
            "anomaly_T2":  anomaly_T2,
            "anomaly_Q":   anomaly_Q,
            "anomaly_any": anomaly_any,
            "n_anomalies": int(anomaly_any.sum()),
        }

    def contribution_analysis(self, X_new: np.ndarray,
                               obs_idx: int) -> Dict:
        """
        Analisi contribution per una singola osservazione anomala.

        Ritorna
        -------
        result : dict con chiavi:
            'contrib_T2'     : ndarray (n_features,) contributi T²
            'contrib_Q'      : ndarray (n_features,) contributi Q
            'ref_T2'         : ndarray (n_features,) baseline calibrazione
            'ref_Q'          : ndarray (n_features,) baseline calibrazione
            'top_vars_T2'    : list — variabili più anomale in T²
            'top_vars_Q'     : list — variabili più anomale in Q
        """
        ct2 = self.model.contributions_T2(X_new, self.n_components)
        cq, _ = self.model.contributions_Q(X_new, self.n_components)

        contrib_T2 = ct2[obs_idx, :]
        contrib_Q  = cq[obs_idx, :]

        # Identifica top variabili anomale (supera la baseline)
        def top_vars(contrib, ref, n=3):
            excess = contrib - ref
            top_idx = np.argsort(excess)[::-1][:n]
            if self.var_names:
                return [self.var_names[i] for i in top_idx]
            return top_idx.tolist()

        return {
            "contrib_T2":  contrib_T2,
            "contrib_Q":   contrib_Q,
            "ref_T2":      self.contrib_T2_ref,
            "ref_Q":       self.contrib_Q_ref,
            "top_vars_T2": top_vars(contrib_T2, self.contrib_T2_ref),
            "top_vars_Q":  top_vars(contrib_Q,  self.contrib_Q_ref),
        }

    def summary_report(self, result: Dict) -> str:
        """
        Genera un testo riassuntivo del monitoraggio.
        Usato come contesto per l'AI interpreter.
        """
        n_tot = len(result["T2"])
        n_an  = result["n_anomalies"]
        lines = [
            f"=== Report monitoraggio processo continuo ===",
            f"Osservazioni analizzate : {n_tot}",
            f"Anomalie rilevate       : {n_an} ({100*n_an/n_tot:.1f}%)",
            f"Limite T² (α={self.alpha}) : {result['T2_limit']:.4f}",
            f"Limite Q  (α={self.alpha}) : {result['Q_limit']:.4f}",
            f"T² max osservato        : {result['T2'].max():.4f}",
            f"Q  max osservato        : {result['Q'].max():.4f}",
        ]
        anomaly_idx = np.where(result["anomaly_any"])[0]
        if len(anomaly_idx) > 0:
            lines.append(f"Indici osservazioni anomale: {anomaly_idx.tolist()}")
        return "\n".join(lines)


# ------------------------------------------------------------------
# MONITORAGGIO BATCH — POST-MORTEM
# ------------------------------------------------------------------

class BatchPostMortem:
    """
    Diagnostica post-mortem per dati batch.
    Analizza batch completati proiettati sul modello PCA batch-wise.

    Parametri
    ----------
    model        : istanza NIPALS fittata su dati batch unfolded
    n_components : numero PC
    alpha        : livello di significatività
    col_names    : nomi colonne unfolded (per estrarre info temporali)
    batch_ids    : ID dei batch di calibrazione
    n_time       : numero istanti temporali per batch
    var_names    : nomi variabili originali (non unfolded)
    """

    def __init__(self, model,
                 n_components: int = None,
                 alpha: float = 0.05,
                 col_names: Optional[List[str]] = None,
                 batch_ids: Optional[List] = None,
                 n_time: int = None,
                 var_names: Optional[List[str]] = None):
        self.model        = model
        self.n_components = n_components or model.n_components_fitted_
        self.alpha        = alpha
        self.col_names    = col_names or []
        self.batch_ids    = batch_ids or []
        self.n_time       = n_time
        self.var_names    = var_names or []

        # Limiti di confidenza
        self.T2_lim = model.T2_limit(n_components=self.n_components,
                                      alpha=alpha)
        self.Q_lim  = model.Q_limit(n_components=self.n_components,
                                     alpha=alpha)

        # Baseline contributi dalla calibrazione
        X_cal_orig = model._inverse_scale(model._X_scaled)
        ct2_cal    = model.contributions_T2(X_cal_orig, self.n_components)
        cq_cal, _  = model.contributions_Q(X_cal_orig,  self.n_components)
        self.ref_T2 = np.mean(ct2_cal, axis=0)
        self.ref_Q  = np.mean(cq_cal,  axis=0)

        # Limite per variabile nel tempo (per contribution plot temporale)
        # Usa media + 3*std dei contributi di calibrazione per colonna
        self.ref_T2_std = np.std(ct2_cal, axis=0)
        self.ref_Q_std  = np.std(cq_cal,  axis=0)
        self.ctrl_lim_T2 = self.ref_T2 + 3 * self.ref_T2_std
        self.ctrl_lim_Q  = self.ref_Q  + 3 * self.ref_Q_std

    def analyze_batch(self, X_test_unf: np.ndarray,
                       test_batch_ids: Optional[List] = None) -> Dict:
        """
        Analizza un set di batch completati (matrice unfolded).

        Parametri
        ----------
        X_test_unf    : ndarray (K_test, V*J) — batch test unfolded
        test_batch_ids : ID dei batch test

        Ritorna
        -------
        result : dict con statistiche complete per ogni batch
        """
        T2 = self.model.compute_T2(X_test_unf, self.n_components)
        Q, E = self.model.compute_Q(X_test_unf, self.n_components)

        anomaly_T2  = T2 > self.T2_lim
        anomaly_Q   = Q  > self.Q_lim
        anomaly_any = anomaly_T2 | anomaly_Q

        ct2        = self.model.contributions_T2(X_test_unf, self.n_components)
        cq, _      = self.model.contributions_Q(X_test_unf,  self.n_components)

        # Per ogni batch anomalo, identifica variabili e istanti problematici
        anomaly_details = {}
        for i in np.where(anomaly_any)[0]:
            bid = test_batch_ids[i] if test_batch_ids else i
            anomaly_details[bid] = self._locate_anomaly(
                ct2[i, :], cq[i, :], anomaly_T2[i], anomaly_Q[i]
            )

        return {
            "T2":             T2,
            "Q":              Q,
            "E":              E,
            "T2_limit":       self.T2_lim,
            "Q_limit":        self.Q_lim,
            "anomaly_T2":     anomaly_T2,
            "anomaly_Q":      anomaly_Q,
            "anomaly_any":    anomaly_any,
            "contrib_T2":     ct2,
            "contrib_Q":      cq,
            "anomaly_details": anomaly_details,
            "batch_ids":      test_batch_ids or list(range(len(T2))),
        }

    def _locate_anomaly(self, ct2_row: np.ndarray,
                          cq_row: np.ndarray,
                          is_T2_anomaly: bool,
                          is_Q_anomaly: bool) -> Dict:
        """
        Per un batch anomalo, identifica:
        - quali variabili contribuiscono di più
        - in quali istanti temporali il contributo supera il limite
        """
        detail = {"T2_anomaly": bool(is_T2_anomaly),
                  "Q_anomaly":  bool(is_Q_anomaly)}

        if is_T2_anomaly and self.col_names:
            # Variabili con contributo sopra il limite di controllo
            above_T2 = ct2_row > self.ctrl_lim_T2
            anomaly_cols_T2 = [self.col_names[j]
                               for j in np.where(above_T2)[0]]
            # Ricava variabili uniche
            vars_T2 = list(dict.fromkeys(
                c.rsplit("_t", 1)[0] for c in anomaly_cols_T2
                if "_t" in c))
            # Istanti critici per variabile
            times_T2 = {}
            for var in vars_T2:
                t_list = [int(c.split("_t")[-1])
                          for c in anomaly_cols_T2
                          if c.startswith(f"{var}_t")]
                times_T2[var] = sorted(t_list)
            detail["vars_T2"]  = vars_T2
            detail["times_T2"] = times_T2

        if is_Q_anomaly and self.col_names:
            above_Q = cq_row > self.ctrl_lim_Q
            anomaly_cols_Q = [self.col_names[j]
                              for j in np.where(above_Q)[0]]
            vars_Q = list(dict.fromkeys(
                c.rsplit("_t", 1)[0] for c in anomaly_cols_Q
                if "_t" in c))
            times_Q = {}
            for var in vars_Q:
                t_list = [int(c.split("_t")[-1])
                          for c in anomaly_cols_Q
                          if c.startswith(f"{var}_t")]
                times_Q[var] = sorted(t_list)
            detail["vars_Q"]  = vars_Q
            detail["times_Q"] = times_Q

        return detail

    def summary_report(self, result: Dict) -> str:
        """
        Genera testo riassuntivo per l'AI interpreter.
        """
        n_tot = len(result["T2"])
        n_an  = int(result["anomaly_any"].sum())
        lines = [
            "=== Report diagnostica batch post-mortem ===",
            f"Batch analizzati        : {n_tot}",
            f"Batch anomali           : {n_an}",
            f"Limite T² (α={self.alpha}) : {result['T2_limit']:.4f}",
            f"Limite Q  (α={self.alpha}) : {result['Q_limit']:.4f}",
        ]
        for bid, detail in result["anomaly_details"].items():
            lines.append(f"\nBatch anomalo: {bid}")
            if detail.get("T2_anomaly"):
                lines.append(f"  T² anomalo")
                for var, times in detail.get("times_T2", {}).items():
                    lines.append(f"    {var}: istanti critici {times}")
            if detail.get("Q_anomaly"):
                lines.append(f"  Q anomalo")
                for var, times in detail.get("times_Q", {}).items():
                    lines.append(f"    {var}: istanti critici {times}")
        return "\n".join(lines)


# ------------------------------------------------------------------
# MONITORAGGIO BATCH — ON-LINE
# ------------------------------------------------------------------

class BatchOnlineMonitor:
    """
    Diagnostica on-line per batch in corso.
    Imputa gli istanti futuri non ancora osservati e proietta
    il batch parziale sul modello PCA di calibrazione.

    Parametri
    ----------
    model         : istanza NIPALS fittata su dati batch unfolded
    n_components  : numero PC
    alpha         : livello di significatività
    col_names     : nomi colonne unfolded
    n_time        : numero totale istanti temporali J
    n_vars        : numero variabili V
    var_names     : nomi variabili originali
    impute_method : 'zero' | 'mean' — metodo imputazione dati futuri
    cal_means     : ndarray (V*J,) — medie calibrazione per imputazione 'mean'
    """

    def __init__(self, model,
                 n_components: int = None,
                 alpha: float = 0.05,
                 col_names: Optional[List[str]] = None,
                 n_time: int = None,
                 n_vars: int = None,
                 var_names: Optional[List[str]] = None,
                 impute_method: str = "mean",
                 cal_means: Optional[np.ndarray] = None):
        self.model          = model
        self.n_components   = n_components or model.n_components_fitted_
        self.alpha          = alpha
        self.col_names      = col_names or []
        self.n_time         = n_time
        self.n_vars         = n_vars
        self.var_names      = var_names or []
        self.impute_method  = impute_method
        self.cal_means      = cal_means

        # Limiti di confidenza
        self.T2_lim = model.T2_limit(n_components=self.n_components,
                                      alpha=alpha)
        self.Q_lim  = model.Q_limit(n_components=self.n_components,
                                     alpha=alpha)

        # Storico della sessione on-line corrente
        self.history: List[Dict] = []

    def update(self, x_partial: np.ndarray,
               current_time: int,
               batch_id: Union[str, int] = "current") -> Dict:
        """
        Aggiorna il monitoraggio con i dati osservati fino a current_time.
        Imputa i dati futuri e proietta il batch parziale sul modello.

        Parametri
        ----------
        x_partial    : ndarray (V*J,) — vettore batch parziale
                       NaN per gli istanti non ancora osservati
        current_time : int — indice ultimo istante osservato (0-based)
        batch_id     : identificativo del batch corrente

        Ritorna
        -------
        result : dict con T², Q, flag anomalia, contributi
        """
        from pca_monitor.preprocessing import impute_online

        # Imputa dati futuri
        x_imp = impute_online(
            x_partial     = x_partial,
            current_time  = current_time,
            n_time        = self.n_time,
            n_vars        = self.n_vars,
            method        = self.impute_method,
            cal_means     = self.cal_means,
        )

        # Proietta sul modello
        x_2d = x_imp.reshape(1, -1)
        T2   = self.model.compute_T2(x_2d, self.n_components)[0]
        Q, E = self.model.compute_Q(x_2d, self.n_components)
        Q    = Q[0]

        # Contributi
        ct2     = self.model.contributions_T2(x_2d, self.n_components)[0]
        cq, _   = self.model.contributions_Q(x_2d,  self.n_components)
        cq      = cq[0]

        result = {
            "batch_id":    batch_id,
            "time":        current_time,
            "T2":          float(T2),
            "Q":           float(Q),
            "T2_limit":    self.T2_lim,
            "Q_limit":     self.Q_lim,
            "anomaly_T2":  bool(T2 > self.T2_lim),
            "anomaly_Q":   bool(Q  > self.Q_lim),
            "anomaly_any": bool(T2 > self.T2_lim or Q > self.Q_lim),
            "contrib_T2":  ct2,
            "contrib_Q":   cq,
            "x_imputed":   x_imp,
        }

        self.history.append(result)
        return result

    def run_full_batch(self, x_complete: np.ndarray,
                        batch_id: Union[str, int] = "current") -> pd.DataFrame:
        """
        Simula il monitoraggio on-line di un batch completo,
        aggiornando istante per istante.
        Utile per visualizzare come T² e Q evolvono nel corso del batch.

        Parametri
        ----------
        x_complete : ndarray (V*J,) — batch completo (tutti gli istanti noti)

        Ritorna
        -------
        df_history : DataFrame con T², Q, flag anomalia per ogni istante
        """
        self.history = []
        for t in range(self.n_time):
            # Maschera: rendi NaN gli istanti futuri
            x_partial = x_complete.copy().astype(float)
            for v in range(self.n_vars):
                for j in range(t + 1, self.n_time):
                    x_partial[v * self.n_time + j] = np.nan

            self.update(x_partial, current_time=t, batch_id=batch_id)

        df = pd.DataFrame([{
            "time":        h["time"],
            "T2":          h["T2"],
            "Q":           h["Q"],
            "anomaly_T2":  h["anomaly_T2"],
            "anomaly_Q":   h["anomaly_Q"],
            "anomaly_any": h["anomaly_any"],
        } for h in self.history])

        return df

    def plot_online_history(self, df_history: pd.DataFrame) -> "plt.Figure":
        """
        Grafico T² e Q vs tempo per il batch in corso.
        """
        import matplotlib.pyplot as plt

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 7),
                                        sharex=True, dpi=120)

        def _plot(ax, col, limit, ylabel, color):
            t   = df_history["time"].values
            val = df_history[col].values
            above = val > limit
            ax.plot(t, val, "-", color="#6B7280", linewidth=0.8,
                    alpha=0.6, zorder=2)
            ax.scatter(t[~above], val[~above], color=color,
                       s=30, alpha=0.8, zorder=3, edgecolors="white",
                       linewidth=0.4)
            ax.scatter(t[above], val[above], color="#DC2626",
                       s=60, alpha=0.9, zorder=4, marker="^",
                       edgecolors="darkred", linewidth=0.6)
            ax.axhline(limit, color="#DC2626", linewidth=1.5,
                       linestyle="--", label=f"Limite 95% = {limit:.3f}")
            ax.fill_between(t, 0, limit, alpha=0.05, color="#16A34A")
            ax.set_ylabel(ylabel, fontsize=10)
            ax.legend(fontsize=9)
            ax.grid(True, alpha=0.25)
            ax.spines[["top", "right"]].set_visible(False)

        _plot(ax1, "T2", self.T2_lim, "T² (Hotelling)", "#2563EB")
        _plot(ax2, "Q",  self.Q_lim,  "Q (SPE)",         "#7C3AED")

        ax2.set_xlabel("Istante temporale", fontsize=10)
        fig.suptitle("Monitoraggio on-line batch — evoluzione T² e Q",
                     fontsize=13, fontweight="bold")
        fig.tight_layout()
        return fig

    def summary_report(self) -> str:
        """
        Genera testo riassuntivo della sessione on-line per l'AI interpreter.
        """
        if not self.history:
            return "Nessun dato on-line registrato."
        n_tot = len(self.history)
        n_an  = sum(1 for h in self.history if h["anomaly_any"])
        first_anomaly = next(
            (h["time"] for h in self.history if h["anomaly_any"]), None)
        lines = [
            "=== Report monitoraggio on-line batch ===",
            f"Batch ID               : {self.history[0]['batch_id']}",
            f"Istanti monitorati     : {n_tot}",
            f"Istanti anomali        : {n_an}",
            f"Prima anomalia a t     : {first_anomaly}",
            f"Limite T²              : {self.T2_lim:.4f}",
            f"Limite Q               : {self.Q_lim:.4f}",
            f"T² max                 : {max(h['T2'] for h in self.history):.4f}",
            f"Q  max                 : {max(h['Q']  for h in self.history):.4f}",
        ]
        return "\n".join(lines)


# ------------------------------------------------------------------
# UTILITÀ GENERALI
# ------------------------------------------------------------------

def find_anomalies(T2: np.ndarray, Q: np.ndarray,
                    T2_limit: float, Q_limit: float) -> Dict:
    """
    Identifica le osservazioni anomale e restituisce un dizionario
    con indici e statistiche.
    """
    above_T2  = np.where(T2 > T2_limit)[0]
    above_Q   = np.where(Q  > Q_limit)[0]
    above_any = np.union1d(above_T2, above_Q)

    return {
        "idx_T2":    above_T2.tolist(),
        "idx_Q":     above_Q.tolist(),
        "idx_any":   above_any.tolist(),
        "n_T2":      len(above_T2),
        "n_Q":       len(above_Q),
        "n_any":     len(above_any),
        "only_T2":   np.setdiff1d(above_T2, above_Q).tolist(),
        "only_Q":    np.setdiff1d(above_Q, above_T2).tolist(),
        "both":      np.intersect1d(above_T2, above_Q).tolist(),
    }


def compute_cal_contribution_limits(model,
                                     n_components: int,
                                     sigma: float = 3.0) -> Dict:
    """
    Calcola i limiti di controllo per i contribution plots
    basandosi sul set di calibrazione (media + sigma * std).

    Ritorna
    -------
    dict con 'T2_mean', 'T2_std', 'T2_limit', 'Q_mean', 'Q_std', 'Q_limit'
    """
    X_cal = model._inverse_scale(model._X_scaled)
    ct2   = model.contributions_T2(X_cal, n_components)
    cq, _ = model.contributions_Q(X_cal,  n_components)

    T2_mean = np.mean(ct2, axis=0)
    T2_std  = np.std(ct2,  axis=0)
    Q_mean  = np.mean(cq,  axis=0)
    Q_std   = np.std(cq,   axis=0)

    return {
        "T2_mean":  T2_mean,
        "T2_std":   T2_std,
        "T2_limit": T2_mean + sigma * T2_std,
        "Q_mean":   Q_mean,
        "Q_std":    Q_std,
        "Q_limit":  Q_mean  + sigma * Q_std,
    }
