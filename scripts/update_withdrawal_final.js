const fs = require('fs');

// --- 1. Update student_room.html with regex for robustness ---
const roomFile = 'public/student/student_room.html';
let roomContent = fs.readFileSync(roomFile, 'utf8');

const roomBtnRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<!--\s*Room\s*Amenities\s*-->/i;
const roomBtnInsert = `
                        <!-- Early Move-out Action -->
                        <div class="mt-4 pt-4 border-top">
                            <div class="alert alert-info border-0 shadow-sm d-flex align-items-center mb-0" style="border-radius:12px;">
                                <i class="fa fa-info-circle fs-4 me-3 text-primary"></i>
                                <div class="flex-grow-1">
                                    <h6 class="fw-bold mb-1 text-dark">Need to leave early?</h6>
                                    <p class="small mb-0 opacity-75">Planning a departure? Request a move-out to free up your room and settle your dues.</p>
                                </div>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold ms-3" id="moveOutBtn" style="display:none;" onclick="openMoveOutModal()">
                                    Request Move-out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Room Amenities -->`;

const roomScriptTarget = 'let roomInfo = rooms.find(r => r.number == myRecord.room);';
const roomScriptInsert = `let roomInfo = rooms.find(r => r.number == myRecord.room);
                if(roomInfo){
                    document.getElementById("moveOutBtn").style.display = "block";
                    window.myRoomNo = myRecord.room;
                    const myApp = applications.find(a => a.student && a.student.toLowerCase() === username.toLowerCase() && a.status === 'Allocated');
                    if (myApp) window.myActiveApp = myApp;
                }`;

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
                    <p class="small text-muted mb-4"><i class="fa fa-info-circle me-1"></i> Refund covers all fully remaining months. If it is after the 2nd day of the current month, the current month is not refundable.</p>
                    <div class="alert alert-warning border-0 small mb-4" style="border-radius:12px; background:#fff8ea;">
                        <i class="fa fa-clock me-1"></i> Refund will be credited within <b>10 working days</b>. If not, please visit the hostel office.
                    </div>
                    <button class="btn btn-danger btn-lg w-100 rounded-pill fw-bold py-3 shadow-lg" id="confirmMoveOutBtn" onclick="submitMoveOut()">
                        Confirm Withdrawal
                    </button>
                    <p class="text-center mt-3 mb-0 small text-muted"><i class="fa fa-shield-halved me-1"></i> Financial Settle & Vacate Sequence</p>
                </div>
            </div>
        </div>
    </div>
    <script>
        function openMoveOutModal() {
            if (!window.myActiveApp) {
                Swal.fire({icon: 'error', title: 'Error', text: 'No active allocated application found.'});
                return;
            }

            const now = new Date();
            const day = now.getDate();
            const monthlyRent = parseFloat(window.myActiveApp.monthlyRent || 5000);
            const endDate = new Date(window.myActiveApp.endDate);
            
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
            document.getElementById("refundAmount").textContent = "₹" + (mCount * monthlyRent).toLocaleString('en-IN');
            document.getElementById("refundNote").textContent = mCount > 0 ? \`Refund applicable for \${mCount} months starting \${day > 2 ? 'next month' : 'immediately'}.\` : 'No refundable months found.';
            window.activeAppId = window.myActiveApp.id;

            new bootstrap.Modal(document.getElementById('moveOutModal')).show();
        }

        async function submitMoveOut() {
            const btn = document.getElementById("confirmMoveOutBtn");
            btn.disabled = true;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Processing...';
            
            const payload = {
                status: 'Refund Pending',
                withdrawalDate: new Date().toLocaleDateString(),
                refundAmount: document.getElementById("refundAmount").textContent
            };

            try {
                const res = await fetch(\`\${API_URL}/data/applications/\${window.activeAppId}\`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if(result.success) {
                    Swal.fire({
                        icon: 'success', 
                        title: 'Request Registered!', 
                        html: "<p>Your withdrawal has been registered.</p><p class='small text-muted'>Your refund of <b>" + payload.refundAmount + "</b> will be transferred within 10 days.</p>"
                    }).then(() => location.reload());
                }
            } catch(e) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Withdrawal';
            }
        }
    </script>`;

if (roomBtnRegex.test(roomContent)) {
    roomContent = roomContent.replace(roomBtnRegex, roomBtnInsert);
    roomContent = roomContent.replace(roomScriptTarget, roomScriptInsert);
    roomContent = roomContent.replace('</body>', modalInsert + '</body>');
    fs.writeFileSync(roomFile, roomContent);
    console.log('✅ Successfully updated student_room.html with Move-out feature.');
} else {
    console.log('❌ Could not find target tags in student_room.html.');
}
