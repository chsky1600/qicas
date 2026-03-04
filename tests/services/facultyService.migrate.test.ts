import { beforeAll, afterAll, beforeEach, describe, test, expect } from "bun:test";
import { connectDB, disconnectDB } from "../../src/db/connection";
import { FacultyModel } from "../../src/db/models/faculty";
import { migrateFacultyToNewYear } from "../../src/services/facultyService";

const KEEP_TEST_DATA = process.env.KEEP_TEST_DATA === "1";

const facultyId = "F_MIGRATE_TEST";
const sourceYearId = "Y2026";
const newYearId = "Y2027";

const seedFaculty = {
  id: facultyId,
  name: "School of Computing",
  users: [],
  current_working_schedule_id : "",
  academic_years: [
    {
      id: sourceYearId,
      name: "2026–2027 Academic Year",
      schedules: [
        {
          id: "SCH001",
          name: "Fall 2026 Schedule",
          year_id: sourceYearId,
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
          ],
        },
      ],
      courses: [
        {
          id: "C001",
          name: "Intro to Computing",
          code: "CISC101",
          level: "Undergraduate",
          year_introduced: "2020",
          notes: [],
          sections: [{ id: "SEC001", number: 1, capacity: 0 }],
          capacity: 0,
        },
      ],
      instructors: [
        {
          id: "I001",
          name: "Dr. Smith",
          workload: 1,
          email: "smith@university.edu",
          rank: "Assistant Professor",
          prev_taught: [],
          notes: [],
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
      ],
      course_rules: [
        {
          id: "CR001",
          course_code: "CISC101",
          terms_offered: ["Fall"],
          workload_fulfillment: 0.5,
          is_full_year: false,
          sections_available: ["SEC001"],
          is_external: false,
          dropped: false,
        },
      ],
    },
  ],
};

describe("migrateFacultyToNewYear (deep copy)", () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await FacultyModel.deleteMany({ id: facultyId });
    await FacultyModel.create(seedFaculty);
  });

  afterAll(async () => {
    if (!KEEP_TEST_DATA) {
      await FacultyModel.deleteMany({ id: facultyId });
    }
    await disconnectDB();
  });

  test("copies data but does not share subdoc ids or mutations", async () => {
    await migrateFacultyToNewYear(
      facultyId,
      facultyId,
      sourceYearId,
      newYearId,
      "Copied Year"
    );

    const faculty = await FacultyModel.findOne({ id: facultyId }).lean();
    expect(faculty).toBeTruthy();

    const source = faculty!.academic_years.find((y) => y.id === sourceYearId);
    const copy = faculty!.academic_years.find((y) => y.id === newYearId);

    expect(copy).toBeTruthy();
    expect(copy!.name).toBe("Copied Year");
    expect(copy!.schedules.length).toBe(0);
    expect(copy!.courses[0].id).toBe(source!.courses[0].id);

    const sourceCourseId = (source!.courses[0] as any)._id?.toString();
    const copyCourseId = (copy!.courses[0] as any)._id?.toString();
    console.log("source course _id", sourceCourseId);
    console.log("copy course _id  ", copyCourseId);
    expect(copyCourseId).not.toBe(sourceCourseId);

    await FacultyModel.updateOne(
      { id: facultyId, "academic_years.id": newYearId },
      { $set: { "academic_years.$.courses.0.name": "Updated Course" } }
    );

    const reloaded = await FacultyModel.findOne({ id: facultyId }).lean();
    const sourceReloaded = reloaded!.academic_years.find(
      (y) => y.id === sourceYearId
    );
    const copyReloaded = reloaded!.academic_years.find(
      (y) => y.id === newYearId
    );

    expect(sourceReloaded!.courses[0].name).toBe("Intro to Computing");
    expect(copyReloaded!.courses[0].name).toBe("Updated Course");

    let err: any;
    try {
      await migrateFacultyToNewYear(
        facultyId,
        facultyId,
        sourceYearId,
        newYearId,
        "Copied Year"
      );
    } catch (e) {
      err = e;
      console.log("second migration error", err?.status, err?.message);
    }

    expect(err).toBeTruthy();
    expect(err.status).toBe(409);
    expect(err.message).toBe("Academic year already exists");
  });
});
