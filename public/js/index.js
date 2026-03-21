// Chart Implementations
// Keep references so we can destroy before re-creating (prevents the "bouncing loop" bug)
let _roomChartInst = null;
let _paymentChartInst = null;
let _complaintChartInst = null;

function renderCharts() {
    // ── 1. ROOM OCCUPANCY (Doughnut) ────────────────────────────────────────
    let availableRooms = rooms.filter(r => r.occupied < r.capacity).length;
    let fullRooms      = rooms.filter(r => r.occupied >= r.capacity).length;
    let unoccupied     = rooms.filter(r => !r.occupied || r.occupied === 0).length;

    // Destroy previous instance first so it doesn't stack/bounce
    if (_roomChartInst) { _roomChartInst.destroy(); _roomChartInst = null; }

    const roomCanvas = document.getElementById("roomChart");

    if (rooms.length === 0) {
        // Show friendly placeholder when no room data at all
        roomCanvas.parentElement.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-4">
                <i class="fa fa-bed fa-2x mb-2 opacity-25"></i>
                <p class="small mb-0">No room data available</p>
            </div>`;
    } else {
        const hasData = (availableRooms + fullRooms) > 0;
        _roomChartInst = new Chart(roomCanvas, {
            type: "doughnut",
            data: {
                labels: ["Available", "Full"],
                datasets: [{
                    data: hasData ? [availableRooms, fullRooms] : [1, 0],
                    backgroundColor: hasData ? ["#28a745", "#dc3545"] : ["#e9ecef", "#e9ecef"],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ${ctx.raw} room(s)`
                        }
                    }
                },
                animation: { animateRotate: true, duration: 600 }
            }
        });
    }

    // ── 2. PAYMENTS COLLECTED (Bar — clearer than line for sparse data) ─────
    if (_paymentChartInst) { _paymentChartInst.destroy(); _paymentChartInst = null; }

    const payCanvas = document.getElementById("paymentChart");
    let cash = payments.filter(p => p.method === "Cash").reduce((s, p) => s + Number(p.amount || 0), 0);
    let upi  = payments.filter(p => p.method === "UPI").reduce((s, p) => s + Number(p.amount || 0), 0);
    let card = payments.filter(p => p.method === "Card" || p.method === "Net Banking").reduce((s, p) => s + Number(p.amount || 0), 0);
    let totalPayment = cash + upi + card;

    if (totalPayment === 0) {
        payCanvas.parentElement.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-4">
                <i class="fa fa-money-bill fa-2x mb-2 opacity-25"></i>
                <p class="small mb-0">No payment records yet</p>
            </div>`;
    } else {
        _paymentChartInst = new Chart(payCanvas, {
            type: "bar",
            data: {
                labels: ["Cash", "UPI", "Card / Net Banking"],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [cash, upi, card],
                    backgroundColor: ["#4e9fff", "#6610f2", "#20c997"],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: Math.ceil(Math.max(cash, upi, card) / 5) || 1 } }
                },
                animation: { duration: 600 }
            }
        });
    }

    // ── 3. COMPLAINT CATEGORIES (Bar) ───────────────────────────────────────
    if (_complaintChartInst) { _complaintChartInst.destroy(); _complaintChartInst = null; }

    const compCanvas = document.getElementById("complaintChart");
    let elec  = complaints.filter(c => c.type === "Electricity").length;
    let water = complaints.filter(c => c.type === "Water").length;
    let clean = complaints.filter(c => c.type === "Cleaning").length;
    let other = complaints.filter(c => c.type !== "Electricity" && c.type !== "Water" && c.type !== "Cleaning").length;
    let totalComplaints = elec + water + clean + other;

    if (totalComplaints === 0) {
        compCanvas.parentElement.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-4">
                <i class="fa fa-circle-check fa-2x mb-2 opacity-25" style="color:#28a745;"></i>
                <p class="small mb-0">No complaints reported</p>
                <small class="text-success mt-1">Everything looks good!</small>
            </div>`;
    } else {
        _complaintChartInst = new Chart(compCanvas, {
            type: "bar",
            data: {
                labels: ["Electricity", "Water", "Cleaning", "Other"],
                datasets: [{
                    label: 'Issues',
                    data: [elec, water, clean, other],
                    backgroundColor: ["#f1c40f", "#3498db", "#e67e22", "#95a5a6"],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } }
                },
                animation: { duration: 600 }
            }
        });
    }
}
