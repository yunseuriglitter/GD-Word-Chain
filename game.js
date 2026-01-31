/* =========================
   Game State
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
const ingameArea = document.getElementById("ingameArea");

// Buttons
const btnStart  = document.getElementById("btnStart");
const btnFinish = document.getElementById("btnFinish");

// Ingame controls
const wordInput = document.getElementById("wordInput");
const btnHint   = document.getElementById("btnHint");

// Options
const optPlatformer = document.getElementById("optPlatformer");
const optStartEnd   = document.getElementById("optStartEndNum");
const optIgnoreNum  = document.getElementById("optIgnoreTrailingNum");
const optOneShot    = document.getElementById("optAllowOneShot");
const optComputer   = document.getElementById("optComputerMode");

/* =========================
   DB (pregenerated json)
   ⚠️ 이미 fetch 되어 있다고 가정
========================= */

// 예시 구조 (네가 실제 fetch로 채우면 됨)
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

// 현재 인게임 DB
let inGameDB = [];

/* =========================
   Init (Game Pre)
========================= */

enterPreGame();

/* =========================
   State Transitions
========================= */

function enterPreGame() {
  gameState = STATE.PRE;

  // UI
  optionsArea.classList.remove("disabled");
  ingameArea.classList.add("disabled");

  wordInput.disabled = true;
  btnHint.disabled   = true;

  // Buttons
  btnStart.textContent = "Start Game";
  btnFinish.disabled  = true;

  applyOptionConstraint();
}

function enterInGame() {
  gameState = STATE.IN;

  // UI
  optionsArea.classList.add("disabled");
  ingameArea.classList.remove("disabled");

  wordInput.disabled = false;
  btnHint.disabled   = false;

  // Buttons
  btnStart.textContent = "Reset Game";
  btnFinish.disabled  = false;
}

/* =========================
   Option Constraint
========================= */

// 3번 옵션은 2번이 켜져 있을 때만 가능
function applyOptionConstraint() {
  optIgnoreNum.disabled = !optStartEnd.checked;
}

optStartEnd.addEventListener("change", applyOptionConstraint);

/* =========================
   Buttons
========================= */

btnStart.addEventListener("click", () => {
  // Start든 Reset이든 동일
  const options = readOptions();
  inGameDB = buildInGameDB(options);

  console.log("InGame DB size:", inGameDB.length);

  enterInGame();

  // 🔽 여기부터는 네가 인게임 로직 붙이면 됨
  // initGame(inGameDB, options);
});

btnFinish.addEventListener("click", () => {
  if (gameState === STATE.IN) {
    // 🔽 인게임 정리 필요하면 여기서
    // clearGame();

    enterPreGame();
  }
});

/* =========================
   Options Read
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
   Build Ingame DB
========================= */

function buildInGameDB(options) {
  const result = [];

  // classic은 항상 포함
  result.push(...allDB.classic.no);

  if (options.useNum) {
    result.push(...allDB.classic.yes);
  }

  // platformer 옵션
  if (options.usePlatformer) {
    result.push(...allDB.platformer.no);

    if (options.useNum) {
      result.push(...allDB.platformer.yes);
    }
  }

  return result;
}
