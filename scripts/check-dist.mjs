import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outputRoot = path.join(root, "dist");
const albums = JSON.parse(
  await readFile(path.join(root, "assets/data/albums.json"), "utf8"),
);
const required = [
  "index.html",
  "work.html",
  "photography.html",
  "photography/iceland.html",
  "photography/peru.html",
  "photography/burlington.html",
  "photography/home.html",
  "writing.html",
  "taylor.html",
  "vow.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  ".well-known/security.txt",
  "assets/data/albums.json",
  "images/kevin-blum-social-v4.png",
];

for (const relativePath of required) {
  await access(path.join(outputRoot, relativePath));
}

const sourceOnlyPaths = [
  "README.md",
  "PHOTO_LIBRARY.md",
  "package.json",
  "scripts",
  "docs",
  "images/iceland",
  "images/pic01.jpg",
];

for (const relativePath of sourceOnlyPaths) {
  try {
    await access(path.join(outputRoot, relativePath));
    throw new Error(`Source-only path leaked into dist: ${relativePath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const htmlFiles = [];
async function collectHtml(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectHtml(entryPath);
    if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(entryPath);
  }
}
await collectHtml(outputRoot);

for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|#|data:)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    let target = clean.startsWith("/")
      ? path.join(outputRoot, clean)
      : path.resolve(path.dirname(htmlPath), clean);
    if (target.endsWith(path.sep)) target = path.join(target, "index.html");
    await access(target);
  }
}

const optimized = await stat(path.join(outputRoot, "images/optimized"));
if (!optimized.isDirectory()) throw new Error("Optimized gallery assets are missing.");

for (const albumSlug of Object.keys(albums)) {
  const albumHtml = await readFile(
    path.join(outputRoot, "photography", `${albumSlug}.html`),
    "utf8",
  );
  if (albumHtml.includes("Loading album…")) {
    throw new Error(`${albumSlug} was not rendered with static album content.`);
  }
  if (!albumHtml.includes('class="photo-frame')) {
    throw new Error(`${albumSlug} is missing static photograph markup.`);
  }
}

console.log(`Checked production artifact with ${htmlFiles.length} HTML pages.`);
