import "./style.css";
import { getRandomInt, getRandomColor } from "./utils";

const canvas = document.getElementById("terrain");
const ctx = canvas.getContext("2d");
const TAILLE_CELLULE = 20;
const green = "#6AA84F"; // vert du serpent
const darkgreen = "#38761D"; // vert plus sombre (contour / ombre)
const darkyellow = "#B7A800"; // nourriture / bonus

/**
 * Représente un anneau du serpent.
 */
class Anneau {
  constructor(i, j, couleur) {
    this.i = i;
    this.j = j;
    this.couleur = couleur;
  }

  draw(ctx, taille) {
    ctx.fillStyle = this.couleur;
    ctx.fillRect(this.i * taille, this.j * taille, taille, taille);
  }

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
    const nbCells = 20;
    this.i = (this.i + nbCells) % nbCells;
    this.j = (this.j + nbCells) % nbCells;
  }

  copy(a) {
    this.i = a.i;
    this.j = a.j;
  }
}

/**
 * Représente un serpent.
 */
class Serpent {
  constructor(longueur, i, j, direction) {
    this.anneaux = [];
    this.direction = direction;

    for (let index = 0; index < longueur; index++) {
      let couleur = green;
      if (index === 0) couleur = darkgreen;
      else if (index === longueur - 1) couleur = darkyellow;
      this.anneaux.push(new Anneau(i, j, couleur));
    }
  }

  draw(ctx, taille) {
    this.anneaux.forEach((anneau) => anneau.draw(ctx, taille));
  }

  /**
   * Fait avancer le serpent.
   * Chaque anneau (sauf la tête) prend la position de celui qui le précède.
   */
  move() {
    // On part de la queue vers la tête
    for (let k = this.anneaux.length - 1; k > 0; k--) {
      this.anneaux[k].copy(this.anneaux[k - 1]);
    }
    // La tête avance selon la direction actuelle
    this.anneaux[0].move(this.direction);
  }

  extend() {
    const nbAnneaux = this.anneaux.length;
    const ancienneQueue = this.anneaux[nbAnneaux - 1];
    ancienneQueue.couleur = green;
    const nouvelleQueue = new Anneau(ancienneQueue.i, ancienneQueue.j, green);
    this.anneaux.push(nouvelleQueue);
  }
}

// --- Animation ---

const serpents = [
  new Serpent(5, 5, 5, 1),
  new Serpent(10, 15, 15, 0),
  new Serpent(3, 10, 10, 2),
];

function update() {
  var elem = document.getElementById("terrain");
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }

  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  serpents.forEach((s) => {
    // Changement de direction aléatoire (probabilité de 2/10)
    if (getRandomInt(10) < 2) {
      let nouvelleDirection = getRandomInt(4);
      // On interdit les demi-tours immédiats (ex: 0 -> 2 ou 1 -> 3)
      if (Math.abs(s.direction - nouvelleDirection) !== 2) {
        s.direction = nouvelleDirection;
      }
    }

    s.move();
    s.draw(ctx, TAILLE_CELLULE);
  });
}

// Lancer l'animation (toutes les 150ms pour que ce soit jouable visuellement)
setInterval(update, 150);

console.log("Animation lancée.");
