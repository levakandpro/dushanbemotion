/**
 * Aggressive but safe mojibake fixer: scans for CP1251-encodable runs that contain strong mojibake markers
 * and rewrites only when conversion clearly improves.
 */
const fs = require('fs');
const path = require('path');

const CP1251_TABLE = [
  '\u0402','\u0403','\u201A','\u0453','\u201E','\u2026','\u2020','\u2021',
  '\u20AC','\u2030','\u0409','\u2039','\u040A','\u040C','\u040B','\u040F',
  '\u0452','\u2018','\u2019','\u201C','\u201D','\u2022','\u2013','\u2014',
  '\u0098','\u2122','\u0459','\u203A','\u045A','\u045C','\u045B','\u045F',
  '\u00A0','\u040E','\u045E','\u0408','\u00A4','\u0490','\u00A6','\u00A7',
  '\u0401','\u00A9','\u0404','\u00AB','\u00AC','\u00AD','\u00AE','\u0407',
  '\u00B0','\u00B1','\u0406','\u0456','\u0491','\u00B5','\u00B6','\u00B7',
  '\u0451','\u2116','\u0454','\u00BB','\u0458','\u0405','\u0455','\u0457',
  ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(0x0410 + i)), // А..Я
  ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(0x0430 + i)), // а..я
];

const CHAR_TO_BYTE = new Map();
for (let i = 0; i < CP1251_TABLE.length; i++) {
  CHAR_TO_BYTE.set(CP1251_TABLE[i], 0x80 + i);
}

function cp1251ByteForChar(ch) {
  const code = ch.charCodeAt(0);
  if (code <= 0x7F) return code;
  const b = CHAR_TO_BYTE.get(ch);
  return b === undefined ? null : b;
}

function encodeCp1251(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const b = cp1251ByteForChar(str[i]);
    if (b === null) return null;
    bytes.push(b);
  }
  return Buffer.from(bytes);
}

function countMarkers(text) {
  // General mojibake markers (covers Cyrillic-pair style + punctuation/emoji styles)
  return (text.match(/(?:[РС][^\x00-\x7F]|в[^\x00-\x7F]|вЂ|рџ)/g) || []).length;
}

function tryFix(chunk) {
  const buf = encodeCp1251(chunk);
  if (!buf) return null;
  const fixed = buf.toString('utf8');
  if (!fixed || fixed.includes('\uFFFD')) return null;
  const before = countMarkers(chunk);
  const after = countMarkers(fixed);
  if (after >= before) return null;
  return fixed;
}

function looksLikeStart(s, i) {
  const a = s[i];
  const b = s[i + 1] || '';
  if (a === 'в' && b === 'Ђ') return true;
  if (a === 'р' && b === 'џ') return true;
  // "вљ пёЏ" style symbol/emoji mojibake often starts with "в" + non-ASCII
  if (a === 'в') {
    const bb = cp1251ByteForChar(b);
    if (bb !== null && b.charCodeAt(0) > 0x7F) {
      const look = s.slice(i, i + 24);
      let nonAscii = 0;
      for (let k = 0; k < look.length; k++) {
        if (look.charCodeAt(k) > 0x7F) nonAscii++;
        if (nonAscii >= 2) return true;
      }
    }
  }
  if ((a === 'Р' || a === 'С')) {
    const bb = cp1251ByteForChar(b);
    if (bb === null || b.charCodeAt(0) <= 0x7F) return false;

    // Require at least 2 mojibake-like pairs "Р?" or "С?" within a short window
    const look = s.slice(i, i + 24);
    let pairs = 0;
    for (let k = 0; k < look.length - 1; k++) {
      const ch = look[k];
      if (ch !== 'Р' && ch !== 'С') continue;
      const next = look[k + 1];
      const nb = cp1251ByteForChar(next);
      if (nb !== null && next.charCodeAt(0) > 0x7F) {
        pairs++;
        if (pairs >= 2) return true;
      }
    }
    return /вЂ|рџ/.test(look);
  }
  return false;
}

function fixText(text) {
  let out = '';
  let i = 0;
  let changed = 0;
  while (i < text.length) {
    if (!looksLikeStart(text, i)) {
      out += text[i];
      i++;
      continue;
    }

    // capture a CP1251-encodable run (up to 600 chars)
    let j = i;
    while (j < text.length && j - i < 600) {
      const b = cp1251ByteForChar(text[j]);
      if (b === null) break;
      j++;
    }
    const chunk = text.slice(i, j);
    const fixed = tryFix(chunk);
    if (fixed) {
      out += fixed;
      changed++;
      i = j;
      continue;
    }

    // fallback: emit one char and move on
    out += text[i];
    i++;
  }
  return { text: out, changed };
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

let fixedFiles = 0;
let fixedRuns = 0;

for (const file of files) {
  let orig;
  try {
    orig = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (countMarkers(orig) === 0) continue;

  const { text: next, changed } = fixText(orig);
  if (changed > 0 && next !== orig) {
    fs.writeFileSync(file, next, 'utf8');
    fixedFiles++;
    fixedRuns += changed;
  }
}

console.log(`Fixed files: ${fixedFiles}`);
console.log(`Fixed runs:  ${fixedRuns}`);


