/* =========================
   IMPORTS
========================= */

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
   GAME STATE
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
   GLOBAL DATA (ON LOAD)
========================= */

// yes_num 전체 풀
const YES_NUM_POOL = [
  ...window.CLASSIC_YES,
  ...window.PLATFORMER_YES
];

// 무조건 한방 리스트 (사이트 로딩 시 1회)
const ABSOLUTE_ONE_SHOT_LIST = buildAbsoluteOneShotList();

function buildAbsoluteOneShotList() {
  const result = [];

  for (const word of YES_NUM_POOL) {
    // 뒤가 5 / 6 / 7
    if (!["5", "6", "7"].includes(word.last)) continue;

    // 이어질 수 있는 단어가 있는지
    const canChain = YES_NUM_POOL.some(other =>
      other.lower !== word.lower &&
      other.first === word.last
    );

    if (!canChain) {
      result.push(word);
    }
  }

  return result;
}

/* =========================
   INITIAL LOAD
========================= */

// 사이트 로딩 시 무조건 PRE 상태로
enterPreGame();

/* =========================
   STATE TRANSITIONS
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
  initPreGame({
    onStartGame: handleStartGame,
    absoluteOneShotList: ABSOLUTE_ONE_SHOT_LIST
  });
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
  startInGame(options, ABSOLUTE_ONE_SHOT_LIST);
}

/* =========================
   BUTTON HANDLERS
========================= */

function handleStartGame(options) {
  if (currentState === STATE.PRE) {
    // Start Game
    enterInGame(options);
  } else if (currentState === STATE.IN) {
    // Reset Game = Start 시퀀스 재실행
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
