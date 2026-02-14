import { describe, test, expect } from "bun:test";
import { checkCourseRules } from "../../src/services/validatorService";
import type { AcademicYear, Assignment, Schedule } from "../../src/types";

// ── self-contained mock data (independent of yearService) ──

const mockCtx: AcademicYear = {
  id: "year-test",
  name: "2026-2027",
  schedules: [],
  courses: [
    { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1 }, { id: "s-2", number: 2 }] },
    { id: "c-6", name: "Senior Thesis", code: "CISC490", level: "undergrad4", year_introduced: "2010", notes: [], sections: [{ id: "s-8", number: 1 }] },
  ],
  instructors: [
    { id: "inst-1", name: "Dr. Smith", workload: 3, email: "smith@queensu.ca", rank: "FullProfessor", prev_taught: [], notes: [] },
  ],
  instructor_rules: [],
  course_rules: [
    {
      id: "cr-1",
      course_code: "CISC101",
      terms_offered: ["Fall", "Winter"],
      workload_fulfillment: 1,
      is_full_year: false,
      sections_available: ["001", "002"],
      is_external: false,
    },
    {
      id: "cr-3",
      course_code: "CISC490",
      terms_offered: ["Fall", "Winter"],
      workload_fulfillment: 2,
      is_full_year: true,
      sections_available: ["001"],
      is_external: false,
    },
  ],
};

// ── Helpers ──

function makeSchedule(assignments: Assignment[]): Schedule {
  return {
    id: "sched-test",
    name: "Test Schedule",
    year_id: "year-test",
    date_created: new Date("2026-02-14"),
    is_rc: false,
    assignments,
  };
}

function makeAssignment(overrides: Partial<Assignment> & { id: string }): Assignment {
  return {
    degree: "valid",
    instructor_id: "inst-1",
    section_id: "s-1",
    course_code: "CISC101",
    term: "Fall",
    ...overrides,
  };
}

// ── Tests ──

describe("checkCourseRules", () => {
  describe("CROSS_TERM_DUPLICATE (INFO)", () => {
    test("fires when same instructor assigned to non-full-year course in both terms", () => {
      const fall = makeAssignment({ id: "a-1", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("CROSS_TERM_DUPLICATE");
      expect(violations[0]!.degree).toBe("Info");
    });

    test("does NOT fire for full-year course", () => {
      const fall = makeAssignment({ id: "a-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", course_code: "CISC490", section_id: "s-8", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations).toHaveLength(0);
    });

    test("does NOT fire when only one term is assigned", () => {
      const fall = makeAssignment({ id: "a-1", term: "Fall" });
      const schedule = makeSchedule([fall]);

      const violations = checkCourseRules(mockCtx, schedule, fall);

      expect(violations).toHaveLength(0);
    });

    test("does NOT fire when different instructors teach same course across terms", () => {
      const fall = makeAssignment({ id: "a-1", instructor_id: "inst-1", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", instructor_id: "inst-2", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations).toHaveLength(0);
    });
  });
});
