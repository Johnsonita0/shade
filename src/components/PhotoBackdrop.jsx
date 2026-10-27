import { useEffect, useState } from "react";

function isPhotoFilename(filename) {
  return (
    typeof filename === "string" &&
    /^[\w.-]+\.(jpg|jpeg|png|webp|avif)$/i.test(filename)
  );
}

export default function PhotoBackdrop() {
  const [photos, setPhotos] = useState([]);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPhotos() {
      try {
        const response = await fetch("/photos.json");
        if (response.status === 404) return;
        if (!response.ok) throw new Error(`Could not load photos.json: ${response.status}`);

        const filenames = await response.json();
        if (!Array.isArray(filenames)) {
          throw new Error("public/photos.json must contain an array of image filenames.");
        }

        const loadedPhotos = await Promise.all(
          filenames.filter(isPhotoFilename).slice(0, 6).map(
            (filename) =>
              new Promise((resolve) => {
                const image = new Image();
                image.onload = () => resolve(`/photos/${filename}`);
                image.onerror = () => {
                  console.warn(`Could not load background photo: ${filename}`);
                  resolve(null);
                };
                image.src = `/photos/${filename}`;
              }),
          ),
        );

        if (active) setPhotos(loadedPhotos.filter(Boolean));
      } catch (error) {
        if (error instanceof TypeError) {
          console.error("Could not load the background photo list.", error);
          return;
        }
        throw error;
      }
    }

    void loadPhotos();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (photos.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActivePhoto((index) => (index + 1) % photos.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  return (
    <div className={`photo-backdrop${photos.length ? "" : " has-no-photos"}`} aria-hidden="true">
      {photos.map((photo, index) => (
        <div
          className={`backdrop-photo${activePhoto === index ? " is-active" : ""}${photos.length === 1 ? " is-single-photo" : ""}`}
          key={photo}
          style={{ backgroundImage: `url("${photo}")` }}
        />
      ))}
    </div>
  );
}
