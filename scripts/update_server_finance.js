const fs = require('fs');

const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Logic Injection for Summary
const summaryLogic = `
        const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
        
        // Calculate Refund Liability from 'Refund Pending' applications
        const refundPendingApps = allApplications.filter(a => a.status === 'Refund Pending' || a.status === 'Refund Processed');
        const refundLiability = refundPendingApps.reduce((s, a) => {
            if (!a.refundAmount) return s;
            const numeric = parseFloat(a.refundAmount.replace(/[₹,]/g, ''));
            return s + (isNaN(numeric) ? 0 : numeric);
        }, 0);

        const netProfit = totalRevenue - totalExpenses - refundLiability;`;

const targetLogic = /\s*const\s*totalRevenue\s*=\s*payments\.reduce[\s\S]*?const\s*netProfit\s*=\s*totalRevenue\s*-\s*totalExpenses;/;
if (targetLogic.test(content)) {
    content = content.replace(targetLogic, summaryLogic);
}

// 2. Response JSON Injection
const responseJson = `
        res.json({
            success: true,
            totalRevenue,
            totalExpenses,
            refundLiability,
            netProfit,
            monthIncome,
            revenueByMonth,
            occupancyTrend,
            totalCapacity,
            expenseByCategory,
            paymentMethods,
            pendingPayments: allApplications.filter(a => a.status === 'Approved - Awaiting Payment'),
            moveOutRequests: allApplications.filter(a => a.status === 'Refund Pending'),
            paymentCount: payments.length,
            expenseCount: expenses.length
        });`;

const targetJson = /\s*res\.json\(\{\s*success: true,[\s\S]*?expenseCount: expenses\.length\s*\}\);/;
if (targetJson.test(content)) {
    content = content.replace(targetJson, responseJson);
}

fs.writeFileSync(file, content);
console.log('✅ Successfully updated server.js with Refund Liability logic.');
