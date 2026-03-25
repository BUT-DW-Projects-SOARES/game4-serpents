import { NB_CELLS, COLORS, GAME_CONFIG } from "../../constants.js";

/**
 * Système de gestion des collisions.
 * Gère les calculs de collision entre serpents (joueur/IA), murs et objets de jeu.
 */
export default class CollisionSystem {
  /**
   * Initialise le système de collision.
   * @param {ItemManager} itemManager - Gestionnaire des objets pour les effets de capture.
   * @param {UIManager} uiManager - Gestionnaire d'interface pour les alertes.
   */
  constructor(itemManager, uiManager) {
    /** @type {ItemManager} */
    this.itemManager = itemManager;
    /** @type {UIManager} */
    this.uiManager = uiManager;
  }

  /**
   * Vérifie les collisions fatales pour un serpent donné.
   * @param {Serpent} s - Le serpent à tester.
   * @param {Serpent[]} serpents - Liste de tous les serpents actifs.
   * @param {Function} onGameOver - Callback appelé en cas de défaite du joueur.
   * @returns {boolean} True si une collision fatale a eu lieu.
   */
  checkFatalCollisions(s, serpents, onGameOver) {
    // 1. Collision avec les limites de la grille (Murs)
    if (s.checkWallCollision(NB_CELLS)) {
      if (s === serpents[0]) onGameOver("Vous avez percuté un mur !");
      else s.dead = true;
      return true;
    }

    // 2. Collision avec son propre corps (Auto-morsure)
    if (s.checkSelfCollision()) {
      if (s === serpents[0]) onGameOver("Vous vous êtes mordu !");
      else s.dead = true;
      return true;
    }

    // 3. Collision avec un autre serpent
    for (const autre of serpents) {
      if (s !== autre && s.checkCollisionWith(autre)) {
        return this._handleSerpentCollision(s, autre, serpents, onGameOver);
      }
    }

    return false;
  }

  /**
   * Résout une collision détectée entre deux serpents.
   * Gère les mécaniques d'invincibilité (PowerUp).
   * @param {Serpent} s - Le serpent qui initie la collision (sa tête tape).
   * @param {Serpent} autre - Le serpent percuté.
   * @param {Serpent[]} serpents - Liste globale des serpents.
   * @param {Function} onGameOver - Callback de fin de partie.
   * @param {number} timestamp - Temps actuel (optionnel).
   * @returns {boolean} True si la collision entraîne la mort d'un des serpents.
   * @private
   */
  _handleSerpentCollision(
    s,
    autre,
    serpents,
    onGameOver,
    timestamp = performance.now(),
  ) {
    const joueur = serpents[0];

    // Cas où le joueur est impliqué
    if (s === joueur) {
      if (joueur.isInvincible(timestamp)) {
        this._destroyIA(autre);
        return false;
      } else {
        onGameOver("Vous avez percuté un autre serpent !");
        return true;
      }
    } else if (autre === joueur) {
      if (joueur.isInvincible(timestamp)) {
        this._destroyIA(s);
        return true;
      } else {
        onGameOver("Un serpent vous a percuté !");
        return true;
      }
    } else {
      // IA vs IA
      s.dead = true;
      return true;
    }
  }

  /**
   * Détruit un serpent IA avec un effet de particules.
   * @param {Serpent} ia - Le serpent IA à détruire.
   * @private
   */
  _destroyIA(ia) {
    if (GAME_CONFIG.DEBUG_MODE) {
      console.info("%c[COLLISION] IA détruite !", "color: #fbbf24;");
    }
    ia.dead = true;
    this.itemManager.spawnParticles(
      ia.anneaux[0].i,
      ia.anneaux[0].j,
      COLORS.snakeBody,
    );
  }

  /**
   * Gère la collecte d'items (pommes, powerups) par les serpents.
   * @param {Serpent} s - Le serpent qui collecte.
   * @param {Serpent} joueur - Le joueur (pour le score).
   * @param {ItemManager} itemManager - Gestionnaire des items.
   * @param {Object} scoreState - État du score à mettre à jour.
   * @param {number} timestamp - Temps actuel.
   */
  handleItemCollection(s, joueur, itemManager, scoreState, timestamp) {
    for (let i = itemManager.items.length - 1; i >= 0; i--) {
      const item = itemManager.items[i];
      if (s.anneaux[0].i === item.i && s.anneaux[0].j === item.j) {
        this._processItem(
          s,
          joueur,
          item,
          itemManager,
          scoreState,
          i,
          timestamp,
        );
      }
    }
  }

  /**
   * Traite l'application de l'effet d'un item collecté.
   * @private
   */
  _processItem(s, joueur, item, itemManager, scoreState, index, timestamp) {
    if (item.type === "apple") {
      this._handleApple(s, joueur, item, itemManager, scoreState, index);
    } else if (item.type === "powerup") {
      this._handlePowerUp(
        s,
        joueur,
        item,
        itemManager,
        scoreState,
        index,
        timestamp,
      );
    }
  }

  /**
   * Gère la collecte d'une pomme.
   * @private
   */
  _handleApple(s, joueur, item, itemManager, scoreState, index) {
    if (s === joueur) {
      scoreState.score += GAME_CONFIG.SCORE_APPLE;
      if (GAME_CONFIG.DEBUG_MODE)
        console.log("%c[ITEM] Pomme mangée (+1)", "color: #4ade80;");
    } else {
      scoreState.score = Math.max(
        0,
        scoreState.score + GAME_CONFIG.SCORE_AI_PENALTY,
      );
      if (GAME_CONFIG.DEBUG_MODE)
        console.warn("%c[ITEM] AI a volé une pomme (-1)", "color: #ef4444;");
    }

    s.extend();
    itemManager.spawnParticles(item.i, item.j, COLORS.apple);
    itemManager.items.splice(index, 1);
    itemManager.spawnItem("apple", [joueur]);
  }

  /**
   * Gère la collecte d'un PowerUp.
   * @private
   */
  _handlePowerUp(s, joueur, item, itemManager, scoreState, index, timestamp) {
    if (s === joueur) {
      scoreState.score += GAME_CONFIG.SCORE_POWERUP;
      joueur.invincibleUntil = timestamp + GAME_CONFIG.POWERUP_DURATION;
      if (GAME_CONFIG.DEBUG_MODE) {
        console.info(
          "%c[ITEM] POWERUP ACTIVÉ ! (Invincibilité 8s)",
          "color: #fbbf24; font-weight: bold;",
        );
      }
    }

    s.extend();
    itemManager.spawnParticles(item.i, item.j, COLORS.powerup);
    itemManager.items.splice(index, 1);
  }
}
