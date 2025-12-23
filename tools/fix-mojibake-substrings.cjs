/**
 * Fix mojibake substrings inside UTF-8 files without touching the whole file.
 *
 * Targets common patterns:
 * - "РђРІС‚..." (UTF-8 text mis-decoded as CP1251 and saved)
 * - "вЂ”" / "вЂ¦" (punctuation mojibake)
 * - "рџЋЁ" (emoji mojibake)
 */
const fs = require('fs');
const path = require('path');

// CP1251 table for bytes 0x80..0xFF to Unicode
const CP1251_TABLE = [
  '\u0402','\u0403','\u201A','\u0453','\u201E','\u2026','\u2020','\u2021',
  '\u20AC','\u2030','\u0409','\u2039','\u040A','\u040C','\u040B','\u040F',
  '\u0452','\u2018','\u2019','\u201C','\u201D','\u2022','\u2013','\u2014',
  '\u0098','\u2122','\u0459','\u203A','\u045A','\u045C','\u045B','\u045F',
  '\u00A0','\u040E','\u045E','\u0408','\u00A4','\u0490','\u00A6','\u00A7',
  '\u0401','\u00A9','\u0404','\u00AB','\u00AC','\u00AD','\u00AE','\u0407',
  '\u00B0','\u00B1','\u0406','\u0456','\u0491','\u00B5','\u00B6','\u00B7',
  '\u0451','\u2116','\u0454','\u00BB','\u0458','\u0405','\u0455','\u0457',
  // 0xC0..0xFF => А..Яа..я
  ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(0x0410 + i)), // А..Я
  ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(0x0430 + i)), // а..я
];

const CHAR_TO_BYTE = new Map();
for (let i = 0; i < CP1251_TABLE.length; i++) {
  CHAR_TO_BYTE.set(CP1251_TABLE[i], 0x80 + i);
}

function encodeCp1251(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7F) {
      bytes.push(code);
      continue;
    }
    const ch = str[i];
    const b = CHAR_TO_BYTE.get(ch);
    if (b === undefined) return null;
    bytes.push(b);
  }
  return Buffer.from(bytes);
}

function tryFixChunk(chunk) {
  const buf = encodeCp1251(chunk);
  if (!buf) return null;
  const fixed = buf.toString('utf8');
  if (!fixed || fixed.includes('\uFFFD')) return null;

  // Heuristic: fixed should reduce mojibake markers
  const markerRe = /(?:[РС][^\x00-\x7F]|вЂ|рџ)/g;
  const markersBefore = (chunk.match(markerRe) || []).length;
  const markersAfter = (fixed.match(markerRe) || []).length;
  if (markersAfter >= markersBefore) return null;

  return fixed;
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const exts = new Set(['.js','.jsx','.ts','.tsx','.css','.md','.html','.json','.toml']);
const files = walk(ROOT).filter(f => exts.has(path.extname(f)));

// Match mojibake-ish runs (keep it conservative)
const RE_CHUNK = new RegExp(
  [
    // "Р’СЃРµ" / "РђРІС‚..." style (pairs of Р/С + non-ASCII CP1251 chars)
    '(?:[РС][^\\x00-\\x7F]){1,}',
    // "вЂ—" / "вЂ¦" / "вЂў" style punctuation mojibake (repeatable tokens)
    '(?:вЂ[^\\x00-\\x7F]){1,40}',
    // "вљ пёЏ" / "вњ…" / "вќЊ" style mojibake for symbols/emojis
    '(?:в[^\\x00-\\x7F]){2,80}',
    // "рџЋЁ" style emoji mojibake
    'рџ[^\\x00-\\x7F]{1,6}',
  ].join('|'),
  'g'
);

let changedFiles = 0;
let changedChunks = 0;

for (const file of files) {
  let orig;
  try {
    orig = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  // Fast skip: only process files that contain typical mojibake markers.
  // Include short pair markers like "Рё"/"РІ"/"СЃ" in addition to the classic "Рџ"/"вЂ"/"рџ".
  if (!/(?:[РС][^\x00-\x7F]|в[^\x00-\x7F]|рџ)/.test(orig)) continue;

  let changedThis = 0;
  const next = orig.replace(RE_CHUNK, (m) => {
    const fixed = tryFixChunk(m);
    if (fixed) {
      changedThis++;
      changedChunks++;
      return fixed;
    }
    return m;
  });

  if (changedThis > 0 && next !== orig) {
    fs.writeFileSync(file, next, 'utf8');
    changedFiles++;
  }
}

console.log(`Fixed files:  ${changedFiles}`);
console.log(`Fixed chunks: ${changedChunks}`);


