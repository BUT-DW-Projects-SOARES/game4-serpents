/**
 * Service de gestion de l'interface utilisateur (HUD, Menus, Modaux).
 * Centralise toutes les manipulations directes du DOM et les mises à jour d'affichage.
 */
export default class UIManager {
  /**
   * Initialise le gestionnaire d'interface et récupère les références du DOM.
   */
  constructor() {
    // HUD Elements
    /** @type {HTMLElement|null} */
    this.scoreValElem = document.getElementById("score-val");
    /** @type {HTMLElement|null} */
    this.speedValElem = document.getElementById("speed-val");

    // Menu Elements
    /** @type {HTMLElement|null} */
    this.menuOverlay = document.getElementById("game-menu-overlay");
    /** @type {HTMLElement|null} */
    this.menuTitle = document.getElementById("menu-title");
    /** @type {HTMLElement|null} */
    this.menuSubtitle = document.getElementById("menu-subtitle");
    /** @type {HTMLElement|null} */
    this.menuScoreDisplay = document.getElementById("menu-score-display");
    /** @type {HTMLElement|null} */
    this.menuScoreVal = document.getElementById("menu-score-val");
    /** @type {HTMLElement|null} */
    this.menuActionBtn = document.getElementById("menu-action-btn");
    /** @type {HTMLElement|null} */
    this.menuRestartBtn = document.getElementById("menu-restart-btn");
    /** @type {HTMLElement|null} */
    this.menuDebugBtn = document.getElementById("menu-debug-btn");

    // Modal Elements
    /** @type {HTMLElement|null} */
    this.confirmOverlay = document.getElementById("confirm-modal");
    /** @type {HTMLElement|null} */
    this.confirmYesBtn = document.getElementById("confirm-yes-btn");
    /** @type {HTMLElement|null} */
    this.confirmNoBtn = document.getElementById("confirm-no-btn");

    /** @type {HTMLElement|null} */
    this.infoOverlay = document.getElementById("info-modal");
    /** @type {HTMLElement|null} */
    this.infoCloseBtn = document.getElementById("info-close");
  }

  /**
   * Met à jour l'affichage des informations en temps réel (HUD).
   * @param {number} score - Score actuel à afficher.
   * @param {number} fps - Multiplicateur de vitesse/difficulté calculé.
   */
  updateHUD(score, fps) {
    if (this.scoreValElem) {
      this.scoreValElem.textContent = score;
    }
    if (this.speedValElem) {
      this.speedValElem.textContent = (fps / 10).toFixed(1) + "x";
    }
  }

  /**
   * Configure et affiche l'overlay du menu (Lancement, Pause, Game Over).
   * @param {Object} options - Options de configuration du menu.
   * @param {string} options.title - Titre principal à afficher.
   * @param {string} options.subtitle - Sous-titre ou message descriptif.
   * @param {boolean} [options.showScore=false] - Affiche ou non le bloc de score.
   * @param {number} [options.score=0] - Valeur du score final à afficher.
   * @param {string} [options.btnText="Rejouer"] - Libellé du bouton principal.
   * @param {boolean} [options.showRestart=false] - Affiche le bouton de redémarrage.
   * @param {boolean} [options.showDebug=false] - Affiche le bouton de debug.
   */
  showMenu({
    title,
    subtitle,
    showScore = false,
    score = 0,
    btnText = "Rejouer",
    showRestart = false,
    showDebug = false,
  }) {
    if (this.menuTitle) this.menuTitle.textContent = title;
    if (this.menuSubtitle) this.menuSubtitle.textContent = subtitle;
    if (this.menuActionBtn) this.menuActionBtn.textContent = btnText;

    // Gestion du score final
    this._toggleElement(this.menuScoreDisplay, showScore);
    if (this.menuScoreVal) this.menuScoreVal.textContent = score;

    // Gestion des boutons optionnels
    this._toggleElement(this.menuDebugBtn, showDebug);
    this._toggleElement(this.menuRestartBtn, showRestart);

    this.menuOverlay?.classList.remove("hidden");
  }

  /**
   * Masque l'overlay du menu.
   */
  hideMenu() {
    this.menuOverlay?.classList.add("hidden");
  }

  /**
   * Détermine si le menu est actuellement à l'écran.
   * @returns {boolean}
   */
  isMenuVisible() {
    return this.menuOverlay
      ? !this.menuOverlay.classList.contains("hidden")
      : false;
  }

  /**
   * Affiche le popup de confirmation (Quitter le jeu).
   */
  showConfirm() {
    this.confirmOverlay?.classList.remove("hidden");
  }

  /**
   * Masque le popup de confirmation.
   */
  hideConfirm() {
    this.confirmOverlay?.classList.add("hidden");
  }

  /**
   * Affiche l'écran d'information (Commandes & Aide).
   */
  showInfo() {
    this.infoOverlay?.classList.remove("hidden");
  }

  /**
   * Masque l'écran d'information.
   */
  hideInfo() {
    this.infoOverlay?.classList.add("hidden");
  }

  /**
   * Met à jour visuellement le bouton de debug dans le menu Pause.
   * @param {boolean} active - État du mode debug.
   */
  updateDebugButton(active) {
    if (!this.menuDebugBtn) return;

    if (active) {
      this.menuDebugBtn.classList.add("active");
      this.menuDebugBtn.textContent = "Debug: ON";
      this.menuDebugBtn.style.backgroundColor = "#10b981"; // Émeraude
    } else {
      this.menuDebugBtn.classList.remove("active");
      this.menuDebugBtn.textContent = "Debug: OFF";
      this.menuDebugBtn.style.backgroundColor = "#ef4444"; // Rose/Rouge
    }
  }

  /**
   * Utilitaire pour afficher/masquer un élément DOM via la classe 'hidden'.
   * @param {HTMLElement|null} element - L'élément cible.
   * @param {boolean} visible - L'état souhaité.
   * @private
   */
  _toggleElement(element, visible) {
    if (!element) return;
    if (visible) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  }
}
