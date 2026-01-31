/* ===================== DOM ===================== */

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const wordInput = document.getElementById("wordInput");
const text1 = document.getElementById("text1");
const text2 = document.getElementById("text2");
const dictionaryBox = document.getElementById("dictionaryBox");

const optPlatformer = document.getElementById("optPlatformer");
const optNumEdge = document.getElementById("optNumEdge");
const optNumIgnore = document.getElementById("optNumIgnore");
const optNoOneShot = document.getElementById("optNoOneShot");
const optAI = document.getElementById("optAI");

/* ===================== STATE ===================== */

let state = "IDLE"; // IDLE | PLAYING
let turn = "PLAYER";

let gameDB = [];
let used = new Set();
let history = [];
let lastChar = null;

/* ===================== UTIL ===================== */

function status(msg) {
  text1.textContent = msg;
}

function updateHistory() {
  text2.textContent = history.join(" → ");
}

function resetGame() {
  used.clear();
  history = [];
  lastChar = null;
  turn = "PLAYER";
  wordInput.value = "";
  updateHistory();
}

/* ===================== OPTIONS ===================== */

function getOptions() {
  return {
    platformer: optPlatformer.checked,
    numEdge: optNumEdge.checked,
    ignoreTrailing: optNumIgnore.checked,
    noOneShot: optNoOneShot.checked,
    computer: optAI.checked
  };
}

/* ===================== DB LOAD ===================== */

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

/* ===================== RULES ===================== */

function nextChar(entry, opt) {
  if (opt.numEdge && opt.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

function hasContinuation(char, usedSet) {
  return gameDB.some(e => !usedSet.has(e.key) && e.first === char);
}

function playableWords(char, usedSet, opt) {
  return gameDB.filter(e => {
    if (usedSet.has(e.key)) return false;
    if (e.first !== char) return false;

    if (opt.noOneShot) {
      const nc = nextChar(e, opt);
      return hasContinuation(nc, usedSet);
    }
    return true;
  });
}

function checkLose(playerName) {
  if (!lastChar) return false;

  const opt = getOptions();
  const moves = playableWords(lastChar, used, opt);
  if (moves.length === 0) {
    status(`❌ ${playerName} loses`);
    state = "IDLE";
    wordInput.disabled = true;
    return true;
  }
  return false;
}

/* ===================== PLAYER ===================== */

function playerSubmit() {
  if (state !== "PLAYING" || turn !== "PLAYER") return;

  if (checkLose("Player")) return;

  const input = wordInput.value.trim().toLowerCase();
  if (!input) return;

  const entry = gameDB.find(e => e.key === input);

  if (lastChar && (!entry || entry.first !== lastChar)) {
    status(`❌ Must start with '${lastChar}'`);
    return;
  }

  if (!entry) {
    status("❌ Not in DB");
    return;
  }

  if (used.has(entry.key)) {
    status("❌ Already used");
    return;
  }

  const opt = getOptions();
  const nc = nextChar(entry, opt);

  if (opt.noOneShot && !hasContinuation(nc, used)) {
    status("❌ One-shot word");
    return;
  }

  used.add(entry.key);
  history.push(entry.original);
  lastChar = nc;
  wordInput.value = "";

  status(`⭕ Player: ${entry.original}`);
  updateHistory();

  if (opt.computer) {
    turn = "COMPUTER";
    setTimeout(computerTurn, 300);
  }
}

/* ===================== COMPUTER ===================== */

function computerTurn() {
  if (state !== "PLAYING") return;

  if (checkLose("Computer")) return;

  const opt = getOptions();
  const moves = playableWords(lastChar, used, opt);
  const pick = moves[Math.floor(Math.random() * moves.length)];

  used.add(pick.key);
  history.push(pick.original);
  lastChar = nextChar(pick, opt);

  status(`⭕ Computer: ${pick.original}`);
  updateHistory();

  turn = "PLAYER";
}

/* ===================== EVENTS ===================== */

startBtn.onclick = async () => {
  if (state === "IDLE") {
    await loadGameDB();
    resetGame();
    dictionaryBox.classList.add("hidden");
    wordInput.disabled = false;
    state = "PLAYING";
    startBtn.textContent = "Game Reset";
    status("Game Started");
  } else {
    resetGame();
    status("Game Reset");
  }
};

endBtn.onclick = () => {
  state = "IDLE";
  resetGame();
  dictionaryBox.classList.remove("hidden");
  wordInput.disabled = true;
  startBtn.textContent = "Game Start";
  status("");
};

wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") playerSubmit();
});

/* ===================== INIT ===================== */

optNumIgnore.disabled = !optNumEdge.checked;
optNumEdge.addEventListener("change", () => {
  optNumIgnore.disabled = !optNumEdge.checked;
});
