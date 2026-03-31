import mongoose from "mongoose";

import { FacultyModel } from "../../db/models/faculty";
import type { Course } from "../../types/course";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/qicas";

async function main() {
  await mongoose.connect(MONGO_URI);

  await FacultyModel.deleteMany({});

  const aliceHash = await Bun.password.hash("password123");
  const bobHash = await Bun.password.hash("password456");

  const courses: Course[] = [
    {
      id: "c-1",
      name: "Intro to Computing",
      code: "CISC101",
      level: "undergrad1",
      year_introduced: "2000",
      notes: [],
      sections: [
        { id: "s-1", number: 1, capacity: 0 },
        { id: "s-2", number: 2, capacity: 0 },
        { id: "s-3", number: 3, capacity: 0 },
      ],
      capacity: 0,
    },
    {
      id: "c-2",
      name: "Intro to Computer Science",
      code: "CISC121",
      level: "undergrad1",
      year_introduced: "2001",
      notes: [],
      sections: [{ id: "s-4", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-3",
      name: "Intro to CS II",
      code: "CISC124",
      level: "undergrad1",
      year_introduced: "2001",
      notes: [],
      sections: [{ id: "s-5", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-4",
      name: "Data Structures",
      code: "CISC203",
      level: "undergrad2",
      year_introduced: "2003",
      notes: [],
      sections: [{ id: "s-6", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-5",
      name: "Logic for Computing",
      code: "CISC204",
      level: "undergrad2",
      year_introduced: "2003",
      notes: [],
      sections: [{ id: "s-7", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-6",
      name: "Computer Architecture",
      code: "CISC235",
      level: "undergrad2",
      year_introduced: "2005",
      notes: [],
      sections: [{ id: "s-10", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-7",
      name: "Software Design",
      code: "CISC320",
      level: "undergrad3",
      year_introduced: "2008",
      notes: [],
      sections: [{ id: "s-11", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-8",
      name: "Senior Thesis",
      code: "CISC490",
      level: "undergrad4",
      year_introduced: "2010",
      notes: [],
      sections: [{ id: "s-8", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-9",
      name: "Advanced Topics in AI",
      code: "CISC890",
      level: "graduate",
      year_introduced: "2015",
      notes: [],
      sections: [{ id: "s-9", number: 1, capacity: 0 }],
      capacity: 0,
    },
    {
      id: "c-10",
      name: "Calculus I",
      code: "MATH110",
      level: "undergrad1",
      year_introduced: "1990",
      notes: [],
      sections: [{ id: "s-12", number: 1, capacity: 0 }],
      capacity: 0,
    },
  ];

  const courseRef = (code: string): Course => {
    const course = courses.find((entry) => entry.code === code);
    if (!course) throw new Error(`Missing course reference for ${code}`);
    return {
      ...course,
      sections: [],
      capacity: 0,
    };
  };

  const faculty = {
    id: "F001",
    name: "Shambles Faculty",
    users: [
      {
        id: "U001",
        faculty_id: "F001",
        name: "Alice Johnson",
        email: "alice.johnson@university.edu",
        password: aliceHash,
        role: "admin",
      },
      {
        id: "U002",
        faculty_id: "F001",
        name: "Bob Smith",
        email: "bob.smith@university.edu",
        password: bobHash,
        role: "support",
      },
    ],
    current_working_schedule_id: "SCH001",
    credits_per_course: 3,
    academic_years: [
      {
        id: "Y2026",
        name: "2026-2027",
        start_year: 2026,
        schedules: [
          {
            id: "SCH001",
            name: "Demo Schedule",
            year_id: "Y2026",
            date_created: new Date("2026-03-29T10:00:00.000Z"),
            is_rc: false,
            version: 1,
            assignments: [],
          },
        ],
        courses,
        instructors: [
          {
            id: "inst-1",
            name: "Dr. Margaret Smith",
            workload: 9,
            email: "margaret.smith@queensu.ca",
            rank: "FullProfessor",
            prev_taught: [courseRef("CISC101"), courseRef("CISC204"), courseRef("CISC490")],
            notes: [],
          },
          {
            id: "inst-2",
            name: "Dr. Ravi Patel",
            workload: 6,
            email: "ravi.patel@queensu.ca",
            rank: "AssociateProfessor",
            prev_taught: [courseRef("CISC203"), courseRef("CISC235")],
            notes: [],
          },
          {
            id: "inst-3",
            name: "Dr. Elena Green",
            workload: 6,
            email: "elena.green@queensu.ca",
            rank: "AssistantProfessor",
            prev_taught: [courseRef("CISC121"), courseRef("CISC124")],
            notes: [],
          },
          {
            id: "inst-4",
            name: "Avery Taylor",
            workload: 6,
            email: "avery.taylor@queensu.ca",
            rank: "TeachingFellow",
            prev_taught: [],
            notes: [],
          },
          {
            id: "inst-5",
            name: "Blake Adams",
            workload: 6,
            email: "blake.adams@queensu.ca",
            rank: "TermAdjunctSRoR",
            prev_taught: [courseRef("CISC101")],
            notes: [],
          },
          {
            id: "inst-6",
            name: "Casey Brown",
            workload: 6,
            email: "casey.brown@queensu.ca",
            rank: "TermAdjunctBasic",
            prev_taught: [courseRef("CISC121")],
            notes: [],
          },
        ],
        instructor_rules: [
          { id: "ir-1", instructor_id: "inst-1", designations: ["undergrad-coordinator"], workload_delta: -3, courses: [], declined_courses: [], dropped: false },
          { id: "ir-2", instructor_id: "inst-2", designations: ["curriculum-committee"], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
          { id: "ir-3", instructor_id: "inst-3", designations: ["new-faculty-mentor"], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
          { id: "ir-4", instructor_id: "inst-4", designations: [], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
          { id: "ir-5", instructor_id: "inst-5", designations: [], workload_delta: 0, courses: ["CISC101", "CISC490"], declined_courses: [], dropped: false },
          { id: "ir-6", instructor_id: "inst-6", designations: [], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
        ],
        course_rules: [
          { id: "cr-1", course_code: "CISC101", terms_offered: ["Fall", "Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-1", "s-2", "s-3"], is_external: false, dropped: false },
          { id: "cr-2", course_code: "CISC121", terms_offered: ["Fall", "Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-4"], is_external: false, dropped: false },
          { id: "cr-3", course_code: "CISC124", terms_offered: ["Fall", "Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-5"], is_external: false, dropped: false },
          { id: "cr-4", course_code: "CISC203", terms_offered: ["Fall", "Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-6"], is_external: false, dropped: false },
          { id: "cr-5", course_code: "CISC204", terms_offered: ["Fall"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-7"], is_external: false, dropped: false },
          { id: "cr-6", course_code: "CISC235", terms_offered: ["Fall"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-10"], is_external: false, dropped: false },
          { id: "cr-7", course_code: "CISC320", terms_offered: ["Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-11"], is_external: false, dropped: false },
          { id: "cr-8", course_code: "CISC490", terms_offered: ["Fall", "Winter"], workload_fulfillment: 6, is_full_year: true, sections_available: ["s-8"], is_external: false, dropped: false },
          { id: "cr-9", course_code: "CISC890", terms_offered: ["Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-9"], is_external: false, dropped: false },
          { id: "cr-10", course_code: "MATH110", terms_offered: ["Fall", "Winter"], workload_fulfillment: 3, is_full_year: false, sections_available: ["s-12"], is_external: true, dropped: false },
        ],
      },
    ],
  };

  const result = await FacultyModel.create(faculty);

  console.log(result);
  console.log("Seed complete.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
