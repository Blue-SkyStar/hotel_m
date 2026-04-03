const fs = require('fs');
const path = require('path');

const studentPages = [
    'public/student/student_dashboard.html',
    'public/student/student_room_application.html',
    'public/student/student_application_status.html',
    'public/student/student_profile.html',
    'public/student/student_room.html',
    'public/student/student_room_details.html',
    'public/student/student_payments.html',
    'public/student/student_complaints.html',
    'public/student/student_notices.html'
];

studentPages.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Inject script tag in head
    if (!content.includes('theme_service.js')) {
        content = content.replace('</head>', '    <script src="../js/theme_service.js"></script>\n</head>');
    }

    // 2. Inject toggle button in navbar (before profile dropdown)
    if (!content.includes('ThemeService.toggle()')) {
        const toggleBtn = `
                    <li class="nav-item me-2">
                        <button class="btn btn-outline-light border-0 rounded-circle p-2" onclick="ThemeService.toggle()" title="Toggle Dark Mode">
                            <i class="fa fa-moon fs-5"></i>
                        </button>
                    </li>`;
        content = content.replace('<li class="nav-item dropdown">', toggleBtn + '\n                    <li class="nav-item dropdown">');
    }

    fs.writeFileSync(file, content);
    console.log(`✅ Updated theme support in ${file}`);
});
