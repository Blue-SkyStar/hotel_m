const fs = require('fs');

// --- 1. Update student_complaints.html ---
const studentFile = 'public/student/student_complaints.html';
let studentContent = fs.readFileSync(studentFile, 'utf8');

// Update UI: Add readonly and Locked message
const uiTarget = /<input type="text" id="cRoom" class="form-control form-control-lg bg-light border-0"\s*placeholder="Your room number" required>/;
const uiReplacement = '<input type="text" id="cRoom" class="form-control form-control-lg bg-light border-0" placeholder="Your room number" required readonly>\n                                    <small class="text-muted" style="font-size:0.75rem;"><i class="fa fa-lock me-1"></i> Locked to your assigned room</small>';

if (uiTarget.test(studentContent)) {
    studentContent = studentContent.replace(uiTarget, uiReplacement);
}

// Update Script: Calculation of pending count and validations
const scriptTarget = /document\.getElementById\("complaintForm"\)\.addEventListener\("submit", function \(e\) \{[\s\S]*?\}\);/;
const scriptReplacement = `document.getElementById("complaintForm").addEventListener("submit", async function (e) {
            e.preventDefault();
            
            // --- ANTI-SPAM & VALIDATION ---
            const myComplaints = complaints.filter(c => c.student && c.student.toLowerCase() === username.toLowerCase());
            const pendingCount = myComplaints.filter(c => c.status === 'Pending').length;
            
            if (pendingCount >= 3) {
                Swal.fire({ icon: 'warning', title: 'Limit Reached', text: 'You can only have 3 active (Pending) complaints. Please wait for resolution.' });
                return;
            }

            const lastTime = localStorage.getItem("last_comp_time");
            const now = Date.now();
            if (lastTime && (now - lastTime) < 300000) { // 5 min cooldown
                const diff = Math.ceil((300000 - (now - lastTime)) / 60000);
                Swal.fire({ icon: 'clock', title: 'Slow Down', text: \`Please wait \${diff} more minute(s) before submitting again.\` });
                return;
            }

            let room = document.getElementById("cRoom").value;
            let type = document.getElementById("cType").value;
            let desc = document.getElementById("cDesc").value;

            if (desc.trim().length < 15) {
                Swal.fire({ icon: 'error', title: 'Too Short', text: 'Please provide at least 15 characters of detail.' });
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Submitting...';

            try {
                await addComplaint(username, room, type, desc);
                localStorage.setItem("last_comp_time", Date.now());
                Swal.fire({ icon: 'success', title: 'Submitted!', text: 'Your complaint has been registered.' });
                document.getElementById("complaintForm").reset();
                if (window.myAssignedRoom) document.getElementById("cRoom").value = window.myAssignedRoom;
                loadMyComplaints();
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa fa-paper-plane me-2"></i> Submit';
            }
        });`;

if (scriptTarget.test(studentContent)) {
    studentContent = studentContent.replace(scriptTarget, scriptReplacement);
}

// Update window.onload for auto-fill
const onloadTarget = /window\.onload = async function \(\) \{[\s\S]*?await initData\(\); loadMyComplaints\(\);[\s\S]*?\}/;
const onloadReplacement = `window.onload = async function () {
            await initData();
            
            // Auto-fill locked room
            const myRecord = students.find(s => s.name && s.name.toLowerCase() === username.toLowerCase());
            if (myRecord && myRecord.room) {
                window.myAssignedRoom = myRecord.room;
                document.getElementById("cRoom").value = myRecord.room;
            } else {
                document.getElementById("cRoom").value = "Not Assigned";
            }
            
            loadMyComplaints();
        }`;

if (onloadTarget.test(studentContent)) {
    studentContent = studentContent.replace(onloadTarget, onloadReplacement);
}

fs.writeFileSync(studentFile, studentContent);
console.log('✅ Updated student_complaints.html with Integrity Controls.');

// --- 2. Update admin_manage_complaints.html ---
const adminFile = 'public/admin/admin_manage_complaints.html';
let adminContent = fs.readFileSync(adminFile, 'utf8');

// Add "Mark as Spam" button in Table row
const btnTarget = /<button class="btn btn-sm btn-outline-success" onclick="resolveComplaint\(\${complaint\.id}\)" \${disableBtn}><i class="fa fa-check"><\/i><\/button>/;
const btnReplacement = `<button class="btn btn-sm btn-outline-success me-1" title="Resolve" onclick="resolveComplaint(\${complaint.id})" \${disableBtn}><i class="fa fa-check"></i></button>
                        <button class="btn btn-sm btn-outline-danger" title="Mark as Spam" onclick="spamComplaint(\${complaint.id})" \${disableBtn}><i class="fa fa-ban"></i></button>`;

if (btnTarget.test(adminContent)) {
    adminContent = adminContent.replace(btnTarget, btnReplacement);
}

// Add spamComplaint function in script
const spamFunc = `
        async function spamComplaint(id) {
            Swal.fire({
                title: 'Mark as Spam?',
                text: "This will dismiss the complaint and flag it as abusive.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Yes, Mark as Spam'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const success = await updateData('complaints', id, { status: "Spam", description: "[SPAM] " + complaints.find(c => c.id == id).description });
                    if(success) {
                        Swal.fire('Updated!', 'Complaint marked as spam.', 'success');
                        loadComplaints();
                    }
                }
            });
        }`;

if (!adminContent.includes('function spamComplaint')) {
    adminContent = adminContent.replace('function resolveComplaint', spamFunc + '\n\n        function resolveComplaint');
}

fs.writeFileSync(adminFile, adminContent);
console.log('✅ Updated admin_manage_complaints.html with Spam Moderation.');
