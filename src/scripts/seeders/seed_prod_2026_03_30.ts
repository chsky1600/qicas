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
