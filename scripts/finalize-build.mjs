import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outputRoot = path.join(root, "dist");
const albums = JSON.parse(
  await readFile(path.join(root, "assets/data/albums.json"), "utf8"),
);

await Promise.all([
  mkdir(path.join(outputRoot, "assets/data"), { recursive: true }),
  mkdir(path.join(outputRoot, "images"), { recursive: true }),
  mkdir(path.join(outputRoot, "photography"), { recursive: true }),
]);

await Promise.all([
  copyFile(
    path.join(root, "assets/data/albums.json"),
    path.join(outputRoot, "assets/data/albums.json"),
  ),
  copyFile(
    path.join(root, "images/kevin-blum-social-v4.png"),
    path.join(outputRoot, "images/kevin-blum-social-v4.png"),
  ),
]);

const derivativeWidths = [480, 960, 1600];
await Promise.all(
  Object.entries(albums).flatMap(([slug, album]) =>
    album.photos.flatMap((photo) =>
      derivativeWidths.map(async (width) => {
        const filename = `${photo.file}-${width}.jpg`;
        const outputDirectory = path.join(outputRoot, "images/optimized", slug);
        await mkdir(outputDirectory, { recursive: true });
        await copyFile(
          path.join(root, "images/optimized", slug, filename),
          path.join(outputDirectory, filename),
        );
      }),
    ),
  ),
);

const albumTemplate = await readFile(path.join(outputRoot, "album.html"), "utf8");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

for (const [slug, album] of Object.entries(albums)) {
  const description = escapeHtml(album.description);
  const albumTitle = escapeHtml(album.title);
  const albumKicker = escapeHtml(album.kicker);
  const photoMarkup = album.photos
    .map(
      (photo, index) => `        <figure class="photo-frame photo-frame--static">
          <img
            src="/images/optimized/${slug}/${photo.file}-960.jpg"
            srcset="/images/optimized/${slug}/${photo.file}-480.jpg 480w, /images/optimized/${slug}/${photo.file}-960.jpg 960w"
            sizes="(max-width: 700px) 100vw, 50vw"
            width="${photo.width}"
            height="${photo.height}"
            alt="${escapeHtml(photo.alt)}"
            loading="${index < 2 ? "eager" : "lazy"}"
            decoding="async"
          />
          <figcaption>${String(index + 1).padStart(2, "0")} · ${escapeHtml(photo.caption)}</figcaption>
        </figure>`,
    )
    .join("\n");
  const socialImage = `https://kevinblum.dev/images/optimized/${slug}/${album.photos[0].file}-1600.jpg`;
  const page = albumTemplate
    .replace(
      "<title>Film album — Kevin Blum</title>",
      `<title>${albumTitle} — Photography by Kevin Blum</title>`,
    )
    .replace(
      'content="A film photography album by Kevin Blum."',
      `content="${description}"`,
    )
    .replace(
      "<link rel=\"stylesheet\"",
      `<link rel="canonical" href="https://kevinblum.dev/photography/${slug}.html" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${albumTitle} — Photography by Kevin Blum" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="https://kevinblum.dev/photography/${slug}.html" />
    <meta property="og:image" content="${socialImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet"`,
    )
    .replace(
      "<body data-gallery-page>",
      `<body data-gallery-page data-album="${slug}">`,
    )
    .replace(
      "<span data-album-breadcrumb>Album</span>",
      `<span data-album-breadcrumb>${albumTitle}</span>`,
    )
    .replace(
      "<p class=\"eyebrow\" data-album-kicker>Film album</p>",
      `<p class="eyebrow" data-album-kicker>${albumKicker}</p>`,
    )
    .replace(
      "<h1 data-album-title>Loading album…</h1>",
      `<h1 data-album-title>${albumTitle}</h1>`,
    )
    .replace(
      "<p data-album-description></p>",
      `<p data-album-description>${description}</p>`,
    )
    .replace(
      "<span data-album-count></span>",
      `<span data-album-count>${album.photos.length} ${
        album.photos.length === 1 ? "photograph" : "photographs"
      }</span>`,
    )
    .replace(
      '<section class="photo-grid" data-photo-grid aria-label="Photographs"></section>',
      `<section class="photo-grid" data-photo-grid aria-label="Photographs">
${photoMarkup}
      </section>`,
    );

  await writeFile(path.join(outputRoot, "photography", `${slug}.html`), page);
}

console.log(
  `Finalized ${Object.keys(albums).length} album pages and responsive photo assets.`,
);
