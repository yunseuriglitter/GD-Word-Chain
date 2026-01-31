console.log("main.js loaded");

import { initPreGame } from "./pregame.js";

initPreGame({
  onStartGame: () => {
    console.log("onStartGame called");
  }
});
