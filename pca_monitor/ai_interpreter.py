"""
ai_interpreter.py
Interpretazione AI dei risultati PCA — contestuale e trasversale.
Supporta due backend:
  - Gemini (default, integrato in Google Colab — gratuito)
  - Claude API (Anthropic — opzionale, richiede API key)

L'interpreter riceve il contesto reale del modello (dati numerici,
tipo processo, sezione corrente, anomalie rilevate) e genera
interpretazioni basate esclusivamente su quelli — non su generalità.
Mantiene memoria della conversazione nella sessione.
"""

import os
from typing import Optional, List, Dict, Any


# ------------------------------------------------------------------
# CONTEXT BUILDER
# costruisce il contesto dinamico da iniettare nel system prompt
# ------------------------------------------------------------------

class PCAContext:
    """
    Raccoglie e formatta il contesto corrente del modello PCA.
    Va aggiornato man mano che l'utente avanza nelle sezioni.
    """

    def __init__(self):
        self.reset()

    def reset(self):
        self.process_type    = None   # 'continuous' | 'batch'
        self.section         = None   # 'loading', 'model', 'diagnostics', ecc.
        self.n_samples       = None
        self.n_vars          = None
        self.var_names       = []
        self.n_components    = None
        self.explained_var   = []     # lista % varianza per PC
        self.cumulative_var  = None   # % cumulativa
        self.rmsecv_values   = []
        self.optimal_nc_rmsecv = None
        self.scale_method    = None
        self.alpha           = 0.05
        self.T2_limit        = None
        self.Q_limit         = None
        self.anomaly_summary = {}     # output di find_anomalies()
        self.top_contributors= {}     # {obs_id: {T2: [...], Q: [...]}}
        self.batch_details   = {}     # output anomaly_details per batch
        self.online_summary  = None   # output BatchOnlineMonitor.summary_report()
        self.extra_notes     = []     # note libere aggiuntive

    def update(self, **kwargs):
        """Aggiorna i campi del contesto."""
        for k, v in kwargs.items():
            if hasattr(self, k):
                setattr(self, k, v)
            else:
                self.extra_notes.append(f"{k}: {v}")

    def build_system_prompt(self) -> str:
        """
        Genera il system prompt dinamico con il contesto reale.
        Questo è ciò che l'AI vede come istruzioni di base.
        """
        lines = [
            "Sei un esperto di analisi statistica multivariata (PCA) e process monitoring industriale.",
            "Hai accesso ai risultati numerici reali dell'analisi corrente.",
            "Rispondi SOLO sulla base dei dati che ti vengono forniti.",
            "Se qualcosa non è nei dati, dillo esplicitamente invece di inventare.",
            "Usa un linguaggio tecnico ma chiaro. Sii conciso e diretto.",
            "",
            "=== CONTESTO ANALISI CORRENTE ===",
        ]

        if self.process_type:
            lines.append(f"Tipo processo     : {self.process_type}")
        if self.section:
            lines.append(f"Sezione corrente  : {self.section}")
        if self.n_samples:
            lines.append(f"Osservazioni      : {self.n_samples}")
        if self.n_vars:
            lines.append(f"Variabili         : {self.n_vars}")
        if self.var_names:
            lines.append(f"Nomi variabili    : {', '.join(self.var_names)}")
        if self.scale_method:
            lines.append(f"Scaling           : {self.scale_method}")
        if self.n_components:
            lines.append(f"PC selezionate    : {self.n_components}")
        if self.optimal_nc_rmsecv:
            lines.append(f"PC ottimali (RMSECV): {self.optimal_nc_rmsecv}")
        if self.explained_var:
            var_str = ", ".join([f"PC{i+1}={v:.1f}%" for i, v in
                                  enumerate(self.explained_var)])
            lines.append(f"Varianza spiegata : {var_str}")
        if self.cumulative_var:
            lines.append(f"Varianza cumulativa: {self.cumulative_var:.1f}%")
        if self.rmsecv_values:
            rv = ", ".join([f"{v:.4f}" for v in self.rmsecv_values])
            lines.append(f"RMSECV per PC     : [{rv}]")
        if self.alpha:
            lines.append(f"Livello alpha     : {self.alpha} ({int((1-self.alpha)*100)}% confidenza)")
        if self.T2_limit:
            lines.append(f"Limite T²         : {self.T2_limit:.4f}")
        if self.Q_limit:
            lines.append(f"Limite Q          : {self.Q_limit:.4f}")

        if self.anomaly_summary:
            a = self.anomaly_summary
            lines.append(f"Anomalie totali   : {a.get('n_any', '?')}")
            lines.append(f"  Solo T²         : {a.get('only_T2', [])}")
            lines.append(f"  Solo Q          : {a.get('only_Q', [])}")
            lines.append(f"  Entrambi        : {a.get('both', [])}")

        if self.top_contributors:
            lines.append("Top variabili anomale:")
            for obs, detail in self.top_contributors.items():
                lines.append(f"  Obs {obs} — T²: {detail.get('T2', [])}, "
                              f"Q: {detail.get('Q', [])}")

        if self.batch_details:
            lines.append("Dettaglio batch anomali:")
            for bid, detail in self.batch_details.items():
                lines.append(f"  Batch {bid}:")
                for var, times in detail.get("times_T2", {}).items():
                    lines.append(f"    {var} anomalo in T² agli istanti: {times}")
                for var, times in detail.get("times_Q", {}).items():
                    lines.append(f"    {var} anomalo in Q agli istanti: {times}")

        if self.online_summary:
            lines.append(f"Monitoraggio on-line:\n{self.online_summary}")

        if self.extra_notes:
            lines.append("Note aggiuntive:")
            for note in self.extra_notes:
                lines.append(f"  {note}")

        lines.append("")
        lines.append("Rispondi sempre in italiano a meno che l'utente non scriva in un'altra lingua.")

        return "\n".join(lines)


# ------------------------------------------------------------------
# GEMINI BACKEND (default su Colab)
# ------------------------------------------------------------------

class GeminiInterpreter:
    """
    Interprete AI basato su Google Gemini.
    Funziona nativamente su Google Colab senza API key aggiuntiva.

    Uso:
        from pca_monitor.ai_interpreter import GeminiInterpreter, PCAContext
        ctx = PCAContext()
        ctx.update(process_type='continuous', n_components=3, ...)
        ai  = GeminiInterpreter(context=ctx)
        risposta = ai.ask("Perché PC1 spiega così poca varianza?")
    """

    def __init__(self, context: PCAContext = None,
                 model_name: str = "gemini-1.5-flash"):
        self.context    = context or PCAContext()
        self.model_name = model_name
        self.history: List[Dict] = []
        self._model = None
        self._init_model()

    def _init_model(self):
        """Inizializza il modello Gemini (richiede autenticazione Colab)."""
        try:
            import google.generativeai as genai

            # Su Colab: usa userdata per la API key
            # Alternativa: os.environ["GOOGLE_API_KEY"]
            try:
                from google.colab import userdata
                api_key = userdata.get("GOOGLE_API_KEY")
            except Exception:
                api_key = os.environ.get("GOOGLE_API_KEY", "")

            if not api_key:
                print("⚠️  GOOGLE_API_KEY non trovata.")
                print("   Su Colab: Secrets → aggiungi GOOGLE_API_KEY")
                print("   Poi riavvia il kernel e riprova.")
                return

            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.context.build_system_prompt()
            )
            self._chat = self._model.start_chat(history=[])
            print(f"✓ Gemini ({self.model_name}) inizializzato.")

        except ImportError:
            print("⚠️  google-generativeai non installato.")
            print("   Esegui: pip install google-generativeai")

    def update_context(self, **kwargs):
        """Aggiorna il contesto e reinizializza il modello."""
        self.context.update(**kwargs)
        # Reinizializza con il nuovo system prompt
        if self._model:
            import google.generativeai as genai
            self._model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.context.build_system_prompt()
            )
            self._chat = self._model.start_chat(history=[])

    def ask(self, question: str, verbose: bool = True) -> str:
        """
        Invia una domanda all'AI mantenendo la memoria della conversazione.

        Parametri
        ----------
        question : str — domanda dell'utente
        verbose  : bool — stampa la risposta oltre a restituirla

        Ritorna
        -------
        response : str
        """
        if self._model is None:
            return "⚠️  Modello non inizializzato. Controlla la API key."

        try:
            response = self._chat.send_message(question)
            answer   = response.text
            self.history.append({"role": "user",      "content": question})
            self.history.append({"role": "assistant",  "content": answer})

            if verbose:
                print(f"\n{'='*60}")
                print(f"🤖 AI: {answer}")
                print(f"{'='*60}\n")

            return answer

        except Exception as e:
            error_msg = f"Errore Gemini: {str(e)}"
            print(f"⚠️  {error_msg}")
            return error_msg

    def reset_conversation(self):
        """Resetta la memoria della conversazione (mantiene il contesto)."""
        self.history = []
        if self._model:
            import google.generativeai as genai
            self._chat = self._model.start_chat(history=[])
        print("✓ Conversazione resettata.")


# ------------------------------------------------------------------
# CLAUDE BACKEND (opzionale — richiede Anthropic API key)
# ------------------------------------------------------------------

class ClaudeInterpreter:
    """
    Interprete AI basato su Claude (Anthropic).
    Richiede ANTHROPIC_API_KEY nel secret manager di Colab
    o nella variabile d'ambiente.

    Uso:
        from pca_monitor.ai_interpreter import ClaudeInterpreter, PCAContext
        ctx = PCAContext()
        ctx.update(process_type='batch', n_components=2, ...)
        ai  = ClaudeInterpreter(context=ctx)
        risposta = ai.ask("Cosa indicano i contribution plots del batch_002?")
    """

    def __init__(self, context: PCAContext = None,
                 model_name: str = "claude-haiku-4-5-20251001"):
        self.context    = context or PCAContext()
        self.model_name = model_name
        self.history: List[Dict] = []
        self._client = None
        self._init_client()

    def _init_client(self):
        try:
            import anthropic

            try:
                from google.colab import userdata
                api_key = userdata.get("ANTHROPIC_API_KEY")
            except Exception:
                api_key = os.environ.get("ANTHROPIC_API_KEY", "")

            if not api_key:
                print("⚠️  ANTHROPIC_API_KEY non trovata.")
                print("   Su Colab: Secrets → aggiungi ANTHROPIC_API_KEY")
                return

            self._client = anthropic.Anthropic(api_key=api_key)
            print(f"✓ Claude ({self.model_name}) inizializzato.")

        except ImportError:
            print("⚠️  anthropic non installato.")
            print("   Esegui: pip install anthropic")

    def update_context(self, **kwargs):
        """Aggiorna il contesto del modello."""
        self.context.update(**kwargs)

    def ask(self, question: str, verbose: bool = True) -> str:
        """
        Invia una domanda a Claude mantenendo la memoria della conversazione.
        """
        if self._client is None:
            return "⚠️  Client non inizializzato. Controlla la API key."

        try:
            # Costruisce la history nel formato Anthropic
            messages = []
            for h in self.history:
                messages.append({
                    "role":    h["role"],
                    "content": h["content"]
                })
            messages.append({"role": "user", "content": question})

            response = self._client.messages.create(
                model       = self.model_name,
                max_tokens  = 1024,
                system      = self.context.build_system_prompt(),
                messages    = messages,
            )

            answer = response.content[0].text
            self.history.append({"role": "user",      "content": question})
            self.history.append({"role": "assistant",  "content": answer})

            if verbose:
                print(f"\n{'='*60}")
                print(f"🤖 AI: {answer}")
                print(f"{'='*60}\n")

            return answer

        except Exception as e:
            error_msg = f"Errore Claude: {str(e)}"
            print(f"⚠️  {error_msg}")
            return error_msg

    def reset_conversation(self):
        """Resetta la memoria della conversazione."""
        self.history = []
        print("✓ Conversazione resettata.")


# ------------------------------------------------------------------
# FACTORY — sceglie il backend automaticamente
# ------------------------------------------------------------------

def create_interpreter(context: PCAContext = None,
                        backend: str = "auto",
                        **kwargs) -> Any:
    """
    Crea l'interprete AI scegliendo il backend disponibile.

    Parametri
    ----------
    backend : 'auto' | 'gemini' | 'claude'
        'auto' — prova Gemini, se non disponibile prova Claude
    **kwargs : argomenti aggiuntivi passati al costruttore

    Ritorna
    -------
    interprete : GeminiInterpreter | ClaudeInterpreter
    """
    ctx = context or PCAContext()

    if backend == "gemini":
        return GeminiInterpreter(context=ctx, **kwargs)

    elif backend == "claude":
        return ClaudeInterpreter(context=ctx, **kwargs)

    elif backend == "auto":
        # Prova Gemini prima (gratuito su Colab)
        try:
            from google.colab import userdata
            key = userdata.get("GOOGLE_API_KEY")
            if key:
                return GeminiInterpreter(context=ctx, **kwargs)
        except Exception:
            pass

        # Fallback su Claude
        try:
            from google.colab import userdata
            key = userdata.get("ANTHROPIC_API_KEY")
            if key:
                return ClaudeInterpreter(context=ctx, **kwargs)
        except Exception:
            pass

        print("⚠️  Nessun backend AI disponibile.")
        print("   Aggiungi GOOGLE_API_KEY o ANTHROPIC_API_KEY nei Secrets di Colab.")
        return None

    else:
        raise ValueError(f"Backend non valido: '{backend}'. "
                         f"Scegli tra: auto, gemini, claude")
