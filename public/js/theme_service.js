/**
 * theme_service.js
 * Handles dark mode persistence and toggle for both Student and Admin portals.
 */

const ThemeService = {
    init() {
        const theme = localStorage.getItem('hs_theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    },

    toggle() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('hs_theme', isDark ? 'dark' : 'light');

        // Update any chart instances if they exist (theme awareness)
        if (window.Chart) {
            // Optional: logic to update chart defaults for dark mode if needed
        }

        return isDark;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ThemeService.init());
