const animations = ["fade", "fade-left", "fade-right", "zoom-in", "zoom-out", "flip-left", "flip-right"];

export function randomAosAnimation() {
  return animations[Math.floor(Math.random() * animations.length)];
}
