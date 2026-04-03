const fs = require('fs');

// --- 1. Update student_room.html ---
const roomFile = 'public/student/student_room.html';
let roomContent = fs.readFileSync(roomFile, 'utf8');

const roomBtnTarget = '</div>\n                    </div>\n                </div>';
const roomBtnInsert = `
                        <!-- Early Move-out Action -->
                        <div class="mt-4 pt-4 border-top">
                            <div class="alert alert-info border-0 shadow-sm d-flex align-items-center mb-0" style="border-radius:12px;">
                                <i class="fa fa-info-circle fs-4 me-3"></i>
                                <div class="flex-grow-1">
                                    <h6 class="fw-bold mb-1 text-dark">Need to leave early?</h6>
                                    <p class="small mb-0 opacity-75">Request an early move-out and get a refund for remaining months subject to our policy.</p>
                                </div>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold ms-3" id="moveOutBtn" style="display:none;" onclick="openMoveOutModal()">
                                    Request Move-out
                                </button>
                            </div>
                        </div>
                    </div>`;

const roomScriptTarget = 'let roomInfo = rooms.find(r => r.number == myRecord.room);\n                if(roomInfo){';
const roomScriptInsert = `let roomInfo = rooms.find(r => r.number == myRecord.room);\n                if(roomInfo){\n                    document.getElementById("moveOutBtn").style.display = "block";\n                    window.myRoomNo = myRecord.room;`;

const modalInsert = `
    <!-- Move-out Modal -->
    <div class="modal fade" id="moveOutModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border-radius:20px; border:none;">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold text-danger"><i class="fa fa-door-open me-2"></i> Early Move-out Request</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="bg-light p-3 rounded-4 mb-4 border">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Refundable Months:</span>
                            <span class="fw-bold" id="refundMonthCount">0</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="text-muted">Estimated Refund:</span>
                            <span class="fw-bold text-success fs-5" id="refundAmount">₹0</span>
                        </div>
                        <hr class="my-2 border-dashed">
                        <p class="small text-muted mb-0" id="refundNote"></p>
                    </div>
                    <div class="alert alert-warning border-0 small mb-4" style="border-radius:12px; background:#fff8ea;">
                        <i class="fa fa-clock me-1"></i> Refund will be credited within <b>10 working days</b>.
                    </div>
                    <button class="btn btn-danger btn-lg w-100 rounded-pill fw-bold py-3 shadow-lg" id="confirmMoveOutBtn" onclick="submitMoveOut()">
                        Confirm Withdrawal
                    </button>
                </div>
            </div>
        </div>
    </div>
    <script>
        function openMoveOutModal() {
            const myApp = applications.find(a => a.student && a.student.toLowerCase() === localStorage.getItem("loggedUser").toLowerCase() && a.status === "Allocated");
            if (!myApp) {
                Swal.fire({icon: 'error', title: 'Error', text: 'No active allocated application found.'});
                return;
            }

            const now = new Date();
            const day = now.getDate();
            const monthlyRent = parseFloat(myApp.monthlyRent || 5000);
            const endDate = new Date(myApp.endDate);
            
            // Refund logic: 1st/2nd day of month includes current month. 3rd onwards starts next.
            let startRefundMonth = now.getMonth();
            if (day > 2) startRefundMonth += 1;
            
            let mCount = 0;
            let checkDate = new Date(now.getFullYear(), startRefundMonth, 1);
            while(checkDate <= endDate) {
                mCount++;
                checkDate.setMonth(checkDate.getMonth() + 1);
            }

            document.getElementById("refundMonthCount").textContent = mCount;
            document.getElementById("refundAmount").textContent = "₹" + (mCount * monthlyRent).toLocaleString();
            document.getElementById("refundNote").textContent = mCount > 0 ? \`Refund applicable for \${mCount} months starting \${day > 2 ? 'next month' : 'immediately'}.\` : 'No refundable months found.';
            window.activeAppId = myApp.id;

            new bootstrap.Modal(document.getElementById('moveOutModal')).show();
        }

        async function submitMoveOut() {
            const btn = document.getElementById("confirmMoveOutBtn");
            btn.disabled = true;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Processing...';
            
            const payload = {
                status: 'Refund Pending',
                withdrawalDate: new Date().toLocaleDateString(),
                refundEst: document.getElementById("refundAmount").textContent
            };

            const res = await fetch(\`\${API_URL}/data/applications/\${window.activeAppId}\`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if(result.success) {
                Swal.fire({
                    icon: 'success', 
                    title: 'Request Submitted!', 
                    html: "<p>Your withdrawal has been registered.</p><p class='small'>Your payment will be transferred within <b>10 days</b>. Please visit the office if not received.</p>"
                }).then(() => location.reload());
            }
        }
    </script>`;

if (roomContent.includes(roomBtnTarget)) {
    roomContent = roomContent.replace(roomBtnTarget, roomBtnInsert);
    roomContent = roomContent.replace(roomScriptTarget, roomScriptInsert);
    roomContent = roomContent.replace('</body>', modalInsert + '</body>');
    fs.writeFileSync(roomFile, roomContent);
    console.log('✅ Updated student_room.html with Move-out feature.');
}

// --- 2. Update admin_room_allocation.html ---
const adminFile = 'public/admin/admin_room_allocation.html';
let adminContent = fs.readFileSync(adminFile, 'utf8');

const tabTarget = '<li class="nav-item"><a class="nav-link text-muted" href="#" onclick="event.preventDefault(); filterApps(\'Rejected\', this)">Rejected</a></li>';
const tabInsert = tabTarget + '\n                            <li class="nav-item"><a class="nav-link text-muted text-danger" href="#" onclick="event.preventDefault(); filterApps(\'Refund Pending\', this)">Refund Requests</a></li>';

if (adminContent.includes(tabTarget)) {
    adminContent = adminContent.replace(tabTarget, tabInsert);
    fs.writeFileSync(adminFile, adminContent);
    console.log('✅ Updated admin_room_allocation.html with Refund tab.');
}
