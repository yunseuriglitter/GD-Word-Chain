// game.js

let db = [];
let used = new Set();
let history = [];
let lastChar = null;

// 옵션 DOM
const optPlatformer = document.getElementById("optPlatformer");
const optNumEdge = document.getElementById("optNumEdge");
const optNumIgnore = document.getElementById("optNumIgnore");
const optIgnoreWrap = document.getElementById("optIgnoreWrap");
const optNoOneShot = document.getElementById("optNoOneShot");

function syncOptions() {
  if (optNumEdge.checked) {
    optNumIgnore.disabled = false;
    optIgnoreWrap.style.opacity = "1";
  } else {
    optNumIgnore.checked = true;   // 기본값 유지
    optNumIgnore.disabled = true;
    optIgnoreWrap.style.opacity = "0.5";
  }
}

optNumEdge.addEventListener("change", syncOptions);
syncOptions(); // 초기 상태

function getOptions() {
  return {
    usePlatformer: optPlatformer.checked,
    useNumEdge: optNumEdge.checked,
    ignoreTrailingNumbers: optNumIgnore.checked,
    noOneShot: optNoOneShot.checked,
  };
}

async function loadDB() {
  const opt = getOptions();
  const files = [];

  files.push("data/db/classic_no_num.json");
  if (opt.useNumEdge) files.push("data/db/classic_yes_num.json");

  if (opt.usePlatformer) {
    files.push("data/db/platformer_no_num.json");
    if (opt.useNumEdge) files.push("data/db/platformer_yes_num.json");
  }

  const lists = await Promise.all(
    files.map(f => fetch(f).then(r => r.json()))
  );

  db = lists.flat();
  log(`DB loaded: ${db.length} entries`);
}

loadDB();

function getNextChar(entry, opt) {
  if (opt.useNumEdge && opt.ignoreTrailingNumbers && entry.endsWithNum) {
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

function onSubmit() {
  const inputRaw = document.getElementById("wordInput").value;
  const input = inputRaw.toLowerCase().trim();
  const opt = getOptions();

  const entry = db.find(e => e.key === input);
  if (!entry) {
    log("❌ Not in database");
    return;
  }

  if (used.has(entry.key)) {
    log("❌ Already used");
    return;
  }

  if (lastChar && entry.first !== lastChar) {
    log(`❌ Must start with '${lastChar}'`);
    return;
  }

  const nextChar = getNextChar(entry, opt);

  if (opt.noOneShot) {
    if (!nextChar || !hasNextWord(nextChar)) {
      log("❌ One-shot word (no possible continuation)");
      return;
    }
  }

  used.add(entry.key);
  history.push(entry.original);
  lastChar = nextChar;

  log("⭕ OK: " + entry.original);
  log("▶ " + history.join(" → "));
}

function log(msg) {
  document.getElementById("log").textContent += msg + "\n";
}
