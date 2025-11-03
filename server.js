const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: "./emsil.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collegeDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => console.log("✅ MongoDB Connected"));
mongoose.connection.on("error", (err) => console.log("❌ MongoDB Error:", err));

// ✅ Ensure "notes" and "uploads" folders exist
const folders = ["uploads", "notes"];
folders.forEach((dir) => {
  const folderPath = path.join(__dirname, dir);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`📁 Created ${dir} folder`);
  }
});

// ✅ Multer setup for uploading notes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "notes/"),  // ✅ put directly into notes
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// ✅ Multer setup for in-memory uploads (for MongoDB storage)
const uploadMemory = multer({ storage: multer.memoryStorage() });

// ✅ Multer setup for student uploads (store in uploads/)
const uploadStudentFiles = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.regNo}-${file.fieldname}${ext}`);
  },
});
const uploadStudent = multer({ storage: uploadStudentFiles });



const uploadTeacherFiles = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.email}-photo${ext}`);
  },
});
const uploadTeacher = multer({ storage: uploadTeacherFiles });




// ✅ Serve uploaded files publicly
app.use("/notes", express.static(path.join(__dirname, "notes")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});
transporter
  .verify()
  .then(() => console.log("📧 Mail transporter ready"))
  .catch((err) => console.error("⚠️ Mail transporter error:", err));


const studentSchema = new mongoose.Schema({
  regNo: String,
  name: String,
  class: String,
  section: String,
  email: String,
  parentEmail: String,
  password: String,
  dob: String,
  gender: String,
  fatherName: String,
  motherName: String,
  fatherContact: String,
  motherContact: String,
  address: String,
  photoPath: String,
  tenthMarksPath: String,

});



module.exports = mongoose.model("Student", studentSchema);

const teacherSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  subject: String,
  qualification: String,
  experience: String,
  phone: String,
  gender: String,
  dob: String,
  address: String,
  photoPath: String, // ✅ add this
});


const classSchema = new mongoose.Schema({
  class: String,
  section: String,
  students: [
    {
      regNo: String,
      name: String,
    },
  ],
});

const attendanceSchema = new mongoose.Schema({
  class: String,
  section: String,
  subject: String,
  teacherEmail: String,
  date: String,
  students: [
    {
      regNo: String,
      name: String,
      present: Boolean,
    },
  ],
});

const marksSchema = new mongoose.Schema({
  class: String,
  section: String,
  subject: String,
  examType: String,
  teacherEmail: String,
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
  marks: [
    {
      regNo: String,
      name: String,
      scored: Number,
      total: Number,
    },
  ],
});

const timetableSchema = new mongoose.Schema({
  class: String,
  section: String,
  timetable: Object, // ✅ changed from "schedule: Array" to "timetable: Object"
});

const noteSchema = new mongoose.Schema({
  subject: String,
  title: String,
  uploadedBy: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now },
});

const syllabusSchema = new mongoose.Schema({
  class: String,
  subjects: [
    {
      subject: String,
      topics: [
        {
          title: String,
          plannedHours: Number,
          covered: { type: Boolean, default: false },
          subtopics: [
            {
              title: String,
              hours: Number,
              covered: { type: Boolean, default: false }
            }
          ]
        }
      ]
    }
  ]
});


// ✅ Models with explicit collection names
const Student = mongoose.model("Student", studentSchema, "students");
const Teacher = mongoose.model("Teacher", teacherSchema, "teachers");
const Class = mongoose.model("Class", classSchema, "classes");
const Attendance = mongoose.model("Attendance", attendanceSchema, "attendances");
const Marks = mongoose.model("Marks", marksSchema, "marks");
const Timetable = mongoose.model("Timetable", timetableSchema, "timetables");
const Note = mongoose.model("Note", noteSchema);
const Syllabus = mongoose.model("Syllabus", syllabusSchema, "syllabus");
// ✅ Routes

// -------------------- LOGIN ROUTES --------------------

// Student Login
app.post("/student-login", async (req, res) => {
  const { regNo, password } = req.body;
  if (!regNo || !password)
    return res.status(400).json({ error: "RegNo and password are required" });

  try {
    const student = await Student.findOne({ regNo });
    if (!student) return res.status(404).json({ error: "Student not found" });
    if (student.password !== password)
      return res.status(401).json({ error: "Incorrect password" });

    res.json({ message: "Login successful", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Login
app.post("/teacher-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const teacher = await Teacher.findOne({ email: email.trim() });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    if (teacher.password.trim() !== password.trim())
      return res.status(401).json({ error: "Incorrect password" });

    res.json({ message: "Login successful", teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/reset-student-password", async (req, res) => {
  const { regNo, newPassword } = req.body;
  try {
    const student = await Student.findOneAndUpdate({ regNo }, { password: newPassword }, { new: true });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/reset-teacher-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const teacher = await Teacher.findOneAndUpdate({ email }, { password: newPassword }, { new: true });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// -------------------- SYLLABUS ROUTES --------------------

// ✅ Get all subjects for a given class
app.get("/subjects/:class", async (req, res) => {
  try {
    const cls = req.params.class;
    const syllabus = await mongoose.connection.db
      .collection("syllabus")
      .findOne({ class: cls });

    if (!syllabus || !syllabus.subjects) return res.json([]);
    const subjects = syllabus.subjects.map(s => s.subject);
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});


// ✅ Get full syllabus (topics + subtopics) for a specific subject in a class
app.get("/syllabus/:class/:subject", async (req, res) => {
  try {
    const { class: cls, subject } = req.params;

    // Fetch the syllabus document for that class
    const syllabus = await mongoose.connection.db
      .collection("syllabus")
      .findOne({ class: cls });

    if (!syllabus) {
      console.log(`❌ No syllabus found for class ${cls}`);
      return res.status(404).json({ error: `No syllabus found for class ${cls}` });
    }

    // Find the matching subject entry
    const subj = syllabus.subjects?.find(s => s.subject === subject);
    if (!subj) {
      console.log(`❌ Subject '${subject}' not found in class ${cls}`);
      return res.status(404).json({ error: `Subject '${subject}' not found in class ${cls}` });
    }

    // ✅ Return entire subject data (topics + subtopics)
    res.json(subj);
  } catch (err) {
    console.error("Error fetching syllabus:", err);
    res.status(500).json({ error: "Failed to fetch syllabus" });
  }
});
// ✅ Get the next subtopic to teach for a given class and subject
app.get("/next-subtopic/:class/:subject", async (req, res) => {
  try {
    const { class: cls, subject } = req.params;

    const syllabus = await mongoose.connection.db
      .collection("syllabus")
      .findOne({ class: cls });

    if (!syllabus) return res.status(404).json({ message: "No syllabus found for this class" });

    const subj = syllabus.subjects.find(s => s.subject === subject);
    if (!subj) return res.status(404).json({ message: "Subject not found" });

    // Find the first topic that still has pending subtopics
    const nextTopic = subj.topics.find(t => t.subtopics.some(st => !st.covered));

    if (!nextTopic) {
      return res.json({
        message: "🎉 All syllabus covered!",
        nextTopic: null
      });
    }

    // Get the first pending subtopic in that topic
    const nextSubtopic = nextTopic.subtopics.find(st => !st.covered);

    res.json({
      topic: nextTopic.title,
      subtopic: nextSubtopic.title,
      hours: nextSubtopic.hours,
      covered: nextSubtopic.covered
    });
  } catch (err) {
    console.error("Error fetching next subtopic:", err);
    res.status(500).json({ error: "Failed to fetch next subtopic" });
  }
});



// ✅ Update covered status for a subtopic and auto-update topic status
app.put("/syllabus/update", async (req, res) => {
  try {
    const { class: cls, subject, topicTitle, subtopicTitle, covered } = req.body;

    // Update specific subtopic
    const result = await mongoose.connection.db.collection("syllabus").updateOne(
      {
        class: cls,
        "subjects.subject": subject,
        "subjects.topics.title": topicTitle,
        "subjects.topics.subtopics.title": subtopicTitle,
      },
      {
        $set: {
          "subjects.$[s].topics.$[t].subtopics.$[st].covered": covered,
        },
      },
      {
        arrayFilters: [
          { "s.subject": subject },
          { "t.title": topicTitle },
          { "st.title": subtopicTitle },
        ],
      }
    );

    if (result.modifiedCount === 0)
      return res.status(400).json({ message: "Update failed" });

    // Check if all subtopics in the topic are covered
    const syllabus = await mongoose.connection.db.collection("syllabus").findOne({ class: cls });
    const subj = syllabus.subjects.find(s => s.subject === subject);
    const topic = subj.topics.find(t => t.title === topicTitle);

    const allCovered = topic.subtopics.every(st => st.covered);
    if (allCovered && !topic.covered) {
      await mongoose.connection.db.collection("syllabus").updateOne(
        {
          class: cls,
          "subjects.subject": subject,
          "subjects.topics.title": topicTitle,
        },
        {
          $set: { "subjects.$[s].topics.$[t].covered": true },
        },
        {
          arrayFilters: [
            { "s.subject": subject },
            { "t.title": topicTitle },
          ],
        }
      );
    }

    console.log(`✅ Updated: ${subject} → ${topicTitle} → ${subtopicTitle}`);
    res.json({ success: true, message: "Subtopic updated successfully" });
  } catch (err) {
    console.error("Error updating subtopic:", err);
    res.status(500).json({ error: "Failed to update subtopic" });
  }
});



// -------------------- PROFILE ROUTES --------------------

app.get("/teacher/:email", async (req, res) => {
  const teacher = await Teacher.findOne({ email: req.params.email });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  res.json(teacher);
});


app.get("/student/:regno", async (req, res) => {
  const { regno } = req.params;

  try {
    const student = await Student.findOne({ regNo: regno });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      name: student.name,
      regNo: student.regNo,
      class: student.class,
      section: student.section,
      parentEmail: student.parentEmail,
      dob: student.dob,
      gender: student.gender,
      fatherName: student.fatherName,
      fatherContact: student.fatherContact,
      motherName: student.motherName,
      motherContact: student.motherContact,
      address: student.address,
      photo: student.photo,
      tenthMarksFile: student.tenthMarksFile
    });

  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// ✅ Upload student profile photo — stores directly in "uploads/"
app.post("/student/upload-photo/:regno", uploadStudent.single("photo"), async (req, res) => {
  try {
    const regNo = req.params.regno;
    const student = await Student.findOne({ regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Delete old photo if it exists
    if (student.photoPath && fs.existsSync(student.photoPath)) {
      fs.unlinkSync(student.photoPath);
    }

    student.photoPath = req.file.path;
    await student.save();

    res.json({ message: "✅ Profile photo updated successfully", path: req.file.path });
  } catch (err) {
    console.error("❌ Error uploading photo:", err);
    res.status(500).json({ error: "Error uploading photo" });
  }
});

// ✅ Upload 10th Marks File — also stores directly in "uploads/"
app.post("/student/upload-tenthmarks/:regNo", uploadStudent.single("tenthMarks"), async (req, res) => {
  try {
    const regNo = req.params.regNo;
    const student = await Student.findOne({ regNo });
    if (!student) return res.status(404).send("Student not found");

    // Delete old marks file if it exists
    if (student.tenthMarksPath && fs.existsSync(student.tenthMarksPath)) {
      fs.unlinkSync(student.tenthMarksPath);
    }

    student.tenthMarksPath = req.file.path;
    await student.save();

    res.json({ message: "✅ 10th marks uploaded successfully", path: req.file.path });
  } catch (err) {
    console.error("❌ Error uploading marks:", err);
    res.status(500).send("Server error");
  }
});


// ✅ Fetch student profile photo — serves from uploads/
app.get("/student/photo/:regno", async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regno });
    if (!student || !student.photoPath) {
      return res.sendFile(path.join(__dirname, "public", "default-profile.png"));
    }

    const photoPath = path.join(__dirname, student.photoPath);
    if (fs.existsSync(photoPath)) {
      res.sendFile(photoPath);
    } else {
      res.sendFile(path.join(__dirname, "public", "default-profile.png"));
    }
  } catch (err) {
    console.error("❌ Error fetching photo:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Fetch 10th Marks File — serves from uploads/
app.get("/student/tenthmarks/:regNo", async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo });
    if (!student || !student.tenthMarksPath) {
      return res.status(404).send("10th marks file not found");
    }

    const marksPath = path.join(__dirname, student.tenthMarksPath);
    if (fs.existsSync(marksPath)) {
      res.sendFile(marksPath);
    } else {
      res.status(404).send("File not found");
    }
  } catch (err) {
    console.error("❌ Error fetching 10th marks file:", err);
    res.status(500).send("Server error");
  }
});


// ✅ Upload teacher photo
app.post("/teacher/upload-photo/:email", uploadTeacher.single("photo"), async (req, res) => {
  try {
    const email = req.params.email;
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Delete old photo if exists
    if (teacher.photoPath && fs.existsSync(teacher.photoPath)) {
      fs.unlinkSync(teacher.photoPath);
    }

    teacher.photoPath = req.file.path;
    await teacher.save();

    res.json({ message: "Teacher photo updated", path: teacher.photoPath });
  } catch (err) {
    console.error("Error uploading teacher photo:", err);
    res.status(500).json({ error: "Error uploading teacher photo" });
  }
});

// ✅ Get teacher photo
app.get("/teacher/photo/:email", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ email: req.params.email });
    if (!teacher || !teacher.photoPath || !fs.existsSync(teacher.photoPath)) {
      return res.sendFile(path.join(__dirname, "public", "default-profile.png"));
    }
    res.sendFile(path.resolve(teacher.photoPath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Upload route
app.post("/upload-note", upload.single("file"), async (req, res) => {
  try {
    const { subject, title, uploadedBy } = req.body;
    const fileUrl = `/notes/${req.file.filename}`;
    

    const note = new Note({ subject, title, uploadedBy, fileUrl });
    await note.save();

    res.json({ message: "Note uploaded successfully", note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get all class-section combinations dynamically
app.get("/classes-list", async (req, res) => {
  try {
    const classes = await mongoose.connection.db.collection("classes")
      .find({}, { projection: { class: 1, section: 1, _id: 0 } })
      .toArray();

    if (!classes.length) return res.json([]);
    res.json(classes);
  } catch (err) {
    console.error("Error fetching class list:", err);
    res.status(500).json({ error: "Failed to fetch class list" });
  }
});



// -------------------- GET ALL NOTES --------------------
app.get("/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- DOWNLOAD NOTE --------------------
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "notes", req.params.filename); // ✅ notes folder, not uploads
  res.download(filePath, (err) => {
    if (err) {
      console.error("File download error:", err);
      res.status(404).send("File not found");
    }
  });
});

// -------------------- CLASS & ATTENDANCE --------------------
app.get("/classes/:class/:section", async (req, res) => {
  try {
    const { class: cls, section } = req.params;
    const classDoc = await Class.findOne({ class: cls, section });
    if (classDoc && classDoc.students.length > 0) return res.json(classDoc.students);
    const students = await Student.find({ class: cls, section }).select("name regNo -_id");
    res.json(students.map(s => ({ name: s.name, regNo: s.regNo })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});


// -------------------- CLASS & ATTENDANCE --------------------

// Get students by class/section
app.get("/classes/:class/:section", async (req, res) => {
  const cls = String(req.params.class);
  const section = String(req.params.section);

  try {
    const classDoc = await Class.findOne({ class: cls, section });
    if (classDoc && classDoc.students.length > 0) {
      return res.json(classDoc.students);
    }

    // fallback to students collection
    const students = await Student.find({ class: cls, section }).select("name regNo -_id");
    res.json(students.map(s => ({ name: s.name, regNo: s.regNo })));
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Mark Attendance
app.post("/attendance/mark", async (req, res) => {
  try {
    const { class: cls, section, subject, teacherEmail, date, students } = req.body;
    if (!cls || !section || !students?.length) return res.status(400).json({ error: "Incomplete data" });

    const attendance = new Attendance({ class: cls, section, subject, teacherEmail, date, students });
    await attendance.save();

    // Notify absentees
    for (const s of students) {
      if (!s.present) {
        const studentData = await Student.findOne({ regNo: s.regNo });
        if (studentData?.parentEmail) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: studentData.parentEmail,
            subject: `Attendance Alert for ${studentData.name}`,
            text: `Dear Parent, ${studentData.name} was absent on ${date} for class ${cls}-${section}.`,
          });
        }
      }
    }

    res.json({ message: "Attendance saved successfully" });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// -------------------- MARKS --------------------

app.post("/marks/upload", async (req, res) => {
  try {
    const { class: cls, section, subject, teacherEmail, examType, marks } = req.body;
    if (!cls || !section || !marks?.length) return res.status(400).json({ error: "Incomplete data" });

    const newMarks = new Marks({ class: cls, section, subject, teacherEmail, examType, marks });
    await newMarks.save();

    // Notify parents
    for (const m of marks) {
      const studentData = await Student.findOne({ regNo: m.regNo });
      if (studentData?.parentEmail) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: studentData.parentEmail,
          subject: `Marks Uploaded for ${studentData.name}`,
          text: `Dear Parent, ${studentData.name} scored ${m.scored}/${m.total} in ${subject} (${examType}).`,
        });
      }
    }

    res.json({ message: "Marks uploaded successfully" });
  } catch (err) {
    console.error("Error uploading marks:", err);
    res.status(500).json({ error: "Failed to upload marks" });
  }
});
// ✅ Fetch all notes
app.get("/notes", async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- TIMETABLE ROUTES --------------------

// ✅ Fetch student timetable (previous working one)
// 📘 Get timetable by student regNo
// ✅ Get Student Timetable by Register Number
app.get("/student-timetable/:regNo", async (req, res) => {
  try {
    const regNo = req.params.regNo;

    // Find student to get class & section
    const student = await Student.findOne({ regNo });
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    // Find timetable for that class & section
    const timetable = await Timetable.findOne({
      class: student.class,
      section: student.section
    });

    if (!timetable)
      return res.status(404).json({ message: "No timetable found for your class" });

    res.json(timetable.timetable);
  } catch (err) {
    console.error("❌ Error fetching timetable:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get all class-section pairs a teacher handles (based on timetable)
app.get("/teacher/classes/:teacherName", async (req, res) => {
  try {
    const { teacherName } = req.params;
    const timetables = await mongoose.connection.db.collection("timetables").find({}).toArray();
    const classSections = new Set();

    timetables.forEach(entry => {
      if (!entry.timetable) return;
      for (const [day, periods] of Object.entries(entry.timetable)) {
        periods.forEach(slot => {
          if (slot.teacher === teacherName) {
            classSections.add(`${entry.class}-${entry.section}`);
          }
        });
      }
    });

    res.json([...classSections]);
  } catch (err) {
    console.error("Error fetching teacher class-sections:", err);
    res.status(500).json({ error: "Failed to fetch class-section list" });
  }
});



// -------------------- STUDENT PERFORMANCE ROUTES --------------------

app.get("/student-marks/:regNo", async (req, res) => {
  try {
    const marks = await Marks.find({ "marks.regNo": req.params.regNo });
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch marks" });
  }
});

app.get("/student-attendance/:regNo", async (req, res) => {
  try {
    const attendance = await Attendance.find({ "students.regNo": req.params.regNo });
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});


//--------------------TEACHER-TIMETABLE------------------------
// 📅 Get teacher timetable
app.get("/teacher-timetable/:teacherName", async (req, res) => {
  try {
    const teacherName = req.params.teacherName;
    const timetables = await Timetable.find();

    let teacherSchedule = {};

    timetables.forEach(entry => {
      const { class: cls, section, timetable } = entry;

      for (const [day, periods] of Object.entries(timetable)) {
        periods.forEach(period => {
          if (period.teacher === teacherName) {
            if (!teacherSchedule[day]) teacherSchedule[day] = [];
            teacherSchedule[day].push({
              time: period.time,
              subject: period.subject,
              class: cls,
              section: section
            });
          }
        });
      }
    });

    res.json(teacherSchedule);
  } catch (err) {
    console.error("Error fetching teacher timetable:", err);
    res.status(500).json({ error: "Failed to load teacher timetable" });
  }
});




// -------------------- SERVER START --------------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
