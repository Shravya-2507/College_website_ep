// ====== ELEMENT REFERENCES ======
const roleSelect = document.getElementById("role");
const adminField = document.querySelector(".admin-field");
const studentField = document.querySelector(".student-field");
const teacherField = document.querySelector(".teacher-field");
const passwordField = document.querySelector(".password-field");
const forgotContainer = document.getElementById("forgotPasswordContainer");

// ====== ROLE SELECTION ======
roleSelect.addEventListener("change", () => {
  adminField.style.display = "none";
  studentField.style.display = "none";
  teacherField.style.display = "none";
  passwordField.style.display = "none";
  forgotContainer.style.display = "none";

  if (roleSelect.value === "student") {
    studentField.style.display = "block";
    passwordField.style.display = "block";
    forgotContainer.style.display = "block";
  } 
  else if (roleSelect.value === "teacher") {
    teacherField.style.display = "block";
    passwordField.style.display = "block";
    forgotContainer.style.display = "block";
  }
  else if (roleSelect.value === "admin") {
    adminField.style.display = "block";     // ⭐ NEW
    passwordField.style.display = "block";
    forgotContainer.style.display = "block";
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
  const adminEmail = document.getElementById("adminEmail")?.value.trim(); // ⭐ NEW
  const password = document.getElementById("password").value.trim();

  if (!role || !password ||
      (role === "student" && !regno) ||
      (role === "teacher" && !email) ||
      (role === "admin" && !adminEmail)) {                             // ⭐ NEW
    alert("Please fill all required fields.");
    return;
  }

  const endpoint =
    role === "student"
      ? "/student-login"
      : role === "teacher"
      ? "/teacher-login"
      : "/admin-login";                                               // ⭐ NEW

  const body =
    role === "student"
      ? { regNo: regno, password }
      : role === "teacher"
      ? { email, password }
      : { email: adminEmail, password };                              // ⭐ NEW

  try {
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok && (data.student || data.teacher || data.admin)) {     // ⭐ NEW
      const user = data.student || data.teacher || data.admin;

      localStorage.setItem(
        role === "student"
          ? "studentRegNo"
          : role === "teacher"
          ? "teacherEmail"
          : "adminEmail",                                             // ⭐ NEW
        user.regNo || user.email
      );

      alert(`Welcome ${user.name}!`);

      window.location.href =
        role === "student"
          ? "student-dashboard.html"
          : role === "teacher"
          ? "teacher-dashboard.html"
          : "admin-dashboard.html";                                   // ⭐ NEW
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

// ====== SEND OTP ======
document.getElementById("sendOtpBtn").addEventListener("click", async () => {
  const role = roleSelect.value;
  const regno = document.getElementById("regno").value.trim();
  const email = document.getElementById("email").value.trim();
  const adminEmail = document.getElementById("adminEmail")?.value.trim(); // ⭐ NEW

  const identifier =
    role === "student" ? regno :
    role === "teacher" ? email :
    adminEmail;                                                       // ⭐ NEW

  if (!role || !identifier) return alert("Enter your details first.");

  const res = await fetch("http://localhost:5000/generate-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, identifier }),
  });

  const data = await res.json();
  if (res.ok) alert("OTP sent to your registered email!");
  else alert(data.error || "Failed to send OTP.");
});

// ====== VERIFY OTP + RESET PASSWORD ======
document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = roleSelect.value;
  const regno = document.getElementById("regno").value.trim();
  const email = document.getElementById("email").value.trim();
  const adminEmail = document.getElementById("adminEmail")?.value.trim(); // ⭐ NEW

  const identifier =
    role === "student" ? regno :
    role === "teacher" ? email :
    adminEmail;                                                       // ⭐ NEW

  const otp = document.getElementById("otp").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (newPassword !== confirmPassword) return alert("Passwords do not match.");

  const res = await fetch("http://localhost:5000/verify-otp-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, identifier, otp, newPassword }),
  });

  const data = await res.json();
  if (res.ok) alert("Password reset successfully!");
  else alert(data.error || "Invalid OTP or request expired.");
});
