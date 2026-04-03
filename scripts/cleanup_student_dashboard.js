const fs = require('fs');

const file = 'public/student/student_dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// Use a more robust regex to find the problematic block
// Looking for the row closure followed by the incorrectly nested cols and another row closure
const redundantBlockRegex = /<\/div>\s*<div class="col-md-3">\s*<div class="card stat-card bg-warning text-dark shadow">[\s\S]*?<div class="col-md-3">\s*<div class="card stat-card bg-info text-white shadow">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newBlock = `                </div>

                <!-- Secondary Stats Row -->
                <div class="row g-4 mb-4">
                    <div class="col-md-6">
                        <div class="card stat-card bg-warning text-dark shadow-sm border-0 h-100" style="border-radius:16px;">
                            <div class="card-body d-flex align-items-center p-4">
                                <div class="bg-white bg-opacity-25 p-3 rounded-circle me-4">
                                    <i class="fa fa-comment-dots fs-3"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h4 class="fw-bold mb-1" id="complaintCount">0</h4>
                                    <p class="mb-0 fw-semibold opacity-75">My Complaints</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card stat-card bg-info text-white shadow-sm border-0 h-100" style="border-radius:16px;">
                            <div class="card-body d-flex align-items-center p-4">
                                <div class="bg-white bg-opacity-25 p-3 rounded-circle me-4">
                                    <i class="fa fa-bell fs-3"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h4 class="fw-bold mb-1" id="noticeCount">0</h4>
                                    <p class="mb-0 fw-semibold opacity-75">Active Notices</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

if (redundantBlockRegex.test(content)) {
    content = content.replace(redundantBlockRegex, newBlock);
    console.log('✅ Successfully cleaned up student dashboard stats row.');
} else {
    console.log('❌ Could not find the redundant block with regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
