import { useMemo } from "react";
import { randomAosAnimation } from "../aosAnimations.js";

export default function Hero({ onOpen }) {
  const animation = useMemo(() => randomAosAnimation(), []);

  return (
    <section className="content hero" aria-labelledby="hero-title">
      <p className="eyebrow" data-aos={animation}>From the heart</p>
      <h1 id="hero-title" data-aos={animation}>
        I&apos;m sorry, Shade.
      </h1>
      <p className="hero-copy" data-aos={animation}>
        I should have said that first.
      </p>
      <button
        className="primary-button hero-open"
        type="button"
        onClick={onOpen}
        data-aos={animation}
      >
        Read my note
      </button>
    </section>
  );
}
