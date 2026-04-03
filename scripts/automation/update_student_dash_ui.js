const fs = require('fs');

const file = 'public/student/student_dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// Replacement for Stats Section
const newStats = `
                <!-- Stats -->
                <div class="row g-4 mb-4">
                    <div class="col-md-3">
                        <div class="stat-card bg-white p-3 shadow-sm border-start border-primary border-4" style="border-radius: 12px;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1 small uppercase fw-bold">Monthly Rent</h6>
                                    <h4 class="mb-0 fw-bold text-dark" id="dash_rent">₹0</h4>
                                </div>
                                <div class="p-2 bg-primary bg-opacity-10 rounded-pill">
                                    <i class="fa fa-home text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-white p-3 shadow-sm border-start border-warning border-4" style="border-radius: 12px;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1 small uppercase fw-bold">Pending Balance</h6>
                                    <h4 class="mb-0 fw-bold text-danger" id="dash_balance">₹0</h4>
                                </div>
                                <div class="p-2 bg-warning bg-opacity-10 rounded-pill">
                                    <i class="fa fa-clock text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-white p-3 shadow-sm border-start border-success border-4" style="border-radius: 12px;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1 small uppercase fw-bold">Contract End</h6>
                                    <h4 class="mb-0 fw-bold" id="dash_expiry" style="font-size: 0.95rem; color: #10b981;">No Contract</h4>
                                </div>
                                <div class="p-2 bg-success bg-opacity-10 rounded-pill">
                                    <i class="fa fa-calendar-check text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-white p-3 shadow-sm border-start border-info border-4" style="border-radius: 12px;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-1 small uppercase fw-bold">Room Status</h6>
                                    <h4 class="mb-0 fw-bold text-info" id="dash_status" style="font-size: 0.9rem;">—</h4>
                                </div>
                                <div class="p-2 bg-info bg-opacity-10 rounded-pill">
                                    <i class="fa fa-info-circle text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

const statsRegex = /<!-- Stats -->[\s\S]*?<div class="row g-4 mb-4">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
if (statsRegex.test(content)) {
    content = content.replace(statsRegex, newStats);
    console.log('✅ Replaced stats container');
} else {
    console.log('❌ Failed to find stats container via regex. Trying simpler match.');
    // Fallback: replace the section between comments if possible
    const simplerRegex = /<!-- Stats -->[\s\S]*?<!-- Quick Actions -->/;
    if (simplerRegex.test(content)) {
        content = content.replace(simplerRegex, newStats + '\n\n                <!-- Quick Actions -->');
        console.log('✅ Replaced via simpler regex');
    }
}

fs.writeFileSync(file, content);
console.log('Done.');
