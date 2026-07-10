/* ==========================================================================
   serve.mjs — micro-serveur statique (zero dependance) pour le site docs/.
   Racine = docs/ (parent de _engine) : le builder atteint /_engine/ et /data/.
   Usage : node docs/_engine/serve.mjs [port]   (defaut 8000)
   Ouvrir : http://localhost:8000/html/builder.html
   MIME correct pour .mjs/.js (modules ES) et .json.
   ========================================================================== */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); // docs/
const PORT = Number(process.argv[2]) || 8000;
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; } // pas de remontee au-dessus de docs/
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 Not Found");
  }
});
server.listen(PORT, () => console.log(`docs/ servi sur http://localhost:${PORT}/  (builder : http://localhost:${PORT}/html/builder.html)`));
