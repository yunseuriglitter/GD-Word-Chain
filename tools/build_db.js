const fs = require("fs");
const path = require("path");

/* =========================
   경로
========================= */

const RAW_DIR = path.join(__dirname, "../data/raw");
const DB_DIR = path.join(__dirname, "../data/db");

/* =========================
   유틸
========================= */

// 괄호 제거
function removeParen(str) {
  return str.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

// 맨 앞 / 뒤가 영문자 or 숫자인지
function isValidEdge(str) {
  return /^[a-z0-9].*[a-z0-9]$/i.test(str);
}

// 맨 앞 글자 (소문자)
function getFirst(str) {
  return str[0].toLowerCase();
}

// 맨 뒤 글자 (소문자, 숫자 가능)
function getLast(str) {
  return str[str.length - 1].toLowerCase();
}

// 맨 뒤 알파벳
function getLastAlpha(str) {
  for (let i = str.length - 1; i >= 0; i--) {
    const c = str[i].toLowerCase();
    if (c >= "a" && c <= "z") return c;
  }
  return null;
}

/* =========================
   raw → list
========================= */

function buildList(rawText) {
  const seen = new Set();
  const list = [];

  const lines = rawText.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const original = removeParen(line);
    if (!original) continue;
    if (!isValidEdge(original)) continue;

    const lower = original.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    const first = getFirst(original);
    const last = getLast(original);
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
  const no = [];

  for (const w of list) {
    if (/[0-9]$/.test(w.original)) yes.push(w);
    else no.push(w);
  }

  return { yes, no };
}

/* =========================
   메인 처리
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

  console.log(
    `✔ ${name}: yes=${yes.length}, no=${no.length}`
  );
}

/* =========================
   실행
========================= */

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

processFile("classic");
processFile("platformer");
