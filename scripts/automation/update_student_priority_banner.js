const fs = require('fs');

const file = 'public/student/student_dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add priority banner placeholder
if (!content.includes('id="priorityBanner"')) {
    content = content.replace('<!-- Stats -->', '<div id="priorityBanner" class="mb-4"></div>\n\n                <!-- Stats -->');
}

// 2. Update logic to show banner if expiry < 15 days
const bannerLogic = `
                if (activeApp.endDate) {
                    const expiry = new Date(activeApp.endDate);
                    const now = new Date();
                    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                    
                    if (document.getElementById("dash_expiry")) {
                        document.getElementById("dash_expiry").textContent = "Till " + expiry.toLocaleDateString();
                    }

                    // --- Resident Priority Banner (15 Day Window) ---
                    if (diffDays <= 15 && diffDays > 0) {
                        const banner = document.getElementById("priorityBanner");
                        banner.innerHTML = \`
                            <div class="alert alert-warning border-0 shadow-sm d-flex align-items-center p-4 animate__animated animate__pulse animate__infinite" style="border-radius:16px;">
                                <div class="bg-warning bg-opacity-25 p-3 rounded-circle me-4">
                                    <i class="fa fa-clock text-warning fs-3"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="fw-bold mb-1">Contract Ending Soon!</h5>
                                    <p class="mb-0 text-muted">Your resident contract expires in <strong>\${diffDays} days</strong> (\${expiry.toLocaleDateString()}). You have priority access to extend your stay.</p>
                                </div>
                                <a href="student_room_application.html?roomId=\${activeApp.roomId}&extend=true" class="btn btn-warning px-4 py-2 rounded-pill fw-bold shadow-sm">Extend Stay</a>
                            </div>\`;
                    }
                } else {
                    if (document.getElementById("dash_expiry")) document.getElementById("dash_expiry").textContent = "No Expiry Set";
                }
`;

// Replace the older expiry logic
const oldExpiryRegex = /if\s*\(activeApp\.endDate\)\s*\{[\s\S]*?document\.getElementById\("dash_expiry"\)\.textContent\s*=\s*"Till "\s*\+\s*expiry\.toLocaleDateString\(\);[\s\S]*?\}[\s\S]*?else\s*\{[\s\S]*?document\.getElementById\("dash_expiry"\)\.textContent\s*=\s*"No Expiry Set";\s*\}/;
if (oldExpiryRegex.test(content)) {
    content = content.replace(oldExpiryRegex, bannerLogic);
    console.log('✅ Added Priority Resident Window logic to dashboard');
} else {
    console.log('❌ Failed to find old expiry logic via regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
