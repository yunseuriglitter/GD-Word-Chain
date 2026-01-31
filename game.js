/* ======================= STATE ======================= */

let state = "IDLE"; // IDLE | PLAYING | ENDED
let turn = "PLAYER"; // PLAYER | COMPUTER

let gameDB = [];
let used = new Set();
let history = [];
let lastChar = null;

/* ======================= DOM ======================= */

const wordInput = document.getElementById("wordInput");
const text1 = document.getElementById("text1");
const text2 = document.getElementById("text2");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const dictionaryBox = document.getElementById("dictionaryBox");

/* ======================= UTIL ======================= */

function logStatus(msg) {
  text1.textContent = msg;
}

function logHistory() {
  text2.textContent = history.join(" → ");
}

function resetGame() {
  used.clear();
  history = [];
  lastChar = null;
  turn = "PLAYER";
  wordInput.value = "";
  logStatus("");
  logHistory();
}

/* ======================= OPTIONS ======================= */

function getOptions() {
  return {
    platformer: optPlatformer.checked,
    numEdge: optNumEdge.checked,
    ignoreTrailing: optNumIgnore.checked,
    noOneShot: optNoOneShot.checked,
    aiMode: optAI.checked
  };
}

/* ======================= DB ======================= */

async function loadGameDB() {
  const opt = getOptions();
  const files = [];

  files.push("data/db/classic_no_num.json");
  if (opt.numEdge) files.push("data/db/classic_yes_num.json");

  if (opt.platformer) {
    files.push("data/db/platformer_no_num.json");
    if (opt.numEdge) files.push("data/db/platformer_yes_num.json");
  }

  const lists = await Promise.all(files.map(f => fetch(f).then(r => r.json())));
  gameDB = lists.flat();
}

/* ======================= RULE CORE ======================= */

function getNextChar(entry, opt) {
  if (opt.numEdge && opt.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

function hasAnyContinuation(char, used, opt) {
  return gameDB.some(w =>
    !used.has(w.key) && w.first === char
  );
}

function getPlayableWords(char, used, opt) {
  return gameDB.filter(w => {
    if (used.has(w.key)) return false;
    if (w.first !== char) return false;

    if (opt.noOneShot) {
      const next = getNextChar(w, opt);
      return hasAnyContinuation(next, used, opt);
    }
    return true;
  });
}

/* ======================= TURN CHECK ======================= */

function checkLoseAtTurnStart(player) {
  if (!lastChar) return false;

  const playable = getPlayableWords(lastChar, used, getOptions());
  if (playable.length === 0) {
    lose(player, "No possible continuation");
    return true;
  }
  return false;
}

function lose(player, reason) {
  logStatus(`❌ ${player} loses: ${reason}`);
  state = "ENDED";
}

/* ======================= PLAYER ======================= */

function onSubmit() {
  if (state !== "PLAYING" || turn !== "PLAYER") return;

  if (checkLoseAtTurnStart("Player")) return;

  const input = wordInput.value.toLowerCase().trim();
  if (!input) return;

  const entry = gameDB.find(e => e.key === input);

  if (lastChar && (!entry || entry.first !== lastChar)) {
    return logStatus(`❌ Must start with '${lastChar}'`);
  }
  if (!entry) return logStatus("❌ Not in DB");
  if (used.has(entry.key)) return logStatus("❌ Already used");

  const opt = getOptions();
  const next = getNextChar(entry, opt);

  if (opt.noOneShot && !hasAnyContinuation(next, used, opt)) {
    return logStatus("❌ One-shot word");
  }

  used.add(entry.key);
  history.push(entry.original);
  lastChar = next;
  logStatus(`⭕ Player: ${entry.original}`);
  logHistory();
  wordInput.value = "";

  if (opt.aiMode) {
    turn = "COMPUTER";
    setTimeout(computerTurn, 300);
  }
}

/* ======================= COMPUTER ======================= */

function computerTurn() {
  if (state !== "PLAYING") return;

  if (checkLoseAtTurnStart("Computer")) return;

  const opt = getOptions();
  const candidates = getPlayableWords(lastChar, used, opt);
  const choice = candidates[Math.floor(Math.random() * candidates.length)];

  used.add(choice.key);
  history.push(choice.original);
  lastChar = getNextChar(choice, opt);
  logStatus(`⭕ Computer: ${choice.original}`);
  logHistory();

  turn = "PLAYER";
}

/* ======================= CONTROL ======================= */

startBtn.onclick = async () => {
  resetGame();
  await loadGameDB();
  dictionaryBox.classList.add("hidden");
  state = "PLAYING";
  startBtn.textContent = "Game Reset";
  logStatus("Game Started");
};

endBtn.onclick = () => {
  state = "IDLE";
  dictionaryBox.classList.remove("hidden");
  startBtn.textContent = "Game Start";
  resetGame();
};

wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") onSubmit();
});
