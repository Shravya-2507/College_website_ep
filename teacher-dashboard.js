document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("teacherEmail");

  if (!email) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  // 🧑‍🏫 Load teacher details
  try {
    const res = await fetch(`http://localhost:5000/teacher/${email}`);
    const data = await res.json();

    if (!data || res.status !== 200) {
      document.getElementById("teacherName").textContent = "Error loading profile";
      document.getElementById("teacherInfo").innerHTML = `<p>${data.error || "No data found"}</p>`;
      return;
    }

    document.getElementById("teacherName").innerText = data.name;
    document.getElementById("teacherInfo").innerHTML = `
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Subject:</b> ${data.subject}</p>
      <p><b>Qualification:</b> ${data.qualification}</p>
      <p><b>Experience:</b> ${data.experience}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Gender:</b> ${data.gender}</p>
      <p><b>Date of Birth:</b> ${data.dob}</p>
      <p><b>Address:</b> ${data.address}</p>
    `;

    localStorage.setItem("teacherSubject", data.subject);
  } catch (err) {
    console.error("Error fetching teacher data:", err);
  }

  // 🔹 ATTENDANCE SECTION
  document.getElementById("attendanceBtn").addEventListener("click", async () => {
    document.getElementById("contentArea").innerHTML = `
      <h2>📋 Mark Attendance</h2>
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
        else alert("✅ Attendance marked successfully!");
      });
    });
  });

  // 🔹 MARKS SECTION
  document.getElementById("marksBtn").addEventListener("click", async () => {
    document.getElementById("contentArea").innerHTML = `
      <h2>🧮 Upload Marks</h2>
      <label>Select Class:</label>
      <select id="marksClassSelect">
        <option value="">-- Choose Class --</option>
        <option value="11-A">Class 11 - A</option>
        <option value="11-B">Class 11 - B</option>
        <option value="12-A">Class 12 - A</option>
        <option value="12-B">Class 12 - B</option>
      </select>
      <div id="marksList"></div>
    `;

    document.getElementById("marksClassSelect").addEventListener("change", async (e) => {
      const selected = e.target.value;
      if (!selected) return;

      const [cls, section] = selected.split("-");
      const res = await fetch(`http://localhost:5000/classes/${cls}/${section}`);
      const students = await res.json();

      if (!students.length) {
        document.getElementById("marksList").innerHTML = "<p>No students found.</p>";
        return;
      }

      const formHTML = `
        <form id="marksForm">
          <table>
            <thead><tr><th>Reg No</th><th>Name</th><th>Marks</th><th>Total</th></tr></thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>${s.regNo}</td>
                  <td>${s.name}</td>
                  <td><input type="number" id="marks-${s.regNo}" min="0" required></td>
                  <td><input type="number" id="total-${s.regNo}" min="0" required></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <label>Exam Type:</label><input type="text" id="examType" required>
          <button class="btn" type="submit">Submit Marks</button>
        </form>
      `;
      document.getElementById("marksList").innerHTML = formHTML;

      document.getElementById("marksForm").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const examType = document.getElementById("examType").value.trim();

        const marksArray = students.map(s => ({
          regNo: s.regNo,
          name: s.name,
          scored: parseInt(document.getElementById(`marks-${s.regNo}`).value),
          total: parseInt(document.getElementById(`total-${s.regNo}`).value)
        }));

        const response = await fetch("http://localhost:5000/marks/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class: cls,
            section,
            subject: localStorage.getItem("teacherSubject"),
            teacherEmail: email,
            examType,
            marks: marksArray
          }),
        });

        const result = await response.json();
        if (result.error) alert(result.error);
        else alert("✅ Marks uploaded successfully!");
      });
    });
  });

  // 📝 NOTES UPLOAD SECTION (unchanged)
  document.getElementById("notesBtn").addEventListener("click", () => {
    document.getElementById("contentArea").innerHTML = `
      <h2>Upload Notes</h2>
      <form id="uploadForm" class="upload-form">
        <label for="subject">Subject</label>
        <input type="text" id="subject" placeholder="Enter subject name" required>

        <label for="fileUpload">Choose File</label>
        <input type="file" id="fileUpload" accept=".pdf,.docx,.pptx,.txt" required>

        <button type="submit" class="btn">Upload</button>
      </form>
      <div id="uploadedNotes"></div>
    `;

    const uploadForm = document.getElementById("uploadForm");
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const subject = document.getElementById("subject").value.trim();
      const file = document.getElementById("fileUpload").files[0];

      if (!file) {
        alert("Please select a file.");
        return;
      }

      const uploadedNotesDiv = document.getElementById("uploadedNotes");
      const noteItem = document.createElement("div");
      noteItem.classList.add("note-item");
      noteItem.innerHTML = `
        <p class="upload-success"><strong>Subject:</strong> ${subject}</p>
        <p class="upload-success"><strong>File:</strong> ${file.name}</p>
        <p class="upload-success">✅ Successfully uploaded!</p>
      `;
      uploadedNotesDiv.appendChild(noteItem);
      uploadForm.reset();
    });
  });
});

// 🚪 Logout
function logout() {
  localStorage.removeItem("teacherEmail");
  window.location.href = "login.html";
}
