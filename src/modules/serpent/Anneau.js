/**
 * Représente un segment individuel (anneau) d'un serpent sur la grille.
 * Gère les coordonnées spatiales et temporelles du segment.
 */
export default class Anneau {
  /**
   * Initialise un nouvel anneau.
   * @param {number} i - Indice de colonne sur la grille (axe X).
   * @param {number} j - Indice de ligne sur la grille (axe Y).
   * @param {string} couleur - Code couleur CSS associé.
   */
  constructor(i, j, couleur) {
    /** @type {number} Position horizontale (0 à NB_CELLS-1) */
    this.i = i;
    /** @type {number} Position verticale (0 à NB_CELLS-1) */
    this.j = j;
    /** @type {string} Couleur CSS du segment */
    this.couleur = couleur;
  }

  /**
   * Déplace l'anneau d'une unité dans une direction donnée.
   * @param {number} d - Identifiant de direction (0:Haut, 1:Droite, 2:Bas, 3:Gauche).
   */
  move(d) {
    switch (d) {
      case 0:
        this.j -= 1;
        break; // Haut
      case 1:
        this.i += 1;
        break; // Droite
      case 2:
        this.j += 1;
        break; // Bas
      case 3:
        this.i -= 1;
        break; // Gauche
    }
  }

  /**
   * Copie les coordonnées d'un autre anneau.
   * @param {Anneau} a - L'anneau source dont on copie la position.
   */
  copy(a) {
    this.i = a.i;
    this.j = a.j;
  }
}
