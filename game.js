/* =========================
   State Definition
========================= */

const STATE = {
  PRE: "pre",
  IN: "in"
};

let gameState = STATE.PRE;

/* =========================
   DOM Elements
========================= */

// Areas
const optionsArea = document.getElementById("optionsArea");
const ingameArea  = document.getElementById("ingameArea");

// Buttons
const btnStart  = document.getElementById("btnStart");
const btnFinish = document.getElementById("btnFinish");
const btnHint   = document.getElementById("btnHint");

// Ingame input/output
const wordInput  = document.getElementById("wordInput");
const statusText = document.getElementById("statusText");
const historyText = document.getElementById("historyText");

// Options
const optPlatformer = document.getElementById("optPlatformer");
const optStartEnd   = document.getElementById("optStartEndNum");
const optIgnoreNum  = document.getElementById("optIgnoreTrailingNum");
const optOneShot    = document.getElementById("optAllowOneShot");
const optComputer   = document.getElementById("optComputerMode");

/* =========================
   Databases (assumed loaded)
========================= */

// ⚠️ 실제로는 fetch해서 채우면 됨
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

// Ingame DB
let inGameDB = [];

/* =========================
   Ingame Runtime State
========================= */

let usedSet = new Set();   // lower 기준
let history = [];          // original 기록
let currentLast = null;    // 다음 시작 문자
let isPlayerTurn = true;
let options = {};

/* =========================
   Initial State
========================= */

enterPreGame();

/* =========================
   State Transitions
========================= */

function enterPreGame() {
  gameState = STATE.PRE;

  // UI state
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
   Option Constraints
========================= */

// Ignore Trailing Num은 Start / End Num이 켜져 있을 때만
function applyOptionConstraint() {
  optIgnoreNum.disabled = !optStartEnd.checked;
}

optStartEnd.addEventListener("change", applyOptionConstraint);

/* =========================
   Button Handlers
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
   Options Reader
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
   Ingame DB Builder
========================= */

function buildInGameDB(opt) {
  const result = [];

  // classic always
  result.push(...allDB.classic.no);
  if (opt.useNum) {
    result.push(...allDB.classic.yes);
  }

  // platformer optional
  if (opt.usePlatformer) {
    result.push(...allDB.platformer.no);
    if (opt.useNum) {
      result.push(...allDB.platformer.yes);
    }
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
   Input Handling
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

  // 1. Start char check (skip for first word)
  if (currentLast !== null) {
    if (lower[0] !== currentLast) {
      setStatus(`❌ Must Start '${currentLast}'`);
      return;
    }
  }

  // 2. DB existence check
  const entry = inGameDB.find(w => w.lower === lower);
  if (!entry) {
    setStatus("❌ Not in DB");
    return;
  }

  // 3. Used check
  if (usedSet.has(lower)) {
    setStatus("❌ Already Used");
    return;
  }

  // 4. Accept
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

  // Computer mode hook
  if (options.computerMode) {
    isPlayerTurn = !isPlayerTurn;
    // computerTurn() ← 여기 나중에 붙이면 됨
  }
}

/* =========================
   Helpers
========================= */

function getLastChar(entry) {
  if (options.ignoreTrailingNum) {
    return entry.last_alpha;
  }
  return entry.last;
}

function setStatus(msg) {
  statusText.textContent = msg;
}
