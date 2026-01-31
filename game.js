/* =========================
   전역 상태
========================= */

let option = {
  usePlatformer: true,
  useYesNum: true,
  ignoreNumber: false,
  noOneShot: false,
  mode: "solo" // "solo" | "computer"
};

let inGameDB = null;
let used = new Set();
let history = [];
let expectedChar = null;
let turn = "player"; // computer mode용

/* =========================
   DOM
========================= */

const inputEl = document.getElementById("wordInput");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");

/* =========================
   DB 로딩
========================= */

async function loadDB() {
  const db = {
    classic_yes: await fetch("data/db/classic_yes_num.json").then(r => r.json()),
    classic_no: await fetch("data/db/classic_no_num.json").then(r => r.json()),
    platformer_yes: await fetch("data/db/platformer_yes_num.json").then(r => r.json()),
    platformer_no: await fetch("data/db/platformer_no_num.json").then(r => r.json())
  };
  return db;
}

/* =========================
   인게임 DB 생성
========================= */

function buildInGameDB(allDB) {
  const list = [];
  const byFirst = {};
  const byLower = {};

  function pushWords(words) {
    for (const w of words) {
      list.push(w);
      byLower[w.lower] = w;
      if (!byFirst[w.first]) byFirst[w.first] = [];
      byFirst[w.first].push(w);
    }
  }

  if (option.useYesNum) {
    pushWords(allDB.classic_yes.list);
    if (option.usePlatformer) pushWords(allDB.platformer_yes.list);
  } else {
    pushWords(allDB.classic_no.list);
    if (option.usePlatformer) pushWords(allDB.platformer_no.list);
  }

  return { list, byFirst, byLower };
}

/* =========================
   유틸
========================= */

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

const ERROR = {
  WRONG_START: "WRONG_START",
  NOT_IN_DB: "NOT_IN_DB",
  ALREADY_USED: "ALREADY_USED",
  ONE_SHOT: "ONE_SHOT"
};

function validateInput(inputLower) {
  if (inputLower[0] !== expectedChar) return ERROR.WRONG_START;

  const word = inGameDB.byLower[inputLower];
  if (!word) return ERROR.NOT_IN_DB;

  if (used.has(word.original)) return ERROR.ALREADY_USED;

  if (option.noOneShot && isOneShot(word)) return ERROR.ONE_SHOT;

  return null;
}

function getErrorMessage(error) {
  switch (error) {
    case ERROR.WRONG_START:
      return `Start는 '${expectedChar}'로 시작해야 합니다.`;
    case ERROR.NOT_IN_DB:
      return "데이터베이스에 없는 단어입니다.";
    case ERROR.ALREADY_USED:
      return "이미 사용한 단어입니다.";
    case ERROR.ONE_SHOT:
      return "현재 상황에서 한방단어입니다.";
    default:
      return "";
  }
}

/* =========================
   게임 진행
========================= */

function applyWord(word) {
  used.add(word.original);
  history.push(word.original);
  expectedChar = getNextChar(word);
  render();
}

function render() {
  historyEl.textContent = history.join(" → ");
  statusEl.textContent = `Start: '${expectedChar}'`;
}

/* =========================
   플레이어 입력
========================= */

function submitInput() {
  if (!expectedChar) return;

  const raw = inputEl.value.trim();
  if (!raw) return;

  const lower = raw.toLowerCase();
  const error = validateInput(lower);

  if (error) {
    statusEl.textContent = getErrorMessage(error);
    if (option.mode === "solo") {
      statusEl.textContent += " 💀 Game Over";
    }
    return;
  }

  const word = inGameDB.byLower[lower];
  applyWord(word);
  inputEl.value = "";

  if (option.mode === "computer") {
    turn = "computer";
    setTimeout(computerTurn, 500);
  }
}

/* =========================
   컴퓨터 턴
========================= */

function computerTurn() {
  const candidates = inGameDB.byFirst[expectedChar] || [];
  const usable = candidates.filter(
    w => !used.has(w.original)
  );

  if (usable.length === 0) {
    statusEl.textContent = "컴퓨터가 낼 단어가 없습니다. 당신의 승리!";
    return;
  }

  let choice = usable;
  if (option.noOneShot) {
    choice = usable.filter(w => !isOneShot(w));
    if (choice.length === 0) choice = usable;
  }

  const word = choice[Math.floor(Math.random() * choice.length)];
  applyWord(word);
  turn = "player";
}

/* =========================
   초기화
========================= */

async function startGame(startChar, opt) {
  option = opt;
  used.clear();
  history = [];
  expectedChar = startChar.toLowerCase();
  turn = "player";

  const allDB = await loadDB();
  inGameDB = buildInGameDB(allDB);

  render();
}

/* =========================
   Enter 키
========================= */

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") submitInput();
});
