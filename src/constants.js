/**
 * Constantes globales du jeu Slither Arena.
 * @module constants
 */

const styles = getComputedStyle(document.documentElement);

/**
 * Palette de couleurs extraite des propriétés CSS du document.
 * @type {Object}
 */
export const COLORS = {
  snakeHead: styles.getPropertyValue("--canvas-snake-head").trim() || "#16a34a",
  snakeBody: styles.getPropertyValue("--canvas-snake-body").trim() || "#4ade80",
  snakeTail: styles.getPropertyValue("--canvas-snake-tail").trim() || "#86efac",
  apple: styles.getPropertyValue("--canvas-apple").trim() || "#f43f5e",
  redIA: styles.getPropertyValue("--canvas-ia").trim() || "#ef4444",
  redIABody: styles.getPropertyValue("--canvas-ia-body").trim() || "#991b1b",
  powerup: styles.getPropertyValue("--canvas-powerup").trim() || "#fbbf24",
  canvasGrid: styles.getPropertyValue("--canvas-grid").trim() || "#000000",
};

/**
 * Configuration globale du gameplay pour un équilibrage facile.
 * @type {Object}
 */
export const GAME_CONFIG = {
  DEBUG_MODE: true,
  FPS_INITIAL: 10,
  FPS_MAX: 20,
  SCORE_FOR_SPEED_INCREASE: 12,

  AI_SPAWN_SCORE_INTERVAL: 10,
  AI_MOVE_CHANCE: 0.9,
  AI_RANDOM_MOVE_CHANCE: 0.35,

  POWERUP_SPAWN_CHANCE: 0.05,
  POWERUP_DURATION: 8000,

  SCORE_POWERUP: 5,
  SCORE_APPLE: 1,
  SCORE_AI_PENALTY: -1,
  SCORE_KILL_AI: 5,
};

/** @type {number} Taille d'une cellule de la grille en pixels */
export const TAILLE_CELLULE = 20;

/** @type {number} Nombre de cellules par côté de la grille */
export const NB_CELLS = 30;

/** @type {number} Taille totale du canvas en pixels CSS */
export const CSS_SIZE = 600;
