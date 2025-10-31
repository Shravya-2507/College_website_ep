const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
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

// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify()
  .then(() => console.log("📧 Mail transporter ready"))
  .catch(err => console.error("⚠️ Mail transporter error:", err));

// ✅ Schemas
const studentSchema = new mongoose.Schema({
  regNo: String,
  name: String,
  class: String,
  section: String,
  email: String,
  parentEmail: String,
  password: String,
});

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
  subject: { type: String, required: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true } // link to PDF file
});

// ✅ Models with explicit collection names
const Student = mongoose.model("Student", studentSchema, "students");
const Teacher = mongoose.model("Teacher", teacherSchema, "teachers");
const Class = mongoose.model("Class", classSchema, "classes");
const Attendance = mongoose.model("Attendance", attendanceSchema, "attendances");
const Marks = mongoose.model("Marks", marksSchema, "marks");
const Timetable = mongoose.model("Timetable", timetableSchema, "timetables");
const Note = mongoose.model("Note", noteSchema);

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

// -------------------- PROFILE ROUTES --------------------

app.get("/teacher/:email", async (req, res) => {
  const teacher = await Teacher.findOne({ email: req.params.email });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  res.json(teacher);
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
app.get("/student-timetable/:regNo", async (req, res) => {
  try {
    const { regNo } = req.params;
    const student = await Student.findOne({ regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const timetableDoc = await Timetable.findOne({
      class: student.class,
      section: student.section
    });
    if (!timetableDoc)
      return res.status(404).json({ message: "No timetable found" });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    const periods = timetableDoc.timetable[today] || [];

    res.json({
      day: today,
      class: student.class,
      section: student.section,
      periods,
      fullTimetable: timetableDoc.timetable
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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

// -------------------- SERVER START --------------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
