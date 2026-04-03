const fs = require('fs');

const file = 'public/student/student_dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// Replacement for JS logic
const newLogic = `
        window.onload = async function () {
            await initData();
            let user = localStorage.getItem("loggedUser") || "Student";
            document.getElementById("dashUsername").textContent = user;
            document.getElementById("welcomeUser").textContent = "Hi, " + user;

            // ── Financial & Application Logic ────────────────────────────
            const userApps = applications.filter(a => a.student && a.student.toLowerCase() === user.toLowerCase());
            const userPayments = (typeof payments !== 'undefined' ? payments : []).filter(p => p.student && p.student.toLowerCase() === user.toLowerCase());
            
            // Priority for Allocated application, else Pending
            const activeApp = userApps.find(a => a.status === 'Allocated') || userApps.find(a => a.status !== 'Rejected' && a.status !== 'Cancelled') || null;

            if (activeApp) {
                if (document.getElementById("dash_status")) document.getElementById("dash_status").textContent = activeApp.status;
                if (document.getElementById("dash_rent"))   document.getElementById("dash_rent").textContent = "₹" + (activeApp.monthlyRent || activeApp.totalPrice || 0);
                
                const totalDue = parseFloat(activeApp.totalAmount || activeApp.totalPrice || 0);
                const paidSum = userPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
                const balance = totalDue - paidSum;
                
                if (document.getElementById("dash_balance")) {
                    document.getElementById("dash_balance").textContent = "₹" + (balance > 0 ? balance.toLocaleString() : 0);
                }
                
                if (document.getElementById("dash_expiry")) {
                    if (activeApp.endDate) {
                        const expiry = new Date(activeApp.endDate);
                        document.getElementById("dash_expiry").textContent = "Till " + expiry.toLocaleDateString();
                    } else {
                        document.getElementById("dash_expiry").textContent = "No Expiry Set";
                    }
                }
            } else {
                if (document.getElementById("dash_status")) document.getElementById("dash_status").textContent = "No Active Application";
                if (document.getElementById("dash_expiry")) document.getElementById("dash_expiry").textContent = "None";
            }

            // ── Other Stats ──────────────────────────────────────────────
            let notices = JSON.parse(localStorage.getItem("notices")) || [];
            if (document.getElementById("noticeCount")) {
                document.getElementById("noticeCount").textContent = notices.length;
            }

            if (document.getElementById("complaintCount") && typeof complaints !== 'undefined') {
                let myComplaints = complaints.filter(c => c.student && c.student.toLowerCase() === user.toLowerCase());
                document.getElementById("complaintCount").textContent = myComplaints.length;
            }

            loadFacilities();
            loadPopularRooms();
        }`;

const logicRegex = /window\.onload\s*=\s*async\s*function\s*\(\)\s*\{[\s\S]*?loadPopularRooms\(\);\s*\}/;
if (logicRegex.test(content)) {
    content = content.replace(logicRegex, newLogic);
    console.log('✅ Replaced dashboard logic');
} else {
    console.log('❌ Failed to find dashboard logic via regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
