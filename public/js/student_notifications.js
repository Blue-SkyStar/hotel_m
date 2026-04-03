/**
 * HostelSphere Student Notifications System
 * Handles fetching and displaying personal status updates for students.
 */

(function() {
    const STUDENT_ID = localStorage.getItem("loggedUser");
    if (!STUDENT_ID) return;

    // Inject CSS for notification bell
    const style = document.createElement('style');
    style.innerHTML = `
        .nav-link.notification-bell { position: relative; cursor: pointer; }
        .notification-badge {
            position: absolute; top: 5px; right: 8px;
            background: #dc3545; color: #fff;
            border-radius: 50%; padding: 2px 5px;
            font-size: 0.65rem; font-weight: 700;
            border: 2px solid #fff;
        }
        .swal2-notification-list { text-align: left; max-height: 400px; overflow-y: auto; }
        .notification-item { padding: 12px; border-bottom: 1px solid #eee; transition: background 0.2s; border-radius: 8px; }
        .notification-item:hover { background: #f8fafc; }
        .notification-item.unread { background: #eff6ff; border-left: 4px solid #3b82f6; }
    `;
    document.head.appendChild(style);

    async function initNotifications() {
        // Wait for navbar to load
        const navbar = document.querySelector('.navbar-nav');
        if (!navbar) { setTimeout(initNotifications, 500); return; }

        // Create Bell Icon
        const li = document.createElement('li');
        li.className = 'nav-item me-3';
        li.innerHTML = `
            <a class="nav-link notification-bell" id="notifBell">
                <i class="fa fa-bell fs-5"></i>
                <span class="notification-badge d-none" id="notifBadge">0</span>
            </a>
        `;
        navbar.insertBefore(li, navbar.firstChild);

        document.getElementById('notifBell').addEventListener('click', showNotifications);
        
        // Initial Fetch
        checkNotifications();
        // Poll every 30 seconds
        setInterval(checkNotifications, 30000);
    }

    async function checkNotifications() {
        try {
            const res = await fetch(`${API_URL}/data/notifications`);
            const allNotifs = await res.json();
            const myNotifs = allNotifs.filter(n => n.student === STUDENT_ID && !n.read);
            
            const badge = document.getElementById('notifBadge');
            if (myNotifs.length > 0) {
                badge.innerText = myNotifs.length;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        } catch (e) { console.error("Notif check failed", e); }
    }

    async function showNotifications() {
        try {
            const res = await fetch(`${API_URL}/data/notifications`);
            const allNotifs = await res.json();
            const myNotifs = allNotifs.filter(n => n.student === STUDENT_ID).sort((a,b) => b.id - a.id).slice(0, 5);

            if (myNotifs.length === 0) {
                Swal.fire({ title: 'Notifications', text: 'You have no new notifications.', icon: 'info' });
                return;
            }

            let html = '<div class="swal2-notification-list">';
            myNotifs.forEach(n => {
                html += `
                    <div class="notification-item ${n.read ? '' : 'unread'}">
                        <div class="fw-bold text-dark">${n.title}</div>
                        <div class="small text-muted mb-1">${n.message}</div>
                        <div class="text-end" style="font-size:0.7rem; opacity:0.6;"><i class="fa fa-clock me-1"></i>${n.date}</div>
                    </div>
                `;
            });
            html += '</div>';

            Swal.fire({
                title: 'Activity Alerts',
                html: html,
                confirmButtonText: 'Mark all as read',
                confirmButtonColor: '#0d6efd',
                showCloseButton: true,
                width: '450px'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    // Mark all as read
                    for (let n of myNotifs) {
                        if (!n.read) {
                            n.read = true;
                            await fetch(`${API_URL}/data/notifications/${n.id}`, {
                                method: 'PUT',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(n)
                            });
                        }
                    }
                    checkNotifications();
                }
            });
        } catch (e) { console.error("Show notifs failed", e); }
    }

    // Start
    if (document.readyState === "complete") initNotifications();
    else window.addEventListener("load", initNotifications);

})();
