import { useEffect, useState } from "react";

function isPhotoFilename(filename) {
  return typeof filename === "string" && /^[\w.\s-]+\.(jpg|jpeg|png|webp|avif)$/i.test(filename);
}

function getCarouselOffset(index, activeIndex, length) {
  const distance = (index - activeIndex + length) % length;
  if (distance === 0) return "0%";
  return distance <= length / 2 ? "100%" : "-100%";
}

const preparationMessages = [
  "Finding the right words...",
  "Making room to say this properly...",
  "Getting this little note ready...",
  "Almost ready, Shade...",
];

export default function Splash({ onFinished }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [photos, setPhotos] = useState(["/photos/pic 1.jpg"]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPhotos() {
      try {
        const response = await fetch("/photos.json");
        if (!response.ok) throw new Error(`Could not load photos.json: ${response.status}`);

        const filenames = await response.json();
        if (!Array.isArray(filenames)) {
          throw new Error("public/photos.json must contain an array of image filenames.");
        }

        const photoPaths = filenames
          .filter(isPhotoFilename)
          .slice(0, 6)
          .map((filename) => `/photos/${filename}`);
        if (active && photoPaths.length > 0) setPhotos(photoPaths);

        const loadedPhotos = await Promise.all(
          photoPaths.map(
            (photoPath) =>
              new Promise((resolve) => {
                const image = new Image();
                image.onload = () => resolve(photoPath);
                image.onerror = () => {
                  console.warn(`Could not load splash photo: ${photoPath}`);
                  resolve(null);
                };
                image.src = photoPath;
              }),
          ),
        );
        if (active) setPhotos(loadedPhotos.filter(Boolean));
      } catch (error) {
        if (error instanceof TypeError) {
          console.error("Could not load splash photos.", error);
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
    let active = true;
    const contentTimer = window.setInterval(() => {
      setMessageIndex((index) => Math.min(index + 1, preparationMessages.length - 1));
    }, 1375);
    let removalTimer;
    const finishTimer = window.setTimeout(() => {
      setIsFinished(true);
      onFinished();
      removalTimer = window.setTimeout(() => {
        if (active) setIsRemoved(true);
      }, 650);
    }, 5500);

    return () => {
      active = false;
      window.clearInterval(contentTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(removalTimer);
    };
  }, [onFinished]);

  useEffect(() => {
    if (photos.length < 2) return undefined;
    const photoTimer = window.setInterval(() => {
      setActivePhoto((index) => (index + 1) % photos.length);
    }, 5600);
    return () => window.clearInterval(photoTimer);
  }, [photos.length]);

  if (isRemoved) return null;

  return (
    <div className={`splash${isFinished ? " is-finished" : ""}`} role="status" aria-live="polite">
      {photos.length > 0 && (
        <div className="splash-photo-background" aria-hidden="true">
          {photos.map((photo, index) => (
            <div
              className={`splash-background-photo${index === activePhoto ? " is-active" : ""}`}
              key={photo}
              data-photo-index={index}
              style={{
                "--photo-offset": getCarouselOffset(index, activePhoto, photos.length),
                backgroundImage: `url("${photo}")`,
              }}
            />
          ))}
        </div>
      )}
      <div className="splash-content">
        {photos.length > 0 && (
          <div className="splash-photo-frame" aria-hidden="true">
            {photos.map((photo, index) => (
              <img
                className={`splash-portrait${index === activePhoto ? " is-active" : ""}`}
                src={photo}
                alt=""
                key={photo}
                data-photo-index={index}
                style={{ "--photo-offset": getCarouselOffset(index, activePhoto, photos.length) }}
              />
            ))}
          </div>
        )}
        <p className="splash-eyebrow">Just for you</p>
        <h1 className="splash-title">Preparing my apology note...</h1>
        <p className="splash-message" key={messageIndex}>
          {preparationMessages[messageIndex]}
        </p>
        <p className="splash-privacy-note">Take your time. You can close this note whenever you like.</p>
        <div className="splash-progress" role="presentation">
          <span />
        </div>
      </div>
    </div>
  );
}
