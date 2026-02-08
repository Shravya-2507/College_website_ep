const apiBase = "http://localhost:5000";

// ---------------------- NAVIGATION ----------------------
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active-section")
  );
  document.getElementById(id).classList.add("active-section");

  if (id === "students") loadStudents();
}

function logout() {
  localStorage.removeItem("adminEmail");
  window.location.href = "login.html";
}

// ---------------------- ADD STUDENT ----------------------
document.getElementById("addStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target).entries());

  try {
    const res = await fetch(`${apiBase}/admin/add-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok && !data.error) {
      document.getElementById("successBox").style.display = "block";
      document.getElementById("errorBox").style.display = "none";
      e.target.reset();
      loadStudents();
    } else {
      document.getElementById("successBox").style.display = "none";
      document.getElementById("errorBox").style.display = "block";
    }
  } catch (err) {
    console.error(err);
    alert("Server error while adding student.");
  }
});

// ---------------------- LOAD STUDENTS ----------------------
async function loadStudents() {
  const selectedClass = document.getElementById("filterClass").value;
  const selectedSection = document.getElementById("filterSection").value;
  const table = document.getElementById("studentTable");

  table.innerHTML = `
    <tr>
      <th>Reg No</th>
      <th>Name</th>
      <th>Class</th>
      <th>Section</th>
      <th>Edit</th>
      <th>Delete</th>
    </tr>
  `;

  if (!selectedClass || !selectedSection) {
    table.innerHTML += `<tr><td colspan="6" style="text-align:center;">
      Select both class and section to view students
    </td></tr>`;
    return;
  }

  try {
    const res = await fetch(`${apiBase}/admin/get-students?section=${selectedSection}`);
    let data = await res.json();

    // Filter by class on frontend
    data = data.filter(s => s.class === selectedClass);

    if (!data.length) {
      table.innerHTML += `<tr><td colspan="6" style="text-align:center;">
        No students found in class ${selectedClass} section ${selectedSection}
      </td></tr>`;
      return;
    }

    data.forEach(s => {
      table.innerHTML += `
        <tr>
          <td>${s.regNo}</td>
          <td>${s.name}</td>
          <td>${s.class}</td>
          <td>${s.section}</td>
          <td><button class="edit-btn" onclick='openEditForm(${JSON.stringify(s)})'>Edit</button></td>
          <td><button class="del-btn" onclick="deleteStudent('${s.regNo}')">Delete</button></td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load students.");
  }
}



document.getElementById("filterClass").addEventListener("change", loadStudents);
document.getElementById("filterSection").addEventListener("change", loadStudents);


// ---------------------- DELETE STUDENT ----------------------
async function deleteStudent(regNo) {
  if (!confirm("Are you sure you want to delete this student?")) return;

  try {
    await fetch(`${apiBase}/admin/delete-student/${regNo}`, {
      method: "DELETE"
    });
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("Failed to delete student.");
  }
}

// ---------------------- EDIT STUDENT ----------------------
function openEditForm(student) {
  document.getElementById("edit_regNo").value = student.regNo;
  document.getElementById("edit_name").value = student.name;
  document.getElementById("edit_class").value = student.class;
  document.getElementById("edit_section").value = student.section;
  document.getElementById("edit_parentEmail").value = student.parentEmail || "";
  document.getElementById("edit_dob").value = student.dob || "";
  document.getElementById("edit_gender").value = student.gender || "";
  document.getElementById("edit_fatherName").value = student.fatherName || "";
  document.getElementById("edit_motherName").value = student.motherName || "";
  document.getElementById("edit_fatherContact").value = student.fatherContact || "";
  document.getElementById("edit_motherContact").value = student.motherContact || "";
  document.getElementById("edit_address").value = student.address || "";
  document.getElementById("edit_busFacility").value = student.busFacility || "No";
  document.getElementById("edit_hostelFacility").value = student.hostelFacility || "No";

  document.getElementById("editPopup").style.display = "block";
}

function closePopup() {
  document.getElementById("editPopup").style.display = "none";
}

// ---------------------- UPDATE STUDENT ----------------------
async function updateStudent() {
  const regNo = document.getElementById("edit_regNo").value;

  const updatedData = {
    name: document.getElementById("edit_name").value.trim(),
    class: document.getElementById("edit_class").value,
    section: document.getElementById("edit_section").value,
    parentEmail: document.getElementById("edit_parentEmail").value,
    dob: document.getElementById("edit_dob").value,
    gender: document.getElementById("edit_gender").value,
    fatherName: document.getElementById("edit_fatherName").value,
    motherName: document.getElementById("edit_motherName").value,
    fatherContact: document.getElementById("edit_fatherContact").value,
    motherContact: document.getElementById("edit_motherContact").value,
    address: document.getElementById("edit_address").value,
    busFacility: document.getElementById("edit_busFacility").value,
    hostelFacility: document.getElementById("edit_hostelFacility").value
  };

  try {
    const res = await fetch(`${apiBase}/admin/update-student/${regNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });

    const data = await res.json();
    alert(data.message || "Student updated successfully!");
    closePopup();
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("Failed to update student.");
  }
}


// ---------------------- LOAD TEACHERS ----------------------
async function loadTeachers() {
  const table = document.getElementById("teacherTable");

  table.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Subject</th>
      <th>Class</th>
      <th>Section</th>
      <th>Edit</th>
      <th>Delete</th>
    </tr>
  `;

  try {
    const res = await fetch(`${apiBase}/admin/get-teachers`);
    const data = await res.json();

    if (!data.length) {
      table.innerHTML += `
        <tr><td colspan="7" style="text-align:center;">
          No teachers found
        </td></tr>`;
      return;
    }

    data.forEach((t, index) => {
      // create a row
      const row = table.insertRow(-1);

      row.insertCell(0).innerText = t.name || "-";
      row.insertCell(1).innerText = t.email || "-";
      row.insertCell(2).innerText = t.subject || "-";
      row.insertCell(3).innerText = t.classAssigned || "-";
      row.insertCell(4).innerText = t.sectionAssigned || "-";

      // Edit button
      const editCell = row.insertCell(5);
      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.innerText = "Edit";
      editBtn.addEventListener("click", () => openTeacherEdit(t));
      editCell.appendChild(editBtn);

      // Delete button
      const delCell = row.insertCell(6);
      const delBtn = document.createElement("button");
      delBtn.className = "del-btn";
      delBtn.innerText = "Delete";
      delBtn.addEventListener("click", () => deleteTeacher(t.email));
      delCell.appendChild(delBtn);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load teachers.");
  }
}
// Call loadTeachers when the page loads
window.addEventListener("DOMContentLoaded", () => {
  loadTeachers();
});

document.getElementById("addTeacherForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target).entries());

  // Handle isClassTeacher and optional fields
  if (formData.isClassTeacher === "true") {
    formData.isClassTeacher = true;
  } else if (formData.isClassTeacher === "false") {
    formData.isClassTeacher = false;
    formData.classAssigned = "";
    formData.sectionAssigned = "";
  } else {
    formData.isClassTeacher = undefined; // leave empty if user didn't select
    formData.classAssigned = "";
    formData.sectionAssigned = "";
  }

  try {
    const res = await fetch(`${apiBase}/admin/add-teacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      e.target.reset();
      loadTeachers();
    } else {
      console.error(data);
      alert("Failed to add teacher.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error while adding teacher.");
  }
});



// ---------------------- EDIT TEACHER ----------------------
function openTeacherEdit(teacher) {
  document.getElementById("editTeacherEmail").value = teacher.email || "";
  document.getElementById("edit_t_name").value = teacher.name || "";
  document.getElementById("edit_t_phone").value = teacher.phone || "";
  document.getElementById("edit_t_qualification").value = teacher.qualification || "";
  document.getElementById("edit_t_experience").value = teacher.experience || "";
  document.getElementById("edit_t_subject").value = teacher.subject || "";
  document.getElementById("edit_t_class").value = teacher.classAssigned || "";
  document.getElementById("edit_t_section").value = teacher.sectionAssigned || "";
  document.getElementById("edit_t_classTeacher").value = teacher.isClassTeacher;
  document.getElementById("edit_t_address").value = teacher.address || "";

  document.getElementById("editTeacherPopup").style.display = "block";
}




function closeTeacherPopup() {
  document.getElementById("editTeacherPopup").style.display = "none";
}

// ---------------------- UPDATE TEACHER ----------------------
async function updateTeacher() {
  const email = document.getElementById("editTeacherEmail").value;

  const updatedData = {
    name: document.getElementById("edit_t_name").value.trim(),
    phone: document.getElementById("edit_t_phone").value,
    qualification: document.getElementById("edit_t_qualification").value,
    experience: document.getElementById("edit_t_experience").value,
    subject: document.getElementById("edit_t_subject").value,
    classAssigned: document.getElementById("edit_t_class").value,
    sectionAssigned: document.getElementById("edit_t_section").value,
    isClassTeacher: document.getElementById("edit_t_classTeacher").value,
    address: document.getElementById("edit_t_address").value
  };

  try {
    const res = await fetch(`${apiBase}/admin/update-teacher/${email}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });

    const data = await res.json();
    alert(data.message || "Teacher updated successfully!");
    closeTeacherPopup();
    loadTeachers();
  } catch (err) {
    console.error(err);
    alert("Failed to update teacher.");
  }
}

function showAddPeriodForm() {
  document.getElementById('addPeriodForm').style.display = 'block';
}

function hideAddPeriodForm() {
  document.getElementById('addPeriodForm').style.display = 'none';
}

// Load timetable
async function loadTimetable() {
  const cls = document.getElementById("ttClass").value;
  const section = document.getElementById("ttSection").value;

  const res = await fetch(`${apiBase}/admin/get-timetable/${cls}/${section}`);
  const data = await res.json();

  const display = document.getElementById("timetableDisplay");
  display.innerHTML = "";

  for (const day of ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]) {
    const periods = data.timetable?.[day] || [];
    const dayDiv = document.createElement("div");
    dayDiv.innerHTML = `<h3>${day}</h3>`;

    const table = document.createElement("table");
    table.innerHTML = `<tr><th>Time</th><th>Subject</th><th>Teacher</th><th>Edit</th><th>Delete</th></tr>`;

    periods.forEach((p, idx) => {
      const row = table.insertRow(-1);
      row.insertCell(0).innerText = p.time;
      row.insertCell(1).innerText = p.subject;
      row.insertCell(2).innerText = p.teacher;

      const editCell = row.insertCell(3);
      const editBtn = document.createElement("button");
      editBtn.innerText = "Edit";
      editBtn.className = "edit-btn";
      editBtn.onclick = () => openEditPopup(cls, section, day, idx, p);
      editCell.appendChild(editBtn);

      const delCell = row.insertCell(4);
      const delBtn = document.createElement("button");
      delBtn.innerText = "Delete";
      delBtn.className = "del-btn";
      delBtn.onclick = () => deletePeriod(cls, section, day, idx);
      delCell.appendChild(delBtn);
    });

    dayDiv.appendChild(table);
    display.appendChild(dayDiv);
  }
}

// Add Period
async function addPeriodSlot() {
  const cls = document.getElementById("ttClass").value;
  const section = document.getElementById("ttSection").value;
  const day = document.getElementById("addPeriodDay").value;
  const time = document.getElementById("addPeriodTime").value;
  const subject = document.getElementById("addPeriodSubject").value;
  const teacher = document.getElementById("addPeriodTeacher").value;

  if (!time || !subject || !teacher) return alert("Fill all fields!");

  await fetch(`${apiBase}/admin/add-period/${cls}/${section}/${day}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ time, subject, teacher })
  });

  hideAddPeriodForm();
  loadTimetable();
}

// Open Edit Popup
function openEditPopup(cls, section, day, index, period) {
  document.getElementById("edit_tt_class").value = cls;
  document.getElementById("edit_tt_section").value = section;
  document.getElementById("edit_tt_day").value = day;
  document.getElementById("edit_tt_index").value = index;

  document.getElementById("edit_tt_time_input").value = period.time;
  document.getElementById("edit_tt_subject_input").value = period.subject;
  document.getElementById("edit_tt_teacher_input").value = period.teacher;

  document.getElementById("editTimetablePopup").style.display = "block";
}

function closeTimetablePopup() {
  document.getElementById("editTimetablePopup").style.display = "none";
}

// Save Edit
async function saveTimetableSlot() {
  const cls = document.getElementById("edit_tt_class").value;
  const section = document.getElementById("edit_tt_section").value;
  const day = document.getElementById("edit_tt_day").value;
  const index = document.getElementById("edit_tt_index").value;

  const time = document.getElementById("edit_tt_time_input").value;
  const subject = document.getElementById("edit_tt_subject_input").value;
  const teacher = document.getElementById("edit_tt_teacher_input").value;

  await fetch(`${apiBase}/admin/edit-period/${cls}/${section}/${day}/${index}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ time, subject, teacher })
  });

  closeTimetablePopup();
  loadTimetable();
}

// Delete Period
async function deletePeriod(cls, section, day, index) {
  if (!confirm("Delete this period?")) return;

  await fetch(`${apiBase}/admin/delete-period/${cls}/${section}/${day}/${index}`, { method: "DELETE" });
  loadTimetable();
}
