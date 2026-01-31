// ======================
// 상태 변수
// ======================
let state = "IDLE"; // IDLE | PLAYING | ENDED
let turn = "PLAYER"; // PLAYER | AI

let db = [];
let used = new Set();
let history = [];
let lastChar = null;

// ======================
// DOM
// ======================
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

// ======================
// 옵션 연동
// ======================
function syncOptions() {
  if (optNumEdge.checked) {
    optNumIgnore.disabled = false;
    optIgnoreWrap.style.opacity = "1";
  } else {
    optNumIgnore.checked = true;
    optNumIgnore.disabled = true;
    optIgnoreWrap.style.opacity = "0.5";
  }
}
optNumEdge.addEventListener("change", syncOptions);
syncOptions();

// ======================
// 유틸
// ======================
function log1(msg) {
  text1.textContent += msg + "\n";
}

function log2(msg) {
  text2.textContent = msg;
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

function getOptions() {
  return {
    platformer: optPlatformer.checked,
    numEdge: optNumEdge.checked,
    ignoreTrailing: optNumIgnore.checked,
    noOneShot: optNoOneShot.checked,
    aiMode: optAI.checked,
  };
}

// ======================
// DB 로드
// ======================
async function loadDB() {
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

  db = lists.flat();
}

// ======================
// 규칙 함수
// ======================
function getNextChar(entry, opt) {
  if (opt.numEdge && opt.ignoreTrailing && entry.endsWithNum) {
    return entry.lastAlpha;
  }
  return entry.last;
}

function hasNextWord(char) {
  return db.some(e =>
    !used.has(e.key) &&
    e.first === char
  );
}

function accept(entry, who) {
  used.add(entry.key);
  history.push(entry.original);
  lastChar = getNextChar(entry, getOptions());

  log1(`⭕ ${who}: ${entry.original}`);
  log2(history.join(" → "));
}

function lose(who, reason) {
  log1(`❌ ${who} loses: ${reason}`);
  state = "ENDED";
}

// ======================
// 플레이어 입력
// ======================
function onSubmit() {
  if (state !== "PLAYING" || turn !== "PLAYER") return;

  const input = wordInput.value.toLowerCase().trim();
  const opt = getOptions();
  const entry = db.find(e => e.key === input);

  if (!entry) return log1("❌ Not in DB");
  if (used.has(entry.key)) return log1("❌ Already used");
  if (lastChar && entry.first !== lastChar)
    return log1(`❌ Must start with '${lastChar}'`);

  const nextChar = getNextChar(entry, opt);
  if (opt.noOneShot && (!nextChar || !hasNextWord(nextChar)))
    return lose("Player", "One-shot word");

  accept(entry, "Player");

  if (opt.aiMode) {
    turn = "AI";
    setTimeout(aiTurn, 300);
  }
}

// ======================
// AI 턴
// ======================
function aiTurn() {
  if (state !== "PLAYING") return;

  const opt = getOptions();

  const candidates = db.filter(e =>
    !used.has(e.key) &&
    (!lastChar || e.first === lastChar) &&
    (!opt.noOneShot || hasNextWord(getNextChar(e, opt)))
  );

  if (candidates.length === 0)
    return lose("AI", "No possible continuation");

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  accept(choice, "AI");
  turn = "PLAYER";
}

// ======================
// 시작 / 종료
// ======================
startBtn.onclick = async () => {
  resetGame();
  await loadDB();
  lockOptions(true);
  state = "PLAYING";
  log1("Game Started");
};

endBtn.onclick = () => {
  state = "IDLE";
  lockOptions(false);
  resetGame();
  log1("Game Ended");
};

// ======================
// Enter 입력
// ======================
wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") onSubmit();
});
