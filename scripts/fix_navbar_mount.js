/**
 * fix_navbar_mount.js
 * Moves <div id="navbar-mount"> from <head> to the very start of <body>
 * in all transformed admin HTML files.
 */
const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, '..', 'public', 'admin');
const files = fs.readdirSync(ADMIN_DIR).filter(f => f.endsWith('.html'));

files.forEach(filename => {
  const filePath = path.join(ADMIN_DIR, filename);
  let html = fs.readFileSync(filePath, 'utf8');

  // Check if navbar-mount is present
  if (!html.includes('id="navbar-mount"')) return;

  // Remove from wherever it is
  html = html.replace(/\n?[ \t]*<div id="navbar-mount"><\/div>\n?/g, '\n');

  // Insert right after <body ...>
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (!bodyMatch) return;

  const bodyIdx = html.indexOf(bodyMatch[0]);
  const insertAt = bodyIdx + bodyMatch[0].length;
  html = html.slice(0, insertAt) + '\n    <div id="navbar-mount"></div>' + html.slice(insertAt);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ✅  FIXED  ${filename}`);
});
console.log('Done!');
