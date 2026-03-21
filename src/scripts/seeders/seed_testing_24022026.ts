import mongoose from "mongoose";

import { FacultyModel } from "../../db/models/faculty";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/qicas";

async function main() {
  await mongoose.connect(MONGO_URI);

  await FacultyModel.deleteMany({});

  const aliceHash = await Bun.password.hash("password123");
  const bobHash = await Bun.password.hash("password456");

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
        role: "scheduler",
      },
    ],
    current_working_schedule_id : "SCH001",
    academic_years: [
      {
        id: "Y2026",
        name: "2026-2027",
        start_year: 2026,

        schedules: [
          {
            id: "SCH001",
            name: "Working Draft",
            year_id: "Y2026",
            date_created: new Date("2026-02-01T10:00:00.000Z"),
            is_rc: false,
            assignments: [
              // Dr. Smith on CISC101-001 Fall + Winter -- CROSS_TERM_DUPLICATE
              { id: "A001", instructor_id: "inst-1", section_id: "s-1", course_code: "CISC101", term: "Fall" },
              { id: "A002", instructor_id: "inst-1", section_id: "s-1", course_code: "CISC101", term: "Winter" },

              // CISC490 full-year: only Fall assigned -- FULLYEAR_HALF_OPEN
              { id: "A003", instructor_id: "inst-1", section_id: "s-8", course_code: "CISC490", term: "Fall" },

              // Teaching Fellow on graduate course -- RANK_MISMATCH
              { id: "A004", instructor_id: "inst-4", section_id: "s-9", course_code: "CISC890", term: "Winter" },

              // CISC204 assigned in Winter but only offered Fall -- TERM_NOT_OFFERED
              { id: "A005", instructor_id: "inst-1", section_id: "s-7", course_code: "CISC204", term: "Winter" },

              // Dr. Smith on CISC101-002 twice in Fall -- DUPLICATE_ASSIGNMENT
              { id: "A006", instructor_id: "inst-1", section_id: "s-2", course_code: "CISC101", term: "Fall" },
              { id: "A007", instructor_id: "inst-1", section_id: "s-2", course_code: "CISC101", term: "Fall" },

              // 3 instructors on CISC101-003 Fall -- SECTION_OVERASSIGNED (limit=2)
              { id: "A008", instructor_id: "inst-1", section_id: "s-3", course_code: "CISC101", term: "Fall" },
              { id: "A009", instructor_id: "inst-4", section_id: "s-3", course_code: "CISC101", term: "Fall" },
              { id: "A010", instructor_id: "inst-5", section_id: "s-3", course_code: "CISC101", term: "Fall" },

              // TermAdjunctBasic on CISC101 while SRoR has rights and hasn't declined -- TADJ_CONFLICT
              { id: "A011", instructor_id: "inst-6", section_id: "s-1", course_code: "CISC101", term: "Fall" },

              // ExchangeFellow with only 1 section in Fall, none in Winter -- EF_WORKLOAD
              { id: "A012", instructor_id: "inst-7", section_id: "s-4", course_code: "CISC121", term: "Fall" },

              // Dr. Smith has workload 3, delta -1 = target 2, but assigned to way more -- WORKLOAD_EXCEEDED
              // (A001, A002, A003, A005, A006, A007, A008 all count for inst-1)

              // Teaching Fellow only assigned CISC890 (never taught) -- FIRST_TIME_TEACHING + OUT_OF_WHEELHOUSE
              // (covered by A004)
            ],
          },
        ],

        courses: [
          { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1, capacity: 0 }, { id: "s-2", number: 2, capacity: 0 }, { id: "s-3", number: 3, capacity: 0 }], capacity: 0 },
          { id: "c-2", name: "Intro to Computer Science", code: "CISC121", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-4", number: 1, capacity: 0 }], capacity: 0 },
          { id: "c-3", name: "Intro to CS II", code: "CISC124", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-5", number: 1, capacity: 0 }], capacity: 0 },
          { id: "c-4", name: "Data Structures", code: "CISC203", level: "undergrad2", year_introduced: "2000", notes: [], sections: [{ id: "s-6", number: 1, capacity: 0 }], capacity: 0 },
          { id: "c-5", name: "Logic for Computing", code: "CISC204", level: "undergrad2", year_introduced: "2000", notes: [], sections: [{ id: "s-7", number: 1, capacity: 0 }], capacity: 0 },
          { id: "c-6", name: "Senior Thesis", code: "CISC490", level: "undergrad4", year_introduced: "2010", notes: [], sections: [{ id: "s-8", number: 1, capacity: 0 }], capacity: 0 },
          { id: "c-7", name: "Advanced Topics in AI", code: "CISC890", level: "graduate", year_introduced: "2015", notes: [], sections: [{ id: "s-9", number: 1, capacity: 0 }], capacity: 0 },
          { id: "c-8", name: "Calculus I", code: "MATH110", level: "undergrad1", year_introduced: "1990", notes: [], sections: [{ id: "s-10", number: 1, capacity: 0 }], capacity: 0 },
        ],

        instructors: [
          { id: "inst-1", name: "Dr. Smith", workload: 3, email: "smith@queensu.ca", rank: "FullProfessor", prev_taught: [
            { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [], capacity: 0 },
            { id: "c-5", name: "Logic for Computing", code: "CISC204", level: "undergrad2", year_introduced: "2000", notes: [], sections: [], capacity: 0 },
          ], notes: [] },
          { id: "inst-4", name: "A. Taylor", workload: 2, email: "taylor@queensu.ca", rank: "TeachingFellow", prev_taught: [], notes: [] },
          { id: "inst-5", name: "B. Adams", workload: 2, email: "adams@queensu.ca", rank: "TermAdjunctSRoR", prev_taught: [], notes: [] },
          { id: "inst-6", name: "C. Brown", workload: 2, email: "brown@queensu.ca", rank: "TermAdjunctBasic", prev_taught: [], notes: [] },
          { id: "inst-7", name: "D. Xu", workload: 2, email: "xu@queensu.ca", rank: "ExchangeFellow", prev_taught: [], notes: [] },
        ],

        instructor_rules: [
          { id: "ir-1", instructor_id: "inst-1", designations: ["undergrad-coordinator"], workload_delta: -1, courses: [], declined_courses: [], dropped: false },
          { id: "ir-5", instructor_id: "inst-5", designations: [], workload_delta: 0, courses: ["CISC101", "CISC490"], declined_courses: [], dropped: false },
        ],

        course_rules: [
          { id: "cr-1", course_code: "CISC101", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001", "002", "003"], is_external: false, dropped: false },
          { id: "cr-2", course_code: "CISC204", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001"], is_external: false, dropped: false },
          { id: "cr-3", course_code: "CISC490", terms_offered: ["Fall", "Winter"], workload_fulfillment: 2, is_full_year: true, sections_available: ["001"], is_external: false, dropped: false },
          { id: "cr-4", course_code: "CISC890", terms_offered: ["Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001"], is_external: false, dropped: false },
          { id: "cr-5", course_code: "MATH110", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001"], is_external: true, dropped: false },
          { id: "cr-6", course_code: "CISC121", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001"], is_external: false, dropped: false },
          { id: "cr-7", course_code: "CISC124", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001"], is_external: false, dropped: false },
          { id: "cr-8", course_code: "CISC203", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["001"], is_external: false, dropped: false },
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
