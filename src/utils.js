/**
 * Bibliothèque de fonctions utilitaires pour Slither Arena.
 * @module utils
 */

/**
 * Génère un nombre entier aléatoire dans l'intervalle [0, max[.
 * @param {number} max - Limite supérieure (exclue).
 * @returns {number} Un entier aléatoire.
 */
export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Génère une couleur CSS aléatoire au format RGB.
 * @returns {string} Une chaîne de type "rgb(r, g, b)".
 */
export function getRandomColor() {
  const r = getRandomInt(256);
  const g = getRandomInt(256);
  const b = getRandomInt(256);
  return `rgb(${r}, ${g}, ${b})`;
}
