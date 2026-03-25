import Anneau from "./Anneau.js";
import { COLORS, NB_CELLS } from "../../constants.js";

/**
 * Entité représentant un serpent sur la grille.
 * Gère sa structure corporelle, ses déplacements, ses collisions et son rendu visuel.
 */
export default class Serpent {
  /**
   * Crée un nouveau serpent à une position donnée.
   * @param {number} longueur - Nombre de segments initiaux.
   * @param {number} i - Indice de colonne (X) initial de la tête.
   * @param {number} j - Indice de ligne (Y) initial de la tête.
   * @param {number} direction - Direction initiale (0:Haut, 1:Droite, 2:Bas, 3:Gauche).
   */
  constructor(longueur, i, j, direction) {
    /** @type {Anneau[]} Liste des segments de la tête [0] à la queue [n] */
    this.anneaux = [];
    /** @type {number} Direction actuelle */
    this.direction = direction;
    /** @type {boolean} État de survie */
    this.dead = false;
    /** @type {number|null} Timestamp de fin d'invincibilité */
    this.invincibleUntil = null;
    /** @type {Array<{startTime: number}>} File des effets de croissance */
    this.pulses = [];

    // Construction initiale
    for (let index = 0; index < longueur; index++) {
      let couleur = COLORS.snakeBody;
      if (index === 0) couleur = COLORS.snakeHead;
      else if (index === longueur - 1) couleur = COLORS.snakeTail;
      this.anneaux.push(new Anneau(i, j, couleur));
    }
  }

  /**
   * Vérifie si le serpent est actuellement invincible.
   * @param {number} [timestamp=performance.now()] - Temps actuel.
   * @returns {boolean}
   */
  isInvincible(timestamp = performance.now()) {
    return this.invincibleUntil ? timestamp < this.invincibleUntil : false;
  }

  /**
   * Dessine le serpent sur le canvas.
   * @param {CanvasRenderingContext2D} ctx - Contexte 2D.
   * @param {number} taille - Taille d'une cellule en pixels.
   */
  draw(ctx, taille) {
    if (this.anneaux.length === 0) return;

    const now = performance.now();
    const isInv = this.isInvincible(now);

    // Nettoyage des pulsations terminées
    this.pulses = this.pulses.filter(
      (p) => now - p.startTime < this.anneaux.length * 100 + 500,
    );

    // Rendu du corps (de la queue à la tête pour superposition correcte)
    for (let k = this.anneaux.length - 1; k >= 0; k--) {
      this._drawSegment(ctx, k, taille, now, isInv);
    }
  }

  /**
   * Dessine un segment spécifique du serpent.
   * @private
   */
  _drawSegment(ctx, index, taille, now, isInv) {
    const a = this.anneaux[index];
    const cx = a.i * taille + taille / 2;
    const cy = a.j * taille + taille / 2;

    // Calcul de l'échelle (Effet Domino)
    let scale = 1.0;
    this.pulses.forEach((p) => {
      const delay = index * 80;
      const elapsed = now - (p.startTime + delay);
      if (elapsed > 0 && elapsed < 400) {
        scale += Math.sin((elapsed / 400) * Math.PI) * 0.6;
      }
    });

    if (index === 0) {
      this._drawHead(ctx, cx, cy, taille, scale, isInv);
    } else {
      this._drawBodyPart(ctx, a, cx, cy, taille, scale, isInv, now);
    }
  }

  /**
   * Dessine la tête du serpent.
   * @private
   */
  _drawHead(ctx, cx, cy, taille, scale, isInv) {
    if (isInv) {
      ctx.fillStyle = COLORS.powerup;
      ctx.shadowColor = COLORS.powerup;
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = this.anneaux[0].couleur || COLORS.snakeHead;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, taille * 0.45 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    this._drawEyes(ctx, cx, cy, taille * scale);
  }

  /**
   * Dessine un segment du corps.
   * @private
   */
  _drawBodyPart(ctx, a, cx, cy, taille, scale, isInv, now) {
    if (isInv) {
      ctx.fillStyle = COLORS.powerup;
      ctx.shadowColor = COLORS.powerup;
      ctx.shadowBlur = 10 + Math.sin(now / 60) * 10;
    } else {
      ctx.fillStyle = a.couleur || COLORS.snakeBody;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, taille * 0.4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /**
   * Dessine les yeux sur la tête selon la direction.
   * @private
   */
  _drawEyes(ctx, hx, hy, taille) {
    const eyeRadius = taille * 0.12;
    const eyeOffset = taille * 0.22;
    const eyeDist = taille * 0.15;

    let e1x, e1y, e2x, e2y;
    switch (this.direction) {
      case 0: // Haut
        e1x = hx - eyeOffset;
        e1y = hy - eyeDist;
        e2x = hx + eyeOffset;
        e2y = hy - eyeDist;
        break;
      case 1: // Droite
        e1x = hx + eyeDist;
        e1y = hy - eyeOffset;
        e2x = hx + eyeDist;
        e2y = hy + eyeOffset;
        break;
      case 2: // Bas
        e1x = hx - eyeOffset;
        e1y = hy + eyeDist;
        e2x = hx + eyeOffset;
        e2y = hy + eyeDist;
        break;
      case 3: // Gauche
        e1x = hx - eyeDist;
        e1y = hy - eyeOffset;
        e2x = hx - eyeDist;
        e2y = hy + eyeOffset;
        break;
    }

    // Blanc des yeux
    ctx.fillStyle = "#ffffff";
    this._fillCircle(ctx, e1x, e1y, eyeRadius);
    this._fillCircle(ctx, e2x, e2y, eyeRadius);

    // Pupilles
    ctx.fillStyle = "#111827";
    this._fillCircle(ctx, e1x, e1y, eyeRadius * 0.5);
    this._fillCircle(ctx, e2x, e2y, eyeRadius * 0.5);
  }

  /** @private */
  _fillCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Déplace le serpent d'une case.
   * Gère le 'wrapping' automatique si le serpent est invincible.
   */
  move() {
    // Le corps suit la tête (cascade)
    for (let k = this.anneaux.length - 1; k > 0; k--) {
      this.anneaux[k].copy(this.anneaux[k - 1]);
    }

    // Déplacement de la tête
    this.anneaux[0].move(this.direction);

    // Wrapping (traversée des murs) si invincible
    if (this.isInvincible()) {
      if (this.anneaux[0].i < 0) this.anneaux[0].i = NB_CELLS - 1;
      else if (this.anneaux[0].i >= NB_CELLS) this.anneaux[0].i = 0;

      if (this.anneaux[0].j < 0) this.anneaux[0].j = NB_CELLS - 1;
      else if (this.anneaux[0].j >= NB_CELLS) this.anneaux[0].j = 0;
    }
  }

  /**
   * Agrantit le serpent en ajoutant un segment à la queue.
   */
  extend() {
    const nbAnneaux = this.anneaux.length;
    const ancienneQueue = this.anneaux[nbAnneaux - 1];

    ancienneQueue.couleur = COLORS.snakeBody;
    const nouvelleQueue = new Anneau(
      ancienneQueue.i,
      ancienneQueue.j,
      COLORS.snakeTail,
    );
    this.anneaux.push(nouvelleQueue);

    // Déclencher une pulsation
    this.pulses.push({ startTime: performance.now() });
  }

  /**
   * Vérifie si la tête touche n'importe quel segment de son propre corps.
   * @returns {boolean}
   */
  checkSelfCollision() {
    const tete = this.anneaux[0];
    for (let k = 1; k < this.anneaux.length; k++) {
      if (tete.i === this.anneaux[k].i && tete.j === this.anneaux[k].j) {
        return true;
      }
    }
    return false;
  }

  /**
   * Vérifie si la tête sort des limites de l'arène.
   * @param {number} NB_CELLS - Taille de la grille.
   * @returns {boolean}
   */
  checkWallCollision(NB_CELLS) {
    if (this.isInvincible()) return false;
    const tete = this.anneaux[0];
    return tete.i < 0 || tete.i >= NB_CELLS || tete.j < 0 || tete.j >= NB_CELLS;
  }

  /**
   * Vérifie la collision entre la tête de ce serpent et le corps d'un autre.
   * @param {Serpent} autre - Le serpent à tester.
   * @returns {boolean}
   */
  checkCollisionWith(autre) {
    const tete = this.anneaux[0];
    return autre.anneaux.some((a) => a.i === tete.i && a.j === tete.j);
  }

  /**
   * Change la direction du serpent.
   * @param {number} d - Nouvelle direction (0:Haut, 1:Droite, 2:Bas, 3:Gauche).
   */
  changeDir(d) {
    this.direction = d;
  }
}
