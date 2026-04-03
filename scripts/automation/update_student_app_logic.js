const fs = require('fs');

const file = 'public/student/student_room_application.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add updateCalculations and global variables
const scriptStart = '    <script>\n' + 
'        let roomObj = null;\n' +
'        let roomIdParam = null;\n' +
'        let totalParam = 0;\n' +
'        let facilitiesParam = "";\n' +
'\n' +
'        function updateCalculations() {\n' +
'            const term = parseInt(document.getElementById("appTerm").value) || 1;\n' +
'            const rent = parseFloat(totalParam) || 0;\n' +
'            const total = term * rent;\n' +
'\n' +
'            document.getElementById("calcTotal").textContent = total.toLocaleString();\n' +
'\n' +
'            const end = new Date();\n' +
'            end.setMonth(end.getMonth() + term);\n' +
'            document.getElementById("calcEndDate").textContent = end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });\n' +
'        }\n';

if (!content.includes('function updateCalculations()')) {
    content = content.replace('    <script>', scriptStart);
}

// 2. Update window.onload variables
const onloadStartRegex = /window\.onload\s*=\s*async\s*function\s*\(\)\s*\{[\s\S]*?roomIdParam\s*=\s*new\s*URLSearchParams[\s\S]*?totalParam\s*=\s*new\s*URLSearchParams[\s\S]*?\}/;
// Since I can't easily regex the whole block without errors, I'll do a direct replacement of the variable declarations
content = content.replace('const roomIdParam =', '            roomIdParam =');
content = content.replace('const totalParam =', '            totalParam =');
content = content.replace('const facilitiesParam =', '            facilitiesParam =');
content = content.replace('const roomObj =', '            roomObj =');

// 3. Inject updateCalculations() call in onload
if (!content.includes('updateCalculations();')) {
    content = content.replace('document.getElementById("appFacilities").textContent = facilitiesParam || "Standard Facilities";', 
                               'document.getElementById("appFacilities").textContent = facilitiesParam || "Standard Facilities";\n            updateCalculations();');
}

fs.writeFileSync(file, content);
console.log('✅ Updated Application Form logic');
