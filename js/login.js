document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();

    let role = document.getElementById("role").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("loggedUser", data.user.username);
            
            // Redirection logic
            if (data.user.role === "admin") {
                window.location.href = "admin/admin_home.html";
            } else if (data.user.role === "warden") {
                window.location.href = "warden/warden_dashboard.html";
            } else {
                window.location.href = "student/student_dashboard.html";
            }
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message || 'Invalid login credentials!'
                });
            } else {
                alert(data.message || "Invalid login credentials!");
            }
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Server error. Please try again later.");
    }
});
