import Serpent from "./serpent/Serpent.js";
import SerpentAI from "./serpent/Serpent_ai.js";
import ItemManager from "./manager/ItemManager.js";
import InputManager from "./manager/InputManager.js";
import ScoreManager from "./manager/ScoreManager.js";
import UIManager from "./manager/UIManager.js";
import SpawnSystem from "./logic/SpawnSystem.js";
import CollisionSystem from "./logic/CollisionSystem.js";
import {
  COLORS,
  TAILLE_CELLULE,
  CSS_SIZE,
  GAME_CONFIG,
  NB_CELLS,
} from "../constants.js";

/**
 * Orchestrateur central de Slither Arena.
 * Gère le cycle de vie du jeu et coordonne les systèmes modulaires.
 */
export default class GameEngine {
  /**
   * Initialise le moteur de jeu avec le canvas spécifié.
   * @param {HTMLCanvasElement} canvas - Le canvas de jeu.
   */
  constructor(canvas) {
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext("2d");

    // Systèmes
    /** @type {UIManager} */
    this.ui = new UIManager();
    /** @type {ItemManager} */
    this.itemManager = new ItemManager(NB_CELLS);
    /** @type {InputManager} */
    this.inputManager = new InputManager();
    /** @type {ScoreManager} */
    this.scoreManager = new ScoreManager();
    /** @type {SpawnSystem} */
    this.spawnSystem = new SpawnSystem(this.itemManager);
    /** @type {CollisionSystem} */
    this.collisionSystem = new CollisionSystem(this.itemManager, this.ui);

    // État
    /** @type {Serpent[]} Liste des serpents actifs (joueur + IAs) */
    this.serpents = [];
    /** @type {Serpent|null} Référence vers le serpent du joueur */
    this.joueur = null;
    /** @type {number} Score actuel de la partie */
    this.score = 0;
    /** @type {number} Vitesse actuelle du jeu (Frames Per Second) */
    this.fps = GAME_CONFIG.FPS_INITIAL;
    /** @type {boolean} Indique si une partie est en cours */
    this.gameRunning = false;
    /** @type {boolean} Indique si le jeu est en pause */
    this.isPaused = false;
    /** @type {number} Timestamp du dernier mouvement effectué */
    this.lastMoveTime = 0;
    /** @type {number} Intervalle cible entre deux mouvements (ms) */
    this.MOVE_INTERVAL = 1000 / this.fps;
    /** @type {number|null} ID de l'animation frame en cours */
    this.animationFrameId = null;

    this._initEvents();
  }

  /**
   * Initialise l'ensemble des écouteurs d'événements du jeu.
   * @private
   */
  _initEvents() {
    this._initUIEvents();
    this._initKeyboardEvents();
    this._initMobileControls();
  }

  /**
   * Configure les événements liés à l'interface utilisateur (boutons, overlays).
   * @private
   */
  _initUIEvents() {
    // Bouton Action Principal (Démarrer / Continuer)
    this.ui.menuActionBtn.addEventListener("click", () => {
      if (this.isPaused) this.togglePause();
      else {
        this.ui.hideMenu();
        this.startGame();
      }
    });

    // Bouton de redémarrage
    this.ui.menuRestartBtn.addEventListener("click", () => {
      this.ui.hideMenu();
      this.startGame();
    });

    // Boutons d'info et de classement
    document
      .getElementById("info-btn")
      ?.addEventListener("click", () => this.ui.showInfo());
    document
      .getElementById("leaderboard-btn")
      ?.addEventListener("click", () => this.scoreManager.show());

    // Fermeture du scoreboard
    document
      .getElementById("scoreboard-close")
      ?.addEventListener("click", () => this.scoreManager.hide());
    document
      .getElementById("scoreboard-clear")
      ?.addEventListener("click", () => this.scoreManager.clearScores());
    document
      .getElementById("scoreboard-overlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "scoreboard-overlay") this.scoreManager.hide();
      });

    // Bouton Debug
    this.ui.menuDebugBtn.addEventListener("click", () => {
      GAME_CONFIG.DEBUG_MODE = !GAME_CONFIG.DEBUG_MODE;
      this.ui.updateDebugButton(GAME_CONFIG.DEBUG_MODE);
      if (GAME_CONFIG.DEBUG_MODE) {
        console.log(
          `%c[SYSTEM] Mode Debug : ACTIVÉ`,
          "color: #3b82f6; font-weight: bold;",
        );
      }
    });

    // Modaux de confirmation
    this.ui.confirmYesBtn.addEventListener("click", () => {
      this.ui.hideConfirm();
      this.ui.hideMenu();
      this.startGame();
    });

    this.ui.confirmNoBtn.addEventListener("click", () => this.ui.hideConfirm());
    this.ui.infoCloseBtn.addEventListener("click", () => this.ui.hideInfo());

    // Fermeture des overlays par clic extérieur
    this.ui.confirmOverlay.addEventListener("click", (e) => {
      if (e.target.id === "confirm-modal") this.ui.hideConfirm();
    });
    this.ui.infoOverlay.addEventListener("click", (e) => {
      if (e.target.id === "info-modal") this.ui.hideInfo();
    });
  }

  /**
   * Configure les raccourcis clavier globaux.
   * @private
   */
  _initKeyboardEvents() {
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      // Pause (P)
      if (key === "p" && this.gameRunning) {
        this.togglePause();
      }

      // Info (I)
      if (key === "i") {
        this.ui.showInfo();
      }

      // Recommencer (R)
      if (key === "r") {
        if (this.gameRunning && !this.isPaused) {
          this.ui.showConfirm();
        } else if (this.ui.isMenuVisible() || !this.gameRunning) {
          this.ui.hideMenu();
          this.startGame();
        }
      }
    });
  }

  /**
   * Configure les contrôles tactiles pour mobile (D-Pad).
   * @private
   */
  _initMobileControls() {
    /**
     * Helper pour configurer un bouton de contrôle mobile.
     * @param {string} id - L'ID HTML du bouton.
     * @param {number} dir - La direction associée (0-3).
     */
    const setupMobileBtn = (id, dir) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const addActive = () => btn.classList.add("is-active");
      const removeActive = () => btn.classList.remove("is-active");

      btn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          addActive();
          this.inputManager.addDirection(dir);
        },
        { passive: false },
      );

      btn.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault();
          removeActive();
        },
        { passive: false },
      );

      btn.addEventListener("touchcancel", removeActive);

      // Fallback Souris
      btn.addEventListener("mousedown", addActive);
      btn.addEventListener("mouseup", removeActive);
      btn.addEventListener("mouseleave", removeActive);
      btn.addEventListener("click", () => this.inputManager.addDirection(dir));
    };

    setupMobileBtn("btn-up", 0);
    setupMobileBtn("btn-right", 1);
    setupMobileBtn("btn-down", 2);
    setupMobileBtn("btn-left", 3);
  }

  /**
   * Bascule l'état de pause du jeu.
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.ui.showMenu({
        title: "PAUSE",
        subtitle: "Le jeu est en pause",
        showScore: true,
        score: this.score,
        btnText: "Continuer",
        showRestart: true,
        showDebug: true,
      });
    } else {
      this.ui.hideMenu();
      this.lastMoveTime = 0; // Reset pour éviter un saut brutal après la pause
    }
  }

  /**
   * Démarre une nouvelle partie.
   * Réinitialise le score, la vitesse, le terrain et spawn le serpent du joueur.
   */
  startGame() {
    if (GAME_CONFIG.DEBUG_MODE) {
      console.info(
        "%c[GAME] Démarrage d'une nouvelle partie",
        "color: #10b981; font-weight: bold;",
      );
    }

    this.score = 0;
    this.fps = GAME_CONFIG.FPS_INITIAL;
    this.MOVE_INTERVAL = 1000 / this.fps;
    this.ui.updateHUD(this.score, this.fps);
    this.itemManager.reset();
    this.inputManager.reset();

    // Initialisation du joueur (position centrale approximative)
    this.serpents = [new Serpent(2, 15, 15, 1)];
    this.joueur = this.serpents[0];
    this.spawnSystem.spawnInitialItems(this.serpents);

    this.gameRunning = true;
    this.isPaused = false;
    this.lastMoveTime = 0;

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Arrête le jeu et affiche l'écran de fin.
   * @param {string} message - Raison de la fin de partie (ex: "Collision !").
   */
  gameOver(message) {
    if (GAME_CONFIG.DEBUG_MODE) {
      console.warn(
        `%c[GAME OVER] ${message} | Score final: ${this.score}`,
        "color: #f43f5e; font-weight: bold;",
      );
    }

    this.gameRunning = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    if (this.score > 0) {
      this.scoreManager.saveScore(this.score);
    }

    this.ui.showMenu({
      title: "Game Over",
      subtitle: message,
      showScore: true,
      score: this.score,
      btnText: "Rejouer",
    });
  }

  /**
   * Mise à jour de la logique de jeu à chaque cycle.
   * Gère les entrées, les mouvements, les collisions et les apparitions.
   * @param {number} timestamp - Temps de jeu en millisecondes.
   */
  updateLogic(timestamp) {
    if (this.isPaused) return;

    // 1. INPUTS : Lecture de la prochaine direction demandée
    const nextDir = this.inputManager.getNextDirection(this.joueur.direction);
    if (nextDir !== null) this.joueur.direction = nextDir;

    // 2. MOUVEMENTS & COLLISIONS FATALES
    for (const s of this.serpents) {
      if (s instanceof SerpentAI) {
        s.move(this.itemManager.items, this.serpents);
      } else {
        s.move();
      }

      const collisionFound = this.collisionSystem.checkFatalCollisions(
        s,
        this.serpents,
        (msg) => this.gameOver(msg),
      );

      if (collisionFound) return;
    }

    // 3. COLLECTE D'ITEMS
    const scoreState = { score: this.score };
    this.serpents.forEach((s) => {
      this.collisionSystem.handleItemCollection(
        s,
        this.joueur,
        this.itemManager,
        scoreState,
        timestamp,
      );
    });

    // 4. SYNCHRONISATION DU SCORE ET DIFFICULTÉ
    if (scoreState.score !== this.score) {
      this._updateDifficulty(scoreState.score);
    }

    // 5. SPAWNS D'IA : Gestion de l'apparition des adversaires
    this._handleAISpawns(timestamp);

    // 6. NETTOYAGE : Suppression des IA mortes
    this.serpents = this.serpents.filter((s) => !s.dead || s === this.joueur);
  }

  /**
   * Met à jour le score et augmente progressivement la vitesse de jeu.
   * @param {number} newScore - Le nouveau score atteint.
   * @private
   */
  _updateDifficulty(newScore) {
    this.score = newScore;
    this.fps = Math.min(
      GAME_CONFIG.FPS_MAX,
      GAME_CONFIG.FPS_INITIAL +
        Math.floor(this.score / GAME_CONFIG.SCORE_FOR_SPEED_INCREASE),
    );
    this.MOVE_INTERVAL = 1000 / this.fps;
    this.ui.updateHUD(this.score, this.fps);

    if (GAME_CONFIG.DEBUG_MODE) {
      console.log(`IA: Score MAJ -> ${this.score} | FPS -> ${this.fps}`);
    }
  }

  /**
   * Gère la logique d'apparition des serpents IA.
   * @param {number} timestamp - Le temps actuel.
   * @private
   */
  _handleAISpawns(timestamp) {
    const shouldSpawnIA =
      this.score > 0 &&
      this.score % GAME_CONFIG.AI_SPAWN_SCORE_INTERVAL === 0 &&
      this._lastAISpawnScore !== this.score;

    if (shouldSpawnIA) {
      if (GAME_CONFIG.DEBUG_MODE) {
        console.log("%c[SPAWN] Nouvelle IA générée !", "color: #fbbf24;");
      }
      this.spawnSystem.spawnNewAI(this.serpents);
      this._lastAISpawnScore = this.score;
    }

    this.spawnSystem.checkSpawns(this.score, this.serpents, timestamp);
  }

  /**
   * Effectue le rendu graphique complet du jeu.
   */
  drawAll() {
    this.ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);

    // Grille de fond
    this.ctx.fillStyle = COLORS.canvasGrid;
    for (let x = 0; x <= CSS_SIZE; x += TAILLE_CELLULE) {
      for (let y = 0; y <= CSS_SIZE; y += TAILLE_CELLULE) {
        this.ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    // Objets et Serpents
    this.itemManager.updateAndDraw(this.ctx, Date.now());
    this.serpents.forEach((s) => {
      if (!s.dead) s.draw(this.ctx, TAILLE_CELLULE);
    });
  }

  /**
   * Boucle de jeu principale pilotée par requestAnimationFrame.
   * @param {number} timestamp - Temps écoulé.
   */
  gameLoop(timestamp) {
    if (!this.gameRunning) return;

    if (!this.isPaused) {
      if (!this.lastMoveTime) this.lastMoveTime = timestamp;
      const deltaTime = timestamp - this.lastMoveTime;

      // Protection contre les changements d'onglets (deltaTime trop large)
      if (deltaTime > 1000) {
        this.lastMoveTime = timestamp;
      } else if (deltaTime >= this.MOVE_INTERVAL) {
        this.updateLogic(timestamp);
        this.lastMoveTime = timestamp;
      }
    }

    this.drawAll();
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }
}
