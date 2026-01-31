import { initPreGame, disablePreGameUI } from "./pregame.js";
import { startInGame, finishInGame } from "./ingame.js";

let state = "PRE";

initPreGame((options) => {
  state = "IN";

  // 버튼 텍스트 변경
  document.getElementById("btnStart").textContent = "Reset Game";

  // Pre-game UI 비활성
  disablePreGameUI();

  // In-game 시작
  startInGame(options);
});

// Finish Game
document.getElementById("btnFinish").onclick = () => {
  if (state !== "IN") return;

  state = "PRE";

  document.getElementById("btnStart").textContent = "Start Game";

  finishInGame();
  initPreGame((options) => {
    state = "IN";
    disablePreGameUI();
    startInGame(options);
  });
};
