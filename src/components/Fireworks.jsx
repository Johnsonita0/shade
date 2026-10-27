import { useEffect } from "react";

const bursts = [0, 1, 2];

export default function Fireworks({ onFinished, continuous = false }) {
  useEffect(() => {
    if (continuous) return undefined;
    const timer = window.setTimeout(onFinished, 1800);
    return () => window.clearTimeout(timer);
  }, [continuous, onFinished]);

  return (
    <div className={`fireworks${continuous ? " fireworks-continuous" : ""}`} aria-hidden="true">
      {bursts.map((burst) => (
        <span className="firework" key={burst}>
          {Array.from({ length: 14 }, (_, index) => {
            const angle = Math.round((360 / 14) * index);
            return (
              <span
                className="firework-spark"
                key={angle}
                style={{
                  "--spark-angle": `${angle}deg`,
                  "--spark-delay": `${index * 12}ms`,
                }}
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}
