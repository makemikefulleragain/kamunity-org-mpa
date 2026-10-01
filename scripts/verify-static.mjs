import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Script } from 'node:vm';

const root = resolve('site');
const files = [];
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) walk(child); else files.push(child);
  }
}
walk(root);
let inlineScripts = 0;
let scriptFiles = 0;
for (const file of files) {
  if (/\.(m?js)$/.test(file)) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    scriptFiles++;
  }
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    const src = attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src) {
      if (/^(?:https?:|\/\/|data:)/.test(src)) continue;
      const cleanSrc = src.split(/[?#]/)[0];
      const path = cleanSrc.startsWith('/') ? resolve(root, `.${cleanSrc}`) : resolve(dirname(file), cleanSrc);
      if (!existsSync(path)) throw new Error(`Missing script ${src} referenced by ${file}`);
    } else if (!/\btype\s*=\s*["'](?:application\/ld\+json|application\/json|module)["']/i.test(attributes)) {
      new Script(match[2], { filename: `${file} inline script ${++inlineScripts}` });
    }
  }
}
console.log(JSON.stringify({ ok: true, scriptFiles, inlineScripts, htmlFiles: files.filter((file) => file.endsWith('.html')).length }));
