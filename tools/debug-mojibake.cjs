const fs = require('fs');

// same CP1251 map as fixer
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
for (let i = 0; i < CP1251_TABLE.length; i++) CHAR_TO_BYTE.set(CP1251_TABLE[i], 0x80 + i);

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

const file = process.argv[2];
const t = fs.readFileSync(file, 'utf8');
const m = t.match(/(?:[РС][^\x00-\x7F]){3,}/);
if (!m) {
  console.log('no match');
  process.exit(0);
}
const chunk = m[0];
console.log('chunk_len', chunk.length);
let bad = 0;
for (let i = 0; i < chunk.length; i++) {
  const b = cp1251ByteForChar(chunk[i]);
  if (b === null) bad++;
}
console.log('unencodable_chars', bad);
const buf = encodeCp1251(chunk);
if (!buf) {
  console.log('encode failed');
  process.exit(0);
}
const fixed = buf.toString('utf8');
console.log('fixed_preview', fixed.slice(0, 40));
console.log('contains_repl', fixed.includes('\uFFFD'));


