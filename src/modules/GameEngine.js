import Serpent from "./serpent/Serpent.js";
import SerpentAI from "./serpent/Serpent_ai.js";
import ItemManager from "./manager/ItemManager.js";
import InputManager from "./manager/InputManager.js";
import ScoreManager from "./manager/ScoreManager.js";
import UIManager from "./manager/UIManager.js";
import InteractionManager from "./manager/InteractionManager.js";
import SpawnSystem from "./logic/SpawnSystem.js";
import CollisionSystem from "./logic/CollisionSystem.js";
import GameState from "./logic/GameState.js";
import Renderer from "./logic/Renderer.js";
import Ticker from "./logic/Ticker.js";
import EntityManager from "./logic/EntityManager.js";
import { GAME_CONFIG, NB_CELLS } from "../constants.js";

/**
 * Orchestrateur central de Slither Arena.
 * Agit comme un contrôleur pur reliant les systèmes spécialisés.
 */
export default class GameEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // 1. Initialisation des Systèmes
    this.state = new GameState();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UIManager();
    this.itemManager = new ItemManager(NB_CELLS);
    this.input = new InputManager();
    this.score = new ScoreManager();
    this.entities = new EntityManager();
    this.spawnSystem = new SpawnSystem(this.itemManager);
    this.collisionSystem = new CollisionSystem(this.itemManager, this.ui);

    // 2. Gestion de la Boucle (Callbacks)
    this.ticker = new Ticker(
      (t) => this.updateLogic(t),
      (t) =>
        this.renderer.render(
          this.state,
          this.itemManager,
          this.entities.serpents,
          t,
        ),
    );
    this.ticker.setGetIntervalMethod(() => this.state.moveInterval);

    // 3. Liaison des Interactions (Callbacks)
    this.interactions = new InteractionManager(
      { ui: this.ui, state: this.state, input: this.input, score: this.score },
      {
        onStart: () => this.startGame(),
        onTogglePause: () => this.togglePause(),
        onRestartRequest: () => this.ui.showConfirm(),
      },
    );
  }

  /**
   * Démarre une nouvelle session de jeu propre.
   */
  startGame() {
    this.state.reset();
    this.itemManager.reset();
    this.input.reset();
    this.entities.init(new Serpent(2, 15, 15, 1));

    this.ui.updateHUD(this.state.score, this.state.fps);
    this.spawnSystem.spawnInitialItems(this.entities.serpents);

    this.ticker.start();
  }

  /**
   * Gère la mise en pause via le Ticker et l'UI.
   */
  togglePause() {
    this.state.togglePause();
    if (this.state.isPaused) {
      this.ticker.pause();
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
      this.ticker.resume();
      this.ui.hideMenu();
    }
  }

  /**
   * Fin de partie : arrêt de la boucle et sauvegarde du score.
   */
  gameOver(message) {
    this.state.gameRunning = false;
    this.ticker.stop();

    if (this.state.score > 0) {
      this.score.saveScore(this.state.score);
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
   * Cœur de la logique cadencé par le Ticker.
   */
  updateLogic(timestamp) {
    if (this.state.isPaused) return;

    // 1. Mise à jour de la direction
    const nextDir = this.input.getNextDirection(this.entities.joueur.direction);
    if (nextDir !== null) this.entities.joueur.changeDir(nextDir);

    // 2. Mouvement et Collisions Fatales
    for (const s of this.entities.serpents) {
      if (s instanceof SerpentAI)
        s.move(this.itemManager.items, this.entities.serpents);
      else s.move();

      const dead = this.collisionSystem.checkFatalCollisions(
        s,
        this.entities.serpents,
        (msg) => this.gameOver(msg),
      );
      if (dead) return;
    }

    // 3. Collectes, Difficulté et Spawns
    this._runSystems(timestamp);

    // 4. Debugging
    if (GAME_CONFIG.DEBUG_MODE && timestamp % 2000 < this.state.moveInterval) {
      this._logDebug();
    }

    // 5. Cleanup
    this.entities.cleanup();
  }

  /**
   * Exécute les systèmes de haut niveau.
   * @private
   */
  _runSystems(timestamp) {
    const scoreState = { score: this.state.score };

    this.entities.serpents.forEach((s) => {
      this.collisionSystem.handleItemCollection(
        s,
        this.entities.joueur,
        this.itemManager,
        scoreState,
        timestamp,
      );
    });

    if (scoreState.score !== this.state.score) {
      this.state.updateScore(scoreState.score);
      this.ui.updateHUD(this.state.score, this.state.fps);
    }

    if (this.state.shouldSpawnAI()) {
      this.spawnSystem.spawnNewAI(this.entities.serpents);
    }
    this.spawnSystem.checkSpawns(
      this.state.score,
      this.entities.serpents,
      timestamp,
    );
  }

  /**
   * Reporting technique console.
   * @private
   */
  _logDebug() {
    console.group(
      `%c[DEBUG] Game State @ ${new Date().toLocaleTimeString()}`,
      "color: #3b82f6; font-weight: bold;",
    );
    console.log(
      `Score: ${this.state.score} | FPS: ${this.state.fps.toFixed(1)}`,
    );
    console.log(
      `Entities: ${this.entities.serpents.length} serpents | ${this.itemManager.items.length} items`,
    );

    const aiStates = this.entities.getAIs().map((s, idx) => ({
      id: idx + 1,
      pos: `[${s.anneaux[0].i},${s.anneaux[0].j}]`,
      behavior: s.isHunting ? "HUNT" : s.isRushing ? "RUSH" : "Wander",
    }));

    if (aiStates.length > 0) console.table(aiStates);
    console.groupEnd();
  }
}
