const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
        message.style.color = "red";
        message.textContent = "Please fill in all fields.";
        return;
    }

    if (password !== confirmPassword) {
        message.style.color = "red";
        message.textContent = "Passwords do not match.";
        return;
    }

    try {
        message.style.color = "black";
        message.textContent = "Creating your account...";

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Registration failed. Please try again."
            );
        }

        message.style.color = "green";
        message.textContent =
            "Account created successfully! Redirecting to login...";

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        message.style.color = "red";
        message.textContent =
            error.message || "Could not connect to the server.";
    }
});