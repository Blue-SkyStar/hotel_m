const fs = require('fs');

// --- 1. Update admin_home.html ---
const homeFile = 'public/admin/admin_home.html';
let homeContent = fs.readFileSync(homeFile, 'utf8');

// Update KPI Card
const homeKpiTarget = /<!-- Payments -->[\s\S]*?<h3>₹<span id="dash_fees">0<\/span><\/h3>\s*<p>Total Fees<\/p>/;
const homeKpiReplacement = `<!-- Net Revenue & Refunds -->
                    <div class="col-md-3">
                        <div class="card text-white bg-danger shadow border-0" style="border-radius:12px;">
                            <div class="card-body text-center p-3">
                                <h3 class="fw-bold mb-0">₹<span id="dash_fees">0</span></h3>
                                <p class="small mb-1 opacity-75">Net Revenue</p>
                                <span class="badge bg-white text-danger fw-bold shadow-sm animate__animated animate__pulse animate__infinite" id="dash_refund_alert" style="display:none; font-size:0.7rem;">0 Refunds Pending</span>
                            </div>
                        </div>
                    </div>`;

if (homeKpiTarget.test(homeContent)) {
    homeContent = homeContent.replace(homeKpiTarget, homeKpiReplacement);
}

// Update Script logic
const homeScriptTarget = /let totalFees = payments\.reduce[\s\S]*?document\.getElementById\("dash_fees"\)\.textContent = totalFees\.toLocaleString\('en-IN'\);/;
const homeScriptReplacement = `
            try {
                const res = await fetch(\`\${API_URL}/finance/summary\`);
                const fin = await res.json();
                document.getElementById("dash_fees").textContent = Math.round(fin.netProfit || 0).toLocaleString('en-IN');
                if (fin.moveOutRequests && fin.moveOutRequests.length > 0) {
                    const alertEl = document.getElementById("dash_refund_alert");
                    alertEl.textContent = \`\${fin.moveOutRequests.length} Refund Request\${fin.moveOutRequests.length > 1 ? 's' : ''}\`;
                    alertEl.style.display = "inline-block";
                }
            } catch(e) { console.warn('Could not load net revenue:', e); }`;

if (homeScriptTarget.test(homeContent)) {
    homeContent = homeContent.replace(homeScriptTarget, homeScriptReplacement);
}

// Update Table logic
const homeTableTarget = /table\.innerHTML \+= `[\s\S]*?Active'}<\/span><\/td>[\s\S]*?<\/tr>`;/g;
const homeTableReplacement = 'const isLeaving = applications.some(a => a.student === student.name && a.status === "Refund Pending");\n                    let statusClass = student.status === "Active" ? "bg-success text-success border-success" : "bg-warning text-warning border-warning";\n                    if (isLeaving) statusClass = "bg-danger text-danger border-danger";\n                    \n                    table.innerHTML += `\n                    <tr>\n                        <td>${student.id}</td>\n                        <td class="fw-medium">${student.name}</td>\n                        <td>${student.room}</td>\n                        <td><span class="badge bg-secondary">${student.course}</span></td>\n                        <td>\n                            ${isLeaving ? \'<span class="badge bg-danger bg-opacity-10 border border-danger me-1">Leaving Soon</span>\' : \'\'}\n                            <span class="badge bg-opacity-10 border ${statusClass}">${student.status || \'Active\'}</span>\n                        </td>\n                    </tr>`;';

if (homeTableTarget.test(homeContent)) {
    homeContent = homeContent.replace(homeTableTarget, homeTableReplacement);
}

fs.writeFileSync(homeFile, homeContent);
console.log('✅ Updated admin_home.html Dashboard Overview.');

// --- 2. Update admin_finance.html ---
const financeFile = 'public/admin/admin_finance.html';
let finContent = fs.readFileSync(financeFile, 'utf8');

// Add KPI Card
const finKpiTarget = /<div class="col-md col-6">[\s\S]*?<i class="fa fa-clock"><\/i><\/div>[\s\S]*?<div class="kpi-label">Awaiting Payment<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
const finKpiReplacement = `
                    <div class="col-md col-6">
                        <div class="kpi-card shadow-sm h-100">
                            <div class="kpi-icon icon-pending"><i class="fa fa-clock"></i></div>
                            <div class="kpi-value"><span id="kpi_pending_count">0</span></div>
                            <div class="kpi-label">Awaiting Pay</div>
                        </div>
                    </div>
                    <div class="col-md col-6">
                        <div class="kpi-card shadow-sm h-100" style="border-bottom: 3px solid var(--rose-500);">
                            <div class="kpi-icon" style="background:#fff1f2; color:var(--rose-500);"><i class="fa fa-wallet"></i></div>
                            <div class="kpi-value text-danger">₹<span id="kpi_refund_liability">0</span></div>
                            <div class="kpi-label">Refund Liability</div>
                            <div class="kpi-trend text-muted"><span id="pendingRefundsCount">0</span> requests</div>
                        </div>
                    </div>`;

if (finKpiTarget.test(finContent)) {
    finContent = finContent.replace(finKpiTarget, finKpiReplacement);
}

// Add Table at bottom
const finTableTarget = /<\/div>\s*<\/div>\s*<\/div>\s*<!-- Shared Admin Layout -->/;
const finTableInsert = `
                <!-- Move-out & Cancellation Ledger -->
                <div class="card shadow-sm border-0 mt-4" style="border-radius: 16px; overflow:hidden;">
                    <div class="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center">
                        <h6 class="mb-0 fw-bold"><i class="fa fa-history me-2 text-danger"></i>Move-out & Refund Ledger</h6>
                        <span class="badge bg-light text-dark fw-normal" id="moveOutCount">0 Records</span>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-4">Student</th>
                                        <th>Room</th>
                                        <th>Request Date</th>
                                        <th>Reason</th>
                                        <th>Est. Refund</th>
                                        <th class="text-end pe-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody id="moveOutBody">
                                    <tr><td colspan="6" class="text-center py-5 text-muted">No cancellation records found.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;

if (finContent.includes('<!-- Shared Admin Layout -->')) {
    finContent = finContent.replace('</div>\n    <!-- Shared Admin Layout -->', finTableInsert + '\n    <!-- Shared Admin Layout -->');
}

// Update Script logic
const finScriptTarget = /document\.getElementById\('kpi_pending_count'\)\.textContent = data\.pendingPayments\.length;/;
const finScriptReplacement = `
            document.getElementById('kpi_pending_count').textContent = data.pendingPayments.length;
            document.getElementById('kpi_refund_liability').textContent = fmt(data.refundLiability || 0);
            document.getElementById('pendingRefundsCount').textContent = data.moveOutRequests ? data.moveOutRequests.length : 0;
            
            // Populate Move-out Ledger
            if (data.moveOutRequests && data.moveOutRequests.length > 0) {
                document.getElementById('moveOutCount').textContent = data.moveOutRequests.length + " Requests";
                document.getElementById('moveOutBody').innerHTML = data.moveOutRequests.map(r => \`
                    <tr>
                        <td class="ps-4 fw-medium">\${r.studentName || r.student}</td>
                        <td>\${r.roomNumber || '—'}</td>
                        <td>\${r.date || r.withdrawalDate || '—'}</td>
                        <td class="small text-muted">\${r.reason || 'Not specified'}</td>
                        <td class="text-danger fw-bold">\${r.refundAmount || (r.refundEst || '—')}</td>
                        <td class="text-end pe-4">
                            <span class="badge bg-danger bg-opacity-10 text-danger border border-danger">\${r.status}</span>
                        </td>
                    </tr>\`).join('');
            }`;

if (finScriptTarget.test(finContent)) {
    finContent = finContent.replace(finScriptTarget, finScriptReplacement);
}

fs.writeFileSync(financeFile, finContent);
console.log('✅ Updated admin_finance.html with Refund Analysis.');
