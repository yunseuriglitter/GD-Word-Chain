// tools/build_db.js
// raw txt -> db json 생성 스크립트

const fs = require("fs");
const path = require("path");

// 경로 설정
const RAW_DIR = path.join(__dirname, "../data/raw");
const DB_DIR = path.join(__dirname, "../data/db");

// raw 파일
const FILES = [
  { type: "classic", file: "classic_raw.txt" },
  { type: "platformer", file: "platformer_raw.txt" },
];

// -------------------------
// 유틸 함수
// -------------------------

// 괄호 제거 + 기본 정제
function normalizeName(raw) {
  if (!raw) return null;

  // 괄호 제거
  const clean = raw.replace(/\s*\(.*?\)\s*/g, "").trim();

  // 빈 문자열
  if (!clean) return null;

  // #31 같은 순위 텍스트 제거
  if (/^#\d+$/.test(clean)) return null;

  // 앞/뒤가 알파벳 또는 숫자가 아니면 제거
  if (!/^[a-z0-9].*[a-z0-9]$/i.test(clean)) return null;

  return clean;
}

// 숫자 시작/끝 여부
function hasNumberEdge(name) {
  return {
    start: /^\d/.test(name),
    end: /\d$/.test(name),
  };
}

// 마지막 알파벳 추출 (숫자 인식 X 룰 대비)
function getLastAlpha(name) {
  const m = name.match(/[a-z](?!.*[a-z])/i);
  return m ? m[0].toLowerCase() : null;
}

// -------------------------
// 메인 처리
// -------------------------

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

FILES.forEach(({ type, file }) => {
  const rawPath = path.join(RAW_DIR, file);
  const text = fs.readFileSync(rawPath, "utf-8");

  const lines = text.split(/\r?\n/);

  const seen = new Set();

  const noNum = [];
  const yesNum = [];

  for (const line of lines) {
    const clean = normalizeName(line);
    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const numEdge = hasNumberEdge(clean);

    const entry = {
      original: clean,           // 출력용
      key,                        // 검색용 (소문자)
      first: key[0],              // 맨 앞
      last: key[key.length - 1],  // 맨 뒤
      lastAlpha: getLastAlpha(key),
      startsWithNum: numEdge.start,
      endsWithNum: numEdge.end,
      type,
    };

    if (numEdge.start || numEdge.end) {
      yesNum.push(entry);
    } else {
      noNum.push(entry);
    }
  }

  // 결과 저장
  fs.writeFileSync(
    path.join(DB_DIR, `${type}_no_num.json`),
    JSON.stringify(noNum, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(DB_DIR, `${type}_yes_num.json`),
    JSON.stringify(yesNum, null, 2),
    "utf-8"
  );

  console.log(
    `[${type}] no_num: ${noNum.length}, yes_num: ${yesNum.length}`
  );
});

console.log("DB build complete.");

