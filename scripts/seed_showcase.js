require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.SUPABASE_URL || 'postgresql://postgres:taskneedstohaveharderpasswordthan12345@db.hdtgfphtkvnkufuyjonh.supabase.co:5432/postgres'
});

const generateId = () => Date.now().toString() + Math.floor(Math.random() * 1000);

const studentsData = [
    { name: "Aarav Sharma", email: "aarav.sh@email.com", phone: "+91 9876543210", course: "B.Tech Computer Science", room: "A-101", gender: "Male", guardianName: "Rajeev Sharma", guardianPhone: "+91 9988776655", address: "Mumbai, MH", status: "Active" },
    { name: "Priya Patel", email: "priya.p@email.com", phone: "+91 9876543211", course: "MBA Finance", room: "G-102", gender: "Female", guardianName: "Amit Patel", guardianPhone: "+91 9988776654", address: "Ahmedabad, GJ", status: "Active" },
    { name: "Rahul Verma", email: "rahul.v@email.com", phone: "+91 9876543212", course: "B.Sc Physics", room: "A-102", gender: "Male", guardianName: "Sanjay Verma", guardianPhone: "+91 9988776653", address: "Delhi, DL", status: "Active" },
    { name: "Neha Gupta", email: "neha.g@email.com", phone: "+91 9876543213", course: "BA Economics", room: "G-103", gender: "Female", guardianName: "Anil Gupta", guardianPhone: "+91 9988776652", address: "Lucknow, UP", status: "Active" },
    { name: "Vikram Singh", email: "vikram.s@email.com", phone: "+91 9876543214", course: "B.Tech Mechanical", room: "A-103", gender: "Male", guardianName: "Ranjit Singh", guardianPhone: "+91 9988776651", address: "Chandigarh, PB", status: "Active" },
    { name: "Ananya Iyer", email: "ananya.i@email.com", phone: "+91 9876543215", course: "BFA Applied Arts", room: "G-104", gender: "Female", guardianName: "Karthik Iyer", guardianPhone: "+91 9988776650", address: "Chennai, TN", status: "Active" },
    { name: "Rohan Das", email: "rohan.d@email.com", phone: "+91 9876543216", course: "MBA HR", room: "A-104", gender: "Male", guardianName: "Biplab Das", guardianPhone: "+91 9988776649", address: "Kolkata, WB", status: "Active" },
    { name: "Sneha Reddy", email: "sneha.r@email.com", phone: "+91 9876543217", course: "MBBS", room: "G-105", gender: "Female", guardianName: "Venkat Reddy", guardianPhone: "+91 9988776648", address: "Hyderabad, TS", status: "Active" },
    { name: "Aditya Desai", email: "aditya.d@email.com", phone: "+91 9876543218", course: "B.Arch", room: "B-201", gender: "Male", guardianName: "Nitin Desai", guardianPhone: "+91 9988776647", address: "Pune, MH", status: "Active" },
    { name: "Meera Nair", email: "meera.n@email.com", phone: "+91 9876543219", course: "B.Tech Civil", room: "H-201", gender: "Female", guardianName: "Krishnan Nair", guardianPhone: "+91 9988776646", address: "Kochi, KL", status: "Active" },
    { name: "Karan Johar", email: "karan.j@email.com", phone: "+91 9876543220", course: "BBA", room: "B-202", gender: "Male", guardianName: "Yash Johar", guardianPhone: "+91 9988776645", address: "Mumbai, MH", status: "Active" },
    { name: "Pooja Hegde", email: "pooja.h@email.com", phone: "+91 9876543221", course: "B.Sc IT", room: "H-202", gender: "Female", guardianName: "Manjunath Hegde", guardianPhone: "+91 9988776644", address: "Mangalore, KA", status: "Active" }
];

const paymentTypes = ["Down Payment", "Monthly Rent", "Mess Fee", "Security Deposit", "Late Fee"];
const paymentMethods = ["UPI", "Razorpay", "Bank Transfer", "Credit Card", "Cash"];
const expenseTypes = ["Electricity", "Water", "Salary", "Maintenance", "Internet", "Food", "Other"];

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
    try {
        console.log("Clearing existing data...");
        await pool.query('DELETE FROM payments');
        await pool.query('DELETE FROM expenses');
        await pool.query('DELETE FROM applications');
        await pool.query('DELETE FROM complaints');
        await pool.query('DELETE FROM visitors');
        await pool.query('DELETE FROM students');
        
        console.log("Seeding Students...");
        for (const s of studentsData) {
            await pool.query(
                `INSERT INTO students (id, name, email, phone, course, room, gender, "guardianName", "guardianPhone", address, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [generateId(), s.name, s.email, s.phone, s.course, s.room, s.gender, s.guardianName, s.guardianPhone, s.address, s.status]
            );
        }

        console.log("Seeding Payments (~55 records over 6 months)...");
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 5);
        startDate.setDate(1);

        for (let i = 0; i < 55; i++) {
            const student = studentsData[Math.floor(Math.random() * studentsData.length)];
            const dateStr = getRandomDate(startDate, new Date()).toISOString().split('T')[0];
            const amount = Math.floor(Math.random() * 50) * 100 + 1000; // 1000 to 6000
            const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const type = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
            
            await pool.query(
                `INSERT INTO payments (id, student, room, amount, method, receipt, date, status, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [generateId(), student.name, student.room, amount, method, `RCPT-${1000+i}`, dateStr, 'Paid', type]
            );
        }

        console.log("Seeding Expenses (~35 records over 6 months)...");
        for (let i = 0; i < 35; i++) {
            const dateStr = getRandomDate(startDate, new Date()).toISOString().split('T')[0];
            const type = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
            const amount = Math.floor(Math.random() * 80) * 100 + 500; // 500 to 8500
            
            await pool.query(
                `INSERT INTO expenses (id, date, type, amount, notes) VALUES ($1, $2, $3, $4, $5)`,
                [generateId(), dateStr, type, amount, `Routine ${type} expense`]
            );
        }

        console.log("Seeding Applications...");
        const applications = [
            { s: "Ravi Kumar", stat: "Approved - Awaiting Payment" },
            { s: "Kavya Menon", stat: "Approved - Awaiting Payment" },
            { s: "Arif Khan", stat: "Approved - Awaiting Payment" },
            { s: "Isha Jain", stat: "Pending Review" },
            { s: "Sameer Joshi", stat: "Pending Review" },
            { s: "Riya Sen", stat: "Rejected" },
            { s: "Arjun Reddy", stat: "Allocated" }
        ];

        for (let i = 0; i < applications.length; i++) {
            const a = applications[i];
            await pool.query(
                `INSERT INTO applications (id, student, "studentName", "roomNumber", "roomType", status, date) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [generateId(), a.s.replace(' ', '').toLowerCase(), a.s, `B-10${i}`, "Double Sharing", a.stat, new Date().toISOString().split('T')[0]]
            );
        }

        console.log("Seeding Complaints & Visitors...");
        await pool.query(`INSERT INTO complaints (id, student, category, description, date, status) VALUES ($1, $2, $3, $4, $5, $6)`, [generateId(), "Aarav Sharma", "Maintenance", "AC Cooling Issue", new Date().toLocaleDateString(), "Pending"]);
        await pool.query(`INSERT INTO complaints (id, student, category, description, date, status) VALUES ($1, $2, $3, $4, $5, $6)`, [generateId(), "Priya Patel", "Electrical", "Tube light flickering", new Date().toLocaleDateString(), "Resolved"]);
        
        await pool.query(`INSERT INTO visitors (id, "visitorName", "visitingStudent", purpose, phone, "inTime", "outTime", date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [generateId(), "Rajeev Sharma", "Aarav Sharma", "Parent Visit", "9988776655", "10:00 AM", "", new Date().toLocaleDateString(), "In"]);
        
        console.log("Seeding complete! Database is primed for showcase.");
        process.exit(0);
    } catch (err) {
        console.error("Error during seeding:", err);
        process.exit(1);
    }
}

seed();
