/**
 * admin_layout.js
 * Shared navbar + sidebar for all admin pages.
 * Usage: call initAdminLayout('page-key') at bottom of each page's <body>
 *
 * Page keys:
 *   dashboard | students | rooms | payments | complaints |
 *   room-allocation | reports | visitor-log | profile |
 *   add-student | finance | expenses
 */

const ADMIN_NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'fa-tachometer-alt',
    href: 'admin_home.html',
    group: null
  },
  // ── Management group ──────────────────────────────
  { group: 'management', groupLabel: 'Management', groupIcon: 'fa-building' },
  {
    id: 'students',
    label: 'Students',
    icon: 'fa-user-graduate',
    href: 'admin_manage_students.html',
    group: 'management'
  },
  {
    id: 'rooms',
    label: 'Rooms',
    icon: 'fa-bed',
    href: 'admin_manage_rooms.html',
    group: 'management'
  },
  {
    id: 'room-allocation',
    label: 'Allocations',
    icon: 'fa-key',
    href: 'admin_room_allocation.html',
    group: 'management'
  },
  // ── Finance group ─────────────────────────────────
  { group: 'finance', groupLabel: 'Finance', groupIcon: 'fa-coins' },
  {
    id: 'payments',
    label: 'Payments',
    icon: 'fa-money-bill-wave',
    href: 'admin_manage_payments.html',
    group: 'finance'
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: 'fa-receipt',
    href: 'admin_expenses.html',
    group: 'finance'
  },
  {
    id: 'finance',
    label: 'Finance Dashboard',
    icon: 'fa-chart-line',
    href: 'admin_finance.html',
    group: 'finance'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'fa-file-invoice',
    href: 'admin_reports.html',
    group: 'finance'
  },
  // ── Operations group ──────────────────────────────
  { group: 'operations', groupLabel: 'Operations', groupIcon: 'fa-cogs' },
  {
    id: 'complaints',
    label: 'Complaints',
    icon: 'fa-exclamation-circle',
    href: 'admin_manage_complaints.html',
    group: 'operations'
  },
  {
    id: 'visitor-log',
    label: 'Visitor Log',
    icon: 'fa-address-book',
    href: 'admin_visitor_log.html',
    group: 'operations'
  },
  // ── Settings group ────────────────────────────────
  { group: 'settings', groupLabel: 'Settings', groupIcon: 'fa-sliders-h' },
  {
    id: 'profile',
    label: 'Admin Profile',
    icon: 'fa-user-shield',
    href: 'admin_profile.html',
    group: 'settings'
  },
];

// Which groups are open by default or because active item is inside them
function getOpenGroups(activePage) {
  const groupMap = { 'management': ['students','rooms','room-allocation','add-student'],
                     'finance': ['payments','expenses','finance','reports'],
                     'operations': ['complaints','visitor-log'],
                     'settings': ['profile'] };
  const open = new Set(JSON.parse(localStorage.getItem('sidebarOpen') || '["management"]'));
  // Force open group that contains the active page
  for (const [g, pages] of Object.entries(groupMap)) {
    if (pages.includes(activePage)) open.add(g);
  }
  return open;
}

function buildSidebar(activePage) {
  const openGroups = getOpenGroups(activePage);
  const groupIds = ['management','finance','operations','settings'];

  // Build group → items map
  const groups = {};
  const items = {};
  ADMIN_NAV.forEach(entry => {
    if (entry.group === null) return; // dashboard handled separately
    if (entry.groupLabel) {
      groups[entry.group] = { label: entry.groupLabel, icon: entry.groupIcon };
    } else {
      if (!items[entry.group]) items[entry.group] = [];
      items[entry.group].push(entry);
    }
  });

  let html = `
  <div id="adminSidebar" class="admin-sidebar d-flex flex-column" style="min-height:100vh;">
    <div class="sidebar-brand px-3 py-3 d-flex align-items-center gap-2">
      <img src="../img/logo/logo.png" class="rounded-circle" width="36" alt="Logo">
      <span class="fw-bold text-white fs-6" style="letter-spacing:1px;">HOSTEL<span style="color:#00d2ff;">SPHERE</span></span>
    </div>
    <hr class="sidebar-divider">
    <nav class="sidebar-nav px-2 flex-grow-1">
      <ul class="nav flex-column gap-1">

        <!-- Dashboard (always visible) -->
        <li class="nav-item">
          <a href="admin_home.html" class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}">
            <i class="fa fa-tachometer-alt sidebar-icon"></i>
            <span>Dashboard</span>
          </a>
        </li>`;

  // Render each group
  groupIds.forEach(gid => {
    if (!groups[gid]) return;
    const isOpen = openGroups.has(gid);
    const groupItems = items[gid] || [];
    const hasActive = groupItems.some(i => i.id === activePage);

    html += `
        <!-- ${groups[gid].label} Group -->
        <li class="nav-item sidebar-group">
          <button class="sidebar-group-btn ${isOpen ? '' : 'collapsed'}" 
                  onclick="toggleSidebarGroup('${gid}', this)"
                  aria-expanded="${isOpen}">
            <span class="d-flex align-items-center gap-2">
              <i class="fa ${groups[gid].icon} sidebar-icon"></i>
              <span>${groups[gid].label}</span>
            </span>
            <i class="fa fa-chevron-down sidebar-chevron ${isOpen ? 'open' : ''}"></i>
          </button>
          <ul class="sidebar-submenu ${isOpen ? 'show' : ''}" id="group-${gid}">`;

    groupItems.forEach(item => {
      html += `
            <li>
              <a href="${item.href}" class="sidebar-sublink ${item.id === activePage ? 'active' : ''}">
                <i class="fa ${item.icon} sidebar-icon-sm"></i>
                <span>${item.label}</span>
              </a>
            </li>`;
    });

    html += `
          </ul>
        </li>`;
  });

  html += `
      </ul>
    </nav>
    <div class="sidebar-footer px-3 py-3">
      <button class="btn btn-sm w-100 btn-logout" onclick="logout()">
        <i class="fa fa-sign-out-alt me-2"></i>Logout
      </button>
    </div>
  </div>`;

  return html;
}

function buildNavbar(activePage) {
  const username = localStorage.getItem('loggedUser') || 'Admin';
  return `
  <nav class="admin-topbar navbar fixed-top">
    <div class="container-fluid px-4 d-flex align-items-center justify-content-between">
      <!-- Left: hamburger + breadcrumb -->
      <div class="d-flex align-items-center gap-3">
        <button class="topbar-toggle d-md-none" onclick="toggleMobileSidebar()">
          <i class="fa fa-bars"></i>
        </button>
        <span class="topbar-title text-white fw-semibold d-none d-md-block">
          <i class="fa fa-tachometer-alt me-2 opacity-50"></i>Admin Panel
        </span>
      </div>

      <!-- Right: bell + user -->
      <div class="d-flex align-items-center gap-3">
        <!-- Dark mode -->
        <button class="topbar-icon-btn" onclick="toggleDarkMode()" title="Toggle Dark Mode">
          <i class="fa fa-moon"></i>
        </button>

        <!-- Notification Bell -->
        <div class="position-relative">
          <button class="topbar-icon-btn" id="notifBellBtn" onclick="toggleNotifPanel()" title="Notifications">
            <i class="fa fa-bell"></i>
            <span class="notif-badge" id="notifBadge" style="display:none;">0</span>
          </button>
          <!-- Dropdown -->
          <div class="notif-panel shadow" id="notifPanel" style="display:none;">
            <div class="notif-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <span class="fw-bold small">Notifications</span>
              <button class="btn btn-sm p-0 text-muted" onclick="toggleNotifPanel()"><i class="fa fa-times"></i></button>
            </div>
            <div id="notifList" class="notif-list">
              <div class="text-center text-muted py-4 small">Loading...</div>
            </div>
          </div>
        </div>

        <!-- User pill -->
        <div class="topbar-user d-none d-md-flex align-items-center gap-2">
          <div class="topbar-avatar">
            <i class="fa fa-user-circle"></i>
          </div>
          <span class="text-white fw-medium small">${username}</span>
        </div>
      </div>
    </div>
  </nav>`;
}

function toggleSidebarGroup(gid, btn) {
  const submenu = document.getElementById('group-' + gid);
  const chevron = btn.querySelector('.sidebar-chevron');
  const isOpen = submenu.classList.contains('show');

  if (isOpen) {
    submenu.classList.remove('show');
    chevron.classList.remove('open');
    btn.classList.add('collapsed');
  } else {
    submenu.classList.add('show');
    chevron.classList.add('open');
    btn.classList.remove('collapsed');
  }

  // Persist open groups
  const openGroups = [];
  document.querySelectorAll('.sidebar-submenu.show').forEach(el => {
    openGroups.push(el.id.replace('group-', ''));
  });
  localStorage.setItem('sidebarOpen', JSON.stringify(openGroups));
}

function toggleMobileSidebar() {
  document.getElementById('adminSidebar').classList.toggle('mobile-open');
}

// ── Notification System ───────────────────────────────────────────────────
let notifOpen = false;
function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  notifOpen = !notifOpen;
  panel.style.display = notifOpen ? 'block' : 'none';
  if (notifOpen) loadNotifications();
}

async function loadNotifications() {
  const listEl = document.getElementById('notifList');
  try {
    const [appsRes, compRes] = await Promise.all([
      fetch(`${API_URL}/data/applications`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/data/complaints`).then(r => r.json()).catch(() => [])
    ]);

    const pending = (appsRes || []).filter(a => a.status === 'Pending Review');
    const awaiting = (appsRes || []).filter(a => a.status === 'Approved - Awaiting Payment');
    const openComp = (compRes || []).filter(c => c.status === 'Pending');

    const total = pending.length + awaiting.length + openComp.length;
    const badge = document.getElementById('notifBadge');
    badge.style.display = total > 0 ? 'flex' : 'none';
    badge.textContent = total;

    let html = '';
    if (pending.length > 0) {
      html += `<div class="notif-item">
        <i class="fa fa-clock text-warning me-2"></i>
        <div><div class="notif-msg fw-medium">${pending.length} application(s) pending review</div>
        <div class="notif-sub text-muted">Room Allocations</div></div>
      </div>`;
    }
    if (awaiting.length > 0) {
      html += `<div class="notif-item">
        <i class="fa fa-rupee-sign text-success me-2"></i>
        <div><div class="notif-msg fw-medium">${awaiting.length} student(s) awaiting payment</div>
        <div class="notif-sub text-muted">Finance</div></div>
      </div>`;
    }
    if (openComp.length > 0) {
      html += `<div class="notif-item">
        <i class="fa fa-exclamation-triangle text-danger me-2"></i>
        <div><div class="notif-msg fw-medium">${openComp.length} unresolved complaint(s)</div>
        <div class="notif-sub text-muted">Operations</div></div>
      </div>`;
    }
    if (html === '') html = `<div class="text-center text-muted py-4 small"><i class="fa fa-check-circle text-success fa-2x d-block mb-2"></i>All clear!</div>`;
    listEl.innerHTML = html;
  } catch(e) {
    listEl.innerHTML = '<div class="text-center text-muted py-3 small">Could not load notifications.</div>';
  }
}

// Close notif panel on outside click
document.addEventListener('click', function(e) {
  if (notifOpen && !e.target.closest('#notifPanel') && !e.target.closest('#notifBellBtn')) {
    document.getElementById('notifPanel').style.display = 'none';
    notifOpen = false;
  }
});

// ── Main Init ────────────────────────────────────────────────────────────────
function initAdminLayout(activePage) {
  // Inject navbar
  const navMount = document.getElementById('navbar-mount');
  if (navMount) navMount.outerHTML = buildNavbar(activePage);

  // Inject sidebar into col-md-2
  const sidebarMount = document.getElementById('sidebar-mount');
  if (sidebarMount) sidebarMount.innerHTML = buildSidebar(activePage);

  // Load notification badge on init (silent, no panel open)
  loadNotifBadge();
}

async function loadNotifBadge() {
  try {
    const [appsRes, compRes] = await Promise.all([
      fetch(`${API_URL}/data/applications`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/data/complaints`).then(r => r.json()).catch(() => [])
    ]);
    const pending = (appsRes || []).filter(a => a.status === 'Pending Review').length;
    const awaiting = (appsRes || []).filter(a => a.status === 'Approved - Awaiting Payment').length;
    const openComp = (compRes || []).filter(c => c.status === 'Pending').length;
    const total = pending + awaiting + openComp;
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.style.display = total > 0 ? 'flex' : 'none';
      badge.textContent = total;
    }
  } catch(e) {}
}
