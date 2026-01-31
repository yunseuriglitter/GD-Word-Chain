console.log("pregame.js loaded");

export function initPreGame(config) {
  console.log("initPreGame called");

  const {
    dictionaryDB,
    absoluteOneShotList,
    onStartGame
  } = config;

  const btnStart = document.getElementById("btnStart");
  const optStartEnd = document.getElementById("optStartEndNum");
  const optIgnore = document.getElementById("optIgnoreTrailingNum");

  const dictSearch = document.getElementById("dictSearch");
  const dictPrefix = document.getElementById("dictPrefix");
  const dictResult = document.getElementById("dictResult");

  const btnFind = document.getElementById("btnFindOneShot");
  const oneShotResult = document.getElementById("oneShotResult");

  /* ---------- 옵션 종속 ---------- */
  function applyDependency() {
    if (!optStartEnd.checked) {
      optIgnore.checked = false;
      optIgnore.disabled = true;
    } else {
      optIgnore.disabled = false;
    }
  }
  applyDependency();
  optStartEnd.onchange = applyDependency;

  /* ---------- Start Game ---------- */
  btnStart.onclick = () => {
    onStartGame({
      useNum: optStartEnd.checked,
      ignoreTrailingNum: optIgnore.checked
    });
  };

  /* ---------- Dictionary ---------- */
  dictSearch.oninput = () => {
    const keyword = dictSearch.value.trim().toLowerCase();
    if (!keyword) {
      dictResult.textContent = "";
      return;
    }

    const isPrefix = dictPrefix.checked;

    const results = dictionaryDB.filter(w =>
      isPrefix
        ? w.lower.startsWith(keyword)
        : w.lower.endsWith(keyword)
    );

    dictResult.textContent = results
      .map(w => w.original)
      .join("\n");
  };

  /* ---------- One-Shot ---------- */
  btnFind.onclick = () => {
    oneShotResult.textContent = absoluteOneShotList
      .map(w => w.original ?? w)
      .join("\n");
  };
}
