import Serpent from "./Serpent.js";
import {
  NB_CELLS,
  COLORS as GAME_COLORS,
  GAME_CONFIG,
} from "../../constants.js";

/**
 * Sous-classe représentant un serpent piloté par ordinateur (IA).
 * Gère une prise de décision autonome (Wander, Rush, Hunt) et l'esquive d'obstacles.
 */
export default class SerpentAI extends Serpent {
  /**
   * Initialise un serpent IA.
   * @param {number} longueur - Longueur initiale.
   * @param {number} i - Position X.
   * @param {number} j - Position Y.
   * @param {number} direction - Direction initiale.
   */
  constructor(longueur, i, j, direction) {
    super(longueur, i, j, direction);

    // Les IA sont visuellement distinctes (Rouge)
    this.anneaux.forEach((a, idx) => {
      a.couleur = idx === 0 ? GAME_COLORS.redIA : GAME_COLORS.redIABody;
    });

    /** @type {number} ID unique basé sur le temps de spawn */
    this.spawnTime = performance.now();
    /** @type {boolean} État de collecte active */
    this.isRushing = false;
    /** @type {boolean} État de traque du joueur */
    this.isHunting = false;
    /** @type {number} Durée restante de traque */
    this.huntCounter = 0;
  }

  /**
   * Orchestre la prise de décision de l'IA à chaque cycle.
   * @param {Item[]} items - Liste des objets sur la grille.
   * @param {Serpent[]} allSerpents - Liste de tous les serpents actifs.
   */
  planNextMove(items = [], allSerpents = []) {
    const tete = this.anneaux[0];
    const joueur = allSerpents[0];

    // 1. Mises à jour des états internes
    this._updateStates(joueur);

    // 2. Détermination de la direction idéale
    let idealDir = this._calculateIdealDirection(tete, items, joueur);

    // 3. Application de la direction après audit de sécurité
    this.direction = this._auditDirection(idealDir, tete, allSerpents, items);
  }

  /**
   * Met à jour les états Rushing/Hunting selon les probabilités.
   * @private
   */
  _updateStates(joueur) {
    if (this.isRushing || this.isHunting) {
      if (Math.random() < 0.05) {
        this.isRushing = false;
        this.isHunting = false;
        this.huntCounter = 0;
      }
    } else {
      const chance = Math.random();
      if (chance < 0.1) {
        this.isRushing = true;
      } else if (joueur && !joueur.dead && chance < 0.25) {
        this.isHunting = true;
        this.huntCounter = 40;
      }
    }
  }

  /**
   * Calcule la direction vers l'objectif actuel.
   * @private
   */
  _calculateIdealDirection(tete, items, joueur) {
    let idealDir = this.direction;

    if (this.isHunting && joueur) {
      this.huntCounter--;
      if (this.huntCounter <= 0) this.isHunting = false;
      idealDir = this._getDirectionTo(tete, joueur.anneaux[0]);
    } else if (this.isRushing) {
      const target = this._findNearestItem(tete, items);
      if (target) idealDir = this._getDirectionTo(tete, target);
    } else if (Math.random() < 0.1) {
      idealDir = Math.floor(Math.random() * 4);
    }

    // Empêcher le demi-tour direct (fatal)
    if (Math.abs(idealDir - this.direction) === 2) {
      idealDir = this.direction;
    }

    return idealDir;
  }

  /**
   * Vérifie et corrige la direction si elle mène à une mort certaine.
   * @private
   */
  _auditDirection(idealDir, tete, allSerpents, items) {
    if (this._isDirectionDangerous(idealDir, tete, allSerpents, items)) {
      return this._getSafeDirection(tete, allSerpents, items);
    }
    return idealDir;
  }

  /**
   * Calcule la direction relative entre deux points.
   * @private
   */
  _getDirectionTo(from, to) {
    const di = to.i - from.i;
    const dj = to.j - from.j;
    if (Math.abs(di) > Math.abs(dj)) return di > 0 ? 1 : 3;
    return dj > 0 ? 2 : 0;
  }

  /**
   * Trouve l'item le plus proche.
   * @private
   */
  _findNearestItem(tete, items) {
    const powerUps = items.filter((it) => it.type === "powerup");
    const targets = powerUps.length > 0 ? powerUps : items;
    let nearest = null;
    let minDist = Infinity;

    targets.forEach((item) => {
      const dist = Math.abs(item.i - tete.i) + Math.abs(item.j - tete.j);
      if (dist < minDist) {
        minDist = dist;
        nearest = item;
      }
    });
    return nearest;
  }

  /**
   * Évalue si foncer dans une direction entraînera une collision.
   * @private
   */
  _isDirectionDangerous(dir, tete, allSerpents, items) {
    let nextI = tete.i;
    let nextJ = tete.j;
    switch (dir) {
      case 0:
        nextJ--;
        break;
      case 1:
        nextI++;
        break;
      case 2:
        nextJ++;
        break;
      case 3:
        nextI--;
        break;
    }

    // Collision avec les murs
    if (nextI < 0 || nextI >= NB_CELLS || nextJ < 0 || nextJ >= NB_CELLS)
      return true;

    // Collision avec n'importe quel serpent
    for (const s of allSerpents) {
      if (s.anneaux.some((a) => a.i === nextI && a.j === nextJ)) return true;
    }

    // Éviter les items pendant le wander (optionnel)
    if (!this.isRushing && items.some((it) => it.i === nextI && it.j === nextJ))
      return true;

    return false;
  }

  /**
   * Cherche une alternative viable si le danger est présent.
   * @private
   */
  _getSafeDirection(tete, allSerpents, items) {
    const valid = [];
    for (let d = 0; d < 4; d++) {
      if (Math.abs(this.direction - d) === 2) continue;
      if (!this._isDirectionDangerous(d, tete, allSerpents, items))
        valid.push(d);
    }
    return valid.length > 0
      ? valid[Math.floor(Math.random() * valid.length)]
      : this.direction;
  }

  /**
   * Cycle de mise à jour de l'IA.
   * @param {Item[]} items - Context items.
   * @param {Serpent[]} allSerpents - Context serpents.
   */
  move(items, allSerpents) {
    if (Math.random() > GAME_CONFIG.AI_MOVE_CHANCE) return;
    this.planNextMove(items, allSerpents);
    super.move();
  }

  /**
   * Applique le style IA lors d'une extension.
   */
  extend() {
    super.extend();
    this.anneaux.forEach((a) => {
      a.couleur = GAME_COLORS.redIA;
    });
  }
}
