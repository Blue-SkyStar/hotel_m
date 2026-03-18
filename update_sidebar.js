const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'student');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('href="student_application_status.html"')) {
        console.log(`Skipping ${file}, already has the link.`);
        return;
    }

    let lines = content.split('\n');
    let newLines = [];

    for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);
        if (lines[i].includes('href="student_room_details.html"')) {
            // Read until we get the closing </li>
            while (!lines[i].includes('</li>') && i < lines.length - 1) {
                i++;
                newLines.push(lines[i]);
            }
            // Insert the new li block
            let matchLine = lines[i].includes('</li>') ? lines[i] : lines[i - 1];
            let indentMatch = matchLine.match(/^\s*/);
            let indent = indentMatch ? indentMatch[0] : '                    ';

            newLines.push(`${indent}<li class="nav-item mb-3"><a href="student_application_status.html" class="nav-link text-white"><i class="fa fa-file-signature me-2"></i> My Applications</a></li>`);
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`Updated sidebar in ${file}`);
});
