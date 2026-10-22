const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const showPassword = document.getElementById("showPassword");
const passwordInput = document.getElementById("password");

showPassword.addEventListener("change", function () {
    passwordInput.type = this.checked ? "text" : "password";
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const studentEmail = document.getElementById("email").value.trim();
    const password = passwordInput.value;

    if (!studentEmail || !password) {
        message.style.color = "red";
        message.textContent = "Please enter your email and password.";
        return;
    }

    try {
        message.style.color = "black";
        message.textContent = "Logging in...";

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                email: studentEmail,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        if (!data.user || data.user.role !== "user") {
            message.style.color = "red";
            message.textContent = "Please use a student account.";
            return;
        }

        sessionStorage.setItem("studentLoggedIn", "true");
        sessionStorage.setItem("userRole", "student");
        sessionStorage.setItem("studentName", data.user.name);
        sessionStorage.setItem("studentEmail", data.user.email);

        window.location.href = "userdash.html";
    } catch (error) {
        message.style.color = "red";
        message.textContent = error.message ||
            "Could not connect to the server.";
    }
});