document.addEventListener("DOMContentLoaded", () => {

/* =========================
   State
========================= */

const STATE = {
  PRE: "pre",
  IN: "in"
};

let gameState = STATE.PRE;

/* =========================
   DOM
========================= */

// Areas
const optionsArea = document.getElementById("optionsArea");
const ingameArea  = document.getElementById("ingameArea");
const optIgnoreWrapper = document.getElementById("optIgnoreWrapper");

// Buttons
const btnStart  = document.getElementById("btnStart");
const btnFinish = document.getElementById("btnFinish");
const btnHint   = document.getElementById("btnHint");

// Ingame
const wordInput   = document.getElementById("wordInput");
const statusText  = document.getElementById("statusText");
const historyText = document.getElementById("historyText");

// Options
const optPlatformer = document.getElementById("optPlatformer");
const optStartEnd   = document.getElementById("optStartEndNum");
const optIgnoreNum  = document.getElementById("optIgnoreTrailingNum");
const optOneShot    = document.getElementById("optAllowOneShot");
const optComputer   = document.getElementById("optComputerMode");

/* =========================
   Databases (global-loaded)
========================= */

const allDB = {
  classic: {
    no:  window.CLASSIC_NO  || [],
    yes: window.CLASSIC_YES || []
  },
  platformer: {
    no:  window.PLATFORMER_NO  || [],
    yes: window.PLATFORMER_YES || []
  }
};

/* =========================
   Absolute One-Shot List
========================= */

const ABSOLUTE_ONE_SHOT_LIST = buildAbsoluteOneShotList();

/* =========================
   Ingame Runtime
========================= */

let inGameDB = [];
let usedSet = new Set();
let history = [];
let currentLast = null;
let options = {};
let isPlayerTurn = true;

/* =========================
   Init
========================= */

enterPreGame();

/* =========================
   State Control
========================= */

function enterPreGame() {
  gameState = STATE.PRE;

  optionsArea.classList.remove("disabled");
  ingameArea.classList.add("disabled");

  wordInput.disabled = true;
  btnHint.disabled = true;

  btnStart.textContent = "Start Game";
  btnFinish.disabled = true;

  applyOptionConstraint();

  statusText.textContent = "";
  historyText.textContent = "";
}

function enterInGame() {
  gameState = STATE.IN;

  optionsArea.classList.add("disabled");
  ingameArea.classList.remove("disabled");

  wordInput.disabled = false;
  btnHint.disabled = false;

  btnStart.textContent = "Reset Game";
  btnFinish.disabled = false;

  wordInput.focus();
}

/* =========================
   Option Constraint
========================= */

function applyOptionConstraint() {
  if (!optStartEnd.checked) {
    optIgnoreNum.checked = false;
    optIgnoreNum.disabled = true;
    optIgnoreWrapper.classList.add("disabled");
  } else {
    optIgnoreNum.disabled = false;
    optIgnoreWrapper.classList.remove("disabled");
  }
}

optStartEnd.addEventListener("change", applyOptionConstraint);

/* =========================
   Buttons
========================= */

btnStart.addEventListener("click", () => {
  const opt = readOptions();
  inGameDB = buildInGameDB(opt);
  initGame(inGameDB, opt);
  enterInGame();
});

btnFinish.addEventListener("click", () => {
  if (gameState === STATE.IN) {
    clearGame();
    enterPreGame();
  }
});

/* =========================
   Options
========================= */

function readOptions() {
  return {
    usePlatformer: optPlatformer.checked,
    useNum: optStartEnd.checked,
    ignoreTrailingNum: optIgnoreNum.checked,
    allowOneShot: optOneShot.checked,
    computerMode: optComputer.checked
  };
}

/* =========================
   DB Builder
========================= */

function buildInGameDB(opt) {
  const result = [];

  result.push(...allDB.classic.no);
  if (opt.useNum) result.push(...allDB.classic.yes);

  if (opt.usePlatformer) {
    result.push(...allDB.platformer.no);
    if (opt.useNum) result.push(...allDB.platformer.yes);
  }

  return result;
}

/* =========================
   Game Init / Clear
========================= */

function initGame(db, opt) {
  inGameDB = db;
  options = opt;

  usedSet.clear();
  history.length = 0;
  currentLast = null;
  isPlayerTurn = true;

  statusText.textContent = "Game Started. Enter first word.";
  historyText.textContent = "";
}

function clearGame() {
  usedSet.clear();
  history.length = 0;
  currentLast = null;
}

/* =========================
   Input
========================= */

wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const value = wordInput.value;
    wordInput.value = "";
    handlePlayerInput(value);
  }
});

/* =========================
   Player Input Logic
========================= */

function handlePlayerInput(raw) {
  if (gameState !== STATE.IN) return;

  const input = raw.trim();
  if (!input) return;

  const lower = input.toLowerCase();

  // 1. start char
  if (currentLast !== null && lower[0] !== currentLast) {
    setStatus(`❌ Must Start '${currentLast}'`);
    return;
  }

  // 2. DB
  const entry = inGameDB.find(w => w.lower === lower);
  if (!entry) {
    setStatus("❌ Not in DB");
    return;
  }

  // 3. used
  if (usedSet.has(lower)) {
    setStatus("❌ Already Used");
    return;
  }

  // 4. absolute one-shot (option)
  if (!options.allowOneShot) {
    if (ABSOLUTE_ONE_SHOT_LIST.some(w => w.lower === lower)) {
      setStatus("❌ Absolute One-Shot Word");
      return;
    }
  }

  acceptWord(entry, "Player");
}

/* =========================
   Accept Word
========================= */

function acceptWord(entry, who) {
  setStatus(`✅ ${who} : ${entry.original}`);

  usedSet.add(entry.lower);
  history.push(entry.original);
  historyText.textContent = history.join(" → ");

  currentLast = getLastChar(entry);

  if (options.computerMode) {
    isPlayerTurn = !isPlayerTurn;
    // computerTurn() ← 이후 구현
  }
}

/* =========================
   Helpers
========================= */

function getLastChar(entry) {
  return options.ignoreTrailingNum ? entry.last_alpha : entry.last;
}

function setStatus(msg) {
  statusText.textContent = msg;
}

/* =========================
   Absolute One-Shot Builder
========================= */

function buildAbsoluteOneShotList() {
  const yesPool = [
    ...allDB.classic.yes,
    ...allDB.platformer.yes
  ];

  const result = [];

  for (const w of yesPool) {
    if (!["5", "6", "7"].includes(w.last)) continue;

    const canChain = yesPool.some(o =>
      o.lower !== w.lower &&
      o.first === w.last
    );

    if (!canChain) result.push(w);
  }

  return result;
}

});
