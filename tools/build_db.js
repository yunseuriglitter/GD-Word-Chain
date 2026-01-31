// tools/build_db.js

const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "../data/raw");
const DB_DIR  = path.join(__dirname, "../data/db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ---------- 유틸 ----------

// 줄 끝 괄호 제거
function removeParen(str) {
  return str.replace(/\s*\([^)]*\)$/, "").trim();
}

// 앞뒤 영숫자 검사
function isValidEdge(str) {
  return /^[A-Za-z0-9].*[A-Za-z0-9]$/.test(str);
}

// 앞 또는 뒤 숫자 존재 여부
function hasEdgeNumber(str) {
  return /^[0-9]/.test(str) || /[0-9]$/.test(str);
}

// 마지막 알파벳 추출 (lower 기준)
function getLastAlpha(lower) {
  for (let i = lower.length - 1; i >= 0; i--) {
    const c = lower[i];
    if (/[a-z]/.test(c)) return c;
  }
  return null;
}

// ---------- 핵심 처리 ----------

function build(rawFileName, prefix) {
  const rawPath = path.join(RAW_DIR, rawFileName);
  const lines = fs.readFileSync(rawPath, "utf-8").split(/\r?\n/);

  const seen = new Set();
  const yesNum = [];
  const noNum = [];

  for (let line of lines) {
    if (!line) continue;

    const cleaned = removeParen(line);
    if (!cleaned) continue;
    if (!isValidEdge(cleaned)) continue;
    if (seen.has(cleaned)) continue;

    seen.add(cleaned);

    const lower = cleaned.toLowerCase();
    const first = lower[0];
    const last  = lower[lower.length - 1];

    const base = {
      original: cleaned,
      lower,
      first,
      last
    };

    if (hasEdgeNumber(cleaned)) {
      yesNum.push({
        ...base,
        last_alpha: getLastAlpha(lower)
      });
    } else {
      noNum.push(base);
    }
  }

  fs.writeFileSync(
    path.join(DB_DIR, `${prefix}_yes_num.json`),
    JSON.stringify({ list: yesNum }, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(DB_DIR, `${prefix}_no_num.json`),
    JSON.stringify({ list: noNum }, null, 2),
    "utf-8"
  );

  console.log(`✔ ${prefix}: yes=${yesNum.length}, no=${noNum.length}`);
}

// ---------- 실행 ----------

build("classic_raw.txt", "classic");
build("platformer_raw.txt", "platformer");
