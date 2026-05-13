# 🏨 HostelSphere

> **Intelligent Hostel Management System**  
> *A comprehensive Web Application developed as part of the **TYBSc IT** (Third Year Bachelor of Science in Information Technology) Project.*

🔗 **Live Demo (Vercel):** [https://hotel-m-gules.vercel.app/](https://hotel-m-gules.vercel.app/)  
🔗 **Repository Link:** [https://github.com/Blue-SkyStar/hotel_m](https://github.com/Blue-SkyStar/hotel_m)

---

## 📖 About the Project

**HostelSphere** is a modern, responsive, and secure web-based digital platform designed to automate and streamline the end-to-end administration of student hostels/dorms. It replaces traditional manual tracking with intelligent workflows, real-time database synchronization, and transparent operations for **Students**, **Administrators**, and **Wardens**.

Whether it's online room allocation, digital rent/fee payments, maintenance complaint tracking, or financial reporting, HostelSphere provides a seamless, world-class user experience.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
* **Digital Room Application:** Seamlessly apply for Single, Double, or Triple sharing accommodation online.
* **Live Application Tracking:** Real-time updates on application status (Approved, Allocated, Waitlisted, Rejected).
* **Secure Online Fee Payments:** Integrated payment gateway support to securely pay accommodation and mess fees.
* **Maintenance & Complaints:** Lodge room maintenance issues or complaints and track resolution status.
* **Digital Notice Board:** Stay updated with instant administration announcements and circulars.
* **Roommate Details:** Transparent access to allocated room and co-resident details.

### 🛡️ Admin Portal
* **Master Control Dashboard:** Advanced analytics, vacancy statistics, and high-level summaries.
* **Intelligent Room Allocation:** Manage room blocks, monitor live occupancy limits, and allocate rooms smoothly.
* **Finance & Expense Management:** Professional accounting suite tracking monthly revenue, category-wise expenses, and generating profit/loss statements.
* **Student & Records Directory:** Complete student records management, ID proofs, and parental contact details.
* **Visitor Log Tracker:** Maintain a secure check-in/check-out register for external visitors/guests.
* **Dynamic Reports Generation:** Export multi-dimensional operational and financial reports instantly.

### 👮 Warden Portal
* **Operational Supervision Dashboard:** Dedicated interface to supervise student attendance, resolve local issues, and maintain campus discipline.

---

## 🛠️ Technology Stack

### **Frontend**
* **HTML5 & CSS3:** Modern semantic structures and responsive styling.
* **Bootstrap 5:** Powerful UI component library for consistent layouts.
* **JavaScript (ES6+):** Dynamic client-side logic and asynchronous API integration.
* **FontAwesome:** Scalable vector icons.

### **Backend**
* **Node.js & Express.js:** Robust, event-driven server backend handling high-concurrency requests.
* **Authentication:** **JWT (JSON Web Tokens)** stored in secure `HttpOnly` cookies, coupled with **bcrypt** for salted password hashing.
* **Real-time Synchronisation:** **Server-Sent Events (SSE)** architecture broadcasting immediate state changes to active dashboards.

### **Database & Cloud Services**
* **PostgreSQL:** Fully relational, robust persistent storage.
* **Supabase Integration:** Enterprise-grade cloud database hosting.
* **Firebase Admin SDK:** Push notification infrastructure.
* **Razorpay SDK:** Reliable payment processing integration.

---

## 🚀 Setup & Installation Guide

Follow these simple steps to set up the project locally on your machine.

### **1. Prerequisites**
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18.x or above recommended)
* [Git](https://git-scm.com/)
* A PostgreSQL Database (or a [Supabase](https://supabase.com/) project URL)

### **2. Clone the Repository**
```bash
git clone https://github.com/Blue-SkyStar/hotel_m.git
cd hotel_m
```

### **3. Install Dependencies**
```bash
npm install
```

### **4. Configure Environment Variables**
Create a `.env` file in the root directory and specify the following keys:
```env
PORT=3000
SUPABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your_super_secure_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### **5. Run the Application**
Start the local development server:
```bash
npm run dev
# OR
npm start
```

The application will be accessible at: **`http://localhost:3000`**

---

## 📂 Project Directory Structure

```text
HostelSphere/
│
├── public/                 # Frontend client static files
│   ├── admin/              # Admin dashboard pages
│   ├── student/            # Student portal interfaces
│   ├── warden/             # Warden operational views
│   ├── css/                # Custom cascading stylesheets
│   ├── js/                 # Client-side scripts
│   └── img/                # Brand logos and graphic assets
│
├── utils/                  # Server-side helper utilities
│   └── firebase.js         # Firebase notifications configuration
│
├── server.js               # Application core backend entry point
├── package.json            # Project dependencies and npm scripts
├── .env                    # Environment variables configuration
└── README.md               # Project documentation
```

---

## 🔐 Security Highlights
* **Protection against XSS & CSRF:** Strict session handling utilizing backend-signed `HttpOnly` JSON Web Tokens.
* **Data Payload Sanitisation:** Optimization for serverless compute architectures to ensure payload structures are robust against server timeouts.
* **SSL Verification:** Secure database connection pooling configuration.

---

## 🎓 Academic Context
This software project is developed and documented strictly in fulfillment of the curriculum requirements for the **Final Year TYBSc IT** degree program. It highlights practical integration of full-stack engineering, secure identity access management, database schema design, and seamless user interface aesthetics.

---

<div align="center">
  <b>Built with ❤️ for hassle-free hostel living.</b>
</div>
