"""
plots.py
Tutte le visualizzazioni del package pca-process-monitor.
Usa matplotlib per output statico (notebook) e plotly per output interattivo.
Ogni funzione è autonoma: riceve i dati già calcolati e restituisce
la figura senza effetti collaterali.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Ellipse
import matplotlib.transforms as transforms
from scipy import stats
from typing import Optional, List, Tuple, Union


# ------------------------------------------------------------------
# COSTANTI GRAFICHE
# ------------------------------------------------------------------

COLORS = {
    "primary":   "#2563EB",
    "secondary": "#7C3AED",
    "ok":        "#16A34A",
    "warning":   "#D97706",
    "danger":    "#DC2626",
    "neutral":   "#6B7280",
    "light":     "#F3F4F6",
}

FIGSIZE_DEFAULT  = (10, 6)
FIGSIZE_WIDE     = (14, 6)
FIGSIZE_SQUARE   = (8, 8)
FIGSIZE_TALL     = (10, 10)
DPI              = 120


# ------------------------------------------------------------------
# SEZIONE 1 — OVERVIEW DATI
# ------------------------------------------------------------------

def plot_variable_distributions(df: pd.DataFrame,
                                  var_cols: List[str],
                                  kind: str = "histogram",
                                  ncols: int = 3) -> plt.Figure:
    """
    Grafici di distribuzione per ogni variabile selezionata.

    Parametri
    ----------
    kind : 'histogram' | 'boxplot' | 'timeseries'
    ncols : numero di colonne nella griglia
    """
    n     = len(var_cols)
    nrows = int(np.ceil(n / ncols))
    fig, axes = plt.subplots(nrows, ncols,
                              figsize=(5 * ncols, 4 * nrows),
                              dpi=DPI)
    axes = np.array(axes).flatten()

    for i, col in enumerate(var_cols):
        ax   = axes[i]
        data = df[col].dropna()

        if kind == "histogram":
            ax.hist(data, bins=30, color=COLORS["primary"],
                    alpha=0.8, edgecolor="white", linewidth=0.5)
            ax.axvline(data.mean(), color=COLORS["danger"],
                       linestyle="--", linewidth=1.2, label=f"μ={data.mean():.2f}")
            ax.legend(fontsize=8)

        elif kind == "boxplot":
            bp = ax.boxplot(data, patch_artist=True,
                            boxprops=dict(facecolor=COLORS["primary"], alpha=0.7),
                            medianprops=dict(color=COLORS["danger"], linewidth=2),
                            whiskerprops=dict(color=COLORS["neutral"]),
                            capprops=dict(color=COLORS["neutral"]),
                            flierprops=dict(marker="o", color=COLORS["warning"],
                                            alpha=0.5, markersize=4))
            ax.set_xticks([])

        elif kind == "timeseries":
            ax.plot(data.values, color=COLORS["primary"],
                    linewidth=0.8, alpha=0.9)
            ax.axhline(data.mean(), color=COLORS["danger"],
                       linestyle="--", linewidth=1, alpha=0.7)

        ax.set_title(col, fontsize=11, fontweight="bold")
        ax.set_xlabel("")
        ax.grid(True, alpha=0.3, linewidth=0.5)
        ax.spines[["top", "right"]].set_visible(False)

    # Nasconde gli assi vuoti
    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    fig.suptitle(f"Distribuzione variabili — {kind}", fontsize=13,
                 fontweight="bold", y=1.01)
    fig.tight_layout()
    return fig


def plot_missing_heatmap(df: pd.DataFrame) -> plt.Figure:
    """
    Heatmap dei valori mancanti: righe = osservazioni, colonne = variabili.
    Bianco = presente, nero = mancante.
    """
    fig, ax = plt.subplots(figsize=FIGSIZE_WIDE, dpi=DPI)
    missing  = df.isnull().astype(int)
    ax.imshow(missing.T, aspect="auto", cmap="binary",
               interpolation="none", vmin=0, vmax=1)
    ax.set_yticks(range(len(df.columns)))
    ax.set_yticklabels(df.columns, fontsize=9)
    ax.set_xlabel("Osservazione / indice riga", fontsize=10)
    ax.set_title("Mappa valori mancanti  (nero = mancante)", fontsize=12,
                 fontweight="bold")
    fig.tight_layout()
    return fig


def plot_descriptive_stats(df: pd.DataFrame,
                             var_cols: List[str]) -> plt.Figure:
    """
    Grafico a barre orizzontali con media ± std per ogni variabile.
    Utile per overview rapida della scala delle variabili.
    """
    means = df[var_cols].mean()
    stds  = df[var_cols].std()

    fig, ax = plt.subplots(figsize=(8, max(4, len(var_cols) * 0.5 + 1)), dpi=DPI)
    y = np.arange(len(var_cols))
    ax.barh(y, means, xerr=stds, color=COLORS["primary"], alpha=0.75,
            ecolor=COLORS["neutral"], capsize=4, height=0.6)
    ax.set_yticks(y)
    ax.set_yticklabels(var_cols, fontsize=10)
    ax.set_xlabel("Valore medio ± std", fontsize=10)
    ax.set_title("Statistiche descrittive — media ± deviazione standard",
                 fontsize=12, fontweight="bold")
    ax.grid(True, axis="x", alpha=0.3, linewidth=0.5)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 3 — SELEZIONE NUMERO DI PC
# ------------------------------------------------------------------

def plot_scree(eigenvalues: np.ndarray,
               explained_var: np.ndarray,
               n_selected: Optional[int] = None) -> plt.Figure:
    """
    Scree plot: eigenvalues e varianza cumulativa per ogni PC.
    """
    n    = len(eigenvalues)
    pcs  = np.arange(1, n + 1)
    cum  = np.cumsum(explained_var) * 100
    var  = explained_var * 100

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=FIGSIZE_WIDE, dpi=DPI)

    # Eigenvalues
    ax1.plot(pcs, eigenvalues, "o-", color=COLORS["primary"],
             linewidth=2, markersize=7, markerfacecolor="white",
             markeredgewidth=2)
    ax1.axhline(1.0, color=COLORS["danger"], linestyle="--",
                linewidth=1, label="Soglia Kaiser (λ=1)")
    if n_selected:
        ax1.axvline(n_selected, color=COLORS["warning"], linestyle="--",
                    linewidth=1.5, label=f"PC scelte = {n_selected}")
    ax1.set_xlabel("Numero PC", fontsize=10)
    ax1.set_ylabel("Eigenvalue", fontsize=10)
    ax1.set_title("Scree plot", fontsize=12, fontweight="bold")
    ax1.legend(fontsize=9)
    ax1.grid(True, alpha=0.3)
    ax1.spines[["top", "right"]].set_visible(False)
    ax1.set_xticks(pcs)

    # Varianza cumulativa
    ax2.bar(pcs, var, color=COLORS["primary"], alpha=0.6,
            label="Var spiegata %")
    ax2.plot(pcs, cum, "o-", color=COLORS["secondary"],
             linewidth=2, markersize=6, label="Cumulativa %")
    ax2.axhline(85, color=COLORS["ok"], linestyle="--",
                linewidth=1, label="85% soglia")
    ax2.axhline(95, color=COLORS["warning"], linestyle="--",
                linewidth=1, label="95% soglia")
    if n_selected:
        ax2.axvline(n_selected, color=COLORS["danger"], linestyle="--",
                    linewidth=1.5, label=f"PC scelte = {n_selected}")
    ax2.set_xlabel("Numero PC", fontsize=10)
    ax2.set_ylabel("Varianza spiegata (%)", fontsize=10)
    ax2.set_title("Varianza spiegata cumulativa", fontsize=12, fontweight="bold")
    ax2.legend(fontsize=9)
    ax2.grid(True, alpha=0.3)
    ax2.spines[["top", "right"]].set_visible(False)
    ax2.set_xticks(pcs)
    ax2.set_ylim(0, 105)

    fig.tight_layout()
    return fig


def plot_rmsecv(rmsecv_values: np.ndarray,
                optimal_nc: int) -> plt.Figure:
    """
    Grafico RMSECV vs numero di PC con indicazione del numero ottimale.
    """
    pcs = np.arange(1, len(rmsecv_values) + 1)
    fig, ax = plt.subplots(figsize=(8, 5), dpi=DPI)

    ax.plot(pcs, rmsecv_values, "o-", color=COLORS["primary"],
            linewidth=2, markersize=8, markerfacecolor="white",
            markeredgewidth=2, label="RMSECV")
    ax.axvline(optimal_nc, color=COLORS["danger"], linestyle="--",
               linewidth=2, label=f"Ottimale: {optimal_nc} PC")
    ax.plot(optimal_nc, rmsecv_values[optimal_nc - 1], "o",
            color=COLORS["danger"], markersize=12, zorder=5)

    ax.set_xlabel("Numero di PC", fontsize=11)
    ax.set_ylabel("RMSECV", fontsize=11)
    ax.set_title("Root Mean Squared Error of Cross-Validation\n"
                 f"Numero ottimale di PC: {optimal_nc}",
                 fontsize=12, fontweight="bold")
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)
    ax.set_xticks(pcs)
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 3 — SCORE PLOT CON ELLISSE DI CONFIDENZA
# ------------------------------------------------------------------

def _confidence_ellipse(x: np.ndarray, y: np.ndarray,
                          ax: plt.Axes, alpha: float = 0.05,
                          color: str = "red") -> None:
    """
    Disegna l'ellisse di confidenza (1-alpha) sul grafico degli scores.
    Basata sulla distribuzione F di Hotelling per 2 PC.
    """
    n    = len(x)
    cov  = np.cov(x, y)
    vals, vecs = np.linalg.eigh(cov)
    order      = vals.argsort()[::-1]
    vals, vecs = vals[order], vecs[:, order]
    angle      = np.degrees(np.arctan2(*vecs[:, 0][::-1]))

    # Asse scala basato su distribuzione F
    p     = 2
    F_crit = stats.f.ppf(1 - alpha, p, n - p)
    scale  = np.sqrt(vals * p * (n - 1) * (n + 1) / (n * (n - p)) * F_crit)

    ellipse = Ellipse(
        xy=(np.mean(x), np.mean(y)),
        width=2 * scale[0],
        height=2 * scale[1],
        angle=angle,
        edgecolor=color,
        facecolor="none",
        linewidth=1.8,
        linestyle="--",
        alpha=0.85,
        zorder=3,
    )
    ax.add_patch(ellipse)


def plot_scores(T: np.ndarray,
                pc_x: int = 1,
                pc_y: int = 2,
                labels: Optional[List[str]] = None,
                highlight_idx: Optional[List[int]] = None,
                alpha: float = 0.05,
                title: str = "Score plot") -> plt.Figure:
    """
    Score plot 2D con ellisse di confidenza di Hotelling.

    Parametri
    ----------
    T           : matrice degli scores (n_samples, n_components)
    pc_x, pc_y  : indici delle PC da plottare (1-based)
    labels      : etichette per ogni punto (batch_id o obs_id)
    highlight_idx : indici dei punti da evidenziare (anomali)
    alpha       : livello di significatività per ellisse (default 0.05)
    """
    x = T[:, pc_x - 1]
    y = T[:, pc_y - 1]

    fig, ax = plt.subplots(figsize=FIGSIZE_SQUARE, dpi=DPI)

    # Punti normali
    normal_mask  = np.ones(len(x), dtype=bool)
    if highlight_idx:
        normal_mask[highlight_idx] = False

    ax.scatter(x[normal_mask], y[normal_mask],
               color=COLORS["primary"], alpha=0.7, s=50,
               edgecolors="white", linewidth=0.5,
               zorder=4, label="Normale")

    # Punti anomali evidenziati
    if highlight_idx:
        ax.scatter(x[~normal_mask], y[~normal_mask],
                   color=COLORS["danger"], alpha=0.9, s=80,
                   edgecolors="darkred", linewidth=0.8,
                   zorder=5, marker="^", label="Anomalo")

    # Ellisse di confidenza
    _confidence_ellipse(x, y, ax, alpha=alpha, color=COLORS["danger"])

    # Etichette punti (se poche osservazioni)
    if labels and len(labels) <= 60:
        for i, (xi, yi, lab) in enumerate(zip(x, y, labels)):
            color = COLORS["danger"] if (highlight_idx and i in highlight_idx) \
                    else COLORS["neutral"]
            ax.annotate(str(lab), (xi, yi),
                        textcoords="offset points", xytext=(5, 3),
                        fontsize=7, color=color, alpha=0.8)

    # Assi
    ax.axhline(0, color=COLORS["neutral"], linewidth=0.7, alpha=0.5)
    ax.axvline(0, color=COLORS["neutral"], linewidth=0.7, alpha=0.5)
    ax.set_xlabel(f"PC{pc_x} scores", fontsize=11)
    ax.set_ylabel(f"PC{pc_y} scores", fontsize=11)
    ax.set_title(f"{title}  |  ellisse confidenza {int((1-alpha)*100)}%",
                 fontsize=12, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.25, linewidth=0.5)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 3 — LOADING PLOT E BIPLOT
# ------------------------------------------------------------------

def plot_loadings(P: np.ndarray,
                   var_names: List[str],
                   pc_x: int = 1,
                   pc_y: int = 2) -> plt.Figure:
    """
    Loading plot 2D: mostra il contributo di ogni variabile alle PC.
    """
    px = P[:, pc_x - 1]
    py = P[:, pc_y - 1]

    fig, ax = plt.subplots(figsize=FIGSIZE_SQUARE, dpi=DPI)

    ax.scatter(px, py, color=COLORS["secondary"],
               s=60, zorder=4, edgecolors="white")

    for i, name in enumerate(var_names):
        ax.annotate(name, (px[i], py[i]),
                    textcoords="offset points", xytext=(5, 3),
                    fontsize=9, color=COLORS["secondary"])
        ax.arrow(0, 0, px[i] * 0.95, py[i] * 0.95,
                 head_width=0.01, head_length=0.01,
                 fc=COLORS["secondary"], ec=COLORS["secondary"],
                 alpha=0.5, linewidth=1)

    ax.axhline(0, color=COLORS["neutral"], linewidth=0.7, alpha=0.5)
    ax.axvline(0, color=COLORS["neutral"], linewidth=0.7, alpha=0.5)

    circle = plt.Circle((0, 0), 1, color=COLORS["neutral"],
                         fill=False, linestyle="--", alpha=0.4)
    ax.add_patch(circle)

    ax.set_xlabel(f"PC{pc_x} loadings", fontsize=11)
    ax.set_ylabel(f"PC{pc_y} loadings", fontsize=11)
    ax.set_title(f"Loading plot  —  PC{pc_x} vs PC{pc_y}",
                 fontsize=12, fontweight="bold")
    ax.grid(True, alpha=0.25)
    ax.spines[["top", "right"]].set_visible(False)
    lim = max(np.abs(px).max(), np.abs(py).max()) * 1.2
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    fig.tight_layout()
    return fig


def plot_biplot(T: np.ndarray,
                P: np.ndarray,
                var_names: List[str],
                pc_x: int = 1,
                pc_y: int = 2,
                labels: Optional[List[str]] = None,
                scale_factor: float = 3.0) -> plt.Figure:
    """
    Biplot: scores e loadings sullo stesso grafico.
    I loadings vengono scalati per essere visibili insieme agli scores.
    """
    tx = T[:, pc_x - 1]
    ty = T[:, pc_y - 1]
    px = P[:, pc_x - 1]
    py = P[:, pc_y - 1]

    # Scala loadings per renderli visibili rispetto agli scores
    max_score = max(np.abs(tx).max(), np.abs(ty).max())
    max_load  = max(np.abs(px).max(), np.abs(py).max())
    sf        = scale_factor * max_score / max_load if max_load > 0 else scale_factor

    fig, ax = plt.subplots(figsize=FIGSIZE_SQUARE, dpi=DPI)

    ax.scatter(tx, ty, color=COLORS["primary"], alpha=0.5,
               s=40, zorder=3, label="Scores", edgecolors="white")

    if labels and len(labels) <= 40:
        for i, lab in enumerate(labels):
            ax.annotate(str(lab), (tx[i], ty[i]),
                        textcoords="offset points", xytext=(4, 2),
                        fontsize=7, color=COLORS["neutral"], alpha=0.7)

    for i, name in enumerate(var_names):
        ax.arrow(0, 0, px[i] * sf, py[i] * sf,
                 head_width=0.05 * sf, head_length=0.05 * sf,
                 fc=COLORS["danger"], ec=COLORS["danger"],
                 alpha=0.8, linewidth=1.5, zorder=5)
        ax.annotate(name, (px[i] * sf, py[i] * sf),
                    textcoords="offset points", xytext=(5, 3),
                    fontsize=9, color=COLORS["danger"], fontweight="bold")

    ax.axhline(0, color=COLORS["neutral"], linewidth=0.7, alpha=0.4)
    ax.axvline(0, color=COLORS["neutral"], linewidth=0.7, alpha=0.4)
    ax.set_xlabel(f"PC{pc_x}", fontsize=11)
    ax.set_ylabel(f"PC{pc_y}", fontsize=11)
    ax.set_title(f"Biplot  —  PC{pc_x} vs PC{pc_y}",
                 fontsize=12, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.25)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


def plot_loading_heatmap(P: np.ndarray,
                          var_names: List[str],
                          n_components: Optional[int] = None) -> plt.Figure:
    """
    Heatmap dei loadings: variabili × PC.
    Utile per vedere quali variabili dominano ogni PC.
    """
    n_comp = n_components or P.shape[1]
    P_plot = P[:, :n_comp]
    pc_labels = [f"PC{i+1}" for i in range(n_comp)]

    fig, ax = plt.subplots(figsize=(max(6, n_comp * 1.2),
                                    max(4, len(var_names) * 0.5 + 1)),
                            dpi=DPI)

    im = ax.imshow(P_plot, cmap="RdBu_r", aspect="auto",
                   vmin=-1, vmax=1)
    plt.colorbar(im, ax=ax, label="Loading", shrink=0.8)

    ax.set_xticks(range(n_comp))
    ax.set_xticklabels(pc_labels, fontsize=10)
    ax.set_yticks(range(len(var_names)))
    ax.set_yticklabels(var_names, fontsize=10)

    # Valori nelle celle
    for i in range(len(var_names)):
        for j in range(n_comp):
            val = P_plot[i, j]
            ax.text(j, i, f"{val:.2f}", ha="center", va="center",
                    fontsize=8,
                    color="white" if abs(val) > 0.5 else "black")

    ax.set_title("Heatmap loadings  (variabili × PC)",
                 fontsize=12, fontweight="bold")
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 3 — LOADINGS NEL TEMPO (BATCH)
# ------------------------------------------------------------------

def plot_loading_time(P: np.ndarray,
                       col_names: List[str],
                       var_name: str,
                       pc: int = 1,
                       n_time: int = None) -> plt.Figure:
    """
    Grafico loading vs tempo per una variabile specifica (dati batch).
    Mostra come il contributo di una variabile alla PC varia nel tempo.

    Parametri
    ----------
    P         : matrice loadings (V*J, n_components)
    col_names : nomi colonne unfolded (es. ["T_batch_t0", "T_batch_t1", ...])
    var_name  : nome variabile da visualizzare (es. "T_batch")
    pc        : numero PC (1-based)
    n_time    : numero istanti temporali (inferito automaticamente se None)
    """
    # Estrai gli indici delle colonne corrispondenti a var_name
    indices = [i for i, c in enumerate(col_names) if c.startswith(f"{var_name}_t")]
    times   = [int(c.split("_t")[-1]) for c in col_names if c.startswith(f"{var_name}_t")]

    if not indices:
        raise ValueError(f"Variabile '{var_name}' non trovata in col_names.")

    loading_values = P[indices, pc - 1]

    fig, ax = plt.subplots(figsize=FIGSIZE_DEFAULT, dpi=DPI)
    ax.plot(times, loading_values, "-o", color=COLORS["secondary"],
            linewidth=2, markersize=5, markerfacecolor="white",
            markeredgewidth=1.5)
    ax.axhline(0, color=COLORS["neutral"], linewidth=0.8, linestyle="--", alpha=0.6)
    ax.fill_between(times, loading_values, 0,
                    alpha=0.15, color=COLORS["secondary"])

    ax.set_xlabel("Istante temporale", fontsize=11)
    ax.set_ylabel(f"Loading PC{pc}", fontsize=11)
    ax.set_title(f"Loading nel tempo  —  {var_name}  |  PC{pc}",
                 fontsize=12, fontweight="bold")
    ax.grid(True, alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 4 — T² E Q NEL TEMPO
# ------------------------------------------------------------------

def plot_T2_Q(T2: np.ndarray,
               Q: np.ndarray,
               T2_limit: float,
               Q_limit: float,
               labels: Optional[List[str]] = None,
               highlight_idx: Optional[List[int]] = None,
               title: str = "Monitoraggio processo") -> plt.Figure:
    """
    Grafico T² e Q vs indice osservazione con limiti di controllo.
    """
    n   = len(T2)
    idx = np.arange(n)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), dpi=DPI,
                                    sharex=True)

    def _plot_stat(ax, values, limit, ylabel, color, title_str):
        above = values > limit
        ax.plot(idx, values, "-", color=COLORS["neutral"],
                linewidth=0.8, alpha=0.6, zorder=2)
        ax.scatter(idx[~above], values[~above],
                   color=color, s=35, alpha=0.8,
                   edgecolors="white", linewidth=0.4, zorder=3,
                   label="Entro limite")
        ax.scatter(idx[above], values[above],
                   color=COLORS["danger"], s=60, alpha=0.9,
                   edgecolors="darkred", linewidth=0.6,
                   marker="^", zorder=4, label="Oltre limite")
        ax.axhline(limit, color=COLORS["danger"], linewidth=1.5,
                   linestyle="--", label=f"Limite 95% = {limit:.3f}")
        ax.fill_between(idx, 0, limit, alpha=0.05, color=COLORS["ok"])
        ax.set_ylabel(ylabel, fontsize=10)
        ax.set_title(title_str, fontsize=11, fontweight="bold")
        ax.legend(fontsize=9, loc="upper right")
        ax.grid(True, alpha=0.25)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_ylim(bottom=0)

    _plot_stat(ax1, T2, T2_limit, "T² (Hotelling)",
               COLORS["primary"], "Indice T² — distanza dal centro del modello")
    _plot_stat(ax2, Q, Q_limit, "Q (SPE)",
               COLORS["secondary"], "Indice Q — errore di predizione del modello")

    if labels and len(labels) <= 80:
        above_T2 = np.where(T2 > T2_limit)[0]
        for i in above_T2:
            ax1.annotate(str(labels[i]), (i, T2[i]),
                         textcoords="offset points", xytext=(3, 4),
                         fontsize=7, color=COLORS["danger"])

    ax2.set_xlabel("Indice osservazione / batch", fontsize=10)
    fig.suptitle(title, fontsize=13, fontweight="bold", y=1.01)
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 4 — CONTRIBUTION PLOTS
# ------------------------------------------------------------------

def plot_contributions(contrib: np.ndarray,
                        var_names: List[str],
                        obs_idx: int,
                        stat: str = "T2",
                        ref_limit: Optional[np.ndarray] = None) -> plt.Figure:
    """
    Contribution plot per una singola osservazione anomala.
    Mostra il contributo di ogni variabile all'indice T² o Q.

    Parametri
    ----------
    contrib    : ndarray (n_samples, n_features) — matrice contributi
    var_names  : nomi variabili
    obs_idx    : indice dell'osservazione da analizzare
    stat       : 'T2' o 'Q'
    ref_limit  : ndarray (n_features,) — limite di controllo per variabile
                 (tipicamente media dei contributi del set di calibrazione)
    """
    c    = contrib[obs_idx, :]
    n    = len(var_names)
    x    = np.arange(n)

    colors = [COLORS["danger"] if (ref_limit is not None and c[i] > ref_limit[i])
              else COLORS["primary"]
              for i in range(n)]

    fig, ax = plt.subplots(figsize=(max(8, n * 0.8), 5), dpi=DPI)
    bars = ax.bar(x, c, color=colors, alpha=0.8, edgecolor="white",
                  linewidth=0.5)

    if ref_limit is not None:
        ax.step(np.append(x - 0.5, x[-1] + 0.5),
                np.append(ref_limit, ref_limit[-1]),
                color=COLORS["danger"], linewidth=1.5,
                linestyle="--", label="Limite di controllo")
        ax.legend(fontsize=9)

    ax.set_xticks(x)
    ax.set_xticklabels(var_names, rotation=45, ha="right", fontsize=9)
    ax.set_ylabel(f"Contributo a {stat}", fontsize=10)
    ax.set_title(f"Contribution plot — {stat}  |  Osservazione {obs_idx}",
                 fontsize=12, fontweight="bold")
    ax.grid(True, axis="y", alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


def plot_contribution_time(contrib: np.ndarray,
                            col_names: List[str],
                            var_name: str,
                            batch_idx: int,
                            stat: str = "Q",
                            control_limit: Optional[np.ndarray] = None) -> plt.Figure:
    """
    Contribution plot nel tempo per una variabile — diagnostica batch.
    Mostra come il contributo di una variabile varia nel tempo per un batch anomalo.

    Parametri
    ----------
    contrib       : ndarray (K, V*J) — matrice contributi unfolded
    col_names     : nomi colonne unfolded
    var_name      : nome variabile da analizzare
    batch_idx     : indice del batch da analizzare
    control_limit : ndarray (J,) — limite di controllo per ogni istante
    """
    indices = [i for i, c in enumerate(col_names) if c.startswith(f"{var_name}_t")]
    times   = [int(c.split("_t")[-1]) for c in col_names if c.startswith(f"{var_name}_t")]

    if not indices:
        raise ValueError(f"Variabile '{var_name}' non trovata in col_names.")

    c_vals = contrib[batch_idx, indices]

    fig, ax = plt.subplots(figsize=FIGSIZE_DEFAULT, dpi=DPI)

    if control_limit is not None:
        colors = [COLORS["danger"] if c_vals[j] > control_limit[j]
                  else COLORS["primary"]
                  for j in range(len(times))]
        ax.step(times, control_limit,
                color=COLORS["danger"], linewidth=1.5,
                linestyle="--", label="Limite controllo", zorder=3)
    else:
        colors = [COLORS["primary"]] * len(times)

    ax.bar(times, c_vals, color=colors, alpha=0.75,
           edgecolor="white", linewidth=0.4, width=0.8)
    ax.axhline(0, color=COLORS["neutral"], linewidth=0.7)

    ax.set_xlabel("Istante temporale", fontsize=11)
    ax.set_ylabel(f"Contributo a {stat}", fontsize=11)
    ax.set_title(f"Contribution plot nel tempo — {var_name}  |  {stat}  |  Batch {batch_idx}",
                 fontsize=12, fontweight="bold")
    if control_limit is not None:
        ax.legend(fontsize=9)
    ax.grid(True, axis="y", alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


# ------------------------------------------------------------------
# SEZIONE 3 — RESIDUI E NORMALITÀ
# ------------------------------------------------------------------

def plot_residuals(E: np.ndarray,
                    var_names: List[str],
                    var_idx: int = 0) -> plt.Figure:
    """
    Grafico dei residui per una variabile: scatter + istogramma + Q-Q plot.

    Parametri
    ----------
    E       : matrice residua (n_samples, n_features)
    var_idx : indice della variabile da analizzare
    """
    res  = E[:, var_idx]
    name = var_names[var_idx] if var_idx < len(var_names) else f"Var {var_idx}"

    fig, axes = plt.subplots(1, 3, figsize=(15, 5), dpi=DPI)

    # Scatter residui
    axes[0].scatter(range(len(res)), res, color=COLORS["primary"],
                    alpha=0.6, s=25, edgecolors="white", linewidth=0.4)
    axes[0].axhline(0, color=COLORS["danger"], linewidth=1.2, linestyle="--")
    axes[0].set_xlabel("Indice osservazione")
    axes[0].set_ylabel("Residuo")
    axes[0].set_title("Residui vs indice")
    axes[0].grid(True, alpha=0.3)
    axes[0].spines[["top", "right"]].set_visible(False)

    # Istogramma con curva normale
    axes[1].hist(res, bins=25, color=COLORS["primary"],
                 alpha=0.75, edgecolor="white", density=True)
    xr = np.linspace(res.min(), res.max(), 200)
    axes[1].plot(xr, stats.norm.pdf(xr, res.mean(), res.std()),
                 color=COLORS["danger"], linewidth=2, label="Normale teorica")
    axes[1].set_xlabel("Residuo")
    axes[1].set_ylabel("Densità")
    axes[1].set_title("Distribuzione residui")
    axes[1].legend(fontsize=9)
    axes[1].grid(True, alpha=0.3)
    axes[1].spines[["top", "right"]].set_visible(False)

    # Q-Q plot
    (osm, osr), (slope, intercept, r) = stats.probplot(res, dist="norm")
    axes[2].scatter(osm, osr, color=COLORS["primary"],
                    alpha=0.6, s=25, edgecolors="white", linewidth=0.4)
    axes[2].plot(osm, slope * np.array(osm) + intercept,
                 color=COLORS["danger"], linewidth=2, label=f"R²={r**2:.3f}")
    axes[2].set_xlabel("Quantili teorici")
    axes[2].set_ylabel("Quantili campionari")
    axes[2].set_title("Q-Q plot normalità")
    axes[2].legend(fontsize=9)
    axes[2].grid(True, alpha=0.3)
    axes[2].spines[["top", "right"]].set_visible(False)

    fig.suptitle(f"Analisi residui — {name}", fontsize=13,
                 fontweight="bold", y=1.01)
    fig.tight_layout()
    return fig
