document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("teacherEmail");

  if (!email) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  const apiBase = "http://localhost:5000";

  // 🧑‍🏫 Load teacher details
  async function loadTeacherProfile() {
    try {
      const res = await fetch(`${apiBase}/teacher/${email}`);
      const data = await res.json();

      if (!data || res.status !== 200) {
        document.getElementById("contentArea").innerHTML = `<p>${data.error || "No data found"}</p>`;
        return;
      }

      // Save details for later use
      localStorage.setItem("teacherSubject", data.subject);
      localStorage.setItem("teacherName", data.name);

      if (data.isClassTeacher) {
      document.getElementById("marksBtn").style.display = "block";
    } else {
      document.getElementById("marksBtn").style.display = "none";
    }


      // ✅ Display profile neatly with photo upload
      document.getElementById("contentArea").innerHTML = `
        <div class="profile-card">
          <div style="text-align:center; margin-bottom:15px;">
            <img id="teacherPhoto" 
                 src="${apiBase}/teacher/photo/${email}?t=${Date.now()}" 
                 alt="Teacher Photo" 
                 style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:2px solid #ccc;">
          </div>

          <label><b>Upload New Profile Photo:</b></label><br>
          <input type="file" id="photoUpload" accept="image/*" onchange="uploadTeacherPhoto(event)" />
          <hr>

          <h2>${data.name}</h2>
          <p><b>Email:</b> ${data.email}</p>
          <p><b>Subject:</b> ${data.subject}</p>
          <p><b>Qualification:</b> ${data.qualification}</p>
          <p><b>Experience:</b> ${data.experience}</p>
          <p><b>Phone:</b> ${data.phone}</p>
          <p><b>Gender:</b> ${data.gender}</p>
          <p><b>Date of Birth:</b> ${data.dob}</p>
          <p><b>Address:</b> ${data.address}</p>
        </div>
      `;
    } catch (err) {
      console.error("Error fetching teacher data:", err);
      document.getElementById("contentArea").innerHTML = `<p>⚠️ Unable to load profile. Please try again later.</p>`;
    }
  }

  // ✅ Upload Teacher Photo
  window.uploadTeacherPhoto = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`${apiBase}/teacher/upload-photo/${email}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Profile photo updated!");
        document.getElementById("teacherPhoto").src = `${apiBase}/teacher/photo/${email}?t=${Date.now()}`;
      } else {
        alert("Error uploading photo.");
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      alert("Server error while uploading photo.");
    }
  };

  // 👇 Auto-load profile when page opens
  await loadTeacherProfile();

  // 👇 Also reload when Profile button is clicked
  document.getElementById("profilebtn").addEventListener("click", loadTeacherProfile);


  // 🔹 ATTENDANCE SECTION
  document.getElementById("attendanceBtn").addEventListener("click", async () => {
    document.getElementById("contentArea").innerHTML = `
      <h2>Mark Attendance</h2>
      <label>Select Class:</label>
      <select id="classSelect">
        <option value="">-- Choose Class --</option>
        <option value="11-A">Class 11 - A</option>
        <option value="11-B">Class 11 - B</option>
        <option value="12-A">Class 12 - A</option>
        <option value="12-B">Class 12 - B</option>
      </select>
      <div id="studentList"></div>
    `;

    document.getElementById("classSelect").addEventListener("change", async (e) => {
      const selected = e.target.value;
      if (!selected) return;

      const [cls, section] = selected.split("-");
      const res = await fetch(`http://localhost:5000/classes/${cls}/${section}`);
      const students = await res.json();

      if (!students.length) {
        document.getElementById("studentList").innerHTML = "<p>No students found.</p>";
        return;
      }

      const formHTML = `
        <form id="attendanceForm">
          <table>
            <thead><tr><th>Reg No</th><th>Name</th><th>Present</th></tr></thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>${s.regNo}</td>
                  <td>${s.name}</td>
                  <td><input type="checkbox" id="${s.regNo}" checked></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button class="btn" type="submit">Submit Attendance</button>
        </form>
      `;
      document.getElementById("studentList").innerHTML = formHTML;

      document.getElementById("attendanceForm").addEventListener("submit", async (ev) => {
        ev.preventDefault();

        const records = [];
        students.forEach(s => {
          const present = document.getElementById(s.regNo).checked;
          records.push({ regNo: s.regNo, name: s.name, present });
        });

        const response = await fetch("http://localhost:5000/attendance/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class: cls,
            section,
            subject: localStorage.getItem("teacherSubject"),
            teacherEmail: email,
            date: new Date().toISOString().split("T")[0],
            students: records
          }),
        });

        const result = await response.json();
        if (result.error) alert(result.error);
        else alert("Attendance marked successfully!");
      });
    });
  });


// 🔹 MARKS SECTION
document.getElementById("marksBtn").addEventListener("click", async () => {
  document.getElementById("contentArea").innerHTML = `
    <h2>Upload Marks</h2>
    <label>Select Class:</label>
    <select id="marksClassSelect">
      <option value="">-- Choose Class --</option>
      <option value="11-A">Class 11 - A</option>
      <option value="11-B">Class 11 - B</option>
      <option value="12-A">Class 12 - A</option>
      <option value="12-B">Class 12 - B</option>
    </select>
    <div id="studentList"></div>
    <div id="marksFormContainer"></div>
  `;

  // Step 1: Load students when class selected
  document.getElementById("marksClassSelect").addEventListener("change", async (e) => {
    const selected = e.target.value;
    if (!selected) return;

    const [cls, section] = selected.split("-");
    const res = await fetch(`http://localhost:5000/classes/${cls}/${section}`);
    const students = await res.json();

    if (!students.length) {
      document.getElementById("studentList").innerHTML = "<p>No students found.</p>";
      return;
    }

    // Step 2: Dropdown to select student
    document.getElementById("studentList").innerHTML = `
      <label>Select Student:</label>
      <select id="studentSelect">
        <option value="">-- Choose Student --</option>
        ${students.map(s => `<option value="${s.regNo}">${s.name} (${s.regNo})</option>`).join('')}
      </select>
    `;

    // Step 3: When student selected, show form for 6 subjects
    document.getElementById("studentSelect").addEventListener("change", (ev) => {
      const regNo = ev.target.value;
      const student = students.find(s => s.regNo === regNo);
      if (!student) {
        document.getElementById("marksFormContainer").innerHTML = "";
        return;
      }

      const formHTML = `
        <form id="marksForm">
          <h3>Marks for ${student.name} (${student.regNo})</h3>
          <table>
            <thead>
              <tr><th>Subject</th><th>Scored</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${["English", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"]
                .map(subj => `
                  <tr>
                    <td>${subj}</td>
                    <td><input type="number" id="scored-${subj}" min="0" required></td>
                    <td><input type="number" id="total-${subj}" min="0" required></td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          <label>Exam Type:</label>
          <input type="text" id="examType" placeholder="e.g. Midterm, Final" required>
          <button class="btn" type="submit">Submit Marks</button>
        </form>
      `;
      document.getElementById("marksFormContainer").innerHTML = formHTML;

      // Step 4: Submit all 6 subjects
      document.getElementById("marksForm").addEventListener("submit", async (e2) => {
        e2.preventDefault();

        const examType = document.getElementById("examType").value.trim();
        if (!examType) return alert("Enter exam type");

        const marksArray = ["English", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"].map(subj => ({
          subject: subj,
          scored: parseInt(document.getElementById(`scored-${subj}`).value),
          total: parseInt(document.getElementById(`total-${subj}`).value)
        }));

        // ✅ Fetch teacher email from localStorage (saved at login)
        const teacherEmail = localStorage.getItem("teacherEmail");
        if (!teacherEmail) {
          alert("Teacher email not found. Please log in again.");
          return;
        }

        // ✅ Send all data including teacherEmail
        const response = await fetch("http://localhost:5000/marks/upload-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regNo: student.regNo,
            name: student.name,
            class: cls,
            section,
            examType,
            marks: marksArray,
            teacherEmail // ✅ now included
          }),
        });

        const result = await response.json();
        if (result.error) alert(result.error);
        else alert("All 6 subject marks uploaded & emailed to parent!");
      });
    });
  });
});


  

  // 📝 NOTES UPLOAD SECTION
  const notesBtn = document.getElementById("notesBtn");
  const contentArea = document.getElementById("contentArea");

  if (notesBtn && contentArea) {
    notesBtn.addEventListener("click", () => {
      contentArea.innerHTML = `
        <h2>Upload Notes</h2>
        <form id="uploadForm" class="upload-form">
          <label for="subject">Subject</label>
          <input type="text" id="subject" placeholder="Enter subject name" required>

          <label for="title">Title</label>
          <input type="text" id="title" placeholder="Enter note title" required>

          <label for="fileUpload">Choose File</label>
          <input type="file" id="fileUpload" accept=".pdf,.docx,.pptx,.txt" required>

          <button type="submit" class="btn">Upload</button>
        </form>
        <div id="uploadedNotes"></div>
      `;

      const uploadForm = document.getElementById("uploadForm");

      uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const subject = document.getElementById("subject").value.trim();
        const title = document.getElementById("title").value.trim();
        const file = document.getElementById("fileUpload").files[0];
        const uploadedBy = localStorage.getItem("teacherName") || "Unknown Teacher";

        if (!file) {
          alert("Please select a file.");
          return;
        }

        const formData = new FormData();
        formData.append("subject", subject);
        formData.append("title", title);
        formData.append("uploadedBy", uploadedBy);
        formData.append("file", file);

        try {
          const res = await fetch("http://localhost:5000/upload-note", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (res.ok) {
            const uploadedNotesDiv = document.getElementById("uploadedNotes");
            const noteItem = document.createElement("div");
            noteItem.classList.add("note-item");
            noteItem.innerHTML = `
              <p><strong>Subject:</strong> ${data.note.subject}</p>
              <p><strong>Title:</strong> ${data.note.title}</p>
              <a href="http://localhost:5000${data.note.fileUrl}" target="_blank">View File</a>

              <p>Uploaded successfully!</p>
            `;
            uploadedNotesDiv.appendChild(noteItem);
            uploadForm.reset();
          } else {
            alert("Upload failed: " + data.error);
          }
        } catch (err) {
          console.error("Error uploading note:", err);
          alert("Server error — check console for details.");
        }
      });
    });
  }


  // 🔹 TEACHER TIMETABLE SECTION (Fixed time slots)
// 🔹 TEACHER TIMETABLE SECTION (with syllabus integration)
async function loadTeacherTimetable() {
  const teacherName = localStorage.getItem("teacherName");
  const teacherSubject = localStorage.getItem("teacherSubject");
  if (!teacherName || !teacherSubject) {
    alert("Teacher name or subject not found. Please log in again.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/teacher-timetable/${teacherName}`);
    const data = await res.json();

    const contentArea = document.getElementById("contentArea");

    if (!data || Object.keys(data).length === 0) {
      contentArea.innerHTML = `<p>No timetable found for ${teacherName}.</p>`;
      return;
    }

    const sortedTimes = [
      "09:00 - 09:45",
      "09:50 - 10:35",
      "10:40 - 11:25",
      "11:30 - 12:15",
      "01:15 - 02:00",
      "02:05 - 02:50",
      "02:55 - 03:40"
    ];

    let timetableHTML = `
      <h2>${teacherName}'s Timetable</h2>
      <table class="timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            ${sortedTimes.map(t => `<th>${t}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (const [day, periods] of Object.entries(data)) {
      timetableHTML += `<tr><td><b>${day}</b></td>`;
      sortedTimes.forEach(time => {
        const slot = periods.find(p => p.time === time);
        if (slot) {
          timetableHTML += `
            <td class="clickable-slot"
                style="cursor:pointer; background-color:#f3f4f6; border-radius:6px;"
                data-class="${slot.class}" data-section="${slot.section}" data-day="${day}">
              <b>${slot.subject}</b><br>
              ${slot.class}-${slot.section}
            </td>
          `;
        } else {
          timetableHTML += `<td>—</td>`;
        }
      });
      timetableHTML += `</tr>`;
    }

    timetableHTML += `
      </tbody></table>
      <div id="syllabusBelow" style="margin-top: 40px;"></div>
    `;

    contentArea.innerHTML = timetableHTML;

    // 👇 Handle slot click for syllabus view
    document.querySelectorAll(".clickable-slot").forEach(cell => {
      cell.addEventListener("click", async () => {
        const className = cell.dataset.class;
        const section = cell.dataset.section;
        const subject = teacherSubject;

        document.getElementById("syllabusBelow").innerHTML =
          `<p>Loading syllabus for <b>${subject}</b> - ${className}${section ? "-" + section : ""}...</p>`;

        try {
          const classNum = className.replace(/\D/g, ""); // get 11 / 12 etc.
          const res = await fetch(`http://localhost:5000/syllabus/${classNum}/${subject}`);
          const syllabus = await res.json();

          if (!syllabus.topics || syllabus.topics.length === 0) {
            document.getElementById("syllabusBelow").innerHTML = `<p>No syllabus found for this subject.</p>`;
            return;
          }

         // Find the next topic that still has uncovered subtopics
let nextTopic = syllabus.topics.find(t => t.subtopics.some(st => !st.covered));

if (!nextTopic) {
  document.getElementById("syllabusBelow").innerHTML = `
    <p>All topics for <b>${subject}</b> in ${className}${section ? "-" + section : ""} are covered!</p>
  `;
  return;
}

// Find the first uncovered subtopic within that topic
let nextSubtopic = nextTopic.subtopics.find(st => !st.covered);

if (!nextSubtopic) {
  document.getElementById("syllabusBelow").innerHTML = `
    <p>All subtopics under <b>${nextTopic.title}</b> are covered!</p>
  `;
  return;
}

// Show only the current subtopic
let tableHTML = `
  <h3>Syllabus to be covered - ${subject} (${className}${section ? "-" + section : ""})</h3>
  <h4>Topic: ${nextTopic.title}</h4>
  <table class="styled-table">
    <thead><tr><th>Subtopic</th><th>Hours</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>
      <tr>
        <td>${nextSubtopic.title}</td>
        <td>${nextSubtopic.hours}</td>
        <td style="font-weight:bold; color:${nextSubtopic.covered ? 'green' : 'red'};">
          ${nextSubtopic.covered ? 'Covered' : 'Pending'}
        </td>
        <td>
          <button class="btn" style="padding:6px 10px;font-size:13px"
            onclick="updateSubtopic('${classNum}','${subject}','${nextTopic.title}','${nextSubtopic.title}',true,true)">
            Mark Covered
          </button>
        </td>
      </tr>
    </tbody>
  </table>
`;

// Display the subtopic
document.getElementById("syllabusBelow").innerHTML = tableHTML;
 
          

        } catch (err) {
          console.error("Error loading syllabus for slot:", err);
          document.getElementById("syllabusBelow").innerHTML = `<p>Failed to load syllabus.</p>`;
        }
      });
    });

  } catch (err) {
    console.error("Error loading timetable:", err);
    document.getElementById("contentArea").innerHTML = `<p>Failed to load timetable.</p>`;
  }
}


document.getElementById("classesBtn").addEventListener("click", loadTeacherTimetable);

  // ---------------- SYLLABUS SECTION ----------------
  async function loadSyllabusSection() {
    contentArea.innerHTML = `
      <div id="syllabusSection">
        <h2>Syllabus Progress Tracker</h2>
        <div class="upload-form">
          <label>Select Class:</label>
          <select id="classSelect">
            <option value="">-- Select Class --</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>

          <label>Select Subject:</label>
          <select id="subjectSelect"><option value="">-- Select Subject --</option></select>

          <label>Select Topic:</label>
          <select id="topicSelect"><option value="">-- Select Topic --</option></select>
        </div>
        <div id="topicDisplay" style="margin-top:20px;"></div>
      </div>
    `;

    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");
    const topicSelect = document.getElementById("topicSelect");
    const topicDisplay = document.getElementById("topicDisplay");
    let syllabusCache = {};

    // Load subjects
    classSelect.addEventListener("change", async () => {
      const classVal = classSelect.value;
      if (!classVal) return;

      subjectSelect.innerHTML = `<option value="">-- Select Subject --</option>`;
      topicSelect.innerHTML = `<option value="">-- Select Topic --</option>`;
      topicDisplay.innerHTML = `<p>Select subject to continue...</p>`;

      const res = await fetch(`${apiBase}/subjects/${classVal}`);
      const subjects = await res.json();
      subjects.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subjectSelect.appendChild(opt);
      });
    });

    // Load topics
    subjectSelect.addEventListener("change", async () => {
      const classVal = classSelect.value;
      const subjectVal = subjectSelect.value;
      if (!subjectVal) return;

      topicSelect.innerHTML = `<option value="">-- Select Topic --</option>`;
      topicDisplay.innerHTML = `<p>Loading topics...</p>`;

      const res = await fetch(`${apiBase}/syllabus/${classVal}/${subjectVal}`);
      const data = await res.json();
      syllabusCache = data;

      if (!data.topics || data.topics.length === 0) {
        topicDisplay.innerHTML = `<p>No topics found</p>`;
        return;
      }

      topicDisplay.innerHTML = `<p>Select a topic to view subtopics</p>`;
      data.topics.forEach(topic => {
        const opt = document.createElement("option");
        opt.value = topic.title;
        opt.textContent = topic.title;
        topicSelect.appendChild(opt);
      });
    });

    // Display subtopics
    topicSelect.addEventListener("change", () => {
      const topicVal = topicSelect.value;
      if (!topicVal || !syllabusCache.topics) return;

      const topic = syllabusCache.topics.find(t => t.title === topicVal);
      if (!topic || !topic.subtopics) {
        topicDisplay.innerHTML = `<p>No subtopics found.</p>`;
        return;
      }

      let tableHTML = `
        <h3>${topic.title}</h3>
        <table class="styled-table">
          <thead><tr><th>Subtopic</th><th>Hours</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
      `;

      topic.subtopics.forEach(sub => {
        tableHTML += `
          <tr>
            <td>${sub.title}</td>
            <td>${sub.hours}</td>
            <td style="font-weight:bold; color:${sub.covered ? 'green' : 'red'};">
              ${sub.covered ? 'Covered' : 'Pending'}
            </td>
            <td>
              <button class="btn" style="padding:6px 10px;font-size:13px"
                onclick="updateSubtopic('${classSelect.value}','${subjectSelect.value}','${topicVal}','${sub.title}',${!sub.covered})">
                Mark ${sub.covered ? 'Pending' : 'Covered'}
              </button>
            </td>
          </tr>
        `;
      });

      tableHTML += `</tbody></table>`;
      topicDisplay.innerHTML = tableHTML;
    });
  }

  window.updateSubtopic = async function (classVal, subject, topicTitle, subtopicTitle, covered, refreshFromTimetable = false) {
  try {
    const res = await fetch(`${apiBase}/syllabus/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class: classVal, subject, topicTitle, subtopicTitle, covered }),
    });

    if (res.ok) {
      if (refreshFromTimetable) {
        // Refresh the syllabus view under timetable after marking
        const evt = new Event("click");
        const activeCell = document.querySelector(".clickable-slot[style*='background-color: rgb(243, 244, 246)']");
        if (activeCell) activeCell.dispatchEvent(evt);
      } else {
        document.getElementById("topicSelect").dispatchEvent(new Event("change"));
      }
    } else {
      alert("Update failed. Please try again.");
    }
  } catch (err) {
    console.error("Error updating subtopic:", err);
  }
};

  // 🟢 Load syllabus when syllabus button is clicked
  document.getElementById("syllabusBtn").addEventListener("click", loadSyllabusSection);

  // 🚪 Logout
  window.logout = function () {
    localStorage.removeItem("teacherEmail");
    window.location.href = "login.html";
  };
});
