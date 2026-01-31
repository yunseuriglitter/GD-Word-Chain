/* =========================================================
   GLOBAL STATE
========================================================= */

let state = "IDLE"; // IDLE | PLAYING | ENDED
let turn = "PLAYER"; // PLAYER | AI

let gameDB = [];
let allDB = [];
let used = new Set();
let history = [];
let lastChar = null;
let lastPlayer = null; // 🔥 마지막에 입력한 주체

/* =========================================================
   DOM
========================================================= */

// options
const optPlatformer = document.getElementById("optPlatformer");
const optNumEdge = document.getElementById("optNumEdge");
const optNumIgnore = document.getElementById("optNumIgnore");
const optIgnoreWrap = document.getElementById("optIgnoreWrap");
const optNoOneShot = document.getElementById("optNoOneShot");
const optAI = document.getElementById("optAI");

// game control
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const wordInput = document.getElementById("wordInput");

// output
const text1 = document.getElementById("text1");
const text2 = document.getElementById("text2");

// dictionary
const dictionaryBox = document.getElementById("dictionaryBox");
const dictInput = document.getElementById("dictInput");
const dictResult = document.getElementById("dictResult");
const dictPrefix = document.getElementById("dictPrefix");
const dictSuffix = document.getElementById("dictSuffix");

const oneshotBtn = document.getElementById("oneshotBtn");
const oneshotResult = document.getElementById("oneshotResult");

/* =========================================================
   UTIL
========================================================= */

function logStatus(msg) {
  text1.textContent = msg;
}

function logHistory() {
  text2.textContent = history.join(" → ");
}

function getOptions() {
  return {
    platformer: optPlatformer.checked,
    numEdge: optNumEdge.checked,
    ignoreTrailing: optNumIgnore.checked,
    noOneShot: optNoOneShot.checked,
    aiMode: optAI.checked
  };
}

function resetGame() {
  used.clear();
  history = [];
  lastChar = null;
  lastPlayer = null;
  turn = "PLAYER";
  text1.textContent = "";
  text2.textContent = "";
  wordInput.value = "";
}

function lockOptions(lock) {
  document.querySelectorAll("#options input").forEach(el => {
    el.disabled = lock;
  });
  wordInput.disabled = !lock;
  endBtn.disabled = !lock;
}

/* =========================================================
   OPTION DEPENDENCY
========================================================= */

function syncOptions() {
  if (optNumEdge.checked) {
    optNumIgnore.disabled = false;
    optIgnoreWrap.classList.remove("disabled");
  } else {
    optNumIgnore.checked = true;
    optNumIgnore.disabled = true;
    optIgnoreWrap.classList.add("disabled");
  }
}
optNumEdge.addEventListener("change", syncOptions);
syncOptions();

/* =========================================================
   DB LOADERS
========================================================= */

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

async function loadOneShotDB() {
  const opt = getOptions();
  const files = ["data/db/classic_yes_num.json"];
  if (opt.platformer) files.push("data/db/platformer_yes_num.json");

  const lists = await Promise.all(files.map(f => fetch(f).then(r => r.json())));
  return lists.flat();
}

/* =========================================================
   CORE RULE FUNCTIONS
========================================================= */

function getNextChar(entry) {
  const opt = getOptions();
  if (opt.numEdge && opt.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

function getCandidates(char) {
  return gameDB.filter(e => !used.has(e.key) && e.first === char);
}

function isOneShot(entry) {
  const next = getNextChar(entry);
  if (!next) return true;
  return getCandidates(next).length === 0;
}

/* =========================================================
   GAME FLOW
========================================================= */

function accept(entry, who) {
  used.add(entry.key);
  history.push(entry.original);
  lastChar = getNextChar(entry);
  lastPlayer = who;

  logStatus(`⭕ ${who}: ${entry.original}`);
  logHistory();
  wordInput.value = "";

  // 🔥 한방 허용 룰에서 즉시 승패 판정
  if (!getOptions().noOneShot && getCandidates(lastChar).length === 0) {
    endGame(`${who} wins (one-shot)`);
  }
}

function endGame(msg) {
  logStatus(msg);
  state = "ENDED";
}

/* ================= PLAYER ================= */

function onSubmit() {
  if (state !== "PLAYING" || turn !== "PLAYER") return;

  // 🔥 AI가 한방 쳤을 경우에만 패배
  if (
    lastChar &&
    lastPlayer === "AI" &&
    getCandidates(lastChar).length === 0
  ) {
    return endGame("Computer wins (one-shot)");
  }

  const input = wordInput.value.toLowerCase().trim();
  if (!input) return;

  const entry = gameDB.find(e => e.key === input);

  if (lastChar && (!entry || entry.first !== lastChar)) {
    return logStatus(`❌ Must start with '${lastChar}'`);
  }
  if (!entry) return logStatus("❌ Not in DB");
  if (used.has(entry.key)) return logStatus("❌ Already used");

  if (getOptions().noOneShot && isOneShot(entry)) {
    return logStatus("❌ One-shot word is disallowed");
  }

  accept(entry, "PLAYER");

  if (getOptions().aiMode && state === "PLAYING") {
    turn = "AI";
    setTimeout(aiTurn, 300);
  }
}

/* ================= AI ================= */

function aiTurn() {
  if (state !== "PLAYING") return;

  if (
    lastChar &&
    lastPlayer === "PLAYER" &&
    getCandidates(lastChar).length === 0
  ) {
    return endGame("Player wins (one-shot)");
  }

  let candidates = getCandidates(lastChar);

  if (getOptions().noOneShot) {
    const safe = candidates.filter(e => !isOneShot(e));
    if (safe.length === 0) return endGame("Player wins");
    candidates = safe;
  }

  if (candidates.length === 0) return endGame("Player wins");

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  accept(choice, "AI");
  turn = "PLAYER";
}

/* =========================================================
   GAME CONTROL
========================================================= */

startBtn.onclick = async () => {
  resetGame();
  await loadGameDB();
  dictionaryBox.classList.add("hidden");
  lockOptions(true);
  state = "PLAYING";
  logStatus("Game Started");
};

endBtn.onclick = () => {
  state = "IDLE";
  lockOptions(false);
  resetGame();
  dictionaryBox.classList.remove("hidden");
  logStatus("Game Ended");
};

wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") onSubmit();
});

/* =========================================================
   DICTIONARY (PREFIX / SUFFIX)
========================================================= */

dictInput.addEventListener("input", async () => {
  if (state !== "IDLE") return;
  await loadAllDB();

  const q = dictInput.value.toLowerCase().trim();
  if (!q) return (dictResult.textContent = "");

  const matches = allDB
    .filter(e =>
      dictPrefix.checked ? e.key.startsWith(q) : e.key.endsWith(q)
    )
    .map(e => e.original);

  dictResult.textContent = matches.length ? matches.join("\n") : "(no matches)";
});

/* =========================================================
   ONE-SHOT DICTIONARY
========================================================= */

oneshotBtn.onclick = async () => {
  if (state !== "IDLE") return;

  oneshotResult.textContent = "Analyzing...";
  const list = await loadOneShotDB();
  await loadAllDB();

  const oneshots = list.filter(e => {
    const next = e.last;
    if (/[0-9]/.test(next)) {
      return !list.some(x => x.key !== e.key && x.first === next);
    }
    return !allDB.some(x => x.first === next);
  }).map(e => e.original);

  oneshotResult.textContent = oneshots.length ? oneshots.join("\n") : "(none)";
};
