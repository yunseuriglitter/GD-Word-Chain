/* =========================
   PRE-GAME MODULE
========================= */

/*
  전제:
  전역에 다음 DB들이 로딩되어 있음
  - CLASSIC_NO
  - CLASSIC_YES
  - PLATFORMER_NO
  - PLATFORMER_YES
*/

// =========================
// DOM
// =========================

const optionsArea     = document.getElementById("optionsArea");
const dictionaryArea  = document.getElementById("dictionaryArea");
const oneShotArea     = document.getElementById("oneShotArea");
const gameControlArea = document.getElementById("gameControlArea");

const btnStart  = document.getElementById("btnStart");
const btnFinish = document.getElementById("btnFinish");

const optPlatformer = document.getElementById("optPlatformer");
const optStartEnd   = document.getElementById("optStartEndNum");
const optIgnoreNum  = document.getElementById("optIgnoreTrailingNum");
const optIgnoreWrap = document.getElementById("optIgnoreWrapper");
const optOneShot    = document.getElementById("optAllowOneShot");
const optComputer   = document.getElementById("optComputerMode");

// Dictionary
const dictPrefixRadio = document.getElementById("dictPrefix");
const dictSuffixRadio = document.getElementById("dictSuffix");
const dictSearchInput = document.getElementById("dictSearch");
const dictResultBox   = document.getElementById("dictResult");

// One-Shot
const btnFindOneShot  = document.getElementById("btnFindOneShot");
const oneShotResult   = document.getElementById("oneShotResult");

// =========================
// Databases (Fixed Scope)
// =========================

// 사전은 옵션과 무관하게 항상 전체
const DICTIONARY_DB = [
  ...window.CLASSIC_NO,
  ...window.CLASSIC_YES,
  ...window.PLATFORMER_NO,
  ...window.PLATFORMER_YES
];

// yes_num 전체 풀 (무조건 한방 계산용)
const YES_NUM_POOL = [
  ...window.CLASSIC_YES,
  ...window.PLATFORMER_YES
];

// =========================
// Absolute One-Shot List
// =========================

export const ABSOLUTE_ONE_SHOT_LIST = buildAbsoluteOneShotList();

function buildAbsoluteOneShotList() {
  const result = [];

  for (const word of YES_NUM_POOL) {
    // 맨 뒤가 5 / 6 / 7
    if (!["5", "6", "7"].includes(word.last)) continue;

    // 이을 수 있는 단어가 존재하는지
    const canChain = YES_NUM_POOL.some(other =>
      other.lower !== word.lower &&
      other.first === word.last
    );

    if (!canChain) {
      result.push(word);
    }
  }

  return result;
}

// =========================
// Init Pre-Game
// =========================

export function initPreGame(onStartGame) {
  enterPreGameUI();
  applyOptionConstraint();

  // Start Game
  btnStart.onclick = () => {
    const options = readOptions();
    onStartGame(options);
  };

  // Finish Game (PRE 상태에서는 비활성)
  btnFinish.disabled = true;

  // Option dependency
  optStartEnd.addEventListener("change", applyOptionConstraint);

  // Dictionary search
  dictSearchInput.addEventListener("input", handleDictionarySearch);

  // One-shot finder
  btnFindOneShot.onclick = showAbsoluteOneShotWords;
}

// =========================
// UI State Control
// =========================

export function enterPreGameUI() {
  optionsArea.classList.remove("disabled");
  dictionaryArea.classList.remove("disabled");
  oneShotArea.classList.remove("disabled");

  btnFinish.disabled = true;
}

export function disablePreGameUI() {
  optionsArea.classList.add("disabled");
  dictionaryArea.classList.add("disabled");
  oneShotArea.classList.add("disabled");
}

// =========================
// Options
// =========================

function applyOptionConstraint() {
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
  const keyword = dictSearchInput.value.trim().toLowerCase();
  if (!keyword) {
    dictResultBox.textContent = "";
    return;
  }

  const isPrefix = dictPrefixRadio.checked;

  const results = DICTIONARY_DB.filter(word => {
    return isPrefix
      ? word.lower.startsWith(keyword)
      : word.lower.endsWith(keyword);
  });

  dictResultBox.textContent = results
    .map(w => w.original)
    .join("\n");
}

// =========================
// One-Shot Display
// =========================

function showAbsoluteOneShotWords() {
  oneShotResult.textContent = ABSOLUTE_ONE_SHOT_LIST
    .map(w => w.original)
    .join("\n");
}
