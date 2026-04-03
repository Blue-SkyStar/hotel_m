/**
 * HostelSphere Authentication & Session Stability Service
 * Handles background session verification and persistence.
 */

const AUTH_CONFIG = {
    CHECK_INTERVAL: 60000 * 5, // Check session every 5 minutes
    LOGIN_PAGE: "/login.html"
};

const AuthService = {
    init: async function(requiredRole) {
        // 1. Instant Local Check (for speed)
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const currentRole = localStorage.getItem("role");
        const user = localStorage.getItem("loggedUser");

        if (!isLoggedIn || (requiredRole && currentRole !== requiredRole)) {
            this.logout("Session invalid or unauthorized.");
            return;
        }

        // 2. Background Server Verification (for security & longevity)
        try {
            const res = await fetch("/api/auth/verify");
            const data = await res.json();

            if (!data.success) {
                this.logout("Session expired. Please login again.");
            } else {
                // Session is valid, update local storage just in case
                localStorage.setItem("loggedUser", data.user.username);
                localStorage.setItem("role", data.user.role);
                console.log("✅ Session heart-beat verified.");
            }
        } catch (e) {
            console.error("Auth check failed, but keeping session for now (offline/sync):", e);
        }

        // 3. Start Heartbeat
        setInterval(() => this.heartbeat(), AUTH_CONFIG.CHECK_INTERVAL);
    },

    heartbeat: async function() {
        try {
            const res = await fetch("/api/auth/verify");
            const data = await res.json();
            if (!data.success) this.logout("Session expired.");
        } catch (e) {
            console.warn("Heartbeat failed, retrying in next cycle.");
        }
    },

    logout: function(message) {
        localStorage.clear();
        sessionStorage.clear();
        
        if (message && typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Session Ended',
                text: message,
                confirmButtonText: 'Back to Login'
            }).then(() => {
                window.location.href = AUTH_CONFIG.LOGIN_PAGE;
            });
        } else {
            window.location.href = AUTH_CONFIG.LOGIN_PAGE;
        }
    }
};

// Auto-run if a role is identified in the filename or context
// Usage: Include this script and call AuthService.init('student') or 'admin'
