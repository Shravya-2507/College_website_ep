require('dotenv').config({ path: 'C:\\Users\\shravya\\OneDrive\\Desktop\\Enterpruenership\\College_website_ep\\emsil.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- MongoDB Connection -------------------
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collegeDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));

// ------------------- Schemas -------------------

// ✅ Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNo: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  parentEmail: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true }
});

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  records: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
      present: { type: Boolean, required: true }
    }
  ]
});

// ✅ Teacher Schema
const teacherSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  address: String,
  dob: String,
  experience: String,
  gender: String,
  phone: String,
  qualification: String,
  subject: String
});

// ✅ Timetable Schema
const timetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, required: true },
  timetable: { type: Object, required: true }
});
//notes schema
const noteSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true } // link to PDF file
});

const Note = mongoose.model("Note", noteSchema);


// ------------------- Models -------------------
const Student = mongoose.model("Student", studentSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);
const Timetable = mongoose.model("Timetable", timetableSchema);

// ------------------- Nodemailer Setup -------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ------------------- ROUTES -------------------

// ✅ Student Login
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
// ✅ Fetch student profile by regNo
app.get("/student/:regNo", async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo }).select("-password");
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Fetch attendance for a student
app.get("/student-attendance/:regNo", async (req, res) => {
  const { regNo } = req.params;
  const student = await Student.findOne({ regNo });
  if (!student) return res.status(404).json({ error: "Student not found" });

  const records = await Attendance.find({ "records.studentId": student._id });
  const attendanceSummary = records.map(att => {
    const record = att.records.find(r => r.studentId.toString() === student._id.toString());
    return { date: att.date, present: record.present };
  });

  res.json({ student: { name: student.name, regNo: student.regNo }, attendance: attendanceSummary });
});



// ✅ Teacher Login
app.post("/teacher-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    if (teacher.password !== password)
      return res.status(401).json({ error: "Incorrect password" });

    res.json({ message: "Login successful", teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- TEACHER PROFILE ROUTE -------------------
app.get("/teacher/:email", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ email: req.params.email }).select("-password");
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    res.json(teacher);
  } catch (err) {
    console.error("Error fetching teacher profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Attendance submission + mail alert
app.post("/attendance", async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records) return res.status(400).json({ error: "Date and records are required" });

    let attendance = await Attendance.findOne({ date });
    if (attendance) {
      attendance.records = records;
      await attendance.save();
    } else {
      attendance = new Attendance({ date, records });
      await attendance.save();
    }

    const absentStudents = await Student.find({
      _id: { $in: records.filter(r => !r.present).map(r => r.studentId) }
    });

    for (let student of absentStudents) {
      transporter.sendMail({
        from: `"College Attendance" <${process.env.EMAIL_USER}>`,
        to: student.parentEmail,
        subject: `Attendance Alert for ${student.name}`,
        text: `Dear Parent,\n\n${student.name} was absent on ${date}.\n\nRegards,\nPriyadarshini PU College`
      }).catch(err => console.error("Mail error:", err.message));
    }

    res.json({ message: "Attendance submitted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
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
// Submit or update attendance
app.post("/attendance", async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records) return res.status(400).json({ error: "Date and records are required" });

    // Check if attendance already exists for the date
    let attendance = await Attendance.findOne({ date });

    if (attendance) {
      // Update existing attendance
      attendance.records = records;
      await attendance.save();
    } else {
      // Create new attendance
      attendance = new Attendance({ date, records });
      await attendance.save();
    }

    // Attendance is now saved ✅, even if emails fail

    // Find absent students
    const absentStudents = await Student.find({
      _id: { $in: records.filter(r => !r.present).map(r => r.studentId) }
    });

    // Send email to each absent student's parent (errors logged, not thrown)
    for (let student of absentStudents) {
      transporter.sendMail({
        from: `"College Attendance" <${process.env.EMAIL_USER}>`,
        to: student.parentEmail,
        subject: `Attendance Alert for ${student.name}`,
        text: `Dear Parent,\n\n${student.name} was absent on ${date}.\n\nRegards,\nPriyadarshini PU College`
      }).then(info => {
        console.log(`Email sent to ${student.parentEmail}: ${info.response}`);
      }).catch(error => {
        console.error(`Error sending email to ${student.parentEmail}:`, error.message);
      });
    }

    res.json({ message: "Attendance submitted successfully!", absentStudents });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- TEACHER ROUTES -------------------

// Get all teachers
app.get("/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new teacher
app.post("/teachers", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const teacher = new Teacher({ name, email, password });
    await teacher.save();
    res.json({ message: "Teacher added successfully", teacher });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Teacher with this email already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Teacher login
app.post("/teacher-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    if (teacher.password !== password)
      return res.status(401).json({ error: "Incorrect password" });

    res.json({ message: "Login successful", teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ------------------- Server Start -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

