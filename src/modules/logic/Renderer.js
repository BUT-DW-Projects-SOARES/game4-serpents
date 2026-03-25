import { COLORS, TAILLE_CELLULE, CSS_SIZE } from "../../constants.js";

/**
 * Gère le rendu graphique complet du jeu sur le canvas.
 * Encapsule les appels au contexte 2D pour isoler la logique de dessin.
 */
export default class Renderer {
  /**
   * @param {CanvasRenderingContext2D} ctx - Le contexte 2D du canvas.
   */
  constructor(ctx) {
    /** @type {CanvasRenderingContext2D} */
    this.ctx = ctx;
  }

  /**
   * Nettoie le canvas et dessine le fond (grille).
   */
  clear() {
    // Nettoyage complet
    this.ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);

    // Dessin de la grille de fond (points de repère)
    this.ctx.fillStyle = COLORS.canvasGrid;
    for (let x = 0; x <= CSS_SIZE; x += TAILLE_CELLULE) {
      for (let y = 0; y <= CSS_SIZE; y += TAILLE_CELLULE) {
        // Dessine des petits carrés de 2x2 aux intersections
        this.ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  /**
   * Dessine l'ensemble des éléments de jeu.
   * @param {GameState} state - L'état actuel du jeu.
   * @param {ItemManager} itemManager - Gestionnaire d'objets.
   * @param {Serpent[]} serpents - Liste des serpents actifs.
   * @param {number} timestamp - Temps actuel (pour les animations).
   */
  render(state, itemManager, serpents, timestamp = Date.now()) {
    this.clear();

    // 1. Rendu des items et particules
    itemManager.updateAndDraw(this.ctx, timestamp);

    // 2. Rendu des serpents
    serpents.forEach((s) => {
      if (!s.dead) {
        s.draw(this.ctx, TAILLE_CELLULE);
      }
    });
  }
}
