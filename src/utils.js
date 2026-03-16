/**
 * Fonctions utiles
 * @module utils
 */

/**
 * Fonction générant des nombres pseudo-aléatoires entiers
 * entre 0 et max (max non compris)
 * @param {*} max Valeur max entière (non comprise)
 * @returns Valeur aléatoire dans [0, max)
 */
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

/**
 * Fonction générant une couleur aléatoire
 * @returns Couleur aléatoire sous forme de chaîne de caractère CSS
 */
function getRandomColor() {
	const red = getRandomInt(256);
	const blue = getRandomInt(256);
	const green = getRandomInt(256);
	return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

export { getRandomInt, getRandomColor };
