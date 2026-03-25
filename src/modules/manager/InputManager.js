/**
 * Système de gestion des entrées utilisateur.
 * Capture les commandes clavier et les stocke dans une file d'attente pour le moteur de jeu.
 */
export default class InputManager {
  /**
   * Initialise le gestionnaire d'entrées et les écouteurs d'événements.
   */
  constructor() {
    /**
     * File d'attente des directions demandées par l'utilisateur.
     * @type {number[]}
     */
    this.directionQueue = [];

    this._setupListeners();
  }

  /**
   * Ajoute une direction à la file d'attente si elle est valide.
   * @param {number} dir - Direction (0:Haut, 1:Droite, 2:Bas, 3:Gauche).
   */
  addDirection(dir) {
    if (dir >= 0 && dir <= 3) {
      this.directionQueue.push(dir);
    }
  }

  /**
   * Initialise les écouteurs d'événements clavier globaux.
   * Supporte les flèches directionnelles et les touches ZQSD / WASD.
   * @private
   */
  _setupListeners() {
    window.addEventListener("keydown", (event) => {
      let nouvelleDirection = -1;

      switch (event.key.toLowerCase()) {
        case "z":
        case "w": // Support WASD/ZQSD
        case "arrowup":
          nouvelleDirection = 0; // Haut
          break;
        case "d":
        case "arrowright":
          nouvelleDirection = 1; // Droite
          break;
        case "s":
        case "arrowdown":
          nouvelleDirection = 2; // Bas
          break;
        case "q":
        case "a": // Support WASD/ZQSD
        case "arrowleft":
          nouvelleDirection = 3; // Gauche
          break;
      }

      if (nouvelleDirection !== -1) {
        this.addDirection(nouvelleDirection);
      }
    });
  }

  /**
   * Récupère la prochaine direction valide de la file d'attente.
   * Applique un filtrage pour empêcher les demi-tours immédiats à 180 degrés.
   * @param {number} currentDirection - La direction actuelle du serpent joueur.
   * @returns {number|null} La nouvelle direction ou null si aucune commande valide n'est en attente.
   */
  getNextDirection(currentDirection) {
    while (this.directionQueue.length > 0) {
      const d = this.directionQueue.shift();

      // Validation : Empêcher le demi-tour direct (ex: Haut vers Bas)
      if (Math.abs(currentDirection - d) !== 2) {
        return d;
      }
    }
    return null;
  }

  /**
   * Vide la file d'attente des commandes.
   */
  reset() {
    this.directionQueue = [];
  }
}
