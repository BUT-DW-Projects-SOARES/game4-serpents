import { COLORS, TAILLE_CELLULE } from "../../constants.js";
import { getRandomInt } from "../../utils.js";

/**
 * Représente un objet ramassable sur la grille (Pomme, PowerUp, etc.).
 */
export class Item {
  /**
   * @param {number} i - L'indice de colonne sur la grille (axe X).
   * @param {number} j - L'indice de ligne sur la grille (axe Y).
   * @param {string} type - Le type de l'objet (ex: "apple", "powerup").
   */
  constructor(i, j, type) {
    /** @type {number} Position X sur la grille */
    this.i = i;
    /** @type {number} Position Y sur la grille */
    this.j = j;
    /** @type {string} Type de l'objet ("apple" ou "powerup") */
    this.type = type;
  }

  /**
   * Dessine l'objet sur le canvas avec ses animations spécifiques.
   * @param {CanvasRenderingContext2D} ctx - Le contexte 2D du canvas.
   * @param {number} timeNow - Timestamp actuel pour animer fluidement.
   */
  draw(ctx, timeNow) {
    const cx = this.i * TAILLE_CELLULE + TAILLE_CELLULE / 2;
    const cy = this.j * TAILLE_CELLULE + TAILLE_CELLULE / 2;

    if (this.type === "apple") {
      this._drawApple(ctx, cx, cy, timeNow);
    } else if (this.type === "powerup") {
      this._drawPowerUp(ctx, cx, cy, timeNow);
    }
  }

  /**
   * Dessine une pomme avec un effet de pulsation.
   * @private
   */
  _drawApple(ctx, cx, cy, timeNow) {
    const scale = 1 + Math.sin(timeNow / 150) * 0.15;
    const r = (TAILLE_CELLULE / 2 - 2) * scale;

    ctx.fillStyle = COLORS.apple;
    ctx.shadowColor = COLORS.apple;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /**
   * Dessine un diamant pulsé électriquement (PowerUp).
   * @private
   */
  _drawPowerUp(ctx, cx, cy, timeNow) {
    const scale = 1 + Math.sin(timeNow / 80) * 0.2;
    const r = (TAILLE_CELLULE / 2 - 1) * scale;

    ctx.fillStyle = COLORS.powerup;
    ctx.shadowColor = COLORS.powerup;
    ctx.shadowBlur = 20;

    // Dessin d'un losange
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/**
 * Manager centralisant la gestion des objets (spawn, rendu) et des effets visuels (particules).
 */
export default class ItemManager {
  /**
   * @param {number} NB_CELLS - Le nombre de cellules sur la grille.
   */
  constructor(NB_CELLS) {
    /**
     * Dimension de la grille (côté).
     * @type {number}
     */
    this.NB_CELLS = NB_CELLS;

    /**
     * Collection des objets actifs sur le terrain.
     * @type {Item[]}
     */
    this.items = [];

    /**
     * Collection des particules visuelles actives (effets d'explosion).
     * @type {Array<{x: number, y: number, vx: number, vy: number, life: number, decay: number, color: string}>}
     */
    this.particles = [];
  }

  /**
   * Instancie aléatoirement un nouvel objet sur la grille en évitant les collisions.
   * @param {string} type - Le type de l'objet (ex: "apple", "powerup").
   * @param {Serpent[]} serpents - Liste des serpents pour éviter de spawner sur eux.
   */
  spawnItem(type, serpents) {
    let x, y;
    let collision;
    let attempts = 0;

    do {
      collision = false;
      x = getRandomInt(this.NB_CELLS);
      y = getRandomInt(this.NB_CELLS);

      // Vérifier les collisions avec les serpents
      serpents.forEach((s) => {
        s.anneaux.forEach((a) => {
          if (a.i === x && a.j === y) collision = true;
        });
      });

      // Vérifier les collisions avec les items existants
      this.items.forEach((item) => {
        if (item.i === x && item.j === y) collision = true;
      });

      attempts++;
      if (attempts > 500) break;
    } while (collision);

    if (attempts <= 500) {
      this.items.push(new Item(x, y, type));
    }
  }

  /**
   * Instancie une grappe de particules visuelles pour un effet "pop".
   * @param {number} x - Position X sur la grille.
   * @param {number} y - Position Y sur la grille.
   * @param {string} color - Couleur des particules.
   */
  spawnParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x * TAILLE_CELLULE + TAILLE_CELLULE / 2,
        y: y * TAILLE_CELLULE + TAILLE_CELLULE / 2,
        vx: (Math.random() - 0.5) * 8, // velocity X
        vy: (Math.random() - 0.5) * 8, // velocity Y
        life: 1.0,
        decay: Math.random() * 0.05 + 0.02,
        color: color,
      });
    }
  }

  /**
   * Met à jour et dessine tous les items et les effets de particules.
   * @param {CanvasRenderingContext2D} ctx - Le contexte 2D du canvas.
   * @param {number} timeNow - Timestamp actuel.
   */
  updateAndDraw(ctx, timeNow) {
    // Dessin des items
    this.items.forEach((item) => item.draw(ctx, timeNow));

    // Mise à jour et dessin des particules
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this._updateAndDrawParticle(ctx, i);
    }
  }

  /**
   * Met à jour et dessine une particule individuelle.
   * @param {CanvasRenderingContext2D} ctx - Le contexte 2D.
   * @param {number} index - Index de la particule dans la collection.
   * @private
   */
  _updateAndDrawParticle(ctx, index) {
    const p = this.particles[index];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0) {
      this.particles.splice(index, 1);
      return;
    }

    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.life * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  /**
   * Réinitialise les collections d'items et de particules.
   */
  reset() {
    this.items = [];
    this.particles = [];
  }
}
