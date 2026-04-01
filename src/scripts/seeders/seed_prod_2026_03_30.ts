import mongoose from "mongoose";

import { FacultyModel } from "../../db/models/faculty";
import type { Course } from "../../types/course";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/qicas";

async function main() {
  await mongoose.connect(MONGO_URI);

  await FacultyModel.deleteMany({});

  // Change these to some arbitrary defaults that can be changer later
  const michaelHash = await Bun.password.hash("password123");
  const maryHash = await Bun.password.hash("password456");
  const supportHash = await Bun.password.hash("admin");

  const faculty = {
    id: "F001",
    name: "Department of French Studies",
    users: [
      {
        id: "U001",
        faculty_id: "F001",
        name: "Michael Reyes",
        email: "michael.reyes@queensu.ca",
        password: michaelHash,
        role: "admin",
      },
      {
        id: "U002",
        faculty_id: "F001",
        name: "Mary Smida",
        email: "mary.smida@queensu.ca",
        password: maryHash,
        role: "admin", 
      },
      {
        id: "U003",
        faculty_id: "F001",
        name: "ICAS Support",
        email: "support@icas.ca",
        password: supportHash,
        role: "admin", 
      },
    ],
    current_working_schedule_id: "SCH001",
    credits_per_course: 1,
    academic_years: [
      {
        id: "Y2026",
        name: "2026-2027",
        start_year: 2026,
        schedules: [
          {
            id: "SCH001",
            name: "Starter Schedule",
            year_id: "Y2026",
            date_created: new Date("2026-03-29T10:00:00.000Z"),
            is_rc: false,
            version: 1,
            assignments: [],
          },
        ],
        courses: [],
        instructors: [],
        instructor_rules: [],
        course_rules: [],
      },
    ],
  };

  const demoCourses: Course[] = [
    { id: "dc-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "ds-1", number: 1, capacity: 0 }, { id: "ds-2", number: 2, capacity: 0 }, { id: "ds-3", number: 3, capacity: 0 }], capacity: 0 },
    { id: "dc-2", name: "Intro to Computer Science", code: "CISC121", level: "undergrad1", year_introduced: "2001", notes: [], sections: [{ id: "ds-4", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-3", name: "Intro to CS II", code: "CISC124", level: "undergrad1", year_introduced: "2001", notes: [], sections: [{ id: "ds-5", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-4", name: "Data Structures", code: "CISC203", level: "undergrad2", year_introduced: "2003", notes: [], sections: [{ id: "ds-6", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-5", name: "Logic for Computing", code: "CISC204", level: "undergrad2", year_introduced: "2003", notes: [], sections: [{ id: "ds-7", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-6", name: "Computer Architecture", code: "CISC235", level: "undergrad2", year_introduced: "2005", notes: [], sections: [{ id: "ds-10", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-7", name: "Software Design", code: "CISC320", level: "undergrad3", year_introduced: "2008", notes: [], sections: [{ id: "ds-11", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-8", name: "Senior Thesis", code: "CISC490", level: "undergrad4", year_introduced: "2010", notes: [], sections: [{ id: "ds-8", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-9", name: "Advanced Topics in AI", code: "CISC890", level: "graduate", year_introduced: "2015", notes: [], sections: [{ id: "ds-9", number: 1, capacity: 0 }], capacity: 0 },
    { id: "dc-10", name: "Calculus I", code: "MATH110", level: "undergrad1", year_introduced: "1990", notes: [], sections: [{ id: "ds-12", number: 1, capacity: 0 }], capacity: 0 },
  ];

  const demoCourseRef = (code: string): Course => {
    const course = demoCourses.find((entry) => entry.code === code);
    if (!course) throw new Error(`Missing course reference for ${code}`);
    return { ...course, sections: [], capacity: 0 };
  };

  const demoHash = await Bun.password.hash("password123");
  const demoSupportHash = await Bun.password.hash("password456");

  const demoFaculty = {
    id: "F002",
    name: "Shambles Faculty",
    users: [
      { id: "DU001", faculty_id: "F002", name: "Alice Johnson", email: "alice.johnson@university.edu", password: demoHash, role: "admin" },
      { id: "DU002", faculty_id: "F002", name: "Bob Smith", email: "bob.smith@university.edu", password: demoSupportHash, role: "support" },
    ],
    current_working_schedule_id: "DSCH001",
    credits_per_course: 1,
    academic_years: [
      {
        id: "DY2026",
        name: "2026-2027",
        start_year: 2026,
        schedules: [
          { id: "DSCH001", name: "Conflict Showcase", year_id: "DY2026", date_created: new Date("2026-03-29T10:00:00.000Z"), is_rc: false, version: 1, assignments: [] },
        ],
        courses: demoCourses,
        instructors: [
          { id: "dinst-1", name: "Dr. Margaret Smith", workload: 3, email: "margaret.smith@queensu.ca", rank: "FullProfessor", prev_taught: [demoCourseRef("CISC101"), demoCourseRef("CISC204"), demoCourseRef("CISC490")], notes: [] },
          { id: "dinst-2", name: "Dr. Ravi Patel", workload: 2, email: "ravi.patel@queensu.ca", rank: "AssociateProfessor", prev_taught: [demoCourseRef("CISC203"), demoCourseRef("CISC235")], notes: [] },
          { id: "dinst-3", name: "Dr. Elena Green", workload: 2, email: "elena.green@queensu.ca", rank: "AssistantProfessor", prev_taught: [demoCourseRef("CISC121"), demoCourseRef("CISC124")], notes: [] },
          { id: "dinst-4", name: "Avery Taylor", workload: 2, email: "avery.taylor@queensu.ca", rank: "TeachingFellow", prev_taught: [], notes: [] },
          { id: "dinst-5", name: "Blake Adams", workload: 2, email: "blake.adams@queensu.ca", rank: "TermAdjunctSRoR", prev_taught: [demoCourseRef("CISC101")], notes: [] },
          { id: "dinst-6", name: "Casey Brown", workload: 2, email: "casey.brown@queensu.ca", rank: "TermAdjunctBasic", prev_taught: [demoCourseRef("CISC121")], notes: [] },
        ],
        instructor_rules: [
          { id: "dir-1", instructor_id: "dinst-1", designations: ["undergrad-coordinator"], workload_delta: -1, courses: [], declined_courses: [], dropped: false },
          { id: "dir-2", instructor_id: "dinst-2", designations: ["curriculum-committee"], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
          { id: "dir-3", instructor_id: "dinst-3", designations: ["new-faculty-mentor"], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
          { id: "dir-4", instructor_id: "dinst-4", designations: [], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
          { id: "dir-5", instructor_id: "dinst-5", designations: [], workload_delta: 0, courses: ["CISC101", "CISC490"], declined_courses: [], dropped: false },
          { id: "dir-6", instructor_id: "dinst-6", designations: [], workload_delta: 0, courses: [], declined_courses: [], dropped: false },
        ],
        course_rules: [
          { id: "dcr-1", course_code: "CISC101", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-1", "ds-2", "ds-3"], is_external: false, dropped: false },
          { id: "dcr-2", course_code: "CISC121", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-4"], is_external: false, dropped: false },
          { id: "dcr-3", course_code: "CISC124", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-5"], is_external: false, dropped: false },
          { id: "dcr-4", course_code: "CISC203", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-6"], is_external: false, dropped: false },
          { id: "dcr-5", course_code: "CISC204", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-7"], is_external: false, dropped: false },
          { id: "dcr-6", course_code: "CISC235", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-10"], is_external: false, dropped: false },
          { id: "dcr-7", course_code: "CISC320", terms_offered: ["Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-11"], is_external: false, dropped: false },
          { id: "dcr-8", course_code: "CISC490", terms_offered: ["Fall", "Winter"], workload_fulfillment: 2, is_full_year: true, sections_available: ["ds-8"], is_external: false, dropped: false },
          { id: "dcr-9", course_code: "CISC890", terms_offered: ["Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-9"], is_external: false, dropped: false },
          { id: "dcr-10", course_code: "MATH110", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["ds-12"], is_external: true, dropped: false },
        ],
      },
    ],
  };

  const result = await FacultyModel.create(faculty);
  const demoResult = await FacultyModel.create(demoFaculty);

  console.log(result);
  console.log(demoResult);
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
