console.log("main.js loaded");

import { initPreGame } from "./pregame.js";

// Finish 버튼 초기 비활성
const btnFinish = document.getElementById("btnFinish");
btnFinish.disabled = true;
btnFinish.style.opacity = "0.3";

// Dictionary는 옵션 무관 → 전체 DB
const DICTIONARY_DB = [
  ...window.CLASSIC_NO,
  ...window.CLASSIC_YES,
  ...window.PLATFORMER_NO,
  ...window.PLATFORMER_YES
];

// 테스트용 one-shot
const ABSOLUTE_ONE_SHOT_LIST = DICTIONARY_DB.slice(0, 5);

initPreGame({
  dictionaryDB: DICTIONARY_DB,
  absoluteOneShotList: ABSOLUTE_ONE_SHOT_LIST,
  onStartGame: (options) => {
    console.log("Start Game!", options);
    btnFinish.disabled = false;
    btnFinish.style.opacity = "1";
  }
});
