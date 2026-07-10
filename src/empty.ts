// Module vide pour le navigateur : le moteur docs/_engine référence node:fs/url/path
// dans des fonctions Node-only (loadCatalogNode, bloc CLI) qui NE s'exécutent jamais côté
// client (gardées par `typeof process`). Turbopack les résout ici pour les bundles browser.
export {};
