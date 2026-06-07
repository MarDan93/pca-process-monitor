"""
preprocessing.py
Gestione dati in ingresso: rilevamento tipo processo, gestione missing values,
scaling, unfolding batch-wise, split calibrazione/test.
"""

import numpy as np
import pandas as pd
from typing import Tuple, Optional, List, Dict, Union


# ------------------------------------------------------------------
# RILEVAMENTO AUTOMATICO TIPO PROCESSO
# ------------------------------------------------------------------

def detect_process_type(df: pd.DataFrame,
                         batch_keywords: List[str] = None,
                         time_keywords: List[str] = None,
                         threshold_repeats: int = 3) -> Dict:
    """
    Cerca di rilevare automaticamente se il dataset è batch o continuo.
    Logica:
      1. Cerca colonne con nomi tipici batch (batch_id, lot, run, ecc.)
      2. Cerca colonne temporali (time, timestamp, t, step, ecc.)
      3. Controlla se i valori di una colonna numerica si resettano
         periodicamente (pattern batch)

    Ritorna
    -------
    result : dict con chiavi:
        'type'         : 'batch' | 'continuous' | 'unknown'
        'confidence'   : 'high' | 'medium' | 'low'
        'batch_col'    : nome colonna batch rilevata (o None)
        'time_col'     : nome colonna tempo rilevata (o None)
        'reason'       : stringa esplicativa
    """
    if batch_keywords is None:
        batch_keywords = ["batch", "lot", "run", "batch_id", "lot_id",
                          "run_id", "campagna", "lotto", "batch_no"]
    if time_keywords is None:
        time_keywords  = ["time", "t", "step", "timestamp", "ora",
                          "tempo", "instant", "index", "seq"]

    cols_lower = {c: c.lower() for c in df.columns}
    batch_col  = None
    time_col   = None

    # --- cerca colonna batch ---
    for col, col_l in cols_lower.items():
        for kw in batch_keywords:
            if kw in col_l:
                batch_col = col
                break
        if batch_col:
            break

    # --- cerca colonna tempo ---
    for col, col_l in cols_lower.items():
        if col == batch_col:
            continue
        for kw in time_keywords:
            if kw in col_l:
                time_col = col
                break
        if time_col:
            break

    # --- decisione ---
    if batch_col is not None:
        process_type = "batch"
        confidence   = "high" if time_col else "medium"
        reason = (f"Trovata colonna batch '{batch_col}'"
                  + (f" e colonna tempo '{time_col}'" if time_col else ""))
    elif time_col is not None:
        # Ha colonna tempo ma non batch: potrebbe essere continuo o batch
        # senza etichetta. Controlla se il tempo si resetta.
        try:
            t_vals = pd.to_numeric(df[time_col], errors="coerce").dropna()
            n_resets = (t_vals.diff() < 0).sum()
            if n_resets >= threshold_repeats:
                process_type = "batch"
                confidence   = "medium"
                reason = (f"Colonna '{time_col}' si resetta {n_resets} volte "
                          f"— probabile struttura batch")
            else:
                process_type = "continuous"
                confidence   = "medium"
                reason = f"Trovata colonna tempo '{time_col}' senza reset"
        except Exception:
            process_type = "unknown"
            confidence   = "low"
            reason       = "Colonna tempo trovata ma non interpretabile"
    else:
        process_type = "continuous"
        confidence   = "low"
        reason       = "Nessun pattern batch rilevato — assunto continuo"

    return {
        "type":       process_type,
        "confidence": confidence,
        "batch_col":  batch_col,
        "time_col":   time_col,
        "reason":     reason,
    }


# ------------------------------------------------------------------
# ANALISI MISSING VALUES
# ------------------------------------------------------------------

def missing_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Restituisce un DataFrame con statistiche sui valori mancanti per colonna.

    Ritorna
    -------
    summary : DataFrame con colonne
        ['n_missing', 'pct_missing', 'dtype', 'n_unique']
    """
    summary = pd.DataFrame({
        "n_missing":   df.isnull().sum(),
        "pct_missing": (df.isnull().mean() * 100).round(2),
        "dtype":       df.dtypes.astype(str),
        "n_unique":    df.nunique(),
    })
    return summary.sort_values("pct_missing", ascending=False)


def handle_missing(df: pd.DataFrame,
                   method: str = "mean",
                   columns: Optional[List[str]] = None,
                   drop_threshold: float = 0.5) -> pd.DataFrame:
    """
    Gestisce i valori mancanti nel DataFrame.

    Parametri
    ----------
    method : str
        'mean'        — sostituisce con media colonna
        'median'      — sostituisce con mediana colonna
        'interpolate' — interpolazione lineare (utile per serie temporali)
        'drop_rows'   — elimina righe con almeno un NaN
        'drop_cols'   — elimina colonne con frazione NaN > drop_threshold
    columns : list, opzionale
        Colonne su cui applicare. Default = tutte le numeriche.
    drop_threshold : float
        Soglia per 'drop_cols' (default 0.5 = 50% mancanti).

    Ritorna
    -------
    df_out : DataFrame pulito (copia, non modifica l'originale)
    """
    df_out = df.copy()
    num_cols = columns or df_out.select_dtypes(include=[np.number]).columns.tolist()

    if method == "mean":
        for col in num_cols:
            df_out[col] = df_out[col].fillna(df_out[col].mean())

    elif method == "median":
        for col in num_cols:
            df_out[col] = df_out[col].fillna(df_out[col].median())

    elif method == "interpolate":
        df_out[num_cols] = df_out[num_cols].interpolate(method="linear",
                                                          limit_direction="both")

    elif method == "drop_rows":
        df_out = df_out.dropna(subset=num_cols)

    elif method == "drop_cols":
        cols_to_drop = [c for c in num_cols
                        if df_out[c].isnull().mean() > drop_threshold]
        df_out = df_out.drop(columns=cols_to_drop)

    else:
        raise ValueError(f"method non valido: '{method}'. "
                         f"Scegli tra: mean, median, interpolate, "
                         f"drop_rows, drop_cols")

    return df_out


# ------------------------------------------------------------------
# SPLIT CALIBRAZIONE / TEST
# ------------------------------------------------------------------

def split_calibration_test(
        df: pd.DataFrame,
        method: str = "fraction",
        test_fraction: float = 0.2,
        test_indices: Optional[List[int]] = None,
        test_batches: Optional[List[str]] = None,
        batch_col: Optional[str] = None,
        split_col: Optional[str] = "split",
        random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Divide il dataset in calibrazione e test.

    Metodi disponibili
    ------------------
    'fraction'    — split casuale per frazione (default 80/20)
    'indices'     — usa test_indices come indici delle righe test
    'batch'       — usa test_batches come lista di batch_id da mettere nel test
    'column'      — usa la colonna split_col già presente nel DataFrame
                    (valori attesi: 'calibration' e 'test')

    Ritorna
    -------
    df_cal, df_test : tuple di DataFrame
    """
    if method == "column":
        if split_col not in df.columns:
            raise ValueError(f"Colonna '{split_col}' non trovata nel DataFrame.")
        df_cal  = df[df[split_col] == "calibration"].copy()
        df_test = df[df[split_col] == "test"].copy()

    elif method == "fraction":
        rng      = np.random.default_rng(random_state)
        idx      = np.arange(len(df))
        rng.shuffle(idx)
        n_test   = max(1, int(len(df) * test_fraction))
        test_idx = idx[:n_test]
        cal_idx  = idx[n_test:]
        df_cal   = df.iloc[cal_idx].copy()
        df_test  = df.iloc[test_idx].copy()

    elif method == "indices":
        if test_indices is None:
            raise ValueError("test_indices richiesto per method='indices'")
        mask    = df.index.isin(test_indices)
        df_test = df[mask].copy()
        df_cal  = df[~mask].copy()

    elif method == "batch":
        if test_batches is None or batch_col is None:
            raise ValueError("test_batches e batch_col richiesti per method='batch'")
        mask    = df[batch_col].isin(test_batches)
        df_test = df[mask].copy()
        df_cal  = df[~mask].copy()

    else:
        raise ValueError(f"method non valido: '{method}'")

    return df_cal, df_test


# ------------------------------------------------------------------
# UNFOLDING BATCH-WISE
# ------------------------------------------------------------------

def unfold_batch(df: pd.DataFrame,
                  batch_col: str = "batch_id",
                  time_col: str  = "time",
                  var_cols: Optional[List[str]] = None) -> Tuple[np.ndarray,
                                                                   List[str],
                                                                   List[str]]:
    """
    Esegue il batch-wise unfolding della matrice 3D (K x J x V)
    nella matrice 2D (K x VJ) dove:
      K = numero di batch
      J = numero di istanti temporali
      V = numero di variabili di processo

    Ogni riga del risultato corrisponde a un batch completo.
    Le colonne sono ordinate come: var1_t0, var1_t1, ..., varV_tJ

    Parametri
    ----------
    df        : DataFrame lungo (formato: una riga per ogni batch×tempo)
    batch_col : nome colonna che identifica il batch
    time_col  : nome colonna che identifica l'istante temporale
    var_cols  : lista variabili di processo. Default = tutte le numeriche
                escluse batch_col e time_col.

    Ritorna
    -------
    X_unf      : ndarray (K, V*J) — matrice unfolded
    batch_ids  : list (K,)        — ID dei batch (ordine righe)
    col_names  : list (V*J,)      — nomi colonne: "varname_t{j}"
    """
    if var_cols is None:
        exclude  = {batch_col, time_col, "split"}
        var_cols = [c for c in df.select_dtypes(include=[np.number]).columns
                    if c not in exclude]

    batch_ids = sorted(df[batch_col].unique())
    time_vals = sorted(df[time_col].unique())

    K = len(batch_ids)
    J = len(time_vals)
    V = len(var_cols)

    X_unf = np.full((K, V * J), np.nan)

    for i, bid in enumerate(batch_ids):
        batch_df = df[df[batch_col] == bid].set_index(time_col)
        for j, tj in enumerate(time_vals):
            if tj in batch_df.index:
                for v, var in enumerate(var_cols):
                    X_unf[i, v * J + j] = batch_df.loc[tj, var]

    # Nomi colonne: variabile_t{istante}
    col_names = [f"{var}_t{tj}" for var in var_cols for tj in time_vals]

    return X_unf, batch_ids, col_names


def fold_batch(X_unf: np.ndarray,
               var_cols: List[str],
               time_vals: List,
               batch_ids: Optional[List] = None) -> pd.DataFrame:
    """
    Operazione inversa dell'unfolding: riporta la matrice (K x VJ)
    al formato lungo (K*J righe, V colonne variabili).

    Ritorna
    -------
    df_long : DataFrame in formato lungo
    """
    J = len(time_vals)
    V = len(var_cols)
    K = X_unf.shape[0]

    if batch_ids is None:
        batch_ids = [f"batch_{i+1:03d}" for i in range(K)]

    records = []
    for i, bid in enumerate(batch_ids):
        for j, tj in enumerate(time_vals):
            row = {"batch_id": bid, "time": tj}
            for v, var in enumerate(var_cols):
                row[var] = X_unf[i, v * J + j]
            records.append(row)

    return pd.DataFrame(records)


# ------------------------------------------------------------------
# IMPUTAZIONE ON-LINE (dati futuri mancanti durante batch in corso)
# ------------------------------------------------------------------

def impute_online(x_partial: np.ndarray,
                  current_time: int,
                  n_time: int,
                  n_vars: int,
                  method: str = "mean",
                  cal_means: Optional[np.ndarray] = None) -> np.ndarray:
    """
    Completa un vettore parziale di un batch in corso imputando
    gli istanti temporali futuri non ancora osservati.
    Usato per la diagnostica on-line.

    Il vettore x_partial è nel formato unfolded: (V*J,)
    con i valori osservati fino a current_time e NaN per i futuri.

    Parametri
    ----------
    x_partial    : ndarray (V*J,) — vettore batch parziale (NaN dove mancante)
    current_time : int — indice dell'ultimo istante osservato (0-based)
    n_time       : int — numero totale di istanti temporali J
    n_vars       : int — numero di variabili V
    method       : 'zero' | 'mean'
        'zero' — imputa 0 (equivale a usare la media se i dati sono scalati)
        'mean' — imputa con la media di calibrazione per quella cella (V,J)
    cal_means    : ndarray (V*J,) opzionale — medie di calibrazione per cella.
                   Richiesto se method='mean'.

    Ritorna
    -------
    x_imputed : ndarray (V*J,) — vettore completo con futuri imputati
    """
    x_imp = x_partial.copy()

    # Indici degli istanti futuri da imputare
    future_indices = []
    for v in range(n_vars):
        for j in range(current_time + 1, n_time):
            idx = v * n_time + j
            future_indices.append(idx)

    if method == "zero":
        for idx in future_indices:
            if np.isnan(x_imp[idx]):
                x_imp[idx] = 0.0

    elif method == "mean":
        if cal_means is None:
            raise ValueError("cal_means richiesto per method='mean'")
        for idx in future_indices:
            if np.isnan(x_imp[idx]):
                x_imp[idx] = cal_means[idx]

    else:
        raise ValueError(f"method non valido: '{method}'. Scegli 'zero' o 'mean'.")

    return x_imp


# ------------------------------------------------------------------
# UTILITÀ GENERALI
# ------------------------------------------------------------------

def get_numeric_columns(df: pd.DataFrame,
                         exclude: Optional[List[str]] = None) -> List[str]:
    """Restituisce le colonne numeriche escludendo quelle in 'exclude'."""
    exclude = set(exclude or [])
    return [c for c in df.select_dtypes(include=[np.number]).columns
            if c not in exclude]


def dataframe_info(df: pd.DataFrame) -> Dict:
    """
    Restituisce un dizionario con le informazioni principali del DataFrame.
    Usato dalla Sezione 1 per la overview iniziale.
    """
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    return {
        "n_rows":        len(df),
        "n_cols":        len(df.columns),
        "n_numeric":     len(num_cols),
        "n_categorical": len(cat_cols),
        "numeric_cols":  num_cols,
        "cat_cols":      cat_cols,
        "n_missing":     int(df.isnull().sum().sum()),
        "pct_missing":   round(df.isnull().mean().mean() * 100, 2),
        "memory_mb":     round(df.memory_usage(deep=True).sum() / 1e6, 3),
        "dtypes":        df.dtypes.astype(str).to_dict(),
    }
