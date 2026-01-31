/* ================= STATE ================= */

let state = "PRE"; // PRE | PLAYING | ENDED
let turn = "PLAYER"; // PLAYER | COMPUTER

let allDB = [];
let playDB = [];
let used = new Set();
let history = [];
let lastChar = null;

/* ================= OPTIONS ================= */

const options = {
  includePlatformer: true,
  allowNum: true,
  ignoreTrailing: false,   // 기본 false
  disallowOneShot: true,
  computerMode: true       // 기본 true
};

/* ================= LOADERS ================= */

async function loadAllDB() {
  if (allDB.length) return;
  const files = [
    "data/db/classic_no_num.json",
    "data/db/classic_yes_num.json",
    "data/db/platformer_no_num.json",
    "data/db/platformer_yes_num.json"
  ];
  const lists = await Promise.all(files.map(f => fetch(f).then(r => r.json())));
  allDB = lists.flat();
}

async function loadPlayDB() {
  const files = [];
  files.push("data/db/classic_no_num.json");
  if (options.allowNum) files.push("data/db/classic_yes_num.json");
  if (options.includePlatformer) {
    files.push("data/db/platformer_no_num.json");
    if (options.allowNum) files.push("data/db/platformer_yes_num.json");
  }
  const lists = await Promise.all(files.map(f => fetch(f).then(r => r.json())));
  playDB = lists.flat();
}

/* ================= CORE LOGIC ================= */

function getNextChar(entry) {
  if (options.allowNum && options.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

function getPlayableCandidates(char) {
  return playDB.filter(e =>
    !used.has(e.key) &&
    e.first === char
  );
}

function isOneShot(entry) {
  const next = getNextChar(entry);
  if (!next) return true;
  return getPlayableCandidates(next).length === 0;
}

function hasNonOneShotMove(char) {
  return getPlayableCandidates(char).some(e => !isOneShot(e));
}

/* ================= GAME FLOW ================= */

function startGame() {
  used.clear();
  history = [];
  lastChar = null;
  turn = "PLAYER";
  state = "PLAYING";
  updateStatus("Game Started");
}

function endGame(msg) {
  state = "ENDED";
  updateStatus(msg);
}

function playEntry(entry, who) {
  used.add(entry.key);
  history.push(entry.original);
  lastChar = getNextChar(entry);
  updateStatus(`${who}: ${entry.original}`);
  updateHistory();

  if (!lastChar) return;

  // 한방 허용 룰
  if (!options.disallowOneShot && getPlayableCandidates(lastChar).length === 0) {
    endGame(`${who} wins (one-shot)`);
  }
}

/* ================= PLAYER ================= */

function playerInput(input) {
  if (state !== "PLAYING") return;

  const key = input.toLowerCase().trim();
  if (!key) return;

  const entry = playDB.find(e => e.key === key);

  if (lastChar && (!entry || entry.first !== lastChar)) {
    return updateStatus(`Must start with '${lastChar}'`);
  }
  if (!entry) return updateStatus("Not in database");
  if (used.has(entry.key)) return updateStatus("Already used");

  if (options.disallowOneShot && isOneShot(entry)) {
    return updateStatus("One-shot word is disallowed");
  }

  playEntry(entry, "Player");

  if (options.computerMode && state === "PLAYING") {
    setTimeout(computerTurn, 300);
  }
}

/* ================= COMPUTER ================= */

function computerTurn() {
  if (state !== "PLAYING") return;

  const candidates = getPlayableCandidates(lastChar);

  if (candidates.length === 0) {
    return endGame("Player wins");
  }

  let pool = candidates;
  if (options.disallowOneShot) {
    pool = candidates.filter(e => !isOneShot(e));
    if (pool.length === 0) {
      return endGame("Player wins");
    }
  }

  const choice = pool[Math.floor(Math.random() * pool.length)];
  playEntry(choice, "Computer");
}

/* ================= UI HELPERS ================= */

function updateStatus(msg) {
  document.getElementById("text1").textContent = msg;
}

function updateHistory() {
  document.getElementById("text2").textContent = history.join(" → ");
}
