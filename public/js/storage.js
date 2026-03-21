// API Base URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

// Global variables (will be populated from server)
let students = [];
let rooms = [];
let payments = [];
let complaints = [];

// Initialize data from server
function initData() {
    return Promise.all([
        fetch(`${API_URL}/data/students`).then(res => res.json()),
        fetch(`${API_URL}/data/rooms`).then(res => res.json()),
        fetch(`${API_URL}/data/payments`).then(res => res.json()),
        fetch(`${API_URL}/data/complaints`).then(res => res.json())
    ]).then(([sRes, rRes, pRes, cRes]) => {
        students = sRes;
        rooms = rRes;
        payments = pRes;
        complaints = cRes;
        
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        return { students, rooms, payments, complaints };
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
        return data.item;
    } catch (err) {
        console.error("Error adding complaint:", err);
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
            // Update local state is optional if we call initData again or just patch it
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
        let total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        totalFeesEl.innerText = "₹" + total.toLocaleString();
    }
}

// Dark Mode Logic
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "true" : "false");
}

document.addEventListener("DOMContentLoaded", () => {
    if(localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});

// Smart Search Logic
function searchTable(inputId, tableId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let rows = document.querySelectorAll(`#${tableId} tbody tr`);

    rows.forEach(row => {
        if(row.innerText.toLowerCase().includes("no ") && row.children.length === 1) return;
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
