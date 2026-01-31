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

let countPlayer = 0;
let countAI = 0;

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
  turn = "PLAYER";

  countPlayer = 0;
  countAI = 0;

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

/* =========================================================
   CORE RULE FUNCTIONS
========================================================= */

// 다음 연결 문자
function getNextChar(entry, opt) {
  if (opt.numEdge && opt.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

// 1차 판정: 다음 글자로 시작하는 단어가 존재하는가
function hasAnyNext(char) {
  return gameDB.some(e =>
    !used.has(e.key) &&
    e.first === char
  );
}

// 2차 판정: 한방이 아닌 선택지가 존재하는가
function hasNonOneShotNext(char, opt) {
  return gameDB.some(e =>
    !used.has(e.key) &&
    e.first === char &&
    hasAnyNext(getNextChar(e, opt))
  );
}

/* =========================================================
   GAME FLOW
========================================================= */

function accept(entry, who) {
  used.add(entry.key);
  history.push(entry.original);
  lastChar = getNextChar(entry, getOptions());

  if (who === "Player") countPlayer++;
  if (who === "AI") countAI++;

  const opt = getOptions();
  const countText = opt.aiMode
    ? `(P:${countPlayer} / AI:${countAI})`
    : `(P:${countPlayer})`;

  logStatus(`⭕ ${who}: ${entry.original} ${countText}`);
  logHistory();
  wordInput.value = "";
}

function lose(who, reason) {
  const opt = getOptions();
  const countText = opt.aiMode
    ? `(P:${countPlayer} / AI:${countAI})`
    : `(P:${countPlayer})`;

  logStatus(`❌ ${who} loses: ${reason} ${countText}`);
  state = "ENDED";
}

/* ================= PLAYER ================= */

function onSubmit() {
  if (state !== "PLAYING" || turn !== "PLAYER") return;

  const input = wordInput.value.toLowerCase().trim();
  if (!input) return;

  // 시작 문자 검사
  if (lastChar && input[0] !== lastChar) {
    return logStatus(`❌ Must start with '${lastChar}'`);
  }

  const entry = gameDB.find(e => e.key === input);
  if (!entry) return logStatus("❌ Not in DB");
  if (used.has(entry.key)) return logStatus("❌ Already used");

  const opt = getOptions();
  const nextChar = getNextChar(entry, opt);

  // 1차 한방: 다음 단어 자체가 없음
  if (!hasAnyNext(nextChar)) {
    if (opt.noOneShot) {
      return lose("Player", "One-shot word (no continuation)");
    }
    // 한방 허용이면 상대 패배는 다음 턴에서 처리
  }

  // 2차 한방: 선택지는 있으나 전부 한방
  if (opt.noOneShot && !hasNonOneShotNext(nextChar, opt)) {
    return lose("Player", "One-shot word (only one-shots)");
  }

  accept(entry, "Player");

  if (opt.aiMode) {
    turn = "AI";
    setTimeout(aiTurn, 300);
  }
}

/* ================= AI ================= */

function aiTurn() {
  if (state !== "PLAYING") return;

  const opt = getOptions();

  // AI 차례 시작 시 패배 판정
  if (!hasAnyNext(lastChar)) {
    return lose("AI", "No possible continuation");
  }

  const candidates = gameDB.filter(e =>
    !used.has(e.key) &&
    e.first === lastChar &&
    (!opt.noOneShot || hasNonOneShotNext(getNextChar(e, opt), opt))
  );

  if (candidates.length === 0) {
    return lose("AI", "No valid move");
  }

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
  if (!q) {
    dictResult.textContent = "";
    return;
  }

  const matches = allDB
    .filter(e =>
      dictPrefix.checked
        ? e.key.startsWith(q)
        : e.key.endsWith(q)
    )
    .map(e => e.original);

  dictResult.textContent =
    matches.length ? matches.join("\n") : "(no matches)";
});

/* =========================================================
   ONE-SHOT DICTIONARY (PRE-GAME ONLY)
========================================================= */

oneshotBtn.onclick = async () => {
  if (state !== "IDLE") return;

  oneshotResult.textContent = "Analyzing...";

  const files = [
    "data/db/classic_yes_num.json",
    "data/db/platformer_yes_num.json"
  ];

  const lists = await Promise.all(files.map(f => fetch(f).then(r => r.json())));
  const yesNumDB = lists.flat();

  const oneshots = yesNumDB.filter(e => {
    const c = e.last;
    return !yesNumDB.some(x => x.first === c);
  }).map(e => e.original);

  oneshotResult.textContent =
    oneshots.length ? oneshots.join("\n") : "(none)";
};
