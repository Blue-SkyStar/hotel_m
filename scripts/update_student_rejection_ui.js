const fs = require('fs');

const file = 'public/student/student_application_status.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the steps rendering for rejection
const renderStepsLogic = `
                // Build progress timeline
                const isRejected = app.status === 'Rejected';
                const steps = [
                    { label: 'Submitted', icon: 'fa-paper-plane', done: true },
                    { label: isRejected ? 'Rejected' : 'Under Review', icon: isRejected ? 'fa-times' : 'fa-search', done: app.status !== 'Pending Review', active: app.status === 'Pending Review' },
                    { label: 'Payment', icon: 'fa-credit-card', done: app.status === 'Allocated', active: app.status === 'Approved - Awaiting Payment', disabled: isRejected },
                    { label: 'Allocated', icon: 'fa-key', done: app.status === 'Allocated', active: false, disabled: isRejected }
                ];

                let timelineHtml = '<div class="step-timeline">';
                steps.forEach((s, i) => {
                    let cls = '';
                    if (isRejected && i === 1) cls = 'rejected';
                    else if (s.done) cls = 'done';
                    else if (s.active) cls = 'active';
                    else if (s.disabled) cls = 'disabled opacity-50';

                    let iconHtml = cls.includes('done') ? '<i class="fa fa-check"></i>' : \`<i class="fa \${s.icon}"></i>\`;
                    if (isRejected && i === 1) iconHtml = '<i class="fa fa-times text-white"></i>';

                    timelineHtml += \`
                        <div class="step-item \${cls}">
                            <div class="step-icon shadow-sm" style="\${isRejected && i === 1 ? 'background:#dc3545;' : ''}">\${iconHtml}</div>
                            <div class="step-label">\${s.label}</div>
                        </div>\`;
                });
                timelineHtml += '</div>';
`;

const stepsRegex = /\/\/ Build progress timeline[\s\S]*?steps\.forEach[\s\S]*?timelineHtml\s*\+=\s*'<\/div>';/;
if (stepsRegex.test(content)) {
    content = content.replace(stepsRegex, renderStepsLogic);
    console.log('✅ Updated rejection status visualization on student portal');
} else {
    console.log('❌ Failed to find steps logic via regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
