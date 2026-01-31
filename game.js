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

/* =========================================================
   DOM
========================================================= */

const optPlatformer = document.getElementById("optPlatformer");
const optNumEdge = document.getElementById("optNumEdge");
const optNumIgnore = document.getElementById("optNumIgnore");
const optIgnoreWrap = document.getElementById("optIgnoreWrap");
const optNoOneShot = document.getElementById("optNoOneShot");
const optAI = document.getElementById("optAI");

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const wordInput = document.getElementById("wordInput");

const text1 = document.getElementById("text1");
const text2 = document.getElementById("text2");

const dictInput = document.getElementById("dictInput");
const dictResult = document.getElementById("dictResult");

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

// 전체 사전 (옵션 무시)
async function loadAllDB() {
  if (allDB.length) return;

  const files = [
    "data/db/classic_no_num.json",
    "data/db/classic_yes_num.json",
    "data/db/platformer_no_num.json",
    "data/db/platformer_yes_num.json"
  ];

  const lists = await Promise.all(
    files.map(f => fetch(f).then(r => r.json()))
  );
  allDB = lists.flat();
}

// 게임용 DB (옵션 반영)
async function loadGameDB() {
  const opt = getOptions();
  const files = [];

  files.push("data/db/classic_no_num.json");
  if (opt.numEdge) files.push("data/db/classic_yes_num.json");

  if (opt.platformer) {
    files.push("data/db/platformer_no_num.json");
    if (opt.numEdge) files.push("data/db/platformer_yes_num.json");
  }

  const lists = await Promise.all(
    files.map(f => fetch(f).then(r => r.json()))
  );
  gameDB = lists.flat();
}

// one-shot 전용 DB (yes_num only, ignoreTrailing 무시)
async function loadOneShotDB() {
  const opt = getOptions();
  const files = ["data/db/classic_yes_num.json"];

  if (opt.platformer) {
    files.push("data/db/platformer_yes_num.json");
  }

  const lists = await Promise.all(
    files.map(f => fetch(f).then(r => r.json()))
  );

  return lists.flat();
}

/* =========================================================
   CORE RULE FUNCTIONS
========================================================= */

function getNextChar(entry, opt) {
  if (opt.numEdge && opt.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

function hasNextWord(char) {
  return gameDB.some(e =>
    !used.has(e.key) &&
    e.first === char
  );
}

/* =========================================================
   GAME FLOW
========================================================= */

function accept(entry, who) {
  used.add(entry.key);
  history.push(entry.original);
  lastChar = getNextChar(entry, getOptions());

  logStatus(`⭕ ${who}: ${entry.original}`);
  logHistory();
  wordInput.value = "";
}

function lose(who, reason) {
  logStatus(`❌ ${who} loses: ${reason}`);
  state = "ENDED";
}

/* ================= PLAYER ================= */

function onSubmit() {
  if (state !== "PLAYING" || turn !== "PLAYER") return;

  const input = wordInput.value.toLowerCase().trim();
  if (!input) return;

  const entry = gameDB.find(e => e.key === input);

  // 시작 글자 우선 검사
  if (lastChar && (!entry || entry.first !== lastChar)) {
    return logStatus(`❌ Must start with '${lastChar}'`);
  }

  if (!entry) return logStatus("❌ Not in DB");
  if (used.has(entry.key)) return logStatus("❌ Already used");

  const opt = getOptions();
  const nextChar = getNextChar(entry, opt);

  // 한방 불가 룰
  if (opt.noOneShot && (!nextChar || !hasNextWord(nextChar))) {
    return lose("Player", "One-shot word");
  }

  accept(entry, "Player");

  // 한방 가능 룰 패배 판정
  if (!opt.noOneShot && (!nextChar || !hasNextWord(nextChar))) {
    return lose("Player", "No possible continuation");
  }

  if (opt.aiMode) {
    turn = "AI";
    setTimeout(aiTurn, 300);
  }
}

/* ================= AI ================= */

function aiTurn() {
  if (state !== "PLAYING") return;

  const opt = getOptions();

  const candidates = gameDB.filter(e =>
    !used.has(e.key) &&
    (!lastChar || e.first === lastChar) &&
    (!opt.noOneShot || hasNextWord(getNextChar(e, opt)))
  );

  if (candidates.length === 0) {
    return lose("AI", "No possible continuation");
  }

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  const nextChar = getNextChar(choice, opt);

  accept(choice, "AI");

  if (!opt.noOneShot && (!nextChar || !hasNextWord(nextChar))) {
    return lose("AI", "No possible continuation");
  }

  turn = "PLAYER";
}

/* =========================================================
   GAME CONTROL
========================================================= */

startBtn.onclick = async () => {
  resetGame();
  await loadGameDB();
  lockOptions(true);
  state = "PLAYING";
  logStatus("Game Started");
};

endBtn.onclick = () => {
  state = "IDLE";
  lockOptions(false);
  resetGame();
  logStatus("Game Ended");
};

wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") onSubmit();
});

/* =========================================================
   DICTIONARY (PREFIX, ALL DB)
========================================================= */

dictInput.addEventListener("input", async () => {
  await loadAllDB();
  const q = dictInput.value.toLowerCase().trim();

  if (!q) {
    dictResult.textContent = "";
    return;
  }

  const matches = allDB
    .filter(e => e.key.startsWith(q))
    .map(e => e.original);

  dictResult.textContent =
    matches.length ? matches.join("\n") : "(no matches)";
});

/* =========================================================
   ONE-SHOT DICTIONARY (YES_NUM ONLY, RAW NUM)
========================================================= */

oneshotBtn.onclick = async () => {
  oneshotResult.textContent = "Analyzing...";
  const list = await loadOneShotDB();

  const oneshots = list
    .filter(e =>
      !list.some(x =>
        x.key !== e.key &&
        x.first === e.last   // 🔥 숫자 그대로 사용
      )
    )
    .map(e => e.original);

  oneshotResult.textContent =
    oneshots.length ? oneshots.join("\n") : "(none)";
};
