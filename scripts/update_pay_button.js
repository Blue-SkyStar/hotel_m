const fs = require('fs');

const file = 'public/student/student_payments.html';
let content = fs.readFileSync(file, 'utf8');

const targetStr = '<h2 class="mb-4"><i class="fa fa-credit-card me-2 text-success"></i>Fees & Payments</h2>';
const replacement = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="m-0"><i class="fa fa-credit-card me-2 text-success"></i>Fees & Payments</h2>
                    <button class="btn btn-success btn-lg rounded-pill fw-bold shadow-sm px-4" id="payNowBtn" style="display:none;" onclick="openPaymentModal()">
                        <i class="fa fa-plus me-2"></i> Make a Payment
                    </button>
                </div>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync(file, content);
    console.log('✅ Successfully updated student_payments.html header.');
} else {
    console.log('❌ Could not find target string in student_payments.html.');
}
