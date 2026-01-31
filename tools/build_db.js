const fs = require("fs");
const path = require("path");

/* =========================
   경로
========================= */

const RAW_DIR = path.join(__dirname, "../data/raw");
const DB_DIR  = path.join(__dirname, "../data/db");

/* =========================
   대표 표기 (예외 처리)
========================= */

const CANONICAL = {
  erebus: "Erebus"
  // 필요하면 여기 계속 추가
};

/* =========================
   유틸 함수
========================= */

// 문자열 끝에 붙은 괄호 제거
function removeTrailingParen(str) {
  return str.replace(/\s*\([^()]*\)\s*$/, "").trim();
}

// 맨 앞 / 맨 뒤 검사
function isValidEdge(str) {
  return /^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(str);
}

// 맨 뒤 알파벳 찾기
function getLastAlpha(str) {
  for (let i = str.length - 1; i >= 0; i--) {
    const c = str[i].toLowerCase();
    if (c >= "a" && c <= "z") return c;
  }
  return null;
}

/* =========================
   raw → 정제된 리스트
========================= */

function buildList(rawText) {
  const seen = new Set();
  const list = [];

  const lines = rawText.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // 1. 뒤 괄호 제거
    let cleaned = removeTrailingParen(line);
    if (!cleaned) continue;

    // 2. 맨 앞 / 뒤 검사
    if (!isValidEdge(cleaned)) continue;

    // 3. 소문자 키
    const lower = cleaned.toLowerCase();

    // 4. 중복 제거 (소문자 기준)
    if (seen.has(lower)) continue;
    seen.add(lower);

    // 5. 대표 표기 적용
    const original = CANONICAL[lower] ?? cleaned;

    // 6. 글자 정보
    const first = original[0].toLowerCase();
    const last = original[original.length - 1].toLowerCase();
    const last_alpha = getLastAlpha(original);

    if (!first || !last_alpha) continue;

    list.push({
      original,
      lower,
      first,
      last,
      last_alpha
    });
  }

  return list;
}

/* =========================
   yes / no num 분리
========================= */

function splitYesNoNum(list) {
  const yes = [];
  const no  = [];

  for (const w of list) {
    if (/^[0-9]|[0-9]$/.test(w.original)) yes.push(w);
    else no.push(w);
  }

  return { yes, no };
}

/* =========================
   파일 처리
========================= */

function processFile(name) {
  const rawPath = path.join(RAW_DIR, `${name}_raw.txt`);
  const rawText = fs.readFileSync(rawPath, "utf-8");

  const baseList = buildList(rawText);
  const { yes, no } = splitYesNoNum(baseList);

  fs.writeFileSync(
    path.join(DB_DIR, `${name}_yes_num.json`),
    JSON.stringify({ list: yes }, null, 2)
  );

  fs.writeFileSync(
    path.join(DB_DIR, `${name}_no_num.json`),
    JSON.stringify({ list: no }, null, 2)
  );

  console.log(`✔ ${name}: yes=${yes.length}, no=${no.length}`);
}

/* =========================
   실행
========================= */

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

processFile("classic");
processFile("platformer");
