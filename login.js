// Elements
const roleSelect = document.getElementById("role");
const studentField = document.querySelector(".student-field");
const teacherField = document.querySelector(".teacher-field");
const passwordField = document.querySelector(".password-field");

// Show/hide fields based on role
roleSelect.addEventListener("change", () => {
  if (roleSelect.value === "student") {
    studentField.style.display = "block";
    teacherField.style.display = "none";
    passwordField.style.display = "block";
  } else if (roleSelect.value === "teacher") {
    studentField.style.display = "none";
    teacherField.style.display = "block";
    passwordField.style.display = "block";
  } else {
    studentField.style.display = "none";
    teacherField.style.display = "none";
    passwordField.style.display = "none";
  }
});

// Handle form submission
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const regno = document.getElementById("regno").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (role === "student") {
    if (!regno || !password) return alert("Please enter your Reg No and Password");

    try {
      const res = await fetch("http://localhost:5000/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo: regno, password })
      });

      const data = await res.json();

      if (res.ok && data.student) {
        localStorage.setItem("studentRegNo", data.student.regNo);
        alert(`Welcome ${data.student.name}!`);
        window.location.href = "student-dashboard.html";
      } else {
        alert(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }

  } else if (role === "teacher") {
    if (!email || !password) return alert("Please enter your Email and Password");

    try {
      const res = await fetch("http://localhost:5000/teacher-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.teacher) {
        localStorage.setItem("teacherEmail", data.teacher.email);
        alert(`Welcome ${data.teacher.name}!`);
        window.location.href = "teacher-dashboard.html";
      } else {
        alert(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  } else {
    alert("Please select a role");
  }
});
