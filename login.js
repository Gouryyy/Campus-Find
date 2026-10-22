
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const showPassword = document.getElementById("showPassword");
const passwordInput = document.getElementById("password");

showPassword.addEventListener("change", function () {
    passwordInput.type = this.checked ? "text" : "password";
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const studentName =
        document.getElementById("studentName").value.trim();

    const studentEmail =
        document.getElementById("email").value.trim();

    const password = passwordInput.value;

    if (!studentName || !studentEmail || !password) {
        message.style.color = "red";
        message.textContent = "Please fill in all fields.";
        return;
    }

    // Demo login only: this does not verify credentials.

    
sessionStorage.setItem("studentLoggedIn", "true");
sessionStorage.setItem("userRole", "student");
sessionStorage.setItem("studentName", studentName);
sessionStorage.setItem("studentEmail", studentEmail);

window.location.href = "userdash.html";

});
