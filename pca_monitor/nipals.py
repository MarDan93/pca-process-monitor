"""
nipals.py
Implementazione dell'algoritmo NIPALS (Nonlinear Iterative Partial Least Squares)
per la decomposizione PCA.
Vantaggi rispetto a SVD:
  - Gestione nativa dei dati mancanti
  - Estrazione sequenziale delle PC (si ferma al numero desiderato)
  - Standard in chemometrics e process monitoring industriale
Riferimento: Wold et al. (1987), Geladi & Kowalski (1986)
"""

import numpy as np


class NIPALS:
    """
    PCA tramite algoritmo NIPALS.

    Parametri
    ---------
    n_components : int
        Numero massimo di PC da estrarre.
    max_iter : int
        Numero massimo di iterazioni per ogni PC (default 500).
    tol : float
        Tolleranza di convergenza su variazione del loading (default 1e-6).
    scale : str
        Tipo di scaling: 'auto' (mean-center + unit variance),
        'pareto' (mean-center + sqrt std), 'center' (solo mean-center).

    Attributi dopo fit()
    --------------------
    T : ndarray (n_samples, n_components)   — scores
    P : ndarray (n_features, n_components)  — loadings
    eigenvalues : ndarray                   — varianza spiegata da ogni PC
    explained_variance_ratio_ : ndarray     — frazione di varianza spiegata
    mean_ : ndarray                         — media per variabile (per scaling)
    std_  : ndarray                         — std per variabile (per scaling)
    n_iter_ : list                          — iterazioni per ogni PC
    converged_ : list                       — flag convergenza per ogni PC
    """

    def __init__(self, n_components=10, max_iter=500, tol=1e-6, scale="auto"):
        self.n_components = n_components
        self.max_iter     = max_iter
        self.tol          = tol
        self.scale        = scale

    # ------------------------------------------------------------------
    # SCALING
    # ------------------------------------------------------------------

    def _compute_scale(self, X):
        """Calcola media e std sui dati di calibrazione (ignora NaN)."""
        self.mean_ = np.nanmean(X, axis=0)
        raw_std    = np.nanstd(X, axis=0, ddof=1)

        if self.scale == "auto":
            self.std_ = np.where(raw_std > 1e-10, raw_std, 1.0)
        elif self.scale == "pareto":
            self.std_ = np.where(raw_std > 1e-10, np.sqrt(raw_std), 1.0)
        elif self.scale == "center":
            self.std_ = np.ones(X.shape[1])
        else:
            raise ValueError(f"scale deve essere 'auto', 'pareto' o 'center'. Ricevuto: {self.scale}")

    def _apply_scale(self, X):
        """Applica scaling con i parametri calcolati su calibrazione."""
        return (X - self.mean_) / self.std_

    def _inverse_scale(self, X_scaled):
        """Riporta i dati scalati allo spazio originale."""
        return X_scaled * self.std_ + self.mean_

    # ------------------------------------------------------------------
    # NIPALS CORE — estrazione di una singola PC
    # ------------------------------------------------------------------

    def _nipals_one_component(self, E):
        """
        Estrae una PC dalla matrice residua E tramite NIPALS.
        Gestisce i NaN: ogni aggiornamento usa solo le osservazioni
        non mancanti per quella variabile/osservazione.

        Ritorna
        -------
        t : ndarray (n,)   score vector
        p : ndarray (m,)   loading vector (normalizzato a norma 1)
        n_iter : int
        converged : bool
        """
        n, m = E.shape

        # Inizializza t con la colonna a varianza massima (robusto ai NaN)
        col_var = np.nanvar(E, axis=0)
        t = E[:, np.argmax(col_var)].copy()

        # Se la colonna ha NaN, sostituisci con 0 per inizializzazione
        t = np.where(np.isnan(t), 0.0, t)

        p_old = np.zeros(m)
        converged = False

        for iteration in range(self.max_iter):
            # --- aggiorna loading p (regressione di E su t) ---
            p = np.zeros(m)
            for j in range(m):
                mask = ~np.isnan(E[:, j])
                if mask.sum() < 2:
                    p[j] = 0.0
                else:
                    t_m = t[mask]
                    denom = t_m @ t_m
                    if denom > 1e-12:
                        p[j] = (E[mask, j] @ t_m) / denom

            # Normalizza p a norma unitaria
            p_norm = np.linalg.norm(p)
            if p_norm < 1e-12:
                break
            p /= p_norm

            # --- aggiorna score t (regressione di E su p) ---
            t_new = np.zeros(n)
            for i in range(n):
                mask = ~np.isnan(E[i, :])
                if mask.sum() < 1:
                    t_new[i] = 0.0
                else:
                    p_m = p[mask]
                    denom = p_m @ p_m
                    if denom > 1e-12:
                        t_new[i] = (E[i, mask] @ p_m) / denom

            # --- check convergenza ---
            delta = np.linalg.norm(p - p_old)
            p_old = p.copy()
            t     = t_new

            if delta < self.tol:
                converged = True
                break

        return t, p, iteration + 1, converged

    # ------------------------------------------------------------------
    # FIT
    # ------------------------------------------------------------------

    def fit(self, X):
        """
        Addestra il modello PCA sui dati X (matrice calibrazione).

        Parametri
        ----------
        X : ndarray o DataFrame (n_samples, n_features)
            Dati grezzi non scalati. Possono contenere NaN.
        """
        import pandas as pd
        if isinstance(X, pd.DataFrame):
            X = X.values.astype(float)
        else:
            X = np.array(X, dtype=float)

        self._compute_scale(X)
        X_scaled = self._apply_scale(X)

        n, m = X_scaled.shape
        n_comp = min(self.n_components, n, m)

        T          = np.zeros((n, n_comp))
        P          = np.zeros((m, n_comp))
        eigenvalues = np.zeros(n_comp)
        n_iter_    = []
        converged_ = []

        E = X_scaled.copy()

        for a in range(n_comp):
            t, p, nit, conv = self._nipals_one_component(E)

            T[:, a] = t
            P[:, a] = p
            eigenvalues[a] = np.nansum(t**2)
            n_iter_.append(nit)
            converged_.append(conv)

            # Deflazione: rimuovi la varianza spiegata da questa PC
            E = E - np.outer(t, p)

        total_var = np.nansum(X_scaled**2)
        self.T                        = T
        self.P                        = P
        self.eigenvalues              = eigenvalues
        self.explained_variance_ratio_ = eigenvalues / total_var if total_var > 0 else eigenvalues
        self.n_iter_                  = n_iter_
        self.converged_               = converged_
        self.n_components_fitted_     = n_comp
        self._X_scaled                = X_scaled
        self._total_var               = total_var

        return self

    # ------------------------------------------------------------------
    # TRANSFORM & INVERSE
    # ------------------------------------------------------------------

    def transform(self, X, n_components=None):
        """
        Proietta nuovi dati X nello spazio delle PC.
        Usa scaling e loadings del modello di calibrazione.
        Supporta NaN tramite imputazione locale per riga.

        Parametri
        ----------
        X : ndarray o DataFrame
        n_components : int, opzionale. Default = tutti quelli fittati.

        Ritorna
        -------
        T_new : ndarray (n_samples, n_components)
        """
        import pandas as pd
        if isinstance(X, pd.DataFrame):
            X = X.values.astype(float)
        else:
            X = np.array(X, dtype=float)

        X_scaled = self._apply_scale(X)
        n_comp   = n_components or self.n_components_fitted_
        P_used   = self.P[:, :n_comp]

        T_new = np.zeros((X_scaled.shape[0], n_comp))
        for i in range(X_scaled.shape[0]):
            mask = ~np.isnan(X_scaled[i, :])
            if mask.sum() < 1:
                continue
            T_new[i, :] = X_scaled[i, mask] @ P_used[mask, :]

        return T_new

    def inverse_transform(self, T, n_components=None):
        """
        Ricostruisce X dallo spazio delle PC (spazio originale, non scalato).
        """
        n_comp   = n_components or self.n_components_fitted_
        T_used   = T[:, :n_comp]
        P_used   = self.P[:, :n_comp]
        X_scaled = T_used @ P_used.T
        return self._inverse_scale(X_scaled)

    # ------------------------------------------------------------------
    # RESIDUI: Q (SPE) e T²
    # ------------------------------------------------------------------

    def compute_Q(self, X, n_components=None):
        """
        Calcola Q (Squared Prediction Error / SPE) per ogni osservazione.
        Q_i = somma dei quadrati dei residui nella riga i.

        Ritorna
        -------
        Q : ndarray (n_samples,)
        E : ndarray (n_samples, n_features)  — matrice residua scalata
        """
        import pandas as pd
        if isinstance(X, pd.DataFrame):
            X = X.values.astype(float)

        X_scaled = self._apply_scale(X)
        T_new    = self.transform(X, n_components)
        n_comp   = n_components or self.n_components_fitted_
        X_hat    = T_new @ self.P[:, :n_comp].T
        E        = X_scaled - X_hat
        Q        = np.nansum(E**2, axis=1)
        return Q, E

    def compute_T2(self, X, n_components=None):
        """
        Calcola T² (Hotelling) per ogni osservazione.
        T²_i = t_i' * Lambda^{-1} * t_i
        dove Lambda è la matrice diagonale degli eigenvalues.

        Ritorna
        -------
        T2 : ndarray (n_samples,)
        """
        T_new  = self.transform(X, n_components)
        n_comp = n_components or self.n_components_fitted_
        lam    = self.eigenvalues[:n_comp]
        lam    = np.where(lam > 1e-12, lam, 1e-12)
        T2     = np.sum((T_new**2) / lam, axis=1)
        return T2

    # ------------------------------------------------------------------
    # LIMITI DI CONFIDENZA
    # ------------------------------------------------------------------

    def T2_limit(self, n_components=None, alpha=0.05, n_cal=None):
        """
        Limite di confidenza per T² basato sulla distribuzione F.
        Limite = A(n-1)(n+1) / (n(n-A)) * F(alpha, A, n-A)
        dove A = numero di PC, n = osservazioni di calibrazione.

        Ritorna
        -------
        limit : float
        """
        from scipy import stats
        n_comp = n_components or self.n_components_fitted_
        n      = n_cal or self.T.shape[0]
        A      = n_comp
        F_crit = stats.f.ppf(1 - alpha, A, n - A)
        limit  = (A * (n - 1) * (n + 1)) / (n * (n - A)) * F_crit
        return limit

    def Q_limit(self, n_components=None, alpha=0.05):
        """
        Limite di confidenza per Q basato sull'approssimazione di Jackson-Mudholkar.

        Ritorna
        -------
        limit : float
        """
        from scipy import stats
        n_comp = n_components or self.n_components_fitted_

        # Eigenvalues delle PC NON estratte (residue)
        all_eig   = self.eigenvalues
        res_eig   = all_eig[n_comp:] if len(all_eig) > n_comp else np.array([1e-6])

        theta1 = np.sum(res_eig)
        theta2 = np.sum(res_eig**2)
        theta3 = np.sum(res_eig**3)

        if theta1 < 1e-12 or theta2 < 1e-12:
            return 0.0

        h0  = 1 - (2 * theta1 * theta3) / (3 * theta2**2)
        z_a = stats.norm.ppf(1 - alpha)

        if h0 > 0:
            limit = theta1 * (
                z_a * np.sqrt(2 * theta2 * h0**2) / theta1
                + 1
                + theta2 * h0 * (h0 - 1) / theta1**2
            ) ** (1 / h0)
        else:
            limit = theta1 * np.exp(z_a * np.sqrt(2 * theta2) / theta1)

        return float(limit)

    # ------------------------------------------------------------------
    # CONTRIBUTION PLOTS
    # ------------------------------------------------------------------

    def contributions_T2(self, X, n_components=None):
        """
        Contribution plot per T²: contributo di ogni variabile all'indice T².
        contrib_{i,j} = (t_{i,a} * p_{j,a})^2 / lambda_a  summed over a

        Ritorna
        -------
        contrib : ndarray (n_samples, n_features)
        """
        T_new  = self.transform(X, n_components)
        n_comp = n_components or self.n_components_fitted_
        lam    = self.eigenvalues[:n_comp]
        lam    = np.where(lam > 1e-12, lam, 1e-12)
        P_used = self.P[:, :n_comp]

        contrib = np.zeros((T_new.shape[0], P_used.shape[0]))
        for a in range(n_comp):
            outer = np.outer(T_new[:, a], P_used[:, a])
            contrib += outer**2 / lam[a]
        return contrib

    def contributions_Q(self, X, n_components=None):
        """
        Contribution plot per Q: il residuo quadratico per ogni variabile.
        contrib_{i,j} = e_{i,j}^2

        Ritorna
        -------
        contrib : ndarray (n_samples, n_features)
        E       : ndarray (n_samples, n_features)
        """
        _, E = self.compute_Q(X, n_components)
        return E**2, E

    # ------------------------------------------------------------------
    # RMSECV — selezione numero ottimale di PC
    # ------------------------------------------------------------------

    def rmsecv(self, X, max_components=None, cv_folds=5):
        """
        Calcola RMSECV (Root Mean Squared Error di Cross-Validation)
        per ogni numero di PC da 1 a max_components.
        Usa k-fold CV: per ogni fold, fitta il modello sui dati di training
        e calcola l'errore di ricostruzione sul validation set.

        Parametri
        ----------
        X            : ndarray o DataFrame — dati calibrazione (non scalati)
        max_components : int — numero massimo di PC da testare
        cv_folds     : int — numero di fold (default 5)

        Ritorna
        -------
        rmsecv_values : ndarray (max_components,) — RMSECV per ogni numero di PC
        optimal_nc    : int — numero di PC suggerito (minimo RMSECV)
        """
        import pandas as pd
        if isinstance(X, pd.DataFrame):
            X = X.values.astype(float)
        else:
            X = np.array(X, dtype=float)

        n, m       = X.shape
        max_comp   = max_components or min(self.n_components, n - 1, m)
        fold_size  = n // cv_folds
        rmsecv_val = np.zeros(max_comp)

        for a in range(1, max_comp + 1):
            errors = []
            for k in range(cv_folds):
                # Definisci indici train/validation
                val_start = k * fold_size
                val_end   = val_start + fold_size if k < cv_folds - 1 else n
                val_idx   = np.arange(val_start, val_end)
                trn_idx   = np.concatenate([np.arange(0, val_start),
                                             np.arange(val_end, n)])

                X_trn = X[trn_idx, :]
                X_val = X[val_idx, :]

                # Fitta modello ridotto sul training fold
                model_cv = NIPALS(n_components=a,
                                   max_iter=self.max_iter,
                                   tol=self.tol,
                                   scale=self.scale)
                try:
                    model_cv.fit(X_trn)
                    X_val_rec = model_cv.inverse_transform(
                        model_cv.transform(X_val, a), a
                    )
                    mse = np.nanmean((X_val - X_val_rec)**2)
                    errors.append(np.sqrt(mse))
                except Exception:
                    errors.append(np.nan)

            rmsecv_val[a - 1] = np.nanmean(errors)

        # Numero ottimale = minimo RMSECV
        optimal_nc = int(np.nanargmin(rmsecv_val)) + 1

        return rmsecv_val, optimal_nc

    # ------------------------------------------------------------------
    # UTILITÀ
    # ------------------------------------------------------------------

    def summary(self, n_components=None):
        """Stampa un riepilogo del modello."""
        n_comp = n_components or self.n_components_fitted_
        print(f"\n{'='*50}")
        print(f"  NIPALS PCA — riepilogo modello")
        print(f"{'='*50}")
        print(f"  Scaling        : {self.scale}")
        print(f"  PC estratte    : {n_comp}")
        print(f"  Osservazioni   : {self.T.shape[0]}")
        print(f"  Variabili      : {self.P.shape[0]}")
        print(f"\n  {'PC':>4}  {'Eigenvalue':>12}  {'Var%':>8}  {'Cum%':>8}  {'Iter':>6}  {'Conv':>6}")
        print(f"  {'-'*52}")
        cum = 0.0
        for a in range(n_comp):
            ev  = self.eigenvalues[a]
            var = self.explained_variance_ratio_[a] * 100
            cum += var
            conv = "SI" if self.converged_[a] else "NO"
            print(f"  {a+1:>4}  {ev:>12.4f}  {var:>7.2f}%  {cum:>7.2f}%  "
                  f"{self.n_iter_[a]:>6}  {conv:>6}")
        print(f"{'='*50}\n")
