import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const albumPath = path.join(root, "assets/data/albums.json");
const albums = JSON.parse(await readFile(albumPath, "utf8"));
const missing = [];
const errors = [];
const outputNames = new Set();

for (const [albumSlug, album] of Object.entries(albums)) {
  for (const field of ["title", "kicker", "description"]) {
    if (!album[field]?.trim()) errors.push(`${albumSlug} is missing ${field}`);
  }

  for (const photo of album.photos) {
    if (!photo.original && !photo.archiveSource) {
      errors.push(`${albumSlug}/${photo.file} has no source`);
    }
    if (!photo.caption?.trim() || !photo.alt?.trim()) {
      errors.push(`${albumSlug}/${photo.file} needs caption and alt text`);
    }
    if (outputNames.has(`${albumSlug}/${photo.file}`)) {
      errors.push(`Duplicate photo output: ${albumSlug}/${photo.file}`);
    }
    outputNames.add(`${albumSlug}/${photo.file}`);

    for (const width of [480, 960, 1600]) {
      const variant = path.join(
        root,
        "images/optimized",
        albumSlug,
        `${photo.file}-${width}.jpg`,
      );

      try {
        await access(variant);
      } catch {
        missing.push(path.relative(root, variant));
      }
    }

  }
}

const htmlFiles = [
  "index.html",
  "work.html",
  "photography.html",
  "album.html",
  "writing.html",
  "taylor.html",
  "vow.html",
  "404.html",
  "iceland.html",
  "openletter.html",
];
const generatedRoutes = new Set(
  Object.keys(albums).map((slug) => `photography/${slug}.html`),
);

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(root, htmlFile), "utf8");
  if (/album=vermont|optimized\/vermont/.test(html)) {
    errors.push(`${htmlFile} contains a stale Vermont gallery reference`);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|#|data:)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    let relativePath = clean.startsWith("/")
      ? clean.slice(1)
      : path.join(path.dirname(htmlFile), clean);
    if (!relativePath) relativePath = "index.html";
    if (relativePath.endsWith("/")) relativePath += "index.html";
    if (generatedRoutes.has(relativePath)) continue;
    try {
      await access(path.join(root, relativePath));
    } catch {
      errors.push(`${htmlFile} references missing ${reference}`);
    }
  }
}

if (missing.length > 0 || errors.length > 0) {
  if (missing.length) {
    console.error(`Missing ${missing.length} photo files:\n${missing.join("\n")}`);
  }
  if (errors.length) {
    console.error(`Validation errors:\n${errors.join("\n")}`);
  }
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} pages, ${Object.keys(albums).length} albums, and ${Object.values(albums).reduce(
    (total, album) => total + album.photos.length,
  0,
  )} photographs.`,
);
