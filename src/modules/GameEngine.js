import Serpent from "./serpent/Serpent.js";
import SerpentAI from "./serpent/Serpent_ai.js";
import ItemManager from "./manager/ItemManager.js";
import InputManager from "./manager/InputManager.js";
import ScoreManager from "./manager/ScoreManager.js";
import UIManager from "./manager/UIManager.js";
import SpawnSystem from "./logic/SpawnSystem.js";
import CollisionSystem from "./logic/CollisionSystem.js";
import GameState from "./logic/GameState.js";
import Renderer from "./logic/Renderer.js";
import { GAME_CONFIG, NB_CELLS } from "../constants.js";

/**
 * Orchestrateur central de Slither Arena.
 * Gère le cycle de vie du jeu et coordonne les systèmes modulaires réfacturés.
 */
export default class GameEngine {
  /**
   * Initialise le moteur de jeu.
   * @param {HTMLCanvasElement} canvas - Le canvas de jeu.
   */
  constructor(canvas) {
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext("2d");

    // Systèmes de gestion
    this.state = new GameState();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UIManager();
    this.itemManager = new ItemManager(NB_CELLS);
    this.inputManager = new InputManager();
    this.scoreManager = new ScoreManager();
    this.spawnSystem = new SpawnSystem(this.itemManager);
    this.collisionSystem = new CollisionSystem(this.itemManager, this.ui);

    /** @type {Serpent[]} Liste des serpents actifs */
    this.serpents = [];
    /** @type {Serpent|null} Référence vers le serpent du joueur */
    this.joueur = null;
    /** @type {number|null} ID de l'animation frame */
    this.animationFrameId = null;

    this._initEvents();
  }

  /**
   * Initialise les événements système et UI.
   * @private
   */
  _initEvents() {
    this._initUIEvents();
    this._initKeyboardEvents();
    this._initMobileControls();
  }

  /**
   * Configure les interactions avec l'interface Modulaire.
   * @private
   */
  _initUIEvents() {
    // Action principale (Start/Resume)
    this.ui.menuActionBtn.addEventListener("click", () => {
      if (this.state.isPaused) this.togglePause();
      else {
        this.ui.hideMenu();
        this.startGame();
      }
    });

    // Redémarrage
    this.ui.menuRestartBtn.addEventListener("click", () => {
      this.ui.hideMenu();
      this.startGame();
    });

    // Menus secondaires
    document
      .getElementById("info-btn")
      ?.addEventListener("click", () => this.ui.showInfo());
    document
      .getElementById("leaderboard-btn")
      ?.addEventListener("click", () => this.scoreManager.show());

    // Scoreboard controls
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

    // Mode Debug
    this.ui.menuDebugBtn.addEventListener("click", () => {
      GAME_CONFIG.DEBUG_MODE = !GAME_CONFIG.DEBUG_MODE;
      this.ui.updateDebugButton(GAME_CONFIG.DEBUG_MODE);
    });

    // Confirmations
    this.ui.confirmYesBtn.addEventListener("click", () => {
      this.ui.hideConfirm();
      this.ui.hideMenu();
      this.startGame();
    });
    this.ui.confirmNoBtn.addEventListener("click", () => this.ui.hideConfirm());
    this.ui.infoCloseBtn.addEventListener("click", () => this.ui.hideInfo());

    // Clics extérieurs
    this.ui.confirmOverlay.addEventListener("click", (e) => {
      if (e.target.id === "confirm-modal") this.ui.hideConfirm();
    });
    this.ui.infoOverlay.addEventListener("click", (e) => {
      if (e.target.id === "info-modal") this.ui.hideInfo();
    });
  }

  /**
   * Raccourcis clavier globaux.
   * @private
   */
  _initKeyboardEvents() {
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key === "p" && this.state.gameRunning) this.togglePause();
      if (key === "i") this.ui.showInfo();
      if (key === "r") {
        if (this.state.gameRunning && !this.state.isPaused)
          this.ui.showConfirm();
        else if (this.ui.isMenuVisible() || !this.state.gameRunning) {
          this.ui.hideMenu();
          this.startGame();
        }
      }
    });
  }

  /**
   * Contrôles tactiles (D-Pad).
   * @private
   */
  _initMobileControls() {
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
   * Bascule le statut de pause via le GameState.
   */
  togglePause() {
    this.state.togglePause();
    if (this.state.isPaused) {
      this.ui.showMenu({
        title: "PAUSE",
        subtitle: "Session suspendue",
        showScore: true,
        score: this.state.score,
        btnText: "Reprendre",
        showRestart: true,
        showDebug: true,
      });
    } else {
      this.ui.hideMenu();
    }
  }

  /**
   * Initialise une nouvelle partie propre.
   */
  startGame() {
    this.state.reset();
    this.ui.updateHUD(this.state.score, this.state.fps);
    this.itemManager.reset();
    this.inputManager.reset();

    this.serpents = [new Serpent(2, 15, 15, 1)];
    this.joueur = this.serpents[0];
    this.spawnSystem.spawnInitialItems(this.serpents);

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Arrête la session et enregistre les performances.
   * @param {string} message - Motif du Game Over.
   */
  gameOver(message) {
    this.state.gameRunning = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    if (this.state.score > 0) {
      this.scoreManager.saveScore(this.state.score);
    }

    this.ui.showMenu({
      title: "Fin de Partie",
      subtitle: message,
      showScore: true,
      score: this.state.score,
      btnText: "Réessayer",
      showDebug: true,
    });
  }

  /**
   * Coordonne la logique de mouvement et de collision.
   */
  updateLogic(timestamp) {
    if (this.state.isPaused) return;

    // 1. Inputs
    const nextDir = this.inputManager.getNextDirection(this.joueur.direction);
    if (nextDir !== null) this.joueur.direction = nextDir;

    // 2. Mouvements & Collisions
    for (const s of this.serpents) {
      if (s instanceof SerpentAI) s.move(this.itemManager.items, this.serpents);
      else s.move();

      const dead = this.collisionSystem.checkFatalCollisions(
        s,
        this.serpents,
        (msg) => this.gameOver(msg),
      );
      if (dead) return;
    }

    // 3. Items & Difficulté
    this._processGameplaySystems(timestamp);

    // 4. Console Debugging (Throttled)
    if (GAME_CONFIG.DEBUG_MODE && timestamp % 2000 < this.state.moveInterval) {
      this._logDebugInfo();
    }

    // 5. Nettoyage
    this.serpents = this.serpents.filter((s) => !s.dead || s === this.joueur);
  }

  /**
   * Loggue les détails techniques de la session dans la console.
   * @private
   */
  _logDebugInfo() {
    console.group(
      `%c[DEBUG] Game State @ ${new Date().toLocaleTimeString()}`,
      "color: #3b82f6; font-weight: bold;",
    );
    console.log(
      `Score: ${this.state.score} | FPS: ${this.state.fps.toFixed(1)}`,
    );
    console.log(
      `Entities: ${this.serpents.length} serpents | ${this.itemManager.items.length} items`,
    );

    const aiStates = this.serpents.slice(1).map((s) => {
      let behavior = "Wander";
      if (s.isHunting) behavior = "HUNT";
      else if (s.isRushing) behavior = "RUSH";
      return { pos: `[${s.anneaux[0].i},${s.anneaux[0].j}]`, behavior };
    });

    if (aiStates.length > 0) {
      console.table(aiStates);
    }
    console.groupEnd();
  }

  /**
   * Gère les systèmes secondaires de gameplay (Items, IA, HUD).
   * @private
   */
  _processGameplaySystems(timestamp) {
    const scoreState = { score: this.state.score };
    this.serpents.forEach((s) => {
      this.collisionSystem.handleItemCollection(
        s,
        this.joueur,
        this.itemManager,
        scoreState,
        timestamp,
      );
    });

    // Mise à jour si le score a changé
    if (scoreState.score !== this.state.score) {
      this.state.updateScore(scoreState.score);
      this.ui.updateHUD(this.state.score, this.state.fps);
    }

    // Gestion du spawn des IA
    if (this.state.shouldSpawnAI()) {
      this.spawnSystem.spawnNewAI(this.serpents);
    }
    this.spawnSystem.checkSpawns(this.state.score, this.serpents, timestamp);
  }

  /**
   * Boucle principale cadencée par le GameState.
   * @param {number} timestamp - Temps écoulé.
   */
  gameLoop(timestamp) {
    if (!this.state.gameRunning) return;

    if (!this.state.isPaused) {
      if (!this.state.lastMoveTime) this.state.lastMoveTime = timestamp;
      const deltaTime = timestamp - this.state.lastMoveTime;

      if (deltaTime > 1000) {
        this.state.lastMoveTime = timestamp;
      } else if (deltaTime >= this.state.moveInterval) {
        this.updateLogic(timestamp);
        this.state.lastMoveTime = timestamp;
      }
    }

    this.renderer.render(
      this.state,
      this.itemManager,
      this.serpents,
      timestamp,
    );
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }
}
