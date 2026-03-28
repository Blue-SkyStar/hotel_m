// Role-Based Access Control logic for shared Admin/Warden pages
document.addEventListener("DOMContentLoaded", () => {
    let role = localStorage.getItem("role");
    
    // Strict guard for admin-only pages
    const adminOnlyPages = [
        "admin_manage_payments.html", 
        "admin_reports.html", 
        "admin_profile.html",
        "settings.html" // Placeholder for any system settings page
    ];

    let currentPath = window.location.pathname;

    if (role === "warden") {
        // 1. Kick warden out if they manage to visit a strictly admin-only page
        if (adminOnlyPages.some(page => currentPath.includes(page))) {
            window.location.href = "../warden/warden_dashboard.html";
            return;
        }

        // 2. Hide restricted menu links in the sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            let href = link.getAttribute('href');
            if (href && adminOnlyPages.some(page => href.includes(page))) {
                let listItem = link.closest('.nav-item');
                if (listItem) listItem.style.display = 'none';
                else link.style.display = 'none';
            }
        });

        // 3. Rewrite "Dashboard" and "Home" links to point to warden dashboard
        document.querySelectorAll('.nav-link, .navbar-brand').forEach(link => {
            let href = link.getAttribute('href');
            if (href === 'admin_home.html') {
                link.setAttribute('href', '../warden/warden_dashboard.html');
            }
        });

        // 4. Hide Delete Buttons globally by injecting a CSS rule
        let style = document.createElement('style');
        style.innerHTML = `
            .delete-btn { 
                display: none !important; 
            }
        `;
        document.head.appendChild(style);
    }
});
