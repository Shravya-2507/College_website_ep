// ====== ELEMENT REFERENCES ======
const roleSelect = document.getElementById("role");
const studentField = document.querySelector(".student-field");
const teacherField = document.querySelector(".teacher-field");
const passwordField = document.querySelector(".password-field");
const forgotContainer = document.getElementById("forgotPasswordContainer");

// ====== ROLE SELECTION ======
roleSelect.addEventListener("change", () => {
  if (roleSelect.value === "student") {
    studentField.style.display = "block";
    teacherField.style.display = "none";
    passwordField.style.display = "block";
    forgotContainer.style.display = "block";
  } else if (roleSelect.value === "teacher") {
    studentField.style.display = "none";
    teacherField.style.display = "block";
    passwordField.style.display = "block";
    forgotContainer.style.display = "block";
  } else {
    studentField.style.display = "none";
    teacherField.style.display = "none";
    passwordField.style.display = "none";
    forgotContainer.style.display = "none";
  }
});

// ====== PASSWORD VISIBILITY TOGGLE ======
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

// ====== LOGIN HANDLER ======
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const role = roleSelect.value;
  const regno = document.getElementById("regno").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!role || !password || (role === "student" && !regno) || (role === "teacher" && !email)) {
    alert("Please fill all required fields.");
    return;
  }

  const endpoint = role === "student" ? "/student-login" : "/teacher-login";
  const body = role === "student" ? { regNo: regno, password } : { email, password };

  try {
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok && (data.student || data.teacher)) {
      const user = data.student || data.teacher;
      localStorage.setItem(role === "student" ? "studentRegNo" : "teacherEmail", user.regNo || user.email);
      alert(`Welcome ${user.name}!`);
      window.location.href = role === "student" ? "student-dashboard.html" : "teacher-dashboard.html";
    } else {
      alert(data.error || "Invalid credentials");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again later.");
  }
});

// ====== FORGOT PASSWORD MODAL ======
const forgotModal = document.getElementById("forgotModal");
const forgotLink = document.getElementById("forgotPasswordLink");
const closeModal = document.getElementById("closeModal");

forgotLink.addEventListener("click", () => (forgotModal.style.display = "block"));
closeModal.addEventListener("click", () => (forgotModal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === forgotModal) forgotModal.style.display = "none";
});

// ====== PASSWORD RESET HANDLER ======
document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = roleSelect.value;
  const regno = document.getElementById("regno").value.trim();
  const email = document.getElementById("email").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!role) return alert("Please select your role first.");
  if (!newPassword || !confirmPassword) return alert("Please fill both password fields.");
  if (newPassword !== confirmPassword) return alert("Passwords do not match.");

  // Identify the correct user
  const identifier = role === "student" ? regno : email;
  if (!identifier) {
    alert("Please enter your registration number or email in the login form.");
    return;
  }

  const endpoint = role === "student" ? "/reset-student-password" : "/reset-teacher-password";
  const body = role === "student" ? { regNo: identifier, newPassword } : { email: identifier, newPassword };

  try {
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Password updated successfully!");
      forgotModal.style.display = "none";
    } else {
      alert(data.error || "Failed to update password.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
});
