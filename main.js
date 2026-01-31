import {
  initPreGame,
  enterPreGameUI,
  disablePreGameUI
} from "./pregame.js";

import {
  startInGame,
  resetInGame,
  finishInGame
} from "./ingame.js";

/* =========================
   Game State
========================= */

const STATE = {
  PRE: "PRE",
  IN: "IN"
};

let currentState = STATE.PRE;

/* =========================
   DOM
========================= */

const btnStart  = document.getElementById("btnStart");
const btnFinish = document.getElementById("btnFinish");

/* =========================
   Initial Load
========================= */

// 🔥 사이트 로딩 시 무조건 pregame 시작
enterPreGame();

/* =========================
   State Handlers
========================= */

function enterPreGame() {
  currentState = STATE.PRE;

  // UI
  btnStart.textContent = "Start Game";
  btnFinish.disabled = true;
  btnFinish.style.opacity = "0.3";

  // pregame UI 활성
  enterPreGameUI();

  // pregame 로직 시작
  initPreGame(handleStartGame);
}

function enterInGame(options) {
  currentState = STATE.IN;

  // UI
  btnStart.textContent = "Reset Game";
  btnFinish.disabled = false;
  btnFinish.style.opacity = "1";

  // pregame UI 비활성
  disablePreGameUI();

  // ingame 시작
  startInGame(options);
}

/* =========================
   Button Logic
========================= */

// Start / Reset 버튼은 pregame에서 onStart 콜백으로만 처리
function handleStartGame(options) {
  if (currentState === STATE.PRE) {
    // Start Game
    enterInGame(options);
  } else if (currentState === STATE.IN) {
    // Reset Game = start 시퀀스 재실행
    resetInGame(options);
  }
}

// Finish Game
btnFinish.addEventListener("click", () => {
  if (currentState !== STATE.IN) return;

  // ingame 종료
  finishInGame();

  // pregame으로 복귀
  enterPreGame();
});
