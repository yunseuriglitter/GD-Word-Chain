/* =====================
   State
===================== */

const STATE = { PRE: "pre", IN: "in" };
let gameState = STATE.PRE;

/* =====================
   DOM
===================== */

const btnStart = document.getElementById("btnStart");
const btnFinish = document.getElementById("btnFinish");
const inputEl = document.getElementById("wordInput");

const optPlatformer = document.getElementById("optPlatformer");
const optStartEnd = document.getElementById("optStartEndNum");
const optIgnore = document.getElementById("optIgnoreTrailingNum");
const optOneShot = document.getElementById("optAllowOneShot");
const optComputer = document.getElementById("optComputerMode");

/* =====================
   Init (PRE_GAME)
===================== */

function enterPreGame() {
  gameState = STATE.PRE;

  btnStart.textContent = "Start Game";
  btnFinish.disabled = true;
  inputEl.disabled = true;

  setOptionsEnabled(true);
  applyOptionConstraints();
}

/* =====================
   Option Control
===================== */

function setOptionsEnabled(enabled) {
  optPlatformer.disabled = !enabled;
  optStartEnd.disabled = !enabled;
  optIgnore.disabled = !enabled || !optStartEnd.checked;
  optOneShot.disabled = !enabled;
  optComputer.disabled = !enabled;
}

function applyOptionConstraints() {
  optIgnore.disabled = !optStartEnd.checked;
}

optStartEnd.addEventListener("change", applyOptionConstraints);

/* =====================
   Buttons
===================== */

btnStart.onclick = () => {
  if (gameState === STATE.PRE) {
    startGame();
  } else {
    resetGame();
  }
};

btnFinish.onclick = () => {
  if (gameState === STATE.IN) {
    endGame();
  }
};

/* =====================
   Game Control
===================== */

function startGame() {
  gameState = STATE.IN;

  btnStart.textContent = "Reset Game";
  btnFinish.disabled = false;
  inputEl.disabled = false;

  setOptionsEnabled(false);

  const options = readOptions();
  const inGameDB = buildInGameDB(options);

  initGame(inGameDB, options);
}

function resetGame() {
  startGame(); // 🔥 완전히 동일
}

function endGame() {
  clearGame();
  enterPreGame();
}

/* =====================
   Options Read
===================== */

function readOptions() {
  return {
    usePlatformer: optPlatformer.checked,
    useNum: optStartEnd.checked,
    ignoreTrailingNum: optIgnore.checked,
    allowOneShot: optOneShot.checked,
    computerMode: optComputer.checked
  };
}

/* =====================
   Placeholder Game Logic
===================== */

function initGame(db, options) {
  console.log("Game started", options, db.length);
}

function clearGame() {
  console.log("Game ended");
}

/* =====================
   Start in PRE_GAME
===================== */

enterPreGame();

