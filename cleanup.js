/**
 * Cleanup script: removes Format.com leftover code from HTML files.
 * Run with: node cleanup.js
 * Then delete this file.
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;

const skipFiles = ['Albums · byamazaky · Lomography.html', 'saved_resource.html', 'cleanup.js'];
const skipDirs  = ['shoes', 'Albums · byamazaky · Lomography_files', '.git', 'node_modules'];

function getHtmlFiles(dir) {
  let results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return results; }
  for (const e of entries) {
    if (skipDirs.includes(e.name)) continue;
    if (e.isDirectory()) results = results.concat(getHtmlFiles(path.join(dir, e.name)));
    else if (e.name.endsWith('.html') && !skipFiles.includes(e.name)) results.push(path.join(dir, e.name));
  }
  return results;
}

const files = getHtmlFiles(root);
let cleaned = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Remove browser "saved from url" comment
  content = content.replace(/<!-- saved from url=\([^)]+\)[^\n]*-->/g, '');

  // 2. Remove turbolinks script (Format.com AJAX navigation, not needed for static site)
  content = content.replace(/\t?<script src="[^"]*turbolinks[^"]*\.transferir"><\/script>\n?/g, '');

  // 3. Remove NREUM / New Relic analytics tracking scripts (config + inlined agent)
  content = content.replace(/<script[^>]*>\s*\(?window\.NREUM[\s\S]*?<\/script>\n?/g, '');

  // 4. Remove canonical link pointing back to Format.com
  content = content.replace(/\t?<link rel="canonical" href="https?:\/\/[^"]*format\.com[^"]*">\n?/g, '');

  // 5. Remove broken /static/theme_api/ stylesheet links (dead links to Format.com CDN)
  content = content.replace(/\t?<link rel="stylesheet" href="\/static\/theme_api\/[^"]*">\n?/g, '');

  // 6. Remove IE conditional comments (IE6, IE7, "lt IE 9") — all dead code
  content = content.replace(/\t?<!--\[if (IE [67]|lt IE 9)\]>[\s\S]*?<!\[endif\]-->\n?/g, '');

  // 7. Collapse 3+ consecutive blank lines into one
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    cleaned++;
    console.log('✓ Cleaned: ' + path.relative(root, file));
  } else {
    console.log('  Skipped (no changes): ' + path.relative(root, file));
  }
}

console.log('\nDone: ' + cleaned + '/' + files.length + ' files cleaned.');
console.log('You can now delete cleanup.js');
