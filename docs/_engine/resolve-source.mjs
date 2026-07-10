#!/usr/bin/env node
// resolve-source — resout un identifiant `source` du catalogue vers l'image de page.
//
// Depuis la consolidation (2026-07-09), les images sont dans docs/img/pages/NNN.jpeg,
// une par numero de page du livre, et les `source` du catalogue sont de la forme
// "img:<page>" (ex. "img:147") ou une liste "img:147,148". Index maitre :
// docs/_analysis/pages_manifest.csv (page;file;approx;quality;wh;entities).
//
// Usage: node docs/_engine/resolve-source.mjs "img:147,150"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PAGES = path.join(ROOT, 'img', 'pages');

const arg = (process.argv[2] || '').replace(/^img:/, '');
for (const tok of arg.split(',').map(s => s.trim()).filter(Boolean)) {
  if (!/^\d+$/.test(tok)) { console.log(tok, '-> ??? format attendu img:<page>'); continue; }
  const f = path.join(PAGES, tok.padStart(3, '0') + '.jpeg');
  console.log(tok, '->', fs.existsSync(f) ? f : `(pas d'image pour la page ${tok} — illustration pleine page ou page non photographiee)`);
}
