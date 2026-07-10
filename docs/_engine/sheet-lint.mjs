/* ==========================================================================
   sheet-lint.mjs — verificateur deterministe des fiches personnage.
   Recalcule chaque personnage via le moteur et signale les problemes
   (compteurs depasses, sort auto oublie, doublon non marque, objet non
   decompose, statut invalide, requires non satisfait, etc.).
   Usage : node docs/_engine/sheet-lint.mjs            (tous les personnages)
           node docs/_engine/sheet-lint.mjs medicis    (un seul)
   Code de sortie non nul si au moins une erreur.
   ========================================================================== */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeCharacter } from "./build-character.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHARDIR = join(HERE, "..", "characters");

let ids = process.argv.slice(2);
if (!ids.length) {
  ids = readdirSync(CHARDIR).filter((f) => f.endsWith(".character.json")).map((f) => f.replace(/\.character\.json$/, ""));
}

let totalErr = 0, totalWarn = 0;
for (const id of ids) {
  const model = JSON.parse(readFileSync(join(CHARDIR, `${id}.character.json`), "utf8"));
  const C = computeCharacter(model);
  const errs = C.problems.filter((p) => p.level === "error");
  const warns = C.problems.filter((p) => p.level === "warn");
  totalErr += errs.length; totalWarn += warns.length;
  const tag = errs.length ? "ERREUR" : "ok";
  console.log(`[${tag}] ${id} — ${errs.length} erreur(s), ${warns.length} avertissement(s)`);
  C.problems.forEach((p) => console.log(`     [${p.level}] ${p.msg}`));
}
console.log(`\nTotal : ${totalErr} erreur(s), ${totalWarn} avertissement(s) sur ${ids.length} personnage(s).`);
process.exit(totalErr ? 1 : 0);
