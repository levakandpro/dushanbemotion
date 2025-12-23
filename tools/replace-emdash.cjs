/**
 * Replace em dash (—, U+2014) with hyphen-minus (-) across the project.
 * Skips node_modules/dist/.git and only touches typical source/text files.
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
const exts = new Set([
  '.js','.jsx','.ts','.tsx',
  '.css','.md','.html','.json','.toml',
  '.txt','.svg'
]);

const files = walk(ROOT).filter(f => exts.has(path.extname(f)));

let changedFiles = 0;
let changedTotal = 0;

for (const file of files) {
  let orig;
  try {
    orig = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  if (!orig.includes('—')) continue;

  const next = orig.replace(/—/g, '-');
  if (next !== orig) {
    fs.writeFileSync(file, next, 'utf8');
    changedFiles++;
    changedTotal++;
  }
}

console.log(`Changed files: ${changedFiles}`);
console.log(`Processed with replacements: ${changedTotal}`);


