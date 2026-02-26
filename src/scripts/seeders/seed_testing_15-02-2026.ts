import mongoose from "mongoose";

import { FacultyModel } from "../../db/models/faculty";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/qicas";

async function main() {
  await mongoose.connect(MONGODB_URI);

  await FacultyModel.deleteMany({});

  // await mongoose.connection.dropDatabase();

  const faculty = {
    id: "F001",
    name: "School of Computing",
    users: [
      {
        id: "U001",
        faculty_id: "F001",
        name: "Alice Johnson",
        email: "alice.johnson@university.edu",
        password: "hashed_password_1",
        role: "admin",
      },
      {
        id: "U002",
        faculty_id: "F001",
        name: "Bob Smith",
        email: "bob.smith@university.edu",
        password: "hashed_password_2",
        role: "scheduler",
      },
    ],

    academic_years: [
      {
        id: "Y2026",
        name: "2026–2027 Academic Year",

        schedules: [
          {
            id: "SCH001",
            name: "Fall 2026 Schedule",
            year_id: "Y2026",
            date_created: new Date("2026-02-01T10:00:00.000Z"),
            is_rc: false,
            assignments: [
              {
                id: "A001",
                instructor_id: "I001",
                section_id: "SEC001",
                course_code: "CISC101",
                term: "Fall",
              },
              {
                id: "A002",
                instructor_id: "I002",
                section_id: "SEC003",
                course_code: "CISC235",
                term: "Fall",
              },
            ],
          },
          {
            id: "SCH002",
            name: "Winter 2027 Schedule",
            year_id: "Y2026",
            date_created: new Date("2026-11-15T15:30:00.000Z"),
            is_rc: true,
            assignments: [
              {
                id: "A003",
                instructor_id: "I001",
                section_id: "SEC002",
                course_code: "CISC101",
                term: "Winter",
              },
            ],
          },
        ],

        courses: [
          {
            id: "C001",
            name: "Introduction to Programming",
            code: "CISC101",
            level: "Undergraduate",
            year_introduced: "2020",
            notes: [
              {
                content: "High enrollment expected.",
                created_by: "Alice Johnson",
                date_created: "2026-01-10",
              },
              {
                content: "Consider adding a third section if waitlist grows.",
                created_by: "Bob Smith",
                date_created: "2026-01-20",
              },
            ],
            sections: [
              { id: "SEC001", number: 1, capacity: 0 },
              { id: "SEC002", number: 2, capacity: 0 },
            ],
            capacity: 0,
          },
          {
            id: "C002",
            name: "Data Structures",
            code: "CISC235",
            level: "Undergraduate",
            year_introduced: "2018",
            notes: [
              {
                content: "Requires CISC101.",
                created_by: "Bob Smith",
                date_created: "2026-01-11",
              },
            ],
            sections: [{ id: "SEC003", number: 1, capacity: 0 }],
            capacity: 0,
          },
        ],

        instructors: [
          {
            id: "I001",
            name: "Dr. Sarah Lee",
            workload: 1.0,
            email: "sarah.lee@university.edu",
            rank: "Associate Professor",
            prev_taught: [
              {
                id: "C001",
                name: "Introduction to Programming",
                code: "CISC101",
                level: "Undergraduate",
                year_introduced: "2020",
                notes: [
                  {
                    content: "Taught in Fall 2024 and Winter 2025.",
                    created_by: "System",
                    date_created: "2025-03-01",
                  },
                ],
                sections: [
                  { id: "SEC001", number: 1, capacity: 0 },
                  { id: "SEC002", number: 2, capacity: 0 },
                ],
                capacity: 0,
              },
            ],
            notes: [
              {
                content: "Prefers morning classes.",
                created_by: "Alice Johnson",
                date_created: "2026-01-12",
              },
            ],
          },
          {
            id: "I002",
            name: "Dr. Mark Chen",
            workload: 1.0,
            email: "mark.chen@university.edu",
            rank: "Assistant Professor",
            prev_taught: [
              {
                id: "C002",
                name: "Data Structures",
                code: "CISC235",
                level: "Undergraduate",
                year_introduced: "2018",
                notes: [
                  {
                    content: "Taught in Fall 2023.",
                    created_by: "System",
                    date_created: "2024-01-05",
                  },
                ],
                sections: [{ id: "SEC003", number: 1, capacity: 0 }],
                capacity: 0,
              },
            ],
            notes: [
              {
                content: "Avoids Friday afternoons.",
                created_by: "Bob Smith",
                date_created: "2026-01-13",
              },
            ],
          },
        ],

        instructor_rules: [
          {
            id: "IR001",
            instructor_id: "I001",
            designations: ["Undergraduate"],
            workload_delta: 0,
            courses: ["CISC101"],
            declined_courses: [],
          },
          {
            id: "IR002",
            instructor_id: "I002",
            designations: ["Undergraduate"],
            workload_delta: -0.5,
            courses: ["CISC235"],
            declined_courses: ["CISC101"],
          },
        ],

        course_rules: [
          {
            id: "CR001",
            course_code: "CISC101",
            terms_offered: ["Fall", "Winter"],
            workload_fulfillment: 0.5,
            is_full_year: false,
            sections_available: ["SEC001", "SEC002"],
            is_external: false,
          },
          {
            id: "CR002",
            course_code: "CISC235",
            terms_offered: ["Fall"],
            workload_fulfillment: 0.5,
            is_full_year: false,
            sections_available: ["SEC003"],
            is_external: false,
          },
        ],
      },
    ],
  };

  const result = await FacultyModel.create(faculty);

  console.log(result)

  console.log("✅ Seed complete.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
