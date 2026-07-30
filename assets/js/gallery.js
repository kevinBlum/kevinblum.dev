const galleryPage = document.querySelector("[data-gallery-page]");

if (galleryPage) {
  const requestedAlbum = new URLSearchParams(window.location.search).get("album");
  const embeddedAlbum = galleryPage.dataset.album;
  let albumSlug = "iceland";

  const nodes = {
    breadcrumb: document.querySelector("[data-album-breadcrumb]"),
    kicker: document.querySelector("[data-album-kicker]"),
    title: document.querySelector("[data-album-title]"),
    description: document.querySelector("[data-album-description]"),
    count: document.querySelector("[data-album-count]"),
    grid: document.querySelector("[data-photo-grid]"),
    viewer: document.querySelector("[data-photo-viewer]"),
    viewerImage: document.querySelector("[data-viewer-image]"),
    viewerCaption: document.querySelector("[data-viewer-caption]"),
    close: document.querySelector("[data-viewer-close]"),
    previous: document.querySelector("[data-viewer-previous]"),
    next: document.querySelector("[data-viewer-next]"),
  };

  let photos = [];
  let currentIndex = 0;

  const optimizedPath = (photo, width) =>
    `/images/optimized/${albumSlug}/${photo.file}-${width}.jpg`;

  const showPhoto = (index) => {
    currentIndex = (index + photos.length) % photos.length;
    const photo = photos[currentIndex];

    nodes.viewerImage.src = optimizedPath(photo, 1600);
    nodes.viewerImage.srcset = `${optimizedPath(photo, 960)} 960w, ${optimizedPath(
      photo,
      1600,
    )} 1600w`;
    nodes.viewerImage.alt = photo.alt;
    nodes.viewerCaption.textContent = `${currentIndex + 1} / ${photos.length} · ${
      photo.caption
    }`;
  };

  const openPhoto = (index) => {
    showPhoto(index);
    nodes.viewer.showModal();
  };

  fetch("/assets/data/albums.json")
    .then((response) => {
      if (!response.ok) throw new Error("The album index could not be loaded.");
      return response.json();
    })
    .then((albums) => {
      albumSlug =
        embeddedAlbum && Object.hasOwn(albums, embeddedAlbum)
          ? embeddedAlbum
          : requestedAlbum && Object.hasOwn(albums, requestedAlbum)
            ? requestedAlbum
            : "iceland";
      const album = albums[albumSlug];
      photos = album.photos;

      document.title = `${album.title} — Photography by Kevin Blum`;
      nodes.breadcrumb.textContent = album.title;
      nodes.kicker.textContent = album.kicker;
      nodes.title.textContent = album.title;
      nodes.description.textContent = album.description;
      nodes.count.textContent = `${photos.length} ${
        photos.length === 1 ? "photograph" : "photographs"
      }`;

      const fragment = document.createDocumentFragment();

      photos.forEach((photo, index) => {
        const button = document.createElement("button");
        button.className = "photo-frame";
        button.type = "button";
        button.setAttribute("aria-label", `View ${photo.caption}`);

        const image = document.createElement("img");
        image.src = optimizedPath(photo, 960);
        image.srcset = `${optimizedPath(photo, 480)} 480w, ${optimizedPath(
          photo,
          960,
        )} 960w`;
        image.sizes = "(max-width: 700px) 100vw, 50vw";
        image.width = photo.width;
        image.height = photo.height;
        image.alt = photo.alt;
        image.loading = index < 2 ? "eager" : "lazy";
        image.decoding = "async";

        const caption = document.createElement("span");
        caption.textContent = `${String(index + 1).padStart(2, "0")} · ${
          photo.caption
        }`;

        button.append(image, caption);
        button.addEventListener("click", () => openPhoto(index));
        fragment.append(button);
      });

      nodes.grid.replaceChildren(fragment);
    })
    .catch((error) => {
      nodes.title.textContent = "Album unavailable";
      nodes.description.textContent = error.message;
    });

  nodes.close.addEventListener("click", () => nodes.viewer.close());
  nodes.previous.addEventListener("click", () => showPhoto(currentIndex - 1));
  nodes.next.addEventListener("click", () => showPhoto(currentIndex + 1));
  nodes.viewer.addEventListener("click", (event) => {
    if (event.target === nodes.viewer) nodes.viewer.close();
  });
  nodes.viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(currentIndex - 1);
    if (event.key === "ArrowRight") showPhoto(currentIndex + 1);
  });
}
