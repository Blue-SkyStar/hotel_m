/**
 * transform_admin_pages.js
 * 
 * Batch-transforms all 10 admin HTML pages to use the shared
 * admin_layout.js sidebar + navbar (Step 1 of the restructuring plan).
 *
 * For each page it:
 *   1. Replaces the inline <nav>…</nav> block with <div id="navbar-mount"></div>
 *   2. Replaces the inline sidebar <div class="col-md-2 bg-dark …">…</div>
 *      with <div id="sidebar-mount" class="col-md-2 p-0"></div>
 *   3. Adds the admin_layout.js <script> tag before </body>
 *   4. Adds initAdminLayout('page-key') call right after
 *   5. Adjusts margin-top on the main container from 90px → 70px
 *      (our new topbar is shorter)
 *
 * Usage:  node scripts/transform_admin_pages.js
 */

const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, '..', 'public', 'admin');

// Map: filename → page key used by initAdminLayout()
const PAGE_MAP = {
  'admin_home.html':               'dashboard',
  'admin_manage_students.html':    'students',
  'admin_manage_rooms.html':       'rooms',
  'admin_manage_payments.html':    'payments',
  'admin_manage_complaints.html':  'complaints',
  'admin_room_allocation.html':    'room-allocation',
  'admin_reports.html':            'reports',
  'admin_visitor_log.html':        'visitor-log',
  'admin_profile.html':            'profile',
  'admin_add_student.html':        'add-student',
};

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const [filename, pageKey] of Object.entries(PAGE_MAP)) {
  const filePath = path.join(ADMIN_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  SKIP  ${filename}  (file not found)`);
    skipCount++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // ── Guard: already transformed? ──────────────────────────────────────
  if (html.includes('id="navbar-mount"') || html.includes("id='navbar-mount'")) {
    console.log(`  ✓  SKIP  ${filename}  (already transformed)`);
    skipCount++;
    continue;
  }

  const original = html;

  // ── 1. Remove old <nav …> … </nav> (the fixed-top navbar) ────────────
  // Match the opening <nav tag up to its closing </nav>
  // We do this with a simple state machine to handle nested tags
  html = removeFirstNav(html);

  // ── 2. Replace sidebar col-md-2 div with mount point ─────────────────
  html = replaceSidebarDiv(html);

  // ── 3. Inject admin_layout.js script + initAdminLayout call ──────────
  const layoutScript = `
    <!-- Shared Admin Layout -->
    <script src="../js/admin_layout.js"></script>
    <script>initAdminLayout('${pageKey}');</script>`;

  // Insert just before </body>
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${layoutScript}\n</body>`);
  }

  // ── 4. Insert navbar-mount div right after <body …> ───────────────────
  // Insert after the opening body tag (or after role-guard script block)
  // We already stripped the old nav; now add the mount div near the top of body
  html = insertNavbarMount(html);

  // ── 5. Adjust container margin-top (90px → 70px) ─────────────────────
  html = html.replace(/margin-top:\s*90px/gi, 'margin-top:70px');

  // ── 6. Write file ─────────────────────────────────────────────────────
  if (html === original) {
    console.log(`  ~  NOOP  ${filename}  (no changes needed)`);
    skipCount++;
    continue;
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ✅  DONE  ${filename}  (page-key: ${pageKey})`);
  successCount++;
}

console.log('\n' + '─'.repeat(55));
console.log(`Transformed: ${successCount}   Skipped: ${skipCount}   Errors: ${errorCount}`);
console.log('─'.repeat(55));


// ══════════════════════════════════════════════════════════════
//  Helper functions
// ══════════════════════════════════════════════════════════════

/**
 * Removes the FIRST <nav …> … </nav> block from html.
 * Uses a character scan to properly handle nested tags.
 */
function removeFirstNav(html) {
  const startIdx = html.toLowerCase().indexOf('<nav ');
  if (startIdx === -1) return html;

  let depth = 0;
  let i = startIdx;
  let endIdx = -1;

  while (i < html.length) {
    if (html[i] === '<') {
      const tag = html.slice(i);
      const openMatch = tag.match(/^<nav[\s>]/i);
      const closeMatch = tag.match(/^<\/nav>/i);
      if (openMatch) {
        depth++;
        // advance past the tag opener
        const gt = html.indexOf('>', i);
        if (gt !== -1) i = gt;
      } else if (closeMatch) {
        depth--;
        if (depth === 0) {
          endIdx = i + '</nav>'.length;
          break;
        }
      }
    }
    i++;
  }

  if (endIdx === -1) {
    // Fallback: regex-based removal of simple nav block
    return html.replace(/<nav[\s\S]*?<\/nav>/i, '');
  }

  return html.slice(0, startIdx) + html.slice(endIdx);
}

/**
 * Replaces the sidebar <div class="col-md-2 bg-dark …"> … </div>
 * with <div id="sidebar-mount" class="col-md-2 p-0"></div>
 */
function replaceSidebarDiv(html) {
  // Find the sidebar div: col-md-2 bg-dark
  const sidebarPattern = /(<div\s[^>]*\bcol-md-2\b[^>]*\bbg-dark\b[^>]*>)/i;
  const match = html.match(sidebarPattern);
  if (!match) {
    console.log('    (no sidebar col-md-2.bg-dark found — may already be replaced)');
    return html;
  }

  const startIdx = html.indexOf(match[0]);
  if (startIdx === -1) return html;

  // Walk forward counting div open/close to find this div's end
  let depth = 0;
  let i = startIdx;
  let endIdx = -1;

  while (i < html.length) {
    if (html[i] === '<') {
      const tag = html.slice(i);
      const openMatch = tag.match(/^<div[\s>]/i);
      const closeMatch = tag.match(/^<\/div>/i);
      if (openMatch) {
        depth++;
        const gt = html.indexOf('>', i);
        if (gt !== -1) i = gt;
      } else if (closeMatch) {
        depth--;
        if (depth === 0) {
          endIdx = i + '</div>'.length;
          break;
        }
      }
    }
    i++;
  }

  if (endIdx === -1) return html;

  const before = html.slice(0, startIdx);
  const after  = html.slice(endIdx);
  return before + '\n            <div id="sidebar-mount" class="col-md-2 p-0"></div>\n' + after;
}

/**
 * Inserts <div id="navbar-mount"></div> right after the <body> or
 * after the first inline role-guard <script> block — whichever comes first
 * in the body.
 */
function insertNavbarMount(html) {
  // If already present, skip
  if (html.includes('id="navbar-mount"') || html.includes("id='navbar-mount'")) {
    return html;
  }

  const mount = '\n    <div id="navbar-mount"></div>\n';

  // Try to insert after the role-guard script, if it's at top of body
  // The guard script contains 'localStorage.getItem("role")'
  const guardEnd = html.indexOf('</script>', html.indexOf('localStorage.getItem'));
  if (guardEnd !== -1) {
    const insertAt = guardEnd + '</script>'.length;
    return html.slice(0, insertAt) + mount + html.slice(insertAt);
  }

  // Fallback: after opening <body> tag
  const bodyIdx = html.search(/<body[^>]*>/i);
  if (bodyIdx !== -1) {
    const gt = html.indexOf('>', bodyIdx);
    return html.slice(0, gt + 1) + mount + html.slice(gt + 1);
  }

  return html;
}
