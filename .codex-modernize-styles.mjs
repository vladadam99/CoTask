import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);
const replacements = [
  ['border-white/5', 'border-border'],
  ['border-white/10', 'border-border'],
  ['border-white/20', 'border-border'],
  ['hover:border-white/10', 'hover:border-primary/30'],
  ['hover:border-white/20', 'hover:border-primary/30'],
  ['bg-white/5', 'bg-secondary/60'],
  ['bg-white/10', 'bg-secondary'],
  ['bg-white/20', 'bg-secondary'],
  ['hover:bg-white/5', 'hover:bg-secondary/70'],
  ['hover:bg-white/10', 'hover:bg-secondary'],
  ['hover:bg-white/20', 'hover:bg-secondary'],
  ['bg-muted/30', 'bg-card'],
  ['bg-muted/50', 'bg-card'],
  ['border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50', 'border-input rounded-lg px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/18 focus:border-primary/45'],
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const [from, to] of replacements) after = after.split(from).join(to);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}
console.log(JSON.stringify({ changedFiles: changed }));
