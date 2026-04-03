const fs = require('fs');

const file = 'public/student/student_payments.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the table headers
content = content.replace(
    '<th class="py-3">Status</th>',
    '<th class="py-3">Status</th>\n                                    <th class="pe-4 py-3 text-center">Action</th>'
);

// 2. Replace window.onload script entirely
const newScript = `
    <script>
        function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

        window.onload = async function () {
            await initData();
            let username = localStorage.getItem("loggedUser") || "";
            let myPayments = payments.filter(p => p.student && p.student.toLowerCase() === username.toLowerCase());

            // ── Calculate Financials ──────────────────────────────────────
            const userApp = applications.find(a => a.student && a.student.toLowerCase() === username.toLowerCase() &&  (a.status === 'Allocated' || a.status === 'Approved - Awaiting Payment'));
            const totalContract = userApp ? parseFloat(userApp.totalAmount || 0) : 0;
            const totalPaid = myPayments.reduce((s, p) => s + Number(p.amount), 0);
            const pending = totalContract - totalPaid;

            document.getElementById("totalPaid").textContent = "₹" + fmt(totalPaid);
            document.getElementById("pendingAmount").textContent = "₹" + fmt(pending > 0 ? pending : 0);
            document.getElementById("totalTxns").textContent = myPayments.length;

            let tbody = document.getElementById("payBody");
            tbody.innerHTML = "";
            if (myPayments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5"><i class="fa fa-receipt fa-2x d-block mb-2 opacity-25"></i>No payment records found.</td></tr>';
            } else {
                myPayments.forEach(p => {
                    let statusBadge = p.status === "Paid"
                        ? '<span class="badge bg-success bg-opacity-10 text-success border border-success">Paid</span>'
                        : '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">Pending</span>';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = \`
                        <td class="ps-4 fw-medium text-primary">#\${p.id || '—'}</td>
                        <td>\${p.date || '—'}</td>
                        <td class="fw-bold">₹\${fmt(p.amount)}</td>
                        <td><i class="fa fa-credit-card me-1 small opacity-50"></i> \${p.method || 'Cash'}</td>
                        <td>\${statusBadge}</td>
                        <td class="pe-4 text-center">
                            <button class="btn btn-sm btn-outline-dark px-3 rounded-pill" onclick='viewReceipt(\${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                                <i class="fa fa-eye me-1"></i>Receipt
                            </button>
                        </td>\`;
                    tbody.appendChild(row);
                });
            }
        }

        function viewReceipt(p) {
            Swal.fire({
                title: '<i class="fa fa-file-invoice me-2"></i>Payment Receipt',
                html: \`
                    <div class="text-start p-3 border rounded-4 bg-light">
                        <div class="d-flex justify-content-between mb-4 pb-2 border-bottom">
                            <div>
                                <h6 class="mb-0 fw-bold">HostelSphere Management</h6>
                                <p class="text-muted small mb-0">Official Digital Receipt</p>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-success">PAID</span>
                            </div>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <p class="text-muted small mb-0 uppercase fw-bold">Receipt ID</p>
                                <p class="fw-bold">#\${p.id}</p>
                            </div>
                            <div class="col-6 text-end">
                                <p class="text-muted small mb-0 uppercase fw-bold">Date</p>
                                <p class="fw-bold">\${p.date || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <p class="text-muted small mb-0 uppercase fw-bold">Student Name</p>
                            <p class="fw-bold">\${p.studentName || p.student}</p>
                        </div>
                        <div class="p-3 bg-white rounded-3 border mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Hostel Fee / Rent</span>
                                <span class="fw-bold">₹\${fmt(p.amount)}</span>
                            </div>
                            <div class="d-flex justify-content-between small text-muted">
                                <span>Payment Method</span>
                                <span>\${p.method || 'Online'}</span>
                            </div>
                        </div>
                        <div class="text-center mt-4">
                            <p class="text-muted small mb-0">Thank you for your payment!</p>
                            <img src="../img/logo/logo.png" style="width:40px; opacity:0.5; margin-top:10px" class="rounded-circle">
                        </div>
                    </div>
                \`,
                confirmButtonText: 'Close',
                confirmButtonColor: '#1e293b',
                width: '450px',
                customClass: {
                    container: 'animate__animated animate__fadeIn'
                }
            });
        }
    </script>`;

content = content.replace(/<script>[\s\S]*?<\/script>/, newScript);

fs.writeFileSync(file, content);
console.log('✅ Updated payments page');
