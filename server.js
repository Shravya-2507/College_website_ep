const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: "./emsil.env" });
const crypto = require("crypto");
const OTPs = {}; // temporary in-memory store (you can use DB instead)

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




//MongoDB connection
mongoose.connect(process.env.MONGO_URI , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => console.log("MongoDB Connected"));
mongoose.connection.on("error", (err) => console.log("MongoDB Error:", err));

// Ensure "notes" and "uploads" folders exist
const folders = ["uploads", "notes"];
folders.forEach((dir) => {
  const folderPath = path.join(__dirname, dir);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`Created ${dir} folder`);
  }
});

// Multer setup for uploading notes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "notes/"),  
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// Multer setup for in-memory uploads (for MongoDB storage)
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Multer setup for student uploads (store in uploads/)
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
  .then(() => console.log("Mail transporter ready"))
  .catch((err) => console.error("Mail transporter error:", err));


  const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
});




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
  busFacility: { type: String, default: "No" },     // ✅ Yes / No
  hostelFacility: { type: String, default: "No" }   // ✅ Yes / No
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
  isClassTeacher: Boolean,
  classAssigned: String,  // e.g. "11"
  sectionAssigned: String
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
  regNo: String,
  class: String,
  section: String,
  examType: String,
  marks: [
    {
      subject: String,
      scored: Number,
      total: Number
    }
  ],
  date: String
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


const busRouteSchema = new mongoose.Schema({
  routeNo: String,
  areas: [String],
  driverName: String,
  driverContact: String,
  timing: String
});


const busFacilitySchema = new mongoose.Schema({
  regNo: String,
  routeNo: String,
  pickupPoint: String,
  driverName: String,
  driverContact: String,
  timing: String
});

const hostelFacilitySchema = new mongoose.Schema({
  regNo: String,
  roomNo: String,
  block: String,
  wardenName: String,
  wardenContact: String
});




// ✅ Models with explicit collection names
const Admin = mongoose.model("Admin", adminSchema, "admin");
const Student = mongoose.model("Student", studentSchema, "students");
const Teacher = mongoose.model("Teacher", teacherSchema, "teachers");
const Class = mongoose.model("Class", classSchema, "classes");
const Attendance = mongoose.model("Attendance", attendanceSchema, "attendances");
const Marks = mongoose.model("Marks", marksSchema, "marks");
const Timetable = mongoose.model("Timetable", timetableSchema, "timetables");
const Note = mongoose.model("Note", noteSchema);
const Syllabus = mongoose.model("Syllabus", syllabusSchema, "syllabus");
// ✅ Register Models
const BusRoute = mongoose.model("BusRoute", busRouteSchema, "busRoutes");
const BusFacility = mongoose.model("BusFacility", busFacilitySchema, "busfacilities");
const HostelFacility = mongoose.model("HostelFacility", hostelFacilitySchema, "hostelFacilities");


// ✅ Generate OTP
app.post("/generate-otp", async (req, res) => {
  try {
    const { role, identifier } = req.body;
    if (!role || !identifier) {
      return res.status(400).json({ error: "Missing role or identifier" });
    }

    let emailToSend;

    if (role === "student") {
      // Find student by registration number
      const student = await Student.findOne({ regNo: identifier });
      if (!student) return res.status(404).json({ error: "Student not found" });

      emailToSend = student.parentEmail || student.email;
    } 
    
    else if (role === "teacher") {
      // Find teacher by email
      const teacher = await Teacher.findOne({ email: identifier });
      if (!teacher) return res.status(404).json({ error: "Teacher not found" });

      emailToSend = teacher.email;
    }

    else if (role === "admin") {  // ⭐ NEW BLOCK
      // Find admin by email
      const admin = await Admin.findOne({ email: identifier });
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      emailToSend = admin.email;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    OTPs[identifier] = { otp, expiresAt };

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailToSend,
      subject: "Priyadarshini PU College - Password Reset OTP",
      text: `Your OTP for password reset is ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${emailToSend}`);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(" OTP send error:", err);
    res.status(500).json({ error: "Failed to send OTP. Please try again later." });
  }
});


// ✅ Verify OTP and Reset Password
app.post("/verify-otp-reset", async (req, res) => {
  try {
    const { role, identifier, otp, newPassword } = req.body;
    if (!role || !identifier || !otp || !newPassword)
      return res.status(400).json({ error: "Missing data" });

    const record = OTPs[identifier];
    if (!record || record.otp !== otp || Date.now() > record.expiresAt)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    // Reset password
    let model;

    if (role === "student") model = Student;
    else if (role === "teacher") model = Teacher;
    else if (role === "admin") model = Admin;   // ⭐ NEW

    const user = await model.findOne(
      role === "student"
        ? { regNo: identifier }
        : { email: identifier }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = newPassword;
    await user.save();

    delete OTPs[identifier];

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// ✅ Routes

// -------------------- LOGIN ROUTES --------------------

// -------------------- ADMIN LOGIN --------------------
app.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Compare password (plain text since you didn't use hashing)
    if (admin.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.json({
      message: "Admin login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});


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


app.post("/admin/add-student", async (req, res) => {
  try {
    const {
      name, regNo, class: cls, section, parentEmail, password,
      dob, gender, fatherName, motherName, fatherContact, motherContact,
      address, busFacility, hostelFacility
    } = req.body;

    const student = new Student({
      name, regNo, class: cls, section, parentEmail, password,
      dob, gender, fatherName, motherName, fatherContact, motherContact,
      address, busFacility, hostelFacility
    });

    await student.save();
    res.json({ message: "Student added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------- UPDATE STUDENT ----------------------
app.put("/admin/update-student/:regNo", async (req, res) => {
  try {
    const updatedStudent = await Student.findOneAndUpdate(
      { regNo: req.params.regNo },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Student updated successfully!" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET all students (optional filter by class & section)
app.get("/admin/get-students", async (req, res) => {
  try {
    const section = req.query.section;   // e.g., ?section=A
    const studentClass = req.query.class; // e.g., ?class=11
    let filter = {};

    if (section) filter.section = section;
    if (studentClass) filter.class = studentClass; // add class filter

    const students = await Student.find(filter);
    res.json(students);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.delete("/admin/delete-student/:regNo", async (req, res) => {
  try {
    const regNo = req.params.regNo;

    const deleted = await Student.findOneAndDelete({ regNo });

    if (!deleted) return res.status(404).json({ error: "Student not found" });

    res.json({ message: "Student deleted successfully" });

  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------- ADD NEW TEACHER ----------------------
app.post("/admin/add-teacher", async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Convert isClassTeacher to boolean
    if (data.isClassTeacher !== undefined) {
      data.isClassTeacher = data.isClassTeacher === "true";
    }

    const teacher = new Teacher(data);
    await teacher.save();
    res.json({ message: "Teacher added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add teacher." });
  }
});

// ---------------------- GET ALL TEACHERS ----------------------
app.get("/admin/get-teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch teachers." });
  }
});

// ---------------------- UPDATE TEACHER ----------------------
app.put("/admin/update-teacher/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updatedData = { ...req.body };

    // Convert isClassTeacher to boolean
    if (updatedData.isClassTeacher !== undefined) {
      updatedData.isClassTeacher = updatedData.isClassTeacher === "true";
    }

    await Teacher.findOneAndUpdate({ email }, updatedData);
    res.json({ message: "Teacher updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update teacher." });
  }
});

// ---------------------- DELETE TEACHER ----------------------
app.delete("/admin/delete-teacher/:email", async (req, res) => {
  try {
    const { email } = req.params;
    await Teacher.findOneAndDelete({ email });
    res.json({ message: "Teacher deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete teacher." });
  }
});

app.get("/admin/get-timetable/:class/:section", async (req, res) => {
  try {
    const { class: cls, section } = req.params;
    const tt = await Timetable.findOne({ class: cls, section });
    res.json(tt || { class: cls, section, timetable: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch timetable." });
  }
});

app.post("/admin/add-period/:class/:section/:day", async (req, res) => {
  try {
    const { class: cls, section, day } = req.params;
    const { time, subject, teacher } = req.body;

    const tt = await Timetable.findOneAndUpdate(
      { class: cls, section },
      { $push: { [`timetable.${day}`]: { time, subject, teacher } } },
      { new: true, upsert: true }
    );

    res.json({ message: "Period added!", timetable: tt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add period." });
  }
});

app.put("/admin/edit-period/:class/:section/:day/:index", async (req, res) => {
  try {
    const { class: cls, section, day, index } = req.params;
    const { time, subject, teacher } = req.body;

    const tt = await Timetable.findOne({ class: cls, section });
    if (!tt) return res.status(404).json({ message: "Timetable not found" });

    tt.timetable[day][index] = { time, subject, teacher };
    await tt.save();

    res.json({ message: "Period updated!", timetable: tt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to edit period." });
  }
});

app.delete("/admin/delete-period/:class/:section/:day/:index", async (req, res) => {
  try {
    const { class: cls, section, day, index } = req.params;

    const tt = await Timetable.findOne({ class: cls, section });
    if (!tt) return res.status(404).json({ message: "Timetable not found" });

    tt.timetable[day].splice(index, 1);
    await tt.save();

    res.json({ message: "Period deleted!", timetable: tt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete period." });
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
      photoPath: student.photoPath,
      tenthMarksPath: student.tenthMarksPath
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

    res.json({ message: "Profile photo updated successfully", path: req.file.path });
  } catch (err) {
    console.error("Error uploading photo:", err);
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

    res.json({ message: "10th marks uploaded successfully", path: req.file.path });
  } catch (err) {
    console.error("Error uploading marks:", err);
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
    console.error("Error fetching photo:", err);
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
    console.error("Error fetching 10th marks file:", err);
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
    const cls = req.params.class;
    const section = req.params.section;

    const students = await Student.find(
      { class: cls, section: section },
      "name regNo"
    );

    res.json(students);
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




app.post("/marks/upload-all", async (req, res) => {
  try {
    const { regNo, name, class: cls, section, examType, marks, teacherEmail } = req.body;

    // 🔹 Step 1: Validate input
    if (!regNo || !cls || !section || !examType || !marks?.length)
      return res.status(400).json({ error: "Incomplete data" });

    // 🔹 Step 2: Verify teacher authorization
    const teacher = await Teacher.findOne({ email: teacherEmail });
    if (!teacher)
      return res.status(403).json({ error: "Teacher not found" });

    if (!teacher.isClassTeacher || teacher.classAssigned !== cls || teacher.sectionAssigned !== section)
      return res.status(403).json({ error: "Unauthorized: Only class teacher can upload marks for this class." });

    // 🔹 Step 3: Save or update marks
    await Marks.findOneAndUpdate(
      { regNo, examType },
      {
        regNo,
        name,
        class: cls,
        section,
        examType,
        marks,
        date: new Date().toISOString().split("T")[0],
      },
      { upsert: true }
    );

    // 🔹 Step 4: Send marks email to parent
    const student = await Student.findOne({ regNo });
    if (!student || !student.parentEmail)
      return res.status(404).json({ error: "Parent email not found" });

    const marksList = marks.map(m => `${m.subject}: ${m.scored}/${m.total}`).join("\n");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: student.parentEmail,
      subject: `Report Card - ${name} (${examType})`,
      text: `Dear Parent,\n\nHere are ${name}'s marks for ${examType}:\n\n${marksList}\n\nRegards,\nPriyadarshini PU College`
    });

    res.json({ message: "Marks uploaded and emailed successfully!" });

  } catch (err) {
    console.error("Error uploading marks:", err);
    res.status(500).json({ error: "Failed to upload marks or send email" });
  }
});



// -------------------- TIMETABLE ROUTES --------------------

// ✅ Fetch student timetable (previous working one)
// 📘 Get timetable by student regNo
app.get("/student-timetable/:regNo", async (req, res) => {
  try {
    const regNo = req.params.regNo;

    // Step 1: Find the student first
    const student = await Student.findOne({ regNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Step 2: Find timetable based on class and section
    const timetable = await Timetable.findOne({
      class: student.class,
      section: student.section
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.json(timetable.timetable); // ✅ Send only timetable object
  } catch (err) {
    console.error("Error fetching timetable:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// -------------------- STUDENT PERFORMANCE ROUTES --------------------

app.get("/student-marks/:regNo", async (req, res) => {
  try {
    const marks = await Marks.find({ regNo: req.params.regNo });

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

// -------------------- SYLLABUS ROUTES --------------------

//  Get all subjects for a given class
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


// Get full syllabus (topics + subtopics) for a specific subject in a class
app.get("/syllabus/:class/:subject", async (req, res) => {
  try {
    const { class: cls, subject } = req.params;

    // Fetch the syllabus document for that class
    const syllabus = await mongoose.connection.db
      .collection("syllabus")
      .findOne({ class: cls });

    if (!syllabus) {
      console.log(`No syllabus found for class ${cls}`);
      return res.status(404).json({ error: `No syllabus found for class ${cls}` });
    }

    // Find the matching subject entry
    const subj = syllabus.subjects?.find(s => s.subject === subject);
    if (!subj) {
      console.log(`Subject '${subject}' not found in class ${cls}`);
      return res.status(404).json({ error: `Subject '${subject}' not found in class ${cls}` });
    }

    //  Return entire subject data (topics + subtopics)
    res.json(subj);
  } catch (err) {
    console.error("Error fetching syllabus:", err);
    res.status(500).json({ error: "Failed to fetch syllabus" });
  }
});
// Get the next subtopic to teach for a given class and subject
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
        message: "All syllabus covered!",
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



//  Update covered status for a subtopic and auto-update topic status
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

    // Use matchedCount instead of modifiedCount
    if (result.matchedCount === 0) {
      return res.status(400).json({ message: "Update failed: No matching document found" });
    }

    // Check if all subtopics are covered
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

    console.log(`Updated: ${subject} → ${topicTitle} → ${subtopicTitle}`);
    res.json({ success: true, message: "Subtopic updated successfully" });
  } catch (err) {
    console.error("Error updating subtopic:", err);
    res.status(500).json({ error: "Failed to update subtopic" });
  }
});

// -------------------- BUS ROUTES --------------------

//  Add or update a bus route manually
app.post("/bus-route", async (req, res) => {
  try {
    const { routeNo, areas, driverName, driverContact, timing } = req.body;
    const route = await BusRoute.findOneAndUpdate(
      { routeNo },
      { routeNo, areas, driverName, driverContact, timing },
      { upsert: true, new: true }
    );
    res.json({ message: "Bus route added/updated successfully", route });
  } catch (err) {
    console.error("Error adding bus route:", err);
    res.status(500).json({ error: "Failed to add bus route" });
  }
});

//  Get all bus routes
app.get("/bus-routes", async (req, res) => {
  try {
    const routes = await BusRoute.find();
    res.json(routes);
  } catch (err) {
    console.error("Error fetching bus routes:", err);
    res.status(500).json({ error: "Failed to fetch bus routes" });
  }
});


async function assignBusRouteToStudent(student) {
  const routes = await BusRoute.find();
  if (!routes.length) return null;

  const cleanAddress = student.address.toLowerCase().replace(/[^a-z0-9]/g, '');

  let matchedRoute = null;
  for (const r of routes) {
    for (const area of r.areas) {
      const cleanArea = area.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanAddress.includes(cleanArea)) {
        matchedRoute = r;
        break;
      }
    }
    if (matchedRoute) break;
  }

  if (!matchedRoute) return null;

  const pickupPoint = matchedRoute.areas.find(a =>
    cleanAddress.includes(a.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const busData = {
    regNo: student.regNo,
    routeNo: matchedRoute.routeNo,
    pickupPoint,
    driverName: matchedRoute.driverName,
    driverContact: matchedRoute.driverContact,
    timing: matchedRoute.timing
  };

  await BusFacility.findOneAndUpdate({ regNo: student.regNo }, busData, { upsert: true });
  return busData;
}



//  Auto-assign bus route only if busFacility is Yes
app.post("/bus-autoassign/:regNo", async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.busFacility?.toLowerCase() !== "yes") {
      return res.status(200).json({ message: "Bus facility not opted" });
    }

    const result = await assignBusRouteToStudent(student);
    if (!result) return res.status(404).json({ message: "No matching route found for address" });

    res.json({ message: "Bus route auto-assigned", bus: result });
  } catch (err) {
    console.error("Error auto-assigning bus route:", err);
    res.status(500).json({ error: "Failed to auto-assign route" });
  }
});

// ================= BUS FACILITY =================
// ================= BUS FACILITY =================
app.get("/bus-facility/:regNo", async (req, res) => {
  try {
    const regNo = req.params.regNo;

    // Check if already has assigned facility
    let busFacility = await BusFacility.findOne({ regNo });
    if (busFacility) return res.json(busFacility);

    // Get student
    const student = await Student.findOne({ regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // STOP if student did NOT opt for bus
    if (!student.busFacility || student.busFacility.toLowerCase() !== "yes") {
      console.log(`${student.name} has not opted for bus facility.`);
      return res.json({ message: "Bus facility not opted", data: null });
    }

    //  Only auto-assign if opted
    const result = await assignBusRouteToStudent(student);
    if (!result)
      return res.json({ message: "No matching bus route for this address", data: null });

    res.json(result);
  } catch (err) {
    console.error("Error fetching bus facility:", err);
    res.status(500).json({ message: "Server error fetching bus facility" });
  }
});




//  Hostel Facility API
app.get("/hostel-facility/:regNo", async (req, res) => {
  try {
    const { regNo } = req.params;
    const student = await Student.findOne({ regNo });

    if (!student) {
      return res.status(404).json({ message: "Student not found", data: null });
    }

    // If student hasn’t opted
    if (student.hostelFacility !== "Yes") {
      return res.json({ message: "Hostel facility not opted", data: null });
    }

    // Find hostel details
    const hostel = await HostelFacility.findOne({ regNo });

    if (!hostel) {
      return res.status(404).json({ message: "No hostel record found", data: null });
    }

    // Return details in consistent format
    res.json({
      message: "Hostel facility found",
      data: {
        roomNo: hostel.roomNo,
        block: hostel.block,
        wardenName: hostel.wardenName,
        wardenContact: hostel.wardenContact,
      },
    });
  } catch (error) {
    console.error("Error fetching hostel:", error);
    res.status(500).json({ message: "Server error", data: null });
  }
});





// -------------------- SERVER START --------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

