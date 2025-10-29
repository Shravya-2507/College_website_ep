document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("teacherEmail");

  if (!email) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  // 🧑‍🏫 Fetch teacher details
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
  } catch (err) {
    console.error("Error fetching teacher data:", err);
    document.getElementById("teacherInfo").innerHTML = "<p>Failed to load teacher info.</p>";
  }

  // 📋 Attendance Button
  document.getElementById("attendanceBtn").addEventListener("click", async () => {
    try {
      const res = await fetch("http://localhost:5000/students");
      const students = await res.json();

      const content = `
        <h2>Mark Attendance</h2>
        <form id="attendanceForm">
          <table>
            <thead><tr><th>Reg No</th><th>Name</th><th>Present</th></tr></thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>${s.regNo}</td>
                  <td>${s.name}</td>
                  <td><input type="checkbox" id="${s._id}" checked></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button class="btn" type="submit">Submit Attendance</button>
        </form>
      `;
      document.getElementById("contentArea").innerHTML = content;

      document.getElementById("attendanceForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const records = [];
        document.querySelectorAll("input[type=checkbox]").forEach(cb => {
          records.push({ studentId: cb.id, present: cb.checked });
        });

        const resp = await fetch("http://localhost:5000/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            records
          })
        });

        const result = await resp.json();
        if (result.error) return alert(result.error);
        alert("Attendance submitted successfully!");
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load students.");
    }
  });


  // 📅 Today's Classes
  document.getElementById("classesBtn").addEventListener("click", async () => {
    try {
      const res = await fetch(`http://localhost:5000/teacher-classes/${email}`);
      const data = await res.json();

      let html = `<h2>Today's Classes</h2>`;
      if (!data.length) {
        html += "<p>No classes scheduled for today.</p>";
      } else {
        html += `
          <table>
            <thead><tr><th>Subject</th><th>Class</th><th>Time</th></tr></thead>
            <tbody>
              ${data.map(c => `
                <tr>
                  <td>${c.subject}</td>
                  <td>${c.className}</td>
                  <td>${c.time}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
      document.getElementById("contentArea").innerHTML = html;
    } catch (err) {
      console.error(err);
      alert("Error loading today's classes.");
    }
  });
});

// 🚪 Logout
function logout() {
  localStorage.removeItem("teacherEmail");
  window.location.href = "login.html";
}

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

  // Handle form submission
  const uploadForm = document.getElementById("uploadForm");
  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const subject = document.getElementById("subject").value.trim();
    const file = document.getElementById("fileUpload").files[0];

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    // Create uploaded note preview
    const uploadedNotesDiv = document.getElementById("uploadedNotes");
    const noteItem = document.createElement("div");
    noteItem.classList.add("note-item");
    noteItem.innerHTML = `
      <p class="upload-success"><strong>Subject:</strong> <span class="note-text">${subject}</span></p>
      <p class="upload-success"><strong>File:</strong> <span class="note-text">${file.name}</span></p>
      <p class="upload-success">✅ Successfully uploaded!</p>
    `;

    uploadedNotesDiv.appendChild(noteItem);
    uploadForm.reset();
  });
});