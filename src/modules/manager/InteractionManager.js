/**
 * Gère les interactions utilisateur complexes et lie l'UI au moteur.
 * Centralise les écouteurs d'événements DOM, clavier et tactiles.
 */
export default class InteractionManager {
  /**
   * @param {Object} systems - Références vers les systèmes nécessaires (ui, state, input, etc).
   * @param {Object} callbacks - Fonctions de rappel pour les actions majeures.
   */
  constructor(systems, callbacks) {
    this.ui = systems.ui;
    this.state = systems.state;
    this.input = systems.input;
    this.score = systems.score;

    this.onStart = callbacks.onStart;
    this.onTogglePause = callbacks.onTogglePause;
    this.onRestartRequest = callbacks.onRestartRequest;

    this._initUI();
    this._initKeyboard();
    this._initMobile();
  }

  /**
   * Liaison des boutons de l'interface graphique.
   * @private
   */

  /**
   * Liaison des boutons de l'interface graphique.
   * @private
   */
  _initUI() {
    const bind = (id, fn) =>
      document.getElementById(id)?.addEventListener("click", fn);

    // Menu Principal et Actions de base
    bind("menu-action-btn", () => {
      if (this.state.isPaused) this.onTogglePause();
      else {
        this.ui.hideMenu();
        this.onStart();
      }
    });

    bind("menu-restart-btn", () => {
      this.ui.hideMenu();
      this.onStart();
    });

    // Modales et Overlays
    bind("info-btn", () => this.ui.showInfo());
    bind("info-close", () => this.ui.hideInfo());
    bind("leaderboard-btn", () => this.score.show());
    bind("scoreboard-close", () => this.score.hide());
    bind("scoreboard-clear", () => this.score.clearScores());

    bind("confirm-yes-btn", () => {
      this.ui.hideConfirm();
      this.onStart();
    });
    bind("confirm-no-btn", () => this.ui.hideConfirm());

    // Fermeture par clic sur l'overlay (Pattern récurrent)
    [
      this.ui.confirmOverlay,
      this.ui.infoOverlay,
      document.getElementById("scoreboard-overlay"),
    ].forEach((ov) => {
      ov?.addEventListener("click", (e) => {
        if (e.target === ov)
          ov === this.ui.confirmOverlay
            ? this.ui.hideConfirm()
            : ov === this.ui.infoOverlay
              ? this.ui.hideInfo()
              : this.score.hide();
      });
    });
  }

  /**
   * Centralisation des raccourcis clavier via InputManager.
   * @private
   */
  _initKeyboard() {
    this.input.registerAction(
      "p",
      () => this.state.gameRunning && this.onTogglePause(),
    );
    this.input.registerAction("i", () => this.ui.showInfo());
    this.input.registerAction("r", () => {
      if (this.state.gameRunning && !this.state.isPaused) {
        this.onRestartRequest();
      } else if (this.ui.isMenuVisible() || !this.state.gameRunning) {
        this.ui.hideMenu();
        this.onStart();
      }
    });
  }

  /**
   * Initialisation des contrôles directionnels (D-Pad).
   * @private
   */
  _initMobile() {
    ["up", "right", "down", "left"].forEach((id, dir) => {
      const btn = document.getElementById(`btn-${id}`);
      if (!btn) return;

      const setAct = (active) =>
        btn.classList[active ? "add" : "remove"]("is-active");

      // Evenements tactiles et souris
      ["touchstart", "mousedown"].forEach((evt) =>
        btn.addEventListener(
          evt,
          (e) => {
            if (evt === "touchstart") e.preventDefault();
            setAct(true);
            this.input.addDirection(dir);
          },
          { passive: evt !== "touchstart" },
        ),
      );

      ["touchend", "mouseup", "mouseleave"].forEach((evt) =>
        btn.addEventListener(evt, () => setAct(false)),
      );

      // Click simple comme fallback
      btn.addEventListener("click", () => this.input.addDirection(dir));
    });
  }
}
