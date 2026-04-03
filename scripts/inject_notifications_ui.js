const fs = require('fs');
const path = require('path');

const studentDir = 'public/student';
const files = fs.readdirSync(studentDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(studentDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('student_notifications.js')) {
        // Inject before theme_service.js or at the end of head
        const injection = '    <script src="../js/student_notifications.js"></script>\n';
        if (content.includes('</body>')) {
            content = content.replace('</body>', injection + '</body>');
            fs.writeFileSync(filePath, content);
            console.log(`✅ Injected notifications script into ${file}`);
        }
    }
});
