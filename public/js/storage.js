// API Base URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// Global variables (will be populated from server)
let students = [];
let rooms = [];
let payments = [];
let complaints = [];
let visitors = [];

// Fallback Dummy Data to prevent empty states
const FALLBACK_DATA = {
    students: [
        { id: 1, name: "Ayan Ali", course: "B.Tech CSE", room: "B-101", status: "Active" },
        { id: 2, name: "Sara Khan", course: "B.Arch", room: "G-201", status: "Active" },
        { id: 3, name: "Rahul Singh", course: "B.Com", room: "B-102", status: "Active" }
    ],
    rooms: [
        { id: 1, number: "B-101", type: "Boys Single Room", capacity: 1, price: 5000, status: "Available", gender: "Boys", image: "../img/rooms/1.png" },
        { id: 2, number: "G-201", type: "Girls Single Room", capacity: 1, price: 5000, status: "Available", gender: "Girls", image: "../img/rooms/2.png" }
    ],
    payments: [
        { id: 1, student: "Ayan Ali", amount: 5000, method: "UPI", date: "01/04/2024", status: "Paid" }
    ],
    complaints: [
        { id: 1, student: "Sara Khan", type: "Plumbing", description: "Water leaking in bathroom", status: "Pending" }
    ],
    applications: [
        { id: 1, status: "Allocated" }, { id: 2, status: "Pending Review" }, { id: 3, status: "Approved - Awaiting Payment" }
    ]
};

// Initialize data from server
function invalidateCache(key) {
    if (key) {
        sessionStorage.removeItem(`hs_cache_${key}`);
    } else {
        // Clear all cache on mutation to ensure fresh data
        Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith('hs_cache_')) sessionStorage.removeItem(k);
        });
    }
}

async function fetchWithCache(key) {
    const cached = sessionStorage.getItem(`hs_cache_${key}`);
    
    // Background refresh (Revalidate in background)
    const bgFetch = fetch(`${API_URL}/data/${key}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                sessionStorage.setItem(`hs_cache_${key}`, JSON.stringify(data));
                // Update global reference silently
                if (key === 'students') students = data;
                if (key === 'rooms') rooms = data;
                if (key === 'payments') payments = data;
                if (key === 'complaints') complaints = data;
                if (key === 'visitors') visitors = data;
                
                // If on a page with auto-render, trigger it
                if (typeof updateDashboardStats === 'function') updateDashboardStats();
                if (typeof renderReports === 'function') renderReports();
            }
            return data;
        }).catch(() => null);

    // If we have cache, return it immediately for instant UI
    if (cached) {
        return JSON.parse(cached);
    }
    
    // If no cache, return dummy data instantly to avoid empty UI, while fetch is working
    if (FALLBACK_DATA[key]) {
        return FALLBACK_DATA[key];
    }

    return await bgFetch;
}

function initData() {
    return Promise.all([
        fetchWithCache('students'),
        fetchWithCache('rooms'),
        fetchWithCache('payments'),
        fetchWithCache('complaints'),
        fetchWithCache('visitors').catch(() => [])
    ]).then(([sRes, rRes, pRes, cRes, vRes]) => {
        students = sRes || [];
        rooms = rRes || [];
        payments = pRes || [];
        complaints = cRes || [];
        visitors = vRes || [];

        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        return { students, rooms, payments, complaints, visitors };
    }).catch(err => {
        console.error("Error loading data from server:", err);
    });
}



// Model Functions (Updated for API)
async function addStudent(name, email, phone, course, room, gender, guardianName, guardianPhone, address) {
    let student = {
        name, email, phone, course, room, gender, guardianName, guardianPhone, address,
        status: "Active"
    };

    try {
        const res = await fetch(`${API_URL}/data/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        const data = await res.json();
        students.push(data.item);
        invalidateCache(); // Clear cache to sync with backend
        return data.item;
    } catch (err) {
        console.error("Error adding student:", err);
    }
}

async function addRoom(number, type, capacity) {
    let room = {
        number, type, capacity,
        occupied: 0,
        status: "Available"
    };

    try {
        const res = await fetch(`${API_URL}/data/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(room)
        });
        const data = await res.json();
        rooms.push(data.item);
        invalidateCache();
        return data.item;
    } catch (err) {
        console.error("Error adding room:", err);
    }
}

async function addPayment(studentName, roomNumber, amount, method, receiptNumber, date) {
    let payment = {
        student: studentName,
        room: roomNumber,
        amount, method,
        receipt: receiptNumber,
        date: date || new Date().toLocaleDateString(),
        status: "Paid"
    };

    try {
        const res = await fetch(`${API_URL}/data/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment)
        });
        const data = await res.json();
        payments.push(data.item);
        invalidateCache();
        return data.item;
    } catch (err) {
        console.error("Error adding payment:", err);
    }
}

async function addComplaint(studentName, roomNumber, type, description) {
    let complaint = {
        student: studentName,
        room: roomNumber,
        type, description,
        date: new Date().toLocaleDateString(),
        status: "Pending"
    };

    try {
        const res = await fetch(`${API_URL}/data/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(complaint)
        });
        const data = await res.json();
        complaints.push(data.item);
        invalidateCache();
        return data.item;
    } catch (err) {
        console.error("Error adding complaint:", err);
    }
}

async function addVisitor(visitorName, visitingStudent, purpose, phone, inTime) {
    let visitor = {
        visitorName,
        visitingStudent,
        purpose,
        phone: phone || '',
        inTime: inTime || new Date().toLocaleTimeString(),
        outTime: '',
        date: new Date().toLocaleDateString(),
        status: 'In'
    };

    try {
        const res = await fetch(`${API_URL}/data/visitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visitor)
        });
        const data = await res.json();
        visitors.push(data.item);
        invalidateCache();
        return data.item;
    } catch (err) {
        console.error("Error adding visitor:", err);
    }
}

async function deleteData(key, id) {
    try {
        const res = await fetch(`${API_URL}/data/${key}/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            if (key === 'students') students = students.filter(s => s.id != id);
            if (key === 'rooms') rooms = rooms.filter(r => r.id != id);
            if (key === 'payments') payments = payments.filter(p => p.id != id);
            if (key === 'complaints') complaints = complaints.filter(c => c.id != id);
            invalidateCache(key);
            return true;
        }
    } catch (err) {
        console.error(`Error deleting ${key}:`, err);
    }
    return false;
}

async function updateData(key, id, updatedItem) {
    try {
        const res = await fetch(`${API_URL}/data/${key}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem)
        });
        const data = await res.json();
        if (data.success) {
            invalidateCache(key); // clear the specific table's cache
            initData(); // Simplest way to keep in sync
            return true;
        }
    } catch (err) {
        console.error(`Error updating ${key}:`, err);
    }
    return false;
}

// Legacy stub to prevent errors in older pages
function saveData() {
    console.log("saveData called: Data is now auto-saved to backend via individual API calls.");
}

// Clear Data (Not recommended for server-side without proper auth, but keeping stub)
function clearDatabase() {
    alert("Clear database not implemented for server mode for security reasons.");
}

// Generate Dashboard Stats
function updateDashboardStats() {
    let totalStudentsEl = document.getElementById("totalStudentsCounter") || document.getElementById("dash_students");
    let totalRoomsEl = document.getElementById("totalRoomsCounter") || document.getElementById("dash_rooms");
    let complaintsEl = document.getElementById("complaintsCounter") || document.getElementById("dash_complaints");
    let totalFeesEl = document.getElementById("totalFeesCounter") || document.getElementById("dash_fees");

    if (totalStudentsEl) totalStudentsEl.innerText = students.length;
    if (totalRoomsEl) totalRoomsEl.innerText = rooms.length;

    if (complaintsEl) {
        let pendingComplaints = complaints.filter(c => c.status === "Pending").length;
        complaintsEl.innerText = pendingComplaints;
    }

    if (totalFeesEl) {
        let total = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        // If the element is the dashboard card, just put the number (₹ is inline in html)
        // If it shows a ₹ prefix already in the element id pattern, strip it
        let el = totalFeesEl;
        if (el.id === 'dash_fees') {
            el.innerText = total.toLocaleString();
        } else {
            el.innerText = '₹' + total.toLocaleString();
        }
    }
}

// Refresh dashboard helper
function refreshDashboard() {
    // Re-fetch all data and update dashboard UI
    return initData().then(() => {
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
    }).catch(err => console.error('Error refreshing dashboard:', err));
}

// Dark Mode Logic
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "true" : "false");
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});

// Smart Search Logic
function searchTable(inputId, tableId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let rows = document.querySelectorAll(`#${tableId} tbody tr`);

    rows.forEach(row => {
        if (row.innerText.toLowerCase().includes("no ") && row.children.length === 1) return;
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}

// Print System
function printReport() {
    window.print();
}

function logout() {
    localStorage.removeItem("role");
    localStorage.removeItem("loggedUser");

    let path = window.location.pathname;
    const loginPath = (path.includes('/admin/') || path.includes('/student/') || path.includes('/warden/')) ? "../login.html" : "login.html";
    window.location.href = loginPath;
}
