/* =========================
   PRE-GAME MODULE
========================= */

/*
  main.js 에서 아래 형태로 호출됨

  initPreGame({
    onStartGame,
    absoluteOneShotList
  });
*/

// =========================
// DOM
// =========================

// Areas
const optionsArea    = document.getElementById("optionsArea");
const dictionaryArea = document.getElementById("dictionaryArea");
const oneShotArea    = document.getElementById("oneShotArea");

// Buttons
const btnStart       = document.getElementById("btnStart");
const btnFinish      = document.getElementById("btnFinish");

// Options
const optPlatformer  = document.getElementById("optPlatformer");
const optStartEnd    = document.getElementById("optStartEndNum");
const optIgnoreNum   = document.getElementById("optIgnoreTrailingNum");
const optIgnoreWrap  = document.getElementById("optIgnoreWrapper");
const optOneShot     = document.getElementById("optAllowOneShot");
const optComputer    = document.getElementById("optComputerMode");

// Dictionary
const dictPrefix     = document.getElementById("dictPrefix");
const dictSuffix     = document.getElementById("dictSuffix");
const dictSearch     = document.getElementById("dictSearch");
const dictResult     = document.getElementById("dictResult");

// One-Shot
const btnFindOneShot = document.getElementById("btnFindOneShot");
const oneShotResult  = document.getElementById("oneShotResult");

// =========================
// Fixed Dictionary DB
// (옵션과 무관, 항상 전체)
// =========================

const DICTIONARY_DB = [
  ...window.CLASSIC_NO,
  ...window.CLASSIC_YES,
  ...window.PLATFORMER_NO,
  ...window.PLATFORMER_YES
];

// =========================
// Public API
// =========================

export function initPreGame(config) {
  const { onStartGame, absoluteOneShotList } = config;

  // UI 초기 상태
  enablePreGameUI();
  applyOptionDependency();

  // Finish Game은 PRE 상태에서 항상 비활성
  btnFinish.disabled = true;

  /* ---------- Event Bind ---------- */

  // Start Game
  btnStart.onclick = () => {
    const options = readOptions();
    onStartGame(options);
  };

  // 옵션 종속 (2번 → 3번)
  optStartEnd.onchange = applyOptionDependency;

  // Dictionary 검색
  dictSearch.oninput = () => {
    handleDictionarySearch();
  };

  // One-Shot Find
  btnFindOneShot.onclick = () => {
    oneShotResult.textContent = absoluteOneShotList
      .map(w => w.original)
      .join("\n");
  };
}

export function enterPreGameUI() {
  enablePreGameUI();
}

export function disablePreGameUI() {
  optionsArea.classList.add("disabled");
  dictionaryArea.classList.add("disabled");
  oneShotArea.classList.add("disabled");
}

// =========================
// UI Control
// =========================

function enablePreGameUI() {
  optionsArea.classList.remove("disabled");
  dictionaryArea.classList.remove("disabled");
  oneShotArea.classList.remove("disabled");
}

// =========================
// Options
// =========================

function applyOptionDependency() {
  // 2번 설정이 꺼지면 3번 설정은 강제 비활성
  if (!optStartEnd.checked) {
    optIgnoreNum.checked = false;
    optIgnoreNum.disabled = true;
    optIgnoreWrap.classList.add("disabled");
  } else {
    optIgnoreNum.disabled = false;
    optIgnoreWrap.classList.remove("disabled");
  }
}

function readOptions() {
  return {
    usePlatformer: optPlatformer.checked,
    useNum: optStartEnd.checked,
    ignoreTrailingNum: optIgnoreNum.checked,
    allowOneShot: optOneShot.checked,
    computerMode: optComputer.checked
  };
}

// =========================
// Dictionary
// =========================

function handleDictionarySearch() {
  const keyword = dictSearch.value.trim().toLowerCase();
  if (!keyword) {
    dictResult.textContent = "";
    return;
  }

  const isPrefix = dictPrefix.checked;

  const results = DICTIONARY_DB.filter(word => {
    return isPrefix
      ? word.lower.startsWith(keyword)
      : word.lower.endsWith(keyword);
  });

  dictResult.textContent = results
    .map(w => w.original)
    .join("\n");
}
