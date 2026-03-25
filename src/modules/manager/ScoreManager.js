/**
 * Service de gestion des scores.
 * Gère la persistance locale via localStorage et le rendu du tableau des meilleurs scores.
 */
export default class ScoreManager {
  /**
   * @param {string} storageKey - La clé de stockage localStorage.
   */
  constructor(storageKey = "slither_arena_scores") {
    /** @type {string} Clé unique pour le localStorage */
    this.STORAGE_KEY = storageKey;

    /** @type {HTMLElement|null} Liste HTML du scoreboard */
    this.scoreboardList = document.getElementById("scoreboard-list");
    /** @type {HTMLElement|null} Overlay du scoreboard */
    this.scoreboardOverlay = document.getElementById("scoreboard-overlay");
  }

  /**
   * Récupère la liste des meilleurs scores enregistrés.
   * @returns {Array<{score: number, date: string}>} Liste des objets scores triés.
   */
  getScores() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des scores :", error);
      return [];
    }
  }

  /**
   * Sauvegarde un nouveau score s'il fait partie du top 10.
   * @param {number} value - Le montant du score à enregistrer.
   */
  saveScore(value) {
    if (value <= 0) return;

    const scores = this.getScores();
    scores.push({
      score: value,
      date: new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    // Tri par score décroissant et conservation du top 10
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    } catch (e) {
      console.warn(
        "Impossible de sauvegarder le score dans le localStorage :",
        e,
      );
    }
  }

  /**
   * Supprime définitivement tous les scores enregistrés localement.
   */
  clearScores() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.renderScoreboard();
  }

  /**
   * Met à jour dynamiquement l'affichage du Scoreboard dans le DOM.
   */
  renderScoreboard() {
    if (!this.scoreboardList) return;

    const scores = this.getScores();
    this.scoreboardList.innerHTML = "";

    if (scores.length === 0) {
      this.scoreboardList.innerHTML =
        '<li class="scoreboard-empty">Aucun score enregistré</li>';
      return;
    }

    scores.forEach((entry, index) => {
      const li = this._createScoreElement(entry, index);
      this.scoreboardList.appendChild(li);
    });
  }

  /**
   * Crée un élément de liste HTML pour une entrée de score.
   * @param {Object} entry - L'entrée de score (score, date).
   * @param {number} index - Position dans le classement.
   * @returns {HTMLLIElement}
   * @private
   */
  _createScoreElement(entry, index) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="score-date">${entry.date}</span>
      <span class="score-value">${entry.score}</span>
    `;
    return li;
  }

  /**
   * Affiche l'overlay du scoreboard.
   */
  show() {
    this.renderScoreboard();
    this.scoreboardOverlay?.classList.remove("hidden");
  }

  /**
   * Masque l'overlay du scoreboard.
   */
  hide() {
    this.scoreboardOverlay?.classList.add("hidden");
  }
}
