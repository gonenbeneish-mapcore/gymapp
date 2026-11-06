const screens = {
  bank: "screen-bank",
  workouts: "screen-workouts",
  session: "screen-session",
  history: "screen-history",
};

function qs(sel) {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
}

function setActiveScreen(key) {
  const screenId = screens[key];
  if (!screenId) return;

  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("screen--active"));
  qs(`#${screenId}`).classList.add("screen--active");

  document.querySelectorAll(".navItem").forEach((b) => b.classList.remove("navItem--active"));
  document.querySelectorAll(`.navItem[data-nav="${key}"]`).forEach((b) => b.classList.add("navItem--active"));

  const title = qs(`#${screenId}`).dataset.title || "GymApp";
  qs("#screenTitle").textContent = title;
}

// Bottom nav and any buttons with data-nav
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  const btn = t.closest("[data-nav]");
  if (!btn) return;
  const key = btn.getAttribute("data-nav");
  if (!key) return;
  setActiveScreen(key);
});

// ----- Rest timer demo -----
const timerDisplay = qs("#timerDisplay");
const timerBadge = qs("#timerBadge");
const startBtn = qs("#timerStart");
const pauseBtn = qs("#timerPause");
const resetBtn = qs("#timerReset");
const demoDoneBtn = qs("#timerDemoDone");

let initialSeconds = 90; // 01:30 demo
let secondsLeft = initialSeconds;
let intervalId = null;

function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setBlink(on) {
  // Blink both the accent card and the badge when done.
  const card = timerDisplay.closest(".card");
  if (card) card.classList.toggle("blink", on);
  timerBadge.classList.toggle("blink", on);
}

function renderTimer() {
  const txt = fmtTime(secondsLeft);
  timerDisplay.textContent = txt;
  timerBadge.textContent = `Rest: ${txt}`;
}

function tick() {
  secondsLeft = Math.max(0, secondsLeft - 1);
  renderTimer();
  if (secondsLeft === 0) {
    stop();
    setBlink(true);
  }
}

function start() {
  if (intervalId) return;
  setBlink(false);
  intervalId = window.setInterval(tick, 1000);
}

function stop() {
  if (!intervalId) return;
  window.clearInterval(intervalId);
  intervalId = null;
}

function reset() {
  stop();
  secondsLeft = initialSeconds;
  setBlink(false);
  renderTimer();
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", stop);
resetBtn.addEventListener("click", reset);
demoDoneBtn.addEventListener("click", () => {
  stop();
  secondsLeft = 0;
  renderTimer();
  setBlink(true);
});

renderTimer();

// Start on Bank screen by default
setActiveScreen("bank");
