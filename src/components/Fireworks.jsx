import { useEffect } from "react";

const bursts = [
  { x: 10, y: 17, delay: 0 },
  { x: 37, y: 12, delay: 140 },
  { x: 68, y: 17, delay: 280 },
  { x: 91, y: 35, delay: 420 },
  { x: 77, y: 61, delay: 560 },
  { x: 48, y: 76, delay: 700 },
  { x: 19, y: 63, delay: 840 },
  { x: 8, y: 39, delay: 980 },
];

export default function Fireworks({ onFinished, continuous = false }) {
  useEffect(() => {
    if (continuous) return undefined;
    const timer = window.setTimeout(onFinished, 3800);
    return () => window.clearTimeout(timer);
  }, [continuous, onFinished]);

  return (
    <div className={`fireworks${continuous ? " fireworks-continuous" : ""}`} aria-hidden="true">
      {bursts.map((burst) => (
        <span
          className="firework"
          key={`${burst.x}-${burst.y}`}
          style={{
            "--burst-x": `${burst.x}%`,
            "--burst-y": `${burst.y}%`,
            "--burst-delay": `${burst.delay}ms`,
          }}
        >
          {Array.from({ length: 24 }, (_, index) => {
            const angle = Math.round((360 / 24) * index);
            const distance = 84 + (index % 3) * 18;
            const radians = (angle * Math.PI) / 180;
            return (
              <span
                className="firework-spark"
                key={angle}
                style={{
                  "--spark-x": `${Math.cos(radians) * distance}px`,
                  "--spark-y": `${Math.sin(radians) * distance}px`,
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
