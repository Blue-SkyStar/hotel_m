// API Base URL
const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3000/api'
    : '/api';

// Global variables (populated from server)
let students = [];
let rooms = [];
let payments = [];
let applications = [];
let complaints = [];
let visitors = [];

// Fallback Dummy Data to prevent empty states
const FALLBACK_DATA = {
    students: [
        { id: 1, name: "Ayan Ali", course: "B.Tech CSE", room: "B-101", status: "Active" }
    ],
    rooms: [
        { id: 1, number: "B-101", type: "Boys Single", capacity: 1, price: 5000, status: "Available", gender: "Boys" }
    ],
    payments: [],
    complaints: [],
    applications: []
};

// Cache Management
function invalidateCache(key) {
    if (typeof sessionStorage === 'undefined') return;
    if (key) {
        sessionStorage.removeItem(`hs_cache_${key}`);
    } else {
        Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith('hs_cache_')) sessionStorage.removeItem(k);
        });
    }
}

async function fetchWithCache(key) {
    if (typeof sessionStorage === 'undefined') return FALLBACK_DATA[key] || [];
    
    const cached = sessionStorage.getItem(`hs_cache_${key}`);
    
    // Background refresh with credentials for Vercel
    const bgFetch = fetch(`${API_URL}/data/${key}`, { credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                sessionStorage.setItem(`hs_cache_${key}`, JSON.stringify(data));
                // Silent background update of globals
                if (key === 'students') students = data;
                if (key === 'rooms') rooms = data;
                if (key === 'payments') payments = data;
                if (key === 'applications') applications = data;
                if (key === 'complaints') complaints = data;
                if (key === 'visitors') visitors = data;

                if (typeof updateDashboardStats === 'function') updateDashboardStats();
                if (typeof renderReports === 'function') renderReports();
            }
            return data;
        }).catch(err => {
            console.warn(`Fetch failed for ${key}:`, err);
            return null;
        });

    if (cached) return JSON.parse(cached);
    
    const data = await bgFetch;
    return data || FALLBACK_DATA[key] || [];
}

async function initData() {
    console.log("System Initialization: Loading production data...");
    try {
        const [s, r, p, a, c, v] = await Promise.all([
            fetchWithCache('students'),
            fetchWithCache('rooms'),
            fetchWithCache('payments'),
            fetchWithCache('applications'),
            fetchWithCache('complaints'),
            fetchWithCache('visitors')
        ]);
        
        students = s || [];
        rooms = r || [];
        payments = p || [];
        applications = a || [];
        complaints = c || [];
        visitors = v || [];

        console.log("Initialization complete. Rooms found:", rooms.length);

        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        return { students, rooms, payments, applications, complaints, visitors };
    } catch (err) {
        console.error("Critical error during data initialization:", err);
        return { students: [], rooms: [], payments: [], applications: [], complaints: [], visitors: [] };
    }
}
