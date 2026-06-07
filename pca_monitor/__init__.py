"""
pca-process-monitor
===================
Libreria Python per il monitoraggio statistico di processo
tramite PCA — processi continui e batch.

Moduli
------
nipals          : algoritmo NIPALS per decomposizione PCA
preprocessing   : caricamento, pulizia, unfolding, split
plots           : tutte le visualizzazioni
diagnostics     : T², Q, contribution plots, on-line e post-mortem
ai_interpreter  : interpretazione AI contestuale (Gemini / Claude)

Uso rapido — processo continuo
-------------------------------
    from pca_monitor.nipals import NIPALS
    from pca_monitor.preprocessing import handle_missing, split_calibration_test
    from pca_monitor.diagnostics import ContinuousMonitor
    from pca_monitor import plots

    model = NIPALS(n_components=5, scale='auto')
    model.fit(X_cal)
    monitor = ContinuousMonitor(model, n_components=3, alpha=0.05)
    result  = monitor.monitor(X_test)

Uso rapido — processo batch
----------------------------
    from pca_monitor.preprocessing import unfold_batch
    from pca_monitor.diagnostics import BatchPostMortem

    X_unf, batch_ids, col_names = unfold_batch(df_cal)
    model.fit(X_unf)
    pm = BatchPostMortem(model, n_components=2, col_names=col_names)
    result = pm.analyze_batch(X_test_unf)
"""

__version__ = "0.1.0"
__author__  = "MarDan93"

from pca_monitor.nipals         import NIPALS
from pca_monitor.preprocessing  import (
    detect_process_type,
    missing_summary,
    handle_missing,
    split_calibration_test,
    unfold_batch,
    fold_batch,
    impute_online,
    get_numeric_columns,
    dataframe_info,
)
from pca_monitor.diagnostics    import (
    ContinuousMonitor,
    BatchPostMortem,
    BatchOnlineMonitor,
    find_anomalies,
    compute_cal_contribution_limits,
)
from pca_monitor                import plots
from pca_monitor.ai_interpreter import (
    PCAContext,
    GeminiInterpreter,
    ClaudeInterpreter,
    create_interpreter,
)

__all__ = [
    "NIPALS",
    "detect_process_type",
    "missing_summary",
    "handle_missing",
    "split_calibration_test",
    "unfold_batch",
    "fold_batch",
    "impute_online",
    "get_numeric_columns",
    "dataframe_info",
    "ContinuousMonitor",
    "BatchPostMortem",
    "BatchOnlineMonitor",
    "find_anomalies",
    "compute_cal_contribution_limits",
    "plots",
    "PCAContext",
    "GeminiInterpreter",
    "ClaudeInterpreter",
    "create_interpreter",
]
