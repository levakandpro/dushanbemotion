/**
 * Strip common mojibake "symbol prefixes" that ended up in log strings / UI text.
 * These are typically broken emoji/symbols like:
 * - "вљ пёЏ" (⚠️)
 * - "вќЊ" (❌)
 * - "вњ…" (✅)
 * - "в†¶" / "в†·" (arrows)
 *
 * We remove them (optionally with following space) to prevent "hieroglyphs" anywhere.
 */
const fs = require('fs');
const path = require('path');

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

// Replace longer sequences first
const REPLACEMENTS = [
  [/вљ пёЏ\s*/g, ''], // ⚠️
  [/вќЊ\s*/g, ''],    // ❌
  [/вњ…\s*/g, ''],    // ✅
  [/в†¶\s*/g, ''],    // ↶
  [/в†·\s*/g, ''],    // ↷
  [/в†’/g, '→'],
  [/вњ“/g, '✓'],
  [/вњ‚пёЏ/g, '✂️'],
  // Common "Р-" prefix that often represents "З" after broken encoding + dash normalization
  [/Р-(?=[\u0400-\u04FFЁё])/g, 'З'],
];

let changedFiles = 0;
let changedTotal = 0;

for (const file of files) {
  let orig;
  try {
    orig = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  let next = orig;
  for (const [re, rep] of REPLACEMENTS) {
    const before = next;
    next = next.replace(re, rep);
    if (next !== before) changedTotal++;
  }

  if (next !== orig) {
    fs.writeFileSync(file, next, 'utf8');
    changedFiles++;
  }
}

console.log(`Changed files: ${changedFiles}`);
console.log(`Replacement groups applied: ${changedTotal}`);


