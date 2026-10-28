import { useEffect, useMemo, useRef, useState } from "react";
import { randomAosAnimation } from "../aosAnimations.js";
import { supabase } from "../lib/supabase.js";
import { slides } from "../slides.js";

export default function MessageSlider({ currentSlide, onChangeSlide, onChooseResponse }) {
  const maybeLaterDodgeOffsets = [
    { x: 12, y: -28 },
    { x: -16, y: 20 },
    { x: 8, y: -32 },
    { x: -10, y: -20 },
    { x: 0, y: 22 },
  ];
  const slide = slides[currentSlide];
  const animation = useMemo(() => randomAosAnimation(), [currentSlide]);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSavingResponse, setIsSavingResponse] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [hasSubmittedMaybeLater, setHasSubmittedMaybeLater] = useState(false);
  const [isMaybeLaterCueVisible, setShowMaybeLaterCue] = useState(false);
  const transitionTimer = useRef(null);
  const maybeLaterCueTimer = useRef(null);
  const maybeLaterActionRef = useRef(null);
  const maybeLaterDodgeCount = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(transitionTimer.current);
      window.clearTimeout(maybeLaterCueTimer.current);
    },
    [],
  );

  function showMaybeLaterCue() {
    setShowMaybeLaterCue(true);
    window.clearTimeout(maybeLaterCueTimer.current);
    maybeLaterCueTimer.current = window.setTimeout(() => setShowMaybeLaterCue(false), 1500);
  }

  function dodgeMaybeLater(event) {
    showMaybeLaterCue();
    if (isSavingResponse || hasSubmittedMaybeLater) return;
    if (event.type === "pointerdown") event.preventDefault();
    const offset = maybeLaterDodgeOffsets[maybeLaterDodgeCount.current % maybeLaterDodgeOffsets.length];
    maybeLaterDodgeCount.current += 1;
    maybeLaterActionRef.current?.style.setProperty("--maybe-dodge-x", `${offset.x}px`);
    maybeLaterActionRef.current?.style.setProperty("--maybe-dodge-y", `${offset.y}px`);
  }

  function moveTo(index) {
    if (isLeaving || index === currentSlide) return;
    setIsLeaving(true);
    transitionTimer.current = window.setTimeout(() => {
      onChangeSlide(index);
      setIsLeaving(false);
    }, 260);
  }

  async function chooseResponse(accepted) {
    setResponseError("");
    if (accepted) {
      onChooseResponse(true);
      return;
    }

    if (!supabase) {
      setResponseError("This response can't be saved right now. Please try again later.");
      return;
    }

    setIsSavingResponse(true);
    try {
      const { error } = await supabase
        .from("dinner_choices")
        .insert({ response: "maybe_later" });
      if (error) {
        console.error("Could not save the maybe-later response.", error);
        setResponseError("Your response couldn't be saved just yet. Please try again.");
        return;
      }
      setHasSubmittedMaybeLater(true);
    } catch (error) {
      console.error("Could not save the maybe-later response.", error);
      setResponseError("Your response couldn't be saved just yet. Please try again.");
    } finally {
      setIsSavingResponse(false);
    }
  }

  return (
    <section
      className={`content message-position-${currentSlide}`}
      aria-labelledby="slide-title"
    >
      <div
        className={`slide-copy${isLeaving ? " is-leaving" : ""}`}
        key={currentSlide}
        data-aos={animation}
        data-aos-duration="750"
      >
        <p className="eyebrow">{slide.eyebrow}</p>
        <h2 id="slide-title">{slide.title}</h2>
        <p className="message-copy">{slide.message}</p>
      </div>
      <nav className="progress" aria-label="Message progress">
        {slides.map((item, index) => (
          <button
            className="progress-dot"
            type="button"
            key={item.title}
            onClick={() => moveTo(index)}
            aria-label={`Go to message ${index + 1}`}
            aria-current={index === currentSlide ? "step" : undefined}
          />
        ))}
      </nav>
      {slide.invitation ? (
        <>
          {responseError && <p className="calendar-error" role="alert">{responseError}</p>}
          <div className="ask-actions">
            <button
              className="primary-button"
              type="button"
              disabled={isSavingResponse}
              onClick={() => void chooseResponse(true)}
            >
              Yes, I&apos;d like that
            </button>
            <span
              ref={maybeLaterActionRef}
              className="maybe-later-action"
            >
              {isMaybeLaterCueVisible && (
                <span className="maybe-later-cue" aria-hidden="true">😂 👈 YES!</span>
              )}
              <button
                className="secondary-button"
                type="button"
                disabled={isSavingResponse || hasSubmittedMaybeLater}
                onPointerEnter={dodgeMaybeLater}
                onPointerDown={dodgeMaybeLater}
                onFocus={showMaybeLaterCue}
                onClick={(event) => {
                  if (event.detail === 0) void chooseResponse(false);
                }}
              >
                {isSavingResponse ? "Saving your response..." : "Maybe later"}
              </button>
            </span>
          </div>
        </>
      ) : (
        <div className="slide-actions">
          <button
            className="text-button"
            type="button"
            onClick={() => moveTo(Math.max(currentSlide - 1, 0))}
            disabled={currentSlide === 0 || isLeaving}
          >
            Back
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => moveTo(Math.min(currentSlide + 1, slides.length - 1))}
            disabled={isLeaving}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
