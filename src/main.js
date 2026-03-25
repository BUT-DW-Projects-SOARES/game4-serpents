import "./style.css";
import GameEngine from "./modules/GameEngine.js";
import { CSS_SIZE, GAME_CONFIG } from "./constants.js";

/**
 * Point d'entrée principal de Slither Arena.
 * Initialise le canvas, configure la mise à l'échelle HiDPI et lance le moteur de jeu.
 */

// --- Configuration du Rendu ---
const canvas = document.getElementById("terrain");
const gameWrapper = document.getElementById("game-wrapper");

// Gestion de la densité de pixels pour un rendu net sur tous les écrans
const dpr = window.devicePixelRatio || 1;
canvas.width = CSS_SIZE * dpr;
canvas.height = CSS_SIZE * dpr;
canvas.style.width = `${CSS_SIZE}px`;
canvas.style.height = `${CSS_SIZE}px`;

// Initialisation du Moteur
const engine = new GameEngine(canvas);
engine.ctx.scale(dpr, dpr);

// --- Gestion des Événements Globaux ---

/**
 * Raccourci clavier pour le mode plein écran (F11).
 */
window.addEventListener("keydown", (event) => {
  if (event.key === "F11") {
    event.preventDefault();
    if (!document.fullscreenElement) {
      gameWrapper.requestFullscreen().catch((err) => {
        console.warn(`Plein écran refusé : ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
});

// --- Démarrage Initial ---

// Affichage du menu d'accueil
engine.ui.showMenu({
  title: "Slither Arena",
  subtitle: "Prêt à relever le défi ?",
  showScore: false,
  btnText: "Démarrer l'Aventure",
  showInput: false,
  isGameOver: false,
});

// Synchronisation visuelle du bouton Debug
engine.ui.updateDebugButton(GAME_CONFIG.DEBUG_MODE);
