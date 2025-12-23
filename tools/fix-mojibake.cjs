/**
 * Fix "mojibake" where UTF-8 text was mis-decoded as Windows-1251 and then saved as UTF-8.
 *
 * Example: "Авторская" -> bytes(UTF-8) misread as cp1251 -> "РђРІС‚РѕСЂСЃРєР°СЏ"
 * This script converts those sequences back to proper UTF-8.
 *
 * It only rewrites files where the conversion clearly improves (markers drop and no replacement chars appear).
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

// Build reverse map: Unicode char -> byte
const CHAR_TO_BYTE = new Map();
for (let i = 0; i < CP1251_TABLE.length; i++) {
  CHAR_TO_BYTE.set(CP1251_TABLE[i], 0x80 + i);
}

function encodeCp1251(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // ASCII
    if (code <= 0x7F) {
      bytes.push(code);
      continue;
    }
    const ch = str[i];
    const b = CHAR_TO_BYTE.get(ch);
    if (b === undefined) {
      // Can't encode (emoji, etc.)
      return null;
    }
    bytes.push(b);
  }
  return Buffer.from(bytes);
}

function fixMojibake(text) {
  const buf = encodeCp1251(text);
  if (!buf) return null;
  // decode bytes as UTF-8
  return buf.toString('utf8');
}

function countMarkers(text) {
  // Strong mojibake markers
  const re = /(Рџ|Рќ|Рђ|РЎ|вЂ)/g;
  let m = 0;
  while (re.exec(text)) m++;
  return m;
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

let changed = 0;
let scanned = 0;

for (const file of files) {
  scanned++;
  let orig;
  try {
    orig = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const origMarkers = countMarkers(orig);
  if (origMarkers === 0) continue;

  const fixed = fixMojibake(orig);
  if (!fixed) continue;

  // Reject if conversion introduces replacement chars
  if (fixed.includes('\uFFFD')) continue;

  const fixedMarkers = countMarkers(fixed);

  // Only accept when it clearly improves
  if (fixedMarkers >= Math.floor(origMarkers * 0.25)) continue;

  if (fixed === orig) continue;

  fs.writeFileSync(file, fixed, 'utf8');
  changed++;
}

console.log(`Scanned: ${scanned} files`);
console.log(`Fixed:   ${changed} files`);


