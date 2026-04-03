const fs = require('fs');

const file = 'public/student/student_room_application.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add auto-fill logic to window.onload
const autoFillLogic = `
        window.onload = async function() {
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('roomId');
            if(!roomId) {
                location.href = 'student_room_details.html';
                return;
            }

            await initData();
            const user = localStorage.getItem("loggedUser") || "Student";
            document.getElementById("welcomeUser").textContent = "Hi, " + user;

            // --- AUTO-FILL STUDENT DATA (Teacher feedback: UX skip re-typing) ---
            const studentInfo = (typeof students !== 'undefined' ? students : []).find(s => s.name.toLowerCase() === user.toLowerCase());
            if (studentInfo) {
                document.getElementById("appName").value = studentInfo.name;
                document.getElementById("appName").disabled = true; // Name is fixed for simplicity
                document.getElementById("appPhone").value = studentInfo.phone || "";
                if (studentInfo.guardianName) document.getElementById("appGuardian").value = studentInfo.guardianName;
                if (studentInfo.course) document.getElementById("appCourse").value = studentInfo.course;
            }

            const room = rooms.find(r => r.id == roomId);
            if(room) {
    `;

const onloadRegex = /window\.onload\s*=\s*async\s*function\(\)\s*\{[\s\S]*?const\s*room\s*=\s*rooms\.find\(r\s*=>\s*r\.id\s*==\s*roomId\);[\s\S]*?if\(room\)\s*\{/;
if (onloadRegex.test(content)) {
    content = content.replace(onloadRegex, autoFillLogic);
    console.log('✅ Added auto-fill logic to room application form');
} else {
    console.log('❌ Failed to find window.onload logic via regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
