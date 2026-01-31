console.log("pregame.js loaded");

export function initPreGame(config) {
  console.log("initPreGame called");

  const btnStart = document.getElementById("btnStart");
  console.log("btnStart:", btnStart);

  btnStart.onclick = () => {
    console.log("Start Game clicked");
    config.onStartGame({});
  };
}

export function enterPreGameUI() {
  console.log("enterPreGameUI");
}

export function disablePreGameUI() {
  console.log("disablePreGameUI");
}
