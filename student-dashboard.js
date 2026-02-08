const apiBase = "http://localhost:5000";

// Sidebar navigation
function showSection(sectionId, element) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active-section"));
  document.getElementById(sectionId).classList.add("active-section");
  document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
  element.classList.add("active");
}

// ✅ Load Student Profile
// ✅ Load Student Profile
async function loadStudentProfile() {
  const regno = localStorage.getItem("studentRegNo");
  if (!regno) {
    alert("Please log in again — missing register number!");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${apiBase}/student/${regno}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Error fetching profile:", data);
      return;
    }

    // ✅ Basic info
    document.getElementById("profileName").textContent = data.name || "N/A";
    document.getElementById("profileRegNo").textContent = data.regNo || "N/A";
    document.getElementById("profileClass").textContent = data.class || "N/A";
    document.getElementById("profileSection").textContent = data.section || "N/A";
    document.getElementById("profileParentEmail").textContent = data.parentEmail || "N/A";
    document.getElementById("profileDob").textContent = data.dob || "N/A";
    document.getElementById("profileGender").textContent = data.gender || "N/A";
    document.getElementById("fatherName").textContent = data.fatherName || "N/A";
    document.getElementById("fatherContact").textContent = data.fatherContact || "N/A";
    document.getElementById("motherName").textContent = data.motherName || "N/A";
    document.getElementById("motherContact").textContent = data.motherContact || "N/A";
    document.getElementById("address").textContent = data.address || "N/A";

    // ✅ Load profile photo from backend
    document.getElementById("profilePhoto").src = `${apiBase}/student/photo/${regno}?t=${Date.now()}`;

    // ✅ Load 10th Marks card (PDF/Image)
    const marksResponse = await fetch(`${apiBase}/student/tenthmarks/${regno}`);
    const marksFileLink = document.getElementById("marksFileLink");

    if (marksResponse.ok) {
      const contentType = marksResponse.headers.get("content-type");
      const blob = await marksResponse.blob();
      const fileUrl = URL.createObjectURL(blob);

      if (contentType.includes("pdf")) {
        marksFileLink.innerHTML = `<embed src="${fileUrl}" type="application/pdf" width="100%" height="300px" style="border-radius:8px; border:1px solid #ccc;">`;
      } else if (contentType.startsWith("image/")) {
        marksFileLink.innerHTML = `<img src="${fileUrl}" alt="10th Marks" style="width:100%; max-height:300px; object-fit:contain; border-radius:8px; border:1px solid #ccc;">`;
      } else {
        marksFileLink.innerHTML = `<a href="${fileUrl}" target="_blank">View 10th Marks</a>`;
      }
    } else {
      marksFileLink.textContent = "No file uploaded";
    }

  } catch (err) {
    console.error("Error loading profile:", err);
  }
}


// ✅ Upload Profile Photo
async function uploadProfilePhoto(event) {
  const file = event.target.files[0];
  const regno = localStorage.getItem("studentRegNo");
  if (!file || !regno) return;

  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${apiBase}/student/upload-photo/${regno}`, {
    method: "POST",
    body: formData
  });

  if (res.ok) {
    alert("Profile photo updated!");
    document.getElementById("profilePhoto").src = `${apiBase}/student/photo/${regno}?t=${Date.now()}`;
  } else {
    alert("Error uploading photo.");
  }
}

// ✅ Upload 10th Marks file
async function uploadTenthMarks(event) {
  const file = event.target.files[0];
  const regno = localStorage.getItem("studentRegNo");
  if (!file || !regno) return;

  const formData = new FormData();
  formData.append("tenthMarks", file);

  const res = await fetch(`${apiBase}/student/upload-tenthmarks/${regno}`, {
    method: "POST",
    body: formData
  });

  if (res.ok) {
    alert("10th Marks uploaded successfully!");
    loadStudentProfile(); // reload preview
  } else {
    alert("Error uploading marks.");
  }
}


// ✅ Attendance percentage calculation
function calculateAttendance() {
  const rows = document.querySelectorAll("#attendance tbody tr");
  let present = 0, total = 0;
  rows.forEach(row => {
    const status = row.cells[1].textContent.trim().toLowerCase();
    if (status === "present") present++;
    total++;
  });
  const percent = total ? ((present / total) * 100).toFixed(2) : 0;
  document.getElementById("attendancePercent").textContent = percent + "%";
}



/// ✅ Load Student Timetable
async function loadStudentTimetable() {
  const regno = localStorage.getItem("studentRegNo");
  if (!regno) {
    alert("Please log in again!");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${apiBase}/student-timetable/${regno}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Error fetching timetable:", data.message);
      document.getElementById("timetableBody").innerHTML =
        `<tr><td colspan="8">No timetable found for your class.</td></tr>`;
      return;
    }

    // ✅ Display full timetable
    displayTimetableTable(data);

    // ✅ Display today’s schedule in dashboard
    displayTodaySchedule(data);

  } catch (err) {
    console.error("Error:", err);
  }
}

// ✅ Display timetable in weekly table (includes teacher names)
function displayTimetableTable(timetable) {
  const tbody = document.getElementById("timetableBody");
  tbody.innerHTML = "";

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  days.forEach(day => {
    const row = document.createElement("tr");

    // Day name cell
    const dayCell = document.createElement("td");
    dayCell.textContent = day;
    row.appendChild(dayCell);

    if (timetable[day]) {
      timetable[day].forEach(slot => {
        const cell = document.createElement("td");
        // ✅ Show subject + teacher
        cell.innerHTML = `<b>${slot.subject}</b><br><small>${slot.teacher}</small>`;
        row.appendChild(cell);
      });
    } else {
      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        cell.textContent = "-";
        row.appendChild(cell);
      }
    }

    tbody.appendChild(row);
  });

  highlightCurrentDay();
}

// ✅ Highlight current day in timetable
function highlightCurrentDay() {
  const today = new Date().getDay(); // 0=Sunday
  if (today < 1 || today > 6) return; // Only Mon–Sat

  const rows = document.querySelectorAll("#timetableBody tr");
  rows[today - 1]?.classList.add("highlight-day");
}

// ✅ Display only today’s schedule in the Dashboard (includes teacher)
function displayTodaySchedule(timetable) {
  const todayIndex = new Date().getDay(); // 0=Sunday
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[todayIndex];

  const todayTitle = document.getElementById("todayName");
  const todayList = document.getElementById("todayPeriods");

  todayTitle.textContent = todayName;

  if (todayIndex === 0 || !timetable[todayName]) {
    todayList.innerHTML = `<li>No classes today 🎉</li>`;
    return;
  }

  todayList.innerHTML = timetable[todayName]
    .map(slot => `<li><b>${slot.time}</b> — ${slot.subject} <small>(${slot.teacher})</small></li>`)
    .join("");
}




// ✅ Load attendance
async function loadStudentAttendance() {
  const regno = localStorage.getItem("studentRegNo");
  try {
    const res = await fetch(`${apiBase}/student-attendance/${regno}`);
    const data = await res.json();
    const table = document.getElementById("attendanceTable");
    table.innerHTML = "";

    if (!data.length) {
      table.innerHTML = "<tr><td colspan='3'>No attendance records</td></tr>";
      document.getElementById("attendancePercent").textContent = "0%";
      return;
    }

    let totalDays = 0, presentDays = 0;

    data.forEach(record => {
      record.students.forEach(student => {
        if (student.regNo === regno) {
          totalDays++;
          if (student.present) presentDays++;
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${record.date}</td>
            <td>${student.present ? "Present" : "Absent"}</td>
          `;
          table.appendChild(row);
        }
      });
    });

    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
    document.getElementById("attendancePercent").textContent = `${percentage}%`;
  } catch (err) {
    console.error("Error loading attendance:", err);
  }
}



// ✅ Load Student Marks (Flat View)
async function loadStudentMarks() {
  const regno = localStorage.getItem("studentRegNo");
  const res = await fetch(`${apiBase}/student-marks/${regno}`);
  const data = await res.json();

  const table = document.getElementById("marksTable");
  table.innerHTML = "";

  const subjects = ["English", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"];

  if (!data.length) {
    table.innerHTML = "<tr><td colspan='5'>No marks available</td></tr>";
    return;
  }

  // 🔹 Sort exams by date (newest first)
  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 🔹 Build table
  data.forEach(exam => {
    exam.marks.forEach(m => {
      table.innerHTML += `
        <tr>
          <td>${m.subject}</td>
          <td>${exam.examType}</td>
          <td>${m.scored}</td>
          <td>${m.total}</td>
          <td>${exam.date}</td>
        </tr>
      `;
    });
  });
}




async function loadNotes() {
  try {
    const res = await fetch(`${apiBase}/notes`);
    const notes = await res.json();
    const notesList = document.getElementById("notesList");
    notesList.innerHTML = "";

    if (!Array.isArray(notes) || notes.length === 0) {
      notesList.innerHTML = "<li>No notes available</li>";
      return;
    }

    notes.forEach(note => {
      const filePath = `${apiBase}${note.fileUrl}`; 
      const li = document.createElement("li");
      li.innerHTML = `<a href="${filePath}" target="_blank">${note.subject} - ${note.title}</a>`;
      notesList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading notes:", err);
    document.getElementById("notesList").innerHTML = "<li>Error loading notes</li>";
  }
}

// Academic Calendar
const events = {
  "2025-06-12": { type: "event", label: "College Reopens" },
  "2025-08-15": { type: "holiday", label: "Independence Day" },
  "2025-09-05": { type: "event", label: "Teachers’ Day" },
  "2025-10-02": { type: "holiday", label: "Gandhi Jayanti" },
  "2025-10-20": { type: "exam", label: "Mid-Term Exams Start" },
  "2025-11-14": { type: "event", label: "Children’s Day" },
  "2025-12-25": { type: "holiday", label: "Christmas" },
  "2026-01-26": { type: "holiday", label: "Republic Day" },
  "2026-02-10": { type: "exam", label: "Pre-Final Exams Start" },
  "2026-03-15": { type: "exam", label: "Final Exams" },
  "2026-04-05": { type: "holiday", label: "Ugadi Festival" },
  "2026-05-01": { type: "holiday", label: "Summer Vacation Begins" }
};

function renderCalendar() {
  const month = parseInt(document.getElementById("monthSelect").value);
  const year = month >= 6 ? 2025 : 2026;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();

  let html = `<table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;">
    <thead><tr style="background:#1e3a8a;color:white;">
      <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
    </tr></thead><tbody><tr>`;

  for (let i = 0; i < firstDay.getDay(); i++) html += "<td></td>";

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const event = events[dateStr];
    const today = new Date();
    const isToday = today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;

    let bg = "#f9fafb", label = "";
    if (event) {
      if (event.type === "holiday") bg = "#bfdbfe";
      else if (event.type === "exam") bg = "#fde68a";
      else if (event.type === "event") bg = "#e9d5ff";
      label = `<br><small>${event.label}</small>`;
    }
    if (isToday) bg = "#bbf7d0";

    html += `<td style="border:1px solid #e5e7eb;padding:8px;text-align:center;background:${bg};border-radius:8px;">
              <b>${day}</b>${label}
            </td>`;

    if ((day + firstDay.getDay()) % 7 === 0) html += "</tr><tr>";
  }

  html += "</tr></tbody></table>";

  html += `
    <div style="margin-top:15px;">
      <span style="background:#f9fafb;padding:5px 10px;border-radius:6px;">Regular</span>
      <span style="background:#bfdbfe;padding:5px 10px;border-radius:6px;">Holiday</span>
      <span style="background:#fde68a;padding:5px 10px;border-radius:6px;">Exam</span>
      <span style="background:#e9d5ff;padding:5px 10px;border-radius:6px;">Event</span>
      <span style="background:#bbf7d0;padding:5px 10px;border-radius:6px;">Today</span>
    </div>
  `;

  document.getElementById("calendarContainer").innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  const monthSelect = document.getElementById("monthSelect");
  if (monthSelect) renderCalendar();
});


// Load Bus Facility (Frontend)
async function loadBusFacility() {
  const regNo = localStorage.getItem("studentRegNo");
  const facilitiesDiv = document.getElementById("facilities");
  if (!facilitiesDiv) return;

  try {
    const res = await fetch(`${apiBase}/bus-facility/${regNo}`);
    const data = await res.json();

    if (data.data === null || data.message?.includes("not opted")) {
      facilitiesDiv.innerHTML = `
        <div class="facility-card">
          <h3>Bus Facility</h3>
          <p>Not opted.</p>
        </div>`;
    } else if (res.ok) {
      facilitiesDiv.innerHTML = `
        <div class="facility-card">
          <h3> Bus Facility</h3>
          <p><strong>Route No:</strong> ${data.routeNo}</p>
          <p><strong>Pickup Point:</strong> ${data.pickupPoint}</p>
          <p><strong>Driver:</strong> ${data.driverName}</p>
          <p><strong>Contact:</strong> ${data.driverContact}</p>
          <p><strong>Timing:</strong> ${data.timing}</p>
        </div>`;
    } else {
      facilitiesDiv.innerHTML = "<p>No bus details found.</p>";
    }
  } catch (err) {
    facilitiesDiv.innerHTML = "<p> Error loading bus facility.</p>";
    console.error("Error fetching bus facility:", err);
  }
}

//  Load Student Facilities (Bus only)
async function loadFacilities() {
  const regNo = localStorage.getItem("studentRegNo");
  const facilitiesDiv = document.getElementById("facilities");

  if (!facilitiesDiv) return; // if section doesn't exist
  if (!regNo) {
    facilitiesDiv.innerHTML = "<p>Please log in to view your facilities.</p>";
    return;
  }

  try {
    let html = `<h2>Facilities</h2>`;

    //  Bus Facility
    const busRes = await fetch(`${apiBase}/bus-facility/${regNo}`);
    const busJson = await busRes.json();

    if (busJson.data === null || busJson.message?.includes("not opted")) {
      html += `<div class="facility-card"><h3>Bus Facility</h3><p>Not opted.</p></div>`;
    } else if (busRes.ok) {
      const busData = busJson;
      html += `
        <div class="facility-card">
          <h3>Bus Facility</h3>
          <p><strong>Route No:</strong> ${busData.routeNo}</p>
          <p><strong>Pickup Point:</strong> ${busData.pickupPoint}</p>
          <p><strong>Driver:</strong> ${busData.driverName}</p>
          <p><strong>Contact:</strong> ${busData.driverContact}</p>
          <p><strong>Timing:</strong> ${busData.timing}</p>
        </div>`;
    }

    facilitiesDiv.innerHTML = html;
  } catch (err) {
    facilitiesDiv.innerHTML = "<p> Error loading facilities.</p>";
    console.error("Error fetching facilities:", err);
  }
}



//  Load Hostel Facility
async function loadHostelFacility() {
  const regNo = localStorage.getItem("studentRegNo");
  const facilitiesDiv = document.getElementById("facilities");
  if (!facilitiesDiv) return;

  try {
    const res = await fetch(`${apiBase}/hostel-facility/${regNo}`);
    const data = await res.json();

    if (!data.data || data.message?.includes("not opted")) {
      facilitiesDiv.innerHTML += `
        <div class="facility-card">
          <h3>Hostel Facility</h3>
          <p>Not opted.</p>
        </div>`;
    } else {
      const h = data.data;
      facilitiesDiv.innerHTML += `
        <div class="facility-card">
          <h3>Hostel Facility</h3>
          <p><strong>Room No:</strong> ${h.roomNo}</p>
          <p><strong>Block:</strong> ${h.block}</p>
          <p><strong>Warden:</strong> ${h.wardenName}</p>
          <p><strong>Contact:</strong> ${h.wardenContact}</p>
        </div>`;
    }
  } catch (err) {
    facilitiesDiv.innerHTML += "<p> Error loading hostel facility.</p>";
    console.error("Error fetching hostel facility:", err);
  }
}






// ✅ On page load
window.onload = async () => {
  await loadStudentProfile();
  await loadStudentTimetable();
  await loadNotes();
  await loadStudentAttendance();
  await loadStudentMarks();
  await loadFacilities(); 
  await loadHostelFacility();
};
