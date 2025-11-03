const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/collegeDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ---------------- SYLLABUS SCHEMA ----------------
const syllabusSchema = new mongoose.Schema({
  class: String,
  subjects: [
    {
      subject: String,
      topics: [
        {
          title: String,
          plannedHours: Number,
          covered: Boolean,
          subtopics: [{ title: String, hours: Number, covered: Boolean }],
        },
      ],
    },
  ],
});

const Syllabus = mongoose.model("Syllabus", syllabusSchema, "syllabus");

// ---------------- SYLLABUS PROGRESS SCHEMA ----------------
const syllabusProgressSchema = new mongoose.Schema({
  class: String,
  section: String,
  subject: String,
  progress: [
    {
      topic: String,
      subtopic: String,
      covered: { type: Boolean, default: false },
      dateCovered: Date,
    },
  ],
});

const SyllabusProgress = mongoose.model(
  "SyllabusProgress",
  syllabusProgressSchema,
  "syllabusProgress"
);

// ---------------- INSERT DATA ----------------
async function insertData() {
  await Syllabus.deleteMany();
  await SyllabusProgress.deleteMany();

  const syllabusData = [
    // ---------- CLASS 11 ----------
    {
      class: "11",
      subjects: [
        {
          subject: "Mathematics",
          topics: [
            {
              title: "Sets",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Introduction to sets and types", hours: 1, covered: false },
                { title: "Venn diagrams and set operations", hours: 2, covered: false },
                { title: "Complement of a set", hours: 1, covered: false },
                { title: "Algebra of sets and identities", hours: 2, covered: false },
                { title: "Practical problems on sets", hours: 2, covered: false },
              ],
            },
            {
              title: "Relations and Functions",
              plannedHours: 10,
              covered: false,
              subtopics: [
                { title: "Ordered pairs, Cartesian product", hours: 2, covered: false },
                { title: "Relations and domain/range", hours: 2, covered: false },
                { title: "Functions and their graphs", hours: 3, covered: false },
                { title: "Real-valued functions", hours: 2, covered: false },
                { title: "Inverse of functions", hours: 1, covered: false },
              ],
            },
            {
              title: "Trigonometric Functions",
              plannedHours: 9,
              covered: false,
              subtopics: [
                { title: "Angles and their measurement", hours: 2, covered: false },
                { title: "Trigonometric ratios", hours: 3, covered: false },
                { title: "Trigonometric equations", hours: 2, covered: false },
                { title: "Graphs of trigonometric functions", hours: 2, covered: false },
              ],
            },
          ],
        },
        {
          subject: "Physics",
          topics: [
            {
              title: "Physical World",
              plannedHours: 4,
              covered: false,
              subtopics: [
                { title: "Scope and excitement of physics", hours: 1, covered: false },
                { title: "Physics and technology", hours: 1, covered: false },
                { title: "Physics and society", hours: 1, covered: false },
                { title: "Nature of physical laws", hours: 1, covered: false },
              ],
            },
            {
              title: "Units and Measurements",
              plannedHours: 6,
              covered: false,
              subtopics: [
                { title: "Fundamental and derived units", hours: 2, covered: false },
                { title: "System of units", hours: 1, covered: false },
                { title: "Significant figures", hours: 1, covered: false },
                { title: "Dimensional analysis", hours: 2, covered: false },
              ],
            },
            {
              title: "Motion in a Straight Line",
              plannedHours: 7,
              covered: false,
              subtopics: [
                { title: "Position, displacement, and distance", hours: 2, covered: false },
                { title: "Velocity and acceleration", hours: 2, covered: false },
                { title: "Graphical analysis of motion", hours: 3, covered: false },
              ],
            },
          ],
        },
        {
          subject: "Chemistry",
          topics: [
            {
              title: "Some Basic Concepts of Chemistry",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Mole concept", hours: 2, covered: false },
                { title: "Laws of chemical combination", hours: 2, covered: false },
                { title: "Empirical and molecular formula", hours: 2, covered: false },
                { title: "Stoichiometric calculations", hours: 2, covered: false },
              ],
            },
            {
              title: "Structure of Atom",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Bohr’s model", hours: 3, covered: false },
                { title: "Quantum numbers", hours: 2, covered: false },
                { title: "Electron configuration", hours: 3, covered: false },
              ],
            },
          ],
        },
        {
          subject: "Biology",
          topics: [
            {
              title: "The Living World",
              plannedHours: 6,
              covered: false,
              subtopics: [
                { title: "What is living?", hours: 1, covered: false },
                { title: "Taxonomy and systematics", hours: 2, covered: false },
                { title: "Nomenclature", hours: 1, covered: false },
                { title: "Binomial classification", hours: 2, covered: false },
              ],
            },
            {
              title: "Plant Kingdom",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Algae and Bryophytes", hours: 3, covered: false },
                { title: "Pteridophytes and Gymnosperms", hours: 3, covered: false },
                { title: "Angiosperms and life cycle", hours: 2, covered: false },
              ],
            },
          ],
        },
        {
          subject: "English",
          topics: [
            {
              title: "Reading Comprehension",
              plannedHours: 5,
              covered: false,
              subtopics: [
                { title: "Unseen passages", hours: 3, covered: false },
                { title: "Poetry comprehension", hours: 2, covered: false },
              ],
            },
            {
              title: "Grammar and Writing Skills",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Tenses and prepositions", hours: 3, covered: false },
                { title: "Report writing", hours: 3, covered: false },
                { title: "Letter writing", hours: 2, covered: false },
              ],
            },
          ],
        },
      ],
    },

    // ---------- CLASS 12 ----------
    {
      class: "12",
      subjects: [
        {
          subject: "Mathematics",
          topics: [
            {
              title: "Matrices",
              plannedHours: 10,
              covered: false,
              subtopics: [
                { title: "Concept and types of matrices", hours: 3, covered: false },
                { title: "Operations on matrices", hours: 3, covered: false },
                { title: "Determinants and inverse", hours: 2, covered: false },
                { title: "Applications in solving equations", hours: 2, covered: false },
              ],
            },
            {
              title: "Calculus – Differentiation",
              plannedHours: 10,
              covered: false,
              subtopics: [
                { title: "Limits and continuity", hours: 3, covered: false },
                { title: "Derivatives", hours: 3, covered: false },
                { title: "Applications of derivatives", hours: 4, covered: false },
              ],
            },
          ],
        },
        {
          subject: "Physics",
          topics: [
            {
              title: "Electrostatics",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Coulomb’s law", hours: 2, covered: false },
                { title: "Electric field lines", hours: 2, covered: false },
                { title: "Gauss’s theorem", hours: 2, covered: false },
                { title: "Applications of Gauss’s theorem", hours: 2, covered: false },
              ],
            },
            {
              title: "Current Electricity",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Ohm’s law and resistance", hours: 2, covered: false },
                { title: "Combination of resistors", hours: 2, covered: false },
                { title: "Kirchhoff’s laws", hours: 2, covered: false },
                { title: "Wheatstone bridge and potentiometer", hours: 2, covered: false },
              ],
            },
          ],
        },
        {
          subject: "Chemistry",
          topics: [
            {
              title: "Solid State",
              plannedHours: 6,
              covered: false,
              subtopics: [
                { title: "Types of solids", hours: 2, covered: false },
                { title: "Crystal lattices and unit cells", hours: 2, covered: false },
                { title: "Packing efficiency", hours: 1, covered: false },
                { title: "Defects in solids", hours: 1, covered: false },
              ],
            },
            {
              title: "Electrochemistry",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Redox reactions", hours: 2, covered: false },
                { title: "Electrochemical cells", hours: 3, covered: false },
                { title: "Nernst equation", hours: 2, covered: false },
                { title: "Batteries and fuel cells", hours: 1, covered: false },
              ],
            },
          ],
        },
        {
          subject: "Biology",
          topics: [
            {
              title: "Reproduction in Organisms",
              plannedHours: 6,
              covered: false,
              subtopics: [
                { title: "Asexual reproduction", hours: 2, covered: false },
                { title: "Sexual reproduction", hours: 2, covered: false },
                { title: "Life span and events", hours: 2, covered: false },
              ],
            },
            {
              title: "Genetics and Evolution",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "Mendel’s laws", hours: 3, covered: false },
                { title: "Chromosomal theory", hours: 2, covered: false },
                { title: "Evolutionary concepts", hours: 3, covered: false },
              ],
            },
          ],
        },
        {
          subject: "English",
          topics: [
            {
              title: "Flamingo – Prose",
              plannedHours: 8,
              covered: false,
              subtopics: [
                { title: "The Last Lesson", hours: 2, covered: false },
                { title: "Lost Spring", hours: 3, covered: false },
                { title: "Deep Water", hours: 3, covered: false },
              ],
            },
            {
              title: "Poetry",
              plannedHours: 6,
              covered: false,
              subtopics: [
                { title: "My Mother at Sixty-Six", hours: 2, covered: false },
                { title: "An Elementary School Classroom in a Slum", hours: 2, covered: false },
                { title: "Keeping Quiet", hours: 2, covered: false },
              ],
            },
          ],
        },
      ],
    },
  ];

  // Insert master syllabus
  await Syllabus.insertMany(syllabusData);
  console.log("✅ Syllabus inserted into 'syllabus' collection.");

  // Generate per-section progress
  const progressData = [];
  syllabusData.forEach(cls => {
    cls.subjects.forEach(sub => {
      ["A", "B"].forEach(section => {
        const entry = {
          class: cls.class,
          section,
          subject: sub.subject,
          progress: [],
        };
        sub.topics.forEach(topic => {
          topic.subtopics.forEach(st => {
            entry.progress.push({
              topic: topic.title,
              subtopic: st.title,
              covered: false,
            });
          });
        });
        progressData.push(entry);
      });
    });
  });

  await SyllabusProgress.insertMany(progressData);
  console.log("✅ Syllabus progress inserted into 'syllabusProgress' collection!");
  mongoose.connection.close();
}

insertData().catch(err => console.error(err));
