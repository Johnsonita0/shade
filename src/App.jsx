import { useCallback, useEffect, useRef, useState } from "react";
import AOS from "aos";
import Admin from "./components/Admin.jsx";
import PhotoBackdrop from "./components/PhotoBackdrop.jsx";
import Fireworks from "./components/Fireworks.jsx";
import Hero from "./components/Hero.jsx";
import MessageSlider from "./components/MessageSlider.jsx";
import Response from "./components/Response.jsx";
import Splash from "./components/Splash.jsx";

const savedResponseKey = "shade-invitation-response";
const postYesFlowEnabled = true;

function readSavedResponse() {
  try {
    const savedResponse = JSON.parse(window.localStorage.getItem(savedResponseKey) || "null");
    if (
      savedResponse?.type === "date_selected" &&
      /^\d{4}-\d{2}-\d{2}$/.test(savedResponse.choice?.date) &&
      /^\d{2}:\d{2}$/.test(savedResponse.choice?.time)
    ) {
      return savedResponse;
    }
  } catch (error) {
    console.error("Could not read the saved invitation response.", error);
  }
  return null;
}

export default function App() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, "") === "/admin";
  const [savedResponse, setSavedResponse] = useState(readSavedResponse);
  const [screen, setScreen] = useState(() => {
    if (postYesFlowEnabled && savedResponse?.type === "date_selected") return "yes";
    return "hero";
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(!savedResponse);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [heroAnimationKey, setHeroAnimationKey] = useState(0);
  const musicRef = useRef(null);
  const [submittedChoice, setSubmittedChoice] = useState(() =>
    savedResponse?.type === "date_selected" ? savedResponse.choice : null,
  );
  const [followUpSubmitted, setFollowUpSubmitted] = useState(
    Boolean(savedResponse?.followUpSubmitted),
  );

  const saveResponse = (nextResponse) => {
    setSavedResponse(nextResponse);
    try {
      window.localStorage.setItem(savedResponseKey, JSON.stringify(nextResponse));
    } catch (error) {
      console.error("Could not persist the invitation response in this browser.", error);
    }
  };

  const playBackgroundMusic = useCallback(async () => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.volume = 0.2;
    audio.muted = false;
    try {
      await audio.play();
      setIsMusicPlaying(true);
    } catch {
      setIsMusicPlaying(false);
    }
  }, []);

  const startCharmTrack = useCallback(async () => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "/charm.aac";
    audio.load();
    audio.volume = 0.2;
    try {
      await audio.play();
      setIsMusicPlaying(!audio.muted);
    } catch {
      setIsMusicPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (showSplash) return;
    void playBackgroundMusic();
  }, [showSplash, playBackgroundMusic]);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
    setShowFireworks(true);
    setHeroAnimationKey((key) => key + 1);
  }, []);
  const handleFireworksFinished = useCallback(() => setShowFireworks(false), []);

  const handleMusicToggle = () => {
    const audio = musicRef.current;
    if (!audio) return;
    if (audio.paused || audio.muted) {
      void playBackgroundMusic();
    } else {
      audio.muted = true;
      setIsMusicPlaying(false);
    }
  };

  useEffect(() => {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
      offset: 0,
      disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  useEffect(() => {
    if (!isAdminRoute) return undefined;
    document.body.classList.add("admin-route");
    return () => document.body.classList.remove("admin-route");
  }, [isAdminRoute]);

  useEffect(() => {
    const refreshAnimations = () => {
      AOS.refreshHard();
      window.dispatchEvent(new Event("scroll"));
    };
    const frame = window.requestAnimationFrame(refreshAnimations);
    return () => window.cancelAnimationFrame(frame);
  }, [screen, currentSlide]);

  const handleOpenNote = () => {
    setCurrentSlide(0);
    setScreen("messages");
    if (musicRef.current?.paused) void playBackgroundMusic();
  };

  if (isAdminRoute) return <Admin />;

  return (
    <div className="app-shell">
      <audio
        ref={musicRef}
        src="/forgeive.mp3"
        loop
        preload="auto"
        onPlay={() => setIsMusicPlaying(!musicRef.current?.muted)}
      />
      <PhotoBackdrop />
      <div className="backdrop-shade" aria-hidden="true" />
      <header className="scene-header" aria-label="A note for Shade">
        <span className="scene-note">A note, just for you</span>
        {!showSplash && (
          <button
            className="music-toggle"
            type="button"
            aria-label={isMusicPlaying ? "Mute background music" : "Unmute background music"}
            aria-pressed={isMusicPlaying}
            onClick={handleMusicToggle}
          >
            {isMusicPlaying ? "Music on" : "Music off"}
          </button>
        )}
      </header>
      <main
        className={`page${screen === "yes" && !submittedChoice ? " page-calendar" : ""}${screen === "messages" ? " page-messages" : ""}${screen === "yes" && submittedChoice ? " page-celebration" : ""}`}
        inert={showSplash || undefined}
      >
        <div className="letter">
          <div id="experience" aria-live="polite" aria-atomic="true">
            {screen === "hero" && <Hero key={heroAnimationKey} onOpen={handleOpenNote} />}
            {screen === "messages" && (
              <MessageSlider
                currentSlide={currentSlide}
                onChangeSlide={setCurrentSlide}
                onChooseResponse={() => {
                  if (!postYesFlowEnabled) return;
                  void startCharmTrack();
                  setSubmittedChoice(null);
                  setScreen("yes");
                }}
              />
            )}
            {(screen === "yes" || screen === "later") && (
              <Response
                accepted={screen === "yes"}
                submittedChoice={submittedChoice}
                followUpSubmitted={followUpSubmitted}
                onSubmitted={(date, time, timeZone) => {
                  const choice = { date, time, timeZone };
                  setSubmittedChoice(choice);
                  setFollowUpSubmitted(false);
                  saveResponse({ type: "date_selected", choice, followUpSubmitted: false });
                }}
                onFollowUpSubmitted={(followUpType) => {
                  setFollowUpSubmitted(true);
                  if (followUpType === "maybe_later") setScreen("later");
                  if (savedResponse?.type === "date_selected") {
                    saveResponse({ ...savedResponse, followUpSubmitted: true });
                  }
                }}
                onClose={() => setScreen("hero")}
              />
            )}
          </div>
        </div>
      </main>
      <footer className="scene-footer">
        <span>Take all the time you need.</span>
        <span aria-hidden="true">A quiet moment, with no expectation.</span>
      </footer>
      {showSplash && <Splash onFinished={handleSplashFinished} />}
      {showFireworks && <Fireworks onFinished={handleFireworksFinished} />}
      {screen === "yes" && submittedChoice && <Fireworks continuous />}
    </div>
  );
}
