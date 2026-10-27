import { slides } from "./slides.js";

const experience = document.querySelector("#experience");
let currentSlide = 0;

function renderHero() {
  experience.innerHTML = `
    <section class="content hero" aria-labelledby="hero-title">
      <p class="eyebrow">A small note for you</p>
      <h1 id="hero-title">
        <span class="hero-line">Hi, Shade.</span>
        <span class="hero-line">I owe you something.</span>
      </h1>
      <p class="hero-copy">Nothing complicated. Just a few things I should have said.</p>
      <button class="primary-button hero-open" type="button" data-action="open">Open</button>
    </section>
  `;
}

function renderSlide() {
  const slide = slides[currentSlide];
  const dots = slides
    .map(
      (_, index) => `
        <button
          class="progress-dot"
          type="button"
          data-action="go-to"
          data-index="${index}"
          aria-label="Go to message ${index + 1}"
          ${index === currentSlide ? 'aria-current="step"' : ""}
        ></button>
      `,
    )
    .join("");
  const actions = slide.invitation
    ? `
      <div class="ask-actions">
        <button class="primary-button" type="button" data-action="yes">Yes, I'd like that</button>
        <button class="secondary-button" type="button" data-action="later">Maybe later</button>
      </div>
    `
    : `
      <div class="slide-actions">
        <button class="text-button" type="button" data-action="previous" ${currentSlide === 0 ? "disabled" : ""}>Back</button>
        <button class="primary-button" type="button" data-action="next">Next</button>
      </div>
    `;

  experience.innerHTML = `
    <section class="content" aria-labelledby="slide-title">
      <p class="eyebrow">${slide.eyebrow}</p>
      <h2 id="slide-title">${slide.title}</h2>
      <p class="message-copy">${slide.message}</p>
      <nav class="progress" aria-label="Message progress">
        ${dots}
        <span class="progress-label">0${currentSlide + 1} / 0${slides.length}</span>
      </nav>
      ${actions}
    </section>
  `;
}

function renderResponse(accepted) {
  experience.innerHTML = accepted
    ? `
      <section class="content" aria-labelledby="response-title">
        <p class="eyebrow">Thank you for hearing me</p>
        <h2 id="response-title">That would mean a lot.</h2>
        <p class="response-copy">No rush to figure anything out right now. If there's a day that works for you, you can pick one here and let me know whenever you're ready.</p>
        <label class="date-field" for="dinner-date">
          A day that works for you
          <input id="dinner-date" type="date" />
          <span class="date-hint">This stays on your device. You can share your choice whenever you feel like it.</span>
        </label>
      </section>
    `
    : `
      <section class="content" aria-labelledby="response-title">
        <p class="eyebrow">Of course</p>
        <h2 id="response-title">No pressure at all.</h2>
        <p class="response-copy">Thank you for reading this. I respect where you're at, and I won't ask you to respond.</p>
        <div class="response-actions">
          <button class="text-button" type="button" data-action="close">Close this note</button>
        </div>
      </section>
    `;
}

experience.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  switch (button.dataset.action) {
    case "open":
      currentSlide = 0;
      renderSlide();
      break;
    case "next":
      currentSlide = Math.min(currentSlide + 1, slides.length - 1);
      renderSlide();
      break;
    case "previous":
      currentSlide = Math.max(currentSlide - 1, 0);
      renderSlide();
      break;
    case "go-to":
      currentSlide = Number(button.dataset.index);
      renderSlide();
      break;
    case "yes":
      renderResponse(true);
      break;
    case "later":
      renderResponse(false);
      break;
    case "close":
      renderHero();
      break;
  }
});

renderHero();
