/* =========================
   전역 상태
========================= */

let option = null;
let inGameDB = null;
let used = new Set();
let history = [];
let expectedChar = null;
let turn = "player";

/* =========================
   DOM
========================= */

const inputEl = document.getElementById("wordInput");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");

/* =========================
   DB 로딩 (안전 버전)
========================= */

async function safeFetchJSON(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json || !Array.isArray(json.list)) {
      throw new Error("Invalid JSON structure");
    }
    return json.list;
  } catch (e) {
    statusEl.textContent = `DB 로딩 실패: ${path}`;
    console.error(e);
    return [];
  }
}

async function loadAllDB() {
  return {
    classic_yes: await safeFetchJSON("data/db/classic_yes_num.json"),
    classic_no: await safeFetchJSON("data/db/classic_no_num.json"),
    platformer_yes: await safeFetchJSON("data/db/platformer_yes_num.json"),
    platformer_no: await safeFetchJSON("data/db/platformer_no_num.json")
  };
}

/* =========================
   인게임 DB 생성
========================= */

function buildInGameDB(allDB) {
  const list = [];
  const byLower = {};
  const byFirst = {};

  function addWords(words) {
    for (const w of words) {
      if (!w || !w.lower) continue;
      list.push(w);
      byLower[w.lower] = w;
      if (!byFirst[w.first]) byFirst[w.first] = [];
      byFirst[w.first].push(w);
    }
  }

  if (option.useYesNum) {
    addWords(allDB.classic_yes);
    if (option.usePlatformer) addWords(allDB.platformer_yes);
  } else {
    addWords(allDB.classic_no);
    if (option.usePlatformer) addWords(allDB.platformer_no);
  }

  return { list, byLower, byFirst };
}

/* =========================
   유틸
========================= */

function normalizeInput(str) {
  return str.trim().toLowerCase();
}

function getNextChar(word) {
  if (!option.useYesNum) return word.last;
  if (!option.ignoreNumber) return word.last;
  return word.last_alpha;
}

function isAbsoluteOneShot(word) {
  return /[567]$/.test(word.last);
}

function isOneShot(word) {
  if (isAbsoluteOneShot(word)) return true;
  const next = getNextChar(word);
  if (!next) return true;

  const candidates = inGameDB.byFirst[next] || [];
  for (const w of candidates) {
    if (!used.has(w.original) && w.original !== word.original) {
      return false;
    }
  }
  return true;
}

/* =========================
   입력 검증
========================= */

function validateInput(inputLower) {
  if (!expectedChar || inputLower[0] !== expectedChar) {
    return `Start는 '${expectedChar}'로 시작해야 합니다.`;
  }

  const word = inGameDB.byLower[inputLower];
  if (!word) {
    return "데이터베이스에 없는 단어입니다.";
  }

  if (used.has(word.original)) {
    return "이미 사용한 단어입니다.";
  }

  if (option.noOneShot && isOneShot(word)) {
    return "현재 상황에서 한방단어입니다.";
  }

  return null;
}

/* =========================
   렌더
========================= */

function render() {
  historyEl.textContent = history.join(" → ");
  statusEl.textContent = `Start: '${expectedChar}'`;
}

/* =========================
   단어 적용
========================= */

function applyWord(word) {
  used.add(word.original);
  history.push(word.original);
  expectedChar = getNextChar(word);
  render();
}

/* =========================
   플레이어 입력
========================= */

function submitInput() {
  if (!expectedChar) return;

  const raw = inputEl.value;
  const inputLower = normalizeInput(raw);
  if (!inputLower) return;

  const error = validateInput(inputLower);
  if (error) {
    statusEl.textContent = error;
    if (option.mode === "solo") {
      statusEl.textContent += " 💀 Game Over";
    }
    return;
  }

  const word = inGameDB.byLower[inputLower];
  applyWord(word);
  inputEl.value = "";

  if (option.mode === "computer") {
    setTimeout(computerTurn, 500);
  }
}

/* =========================
   컴퓨터 턴
========================= */

function computerTurn() {
  const candidates = inGameDB.byFirst[expectedChar] || [];
  const usable = candidates.filter(w => !used.has(w.original));

  if (usable.length === 0) {
    statusEl.textContent = "컴퓨터가 낼 단어가 없습니다. 당신의 승리!";
    return;
  }

  let pool = usable;
  if (option.noOneShot) {
    const safe = usable.filter(w => !isOneShot(w));
    if (safe.length > 0) pool = safe;
  }

  const word = pool[Math.floor(Math.random() * pool.length)];
  applyWord(word);
}

/* =========================
   게임 시작
========================= */

async function startGame(startChar, opt) {
  option = opt;
  used.clear();
  history = [];
  expectedChar = normalizeInput(startChar)[0];

  statusEl.textContent = "DB 로딩 중...";
  const allDB = await loadAllDB();
  inGameDB = buildInGameDB(allDB);

  if (inGameDB.list.length === 0) {
    statusEl.textContent = "인게임 DB가 비어 있습니다.";
    return;
  }

  render();
}

/* =========================
   Enter 키
========================= */

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") submitInput();
});
