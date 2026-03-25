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

    /** @type {Map<string, Function>} Actions personnalisées (ex: Pause) */
    this.actions = new Map();

    /** @type {Object.<string, number>} Mapping des touches vers les directions */
    this.keyMap = {
      z: 0,
      w: 0,
      arrowup: 0,
      d: 1,
      arrowright: 1,
      s: 2,
      arrowdown: 2,
      q: 3,
      a: 3,
      arrowleft: 3,
    };

    this._setupListeners();
  }

  /**
   * Enregistre une callback pour une touche spécifique.
   * @param {string} key - La touche (ex: 'p', 'r').
   * @param {Function} callback - La fonction à exécuter.
   */
  registerAction(key, callback) {
    this.actions.set(key.toLowerCase(), callback);
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
   * Initialise l'écouteur d'événements clavier global.
   * @private
   */
  _setupListeners() {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();

      // 1. Gestion des directions
      if (this.keyMap[key] !== undefined) {
        this.addDirection(this.keyMap[key]);
        return;
      }

      // 2. Gestion des actions système (Pause, etc)
      const action = this.actions.get(key);
      if (action) action();
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
