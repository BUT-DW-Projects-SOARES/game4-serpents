# 🐍 Serpent Game - TP n°2

Ce projet est une implémentation simplifiée du jeu du serpent (Snake) réalisée dans le cadre du cours **GAME4 - Programmation Orientée Objet** (BUT MMI n-2). 

L'objectif principal est de manipuler les concepts de classes et d'objets en JavaScript pour gérer les segments du serpent et son mouvement sur un canvas.

## 🚀 Fonctionnalités

- **Modèle Orienté Objet** : Utilisation de classes (`Anneau` et `Serpent`) pour structurer le code.
- **Animation Fluide** : Le serpent se déplace de manière séquentielle, chaque anneau suivant celui qui le précède.
- **Sortie du Terrier** : Initialement empilés, les anneaux se déploient au premier mouvement.
- **Intelligence Artificielle de base** : Les serpents changent de direction aléatoirement (probabilité 2/10) tout en évitant les demi-tours immédiats.
- **Gestion des Bords** : Système de "wrap-around" (rebond) permettant de traverser les bords du terrain pour réapparaître du côté opposé.
- **Interface Premium** : Design sombre (Dark Mode), titre centré, icône émoji 🐍 et support du plein écran.

## 🛠️ Structure Technique

### Les Classes

- **Classe `Anneau`** :
  - Gère sa position (`i`, `j`) et sa `couleur`.
  - Méthode `draw()` pour s'afficher.
  - Méthode `move(d)` avec gestion automatique des bords (grille 20x20).
  - Méthode `copy(a)` pour copier la position d'un autre anneau.

- **Classe `Serpent`** :
  - Gère un tableau d'objets `Anneau`.
  - Distingue visuellement la tête, le corps et la queue via des variables de couleur (`darkgreen`, `green`).
  - Méthode `move()` : orchestre le suivi des anneaux (le $n$-ième récupère la position du $n-1$).
  - Méthode `extend()` : permet d'allonger le serpent par la queue.

### Environnement

- **Vite** : Utilisé comme serveur de développement et outil de build.
- **Canvas 2D** : Utilisé pour le rendu graphique (grille de 400x400 pixels découpée en cellules de 20x20).

## 👩‍💻 Installation

1. Installez les dépendances :
   ```bash
   pnpm install
   ```
2. Lancez le serveur de développement :
   ```bash
   pnpm run dev
   ```

## 📝 Auteur

Projet réalisé dans le cadre du TP de MMI 2 - Université de Strasbourg.
