import { describe, test, expect } from "bun:test";
import { checkCourseRules, checkInstructorRules, checkScheduleRules, worstDegree } from "../../src/services/validatorService";
import type { AcademicYear, Assignment, Schedule } from "../../src/types";
const VERBOSE = process.env.ver === "1";

// -- self-contained mock data (independent of yearService) --
// update for every new testcase

const mockCtx: AcademicYear = {
  id: "year-test",
  name: "2026-2027",
  schedules: [],
  courses: [
    { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1 }, { id: "s-2", number: 2 }] },
    { id: "c-6", name: "Senior Thesis", code: "CISC490", level: "undergrad4", year_introduced: "2010", notes: [], sections: [{ id: "s-8", number: 1 }] },
    { id: "c-7", name: "Advanced Topics in AI", code: "CISC890", level: "graduate", year_introduced: "2015", notes: [], sections: [{ id: "s-9", number: 1 }] },
  ],
  instructors: [
    { id: "inst-1", name: "Dr. Smith", workload: 3, email: "smith@queensu.ca", rank: "FullProfessor", prev_taught: [
      { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
    ], notes: [] },
    { id: "inst-4", name: "A. Taylor", workload: 2, email: "taylor@queensu.ca", rank: "TeachingFellow", prev_taught: [], notes: [] },
    { id: "inst-5", name: "B. Adams", workload: 2, email: "adams@queensu.ca", rank: "TermAdjunctSRoR", prev_taught: [], notes: [] },
    { id: "inst-6", name: "C. Brown", workload: 2, email: "brown@queensu.ca", rank: "TermAdjunctBasic", prev_taught: [], notes: [] },
    { id: "inst-7", name: "D. Xu", workload: 2, email: "xu@queensu.ca", rank: "ExchangeFellow", prev_taught: [], notes: [] },
  ],
  instructor_rules: [
    { id: "ir-5", instructor_id: "inst-5", designations: [], workload_delta: 0, courses: ["CISC101", "CISC490"], declined_courses: [] },
  ],
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
      id: "cr-2",
      course_code: "CISC204",
      terms_offered: ["Fall"],
      workload_fulfillment: 1,
      is_full_year: false,
      sections_available: ["001"],
      is_external: false,
    },
    {
      id: "cr-4",
      course_code: "CISC890",
      terms_offered: ["Winter"],
      workload_fulfillment: 1,
      is_full_year: false,
      sections_available: ["001"],
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

// -- Helpers --

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

// -- Tests --

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
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
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

    test("does NOT fire when same instructor has same course in same term (not cross-term)", () => {
      const a1 = makeAssignment({ id: "a-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", term: "Fall" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkCourseRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "CROSS_TERM_DUPLICATE")).toHaveLength(0);
    });

    test("does NOT fire when different instructors teach same course across terms", () => {
      const fall = makeAssignment({ id: "a-1", instructor_id: "inst-1", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", instructor_id: "inst-2", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations).toHaveLength(0);
    });
  });

  describe("FULLYEAR_HALF_OPEN (INFO)", () => {
    test("fires when full-year course only has Fall assigned", () => {
      const fall = makeAssignment({ id: "a-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const schedule = makeSchedule([fall]);

      const violations = checkCourseRules(mockCtx, schedule, fall);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("FULLYEAR_HALF_OPEN");
      expect(violations[0]!.degree).toBe("Info");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("fires when full-year course only has Winter assigned", () => {
      const winter = makeAssignment({ id: "a-1", course_code: "CISC490", section_id: "s-8", term: "Winter" });
      const schedule = makeSchedule([winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("FULLYEAR_HALF_OPEN");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("fires when full-year course has different instructors per term", () => {
      const fall = makeAssignment({ id: "a-1", course_code: "CISC490", section_id: "s-8", instructor_id: "inst-1", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", course_code: "CISC490", section_id: "s-8", instructor_id: "inst-2", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, fall);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("FULLYEAR_HALF_OPEN");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when full-year course has same instructor in both terms", () => {
      const fall = makeAssignment({ id: "a-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", course_code: "CISC490", section_id: "s-8", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, fall);

      expect(violations).toHaveLength(0);
    });

    test("does NOT fire when neither term is assigned (vType is 'Unassigned', and not 'HalfOpen')", () => {
      const unrelated = makeAssignment({ id: "a-1", course_code: "CISC101", term: "Fall" });
      const candidate = makeAssignment({ id: "a-99", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      // Schedule has no CISC490 assignments — candidate is not in the schedule
      const schedule = makeSchedule([unrelated]);

      const violations = checkCourseRules(mockCtx, schedule, candidate);

      expect(violations).toHaveLength(0);
    });

    test("does NOT fire for non-full-year courses", () => {
      const fall = makeAssignment({ id: "a-1", course_code: "CISC101", term: "Fall" });
      const schedule = makeSchedule([fall]);

      const violations = checkCourseRules(mockCtx, schedule, fall);

      expect(violations).toHaveLength(0);
    });
  });

  describe("TERM_NOT_OFFERED (WARNING)", () => {
    test("fires when course is assigned in a term it is not offered", () => {
      const winter = makeAssignment({ id: "a-1", course_code: "CISC204", section_id: "s-7", term: "Winter" });
      const schedule = makeSchedule([winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("TERM_NOT_OFFERED");
      expect(violations[0]!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when course is assigned in an offered term", () => {
      const fall = makeAssignment({ id: "a-1", course_code: "CISC204", section_id: "s-7", term: "Fall" });
      const schedule = makeSchedule([fall]);

      const violations = checkCourseRules(mockCtx, schedule, fall);

      expect(violations.filter(v => v.code === "TERM_NOT_OFFERED")).toHaveLength(0);
    });

    test("does NOT fire when course is offered in both terms", () => {
      const winter = makeAssignment({ id: "a-1", course_code: "CISC101", term: "Winter" });
      const schedule = makeSchedule([winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations.filter(v => v.code === "TERM_NOT_OFFERED")).toHaveLength(0);
    });
  });

  describe("RANK_MISMATCH (WARNING)", () => {
    test("fires when TeachingFellow is assigned to graduate course", () => {
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-4", course_code: "CISC890", section_id: "s-9", term: "Winter" });
      const schedule = makeSchedule([a]);

      const violations = checkCourseRules(mockCtx, schedule, a);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("RANK_MISMATCH");
      expect(violations[0]!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when FullProfessor is assigned to graduate course", () => {
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC890", section_id: "s-9", term: "Winter" });
      const schedule = makeSchedule([a]);

      const violations = checkCourseRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "RANK_MISMATCH")).toHaveLength(0);
    });

    test("does NOT fire when TeachingFellow is assigned to undergrad course", () => {
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkCourseRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "RANK_MISMATCH")).toHaveLength(0);
    });
  });

  describe("DUPLICATE_ASSIGNMENT (ERROR)", () => {
    test("fires when same instructor assigned to same section twice in same term", () => {
      const a1 = makeAssignment({ id: "a-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", term: "Fall" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkCourseRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "DUPLICATE_ASSIGNMENT")).toHaveLength(1);
      expect(violations.find(v => v.code === "DUPLICATE_ASSIGNMENT")!.degree).toBe("Error");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when same instructor assigned to same section in different terms", () => {
      const fall = makeAssignment({ id: "a-1", term: "Fall" });
      const winter = makeAssignment({ id: "a-2", term: "Winter" });
      const schedule = makeSchedule([fall, winter]);

      const violations = checkCourseRules(mockCtx, schedule, winter);

      expect(violations.filter(v => v.code === "DUPLICATE_ASSIGNMENT")).toHaveLength(0);
    });

    test("does NOT fire when different instructors assigned to same section in same term", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", term: "Fall" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkCourseRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "DUPLICATE_ASSIGNMENT")).toHaveLength(0);
    });
  });
  describe("SECTION_OVERASSIGNED (ERROR)", () => {
    test("fires when 3 instructors assigned to same section in same term", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", section_id: "s-1", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-3", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkCourseRules(mockCtx, schedule, a3);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("SECTION_OVERASSIGNED");
      expect(violations[0]!.degree).toBe("Error");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when exactly 2 instructors assigned (at limit)", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkCourseRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "SECTION_OVERASSIGNED")).toHaveLength(0);
    });

    test("does NOT fire when 3 instructors are across different terms", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", section_id: "s-1", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-3", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkCourseRules(mockCtx, schedule, a3);

      expect(violations.filter(v => v.code === "SECTION_OVERASSIGNED")).toHaveLength(0);
    });

    test("does NOT fire when 3 instructors are across different sections", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", section_id: "s-1", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-3", section_id: "s-2", term: "Fall" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkCourseRules(mockCtx, schedule, a3);

      expect(violations.filter(v => v.code === "SECTION_OVERASSIGNED")).toHaveLength(0);
    });
  });
});

describe("checkInstructorRules", () => {
  describe("FIRST_TIME_TEACHING (INFO)", () => {
    test("fires when instructor has not previously taught the course", () => {
      // inst-1 (Dr. Smith) has prev_taught = [CISC101]. Assign to CISC490 — never taught.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "FIRST_TIME_TEACHING")).toHaveLength(1);
      expect(violations.find(v => v.code === "FIRST_TIME_TEACHING")!.degree).toBe("Info");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("fires when instructor has empty prev_taught", () => {
      // inst-4 (A. Taylor) has prev_taught = []. Any course is first time.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "FIRST_TIME_TEACHING")).toHaveLength(1);
    });

    test("does NOT fire when instructor has previously taught the course", () => {
      // inst-1 (Dr. Smith) has prev_taught = [CISC101]. Assign to CISC101.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "FIRST_TIME_TEACHING")).toHaveLength(0);
    });
  });

  describe("UNEVEN_YEAR (INFO)", () => {
    test("fires when instructor has 3 Fall sections and 1 Winter section (gap of 2)", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-2", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const a4 = makeAssignment({ id: "a-4", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2, a3, a4]);

      const violations = checkInstructorRules(mockCtx, schedule, a3);

      expect(violations.filter(v => v.code === "UNEVEN_YEAR")).toHaveLength(1);
      expect(violations.find(v => v.code === "UNEVEN_YEAR")!.degree).toBe("Info");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when gap is exactly 1 (2 Fall, 1 Winter)", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-2", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkInstructorRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "UNEVEN_YEAR")).toHaveLength(0);
    });

    test("does NOT fire when terms are balanced (1 Fall, 1 Winter)", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(mockCtx, schedule, a1);

      expect(violations.filter(v => v.code === "UNEVEN_YEAR")).toHaveLength(0);
    });

    test("fires when instructor has 0 Fall and 2 Winter (gap of 2)", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-2", term: "Winter" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "UNEVEN_YEAR")).toHaveLength(1);
    });
  });

  describe("TADJ_UNASSIGNED (WARNING)", () => {
    test("fires when SRoR adjunct is missing a designated course", () => {
      // inst-5 (SRoR) has designated courses [CISC101, CISC490], only assigned CISC101.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-5", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "TADJ_UNASSIGNED")).toHaveLength(1);
      expect(violations.find(v => v.code === "TADJ_UNASSIGNED")!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when SRoR adjunct is assigned all designated courses", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-5", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-5", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(mockCtx, schedule, a1);

      expect(violations.filter(v => v.code === "TADJ_UNASSIGNED")).toHaveLength(0);
    });

    test("does NOT fire for non-SRoR/GRoR instructors", () => {
      // inst-1 is FullProfessor — rule should not apply even if instructor_rules existed.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "TADJ_UNASSIGNED")).toHaveLength(0);
    });
  });

  describe("TADJ_CONFLICT (WARNING)", () => {
    test("fires when TermAdjunctBasic assigned a course a SRoR has rights to and has not declined", () => {
      // inst-6 (TermAdjunctBasic) assigned CISC101, but inst-5 (SRoR) has rights to CISC101 and hasn't declined.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-6", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "TADJ_CONFLICT")).toHaveLength(1);
      expect(violations.find(v => v.code === "TADJ_CONFLICT")!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when SRoR has declined the course", () => {
      // Create context where inst-5 declined CISC101.
      const declinedCtx = {
        ...mockCtx,
        instructor_rules: [
          { ...mockCtx.instructor_rules[0]!, declined_courses: ["CISC101"] },
        ],
      };
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-6", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(declinedCtx, schedule, a);

      expect(violations.filter(v => v.code === "TADJ_CONFLICT")).toHaveLength(0);
    });

    test("does NOT fire when candidate is not a TermAdjunctBasic", () => {
      // inst-1 (FullProfessor) assigned CISC101 — SRoR has rights but rule only applies to BasicAdj.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "TADJ_CONFLICT")).toHaveLength(0);
    });

    test("does NOT fire when course is not in SRoR's designated courses", () => {
      // inst-6 (TermAdjunctBasic) assigned CISC890 — inst-5 has rights to CISC101 and CISC490, not CISC890.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-6", course_code: "CISC890", section_id: "s-9", term: "Winter" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "TADJ_CONFLICT")).toHaveLength(0);
    });
  });

  describe("EF_WORKLOAD (WARNING)", () => {
    test("fires when ExchangeFellow has 1 Fall but 0 Winter", () => {
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-7", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "EF_WORKLOAD")).toHaveLength(1);
      expect(violations.find(v => v.code === "EF_WORKLOAD")!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("fires when ExchangeFellow has 2 Fall and 1 Winter", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-7", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-7", course_code: "CISC101", section_id: "s-2", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-7", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkInstructorRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "EF_WORKLOAD")).toHaveLength(1);
    });

    test("does NOT fire when ExchangeFellow has exactly 1 Fall and 1 Winter", () => {
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-7", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-7", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(mockCtx, schedule, a1);

      expect(violations.filter(v => v.code === "EF_WORKLOAD")).toHaveLength(0);
    });

    test("does NOT fire for non-ExchangeFellow instructors", () => {
      // inst-1 (FullProfessor) with only 1 Fall — rule should not apply.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "EF_WORKLOAD")).toHaveLength(0);
    });
  });

  describe("WORKLOAD_EXCEEDED (WARNING)", () => {
    test("fires when instructor exceeds base workload", () => {
      // inst-4 (A. Taylor) has workload 2, no instructor rule. Assign 3 sections.
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-2", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkInstructorRules(mockCtx, schedule, a3);

      expect(violations.filter(v => v.code === "WORKLOAD_EXCEEDED")).toHaveLength(1);
      expect(violations.find(v => v.code === "WORKLOAD_EXCEEDED")!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when assigned workload equals target", () => {
      // inst-4 has workload 2. Assign exactly 2 sections.
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-4", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "WORKLOAD_EXCEEDED")).toHaveLength(0);
    });

    test("respects workload_delta from instructor rule", () => {
      // inst-5 (SRoR) has workload 2, workload_delta 0 -> target 2. Assign 3 sections
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-5", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-5", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const a3 = makeAssignment({ id: "a-3", instructor_id: "inst-5", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2, a3]);

      const violations = checkInstructorRules(mockCtx, schedule, a3);

      expect(violations.filter(v => v.code === "WORKLOAD_EXCEEDED")).toHaveLength(1);
    });

    test("accounts for workload_fulfillment (CISC490 = 2)", () => {
      // inst-4 has workload 2. CISC490 fulfills 2 by itself -> at target i.e., not exceeded.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-4", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "WORKLOAD_EXCEEDED")).toHaveLength(0);
    });
  });

  describe("OUT_OF_WHEELHOUSE (WARNING)", () => {
    test("fires when all assigned courses are new to the instructor", () => {
      // inst-1 (Dr. Smith) has prev_taught = [CISC101]. Assign only CISC490 (never taught)
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "OUT_OF_WHEELHOUSE")).toHaveLength(1);
      expect(violations.find(v => v.code === "OUT_OF_WHEELHOUSE")!.degree).toBe("Warning");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when at least one assigned course is in prev_taught", () => {
      // inst-1 has prev_taught = [CISC101]. Assigned to CISC101 + CISC490.
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC490", section_id: "s-8", term: "Fall" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(mockCtx, schedule, a2);

      expect(violations.filter(v => v.code === "OUT_OF_WHEELHOUSE")).toHaveLength(0);
    });

    test("does NOT fire when all assigned courses are in prev_taught", () => {
      // inst-1 has prev_taught = [CISC101] only assigned CISC101.
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(mockCtx, schedule, a);

      expect(violations.filter(v => v.code === "OUT_OF_WHEELHOUSE")).toHaveLength(0);
    });
  });

  describe("INSUFFICIENT_WORKLOAD (ERROR)", () => {
    // Isolated context: 1 instructor (workload 2), 1 course with 1 section in Fall
    const insuffCtx: AcademicYear = {
      id: "year-insuff",
      name: "2026-2027",
      schedules: [],
      courses: [
        { id: "c-1", name: "Intro", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1 }] },
      ],
      instructors: [
        { id: "inst-1", name: "Dr. A", workload: 2, email: "a@q.ca", rank: "FullProfessor", prev_taught: [
          { id: "c-1", name: "Intro", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
        ], notes: [] },
      ],
      instructor_rules: [],
      course_rules: [
        { id: "cr-1", course_code: "CISC101", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["s-1"], is_external: false },
      ],
    };

    test("fires when instructor is below target and all sections are assigned", () => {
      // inst-1 has workload 2, assigned 1 section, and that's the only section available
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(insuffCtx, schedule, a);

      expect(violations.filter(v => v.code === "INSUFFICIENT_WORKLOAD")).toHaveLength(1);
      expect(violations.find(v => v.code === "INSUFFICIENT_WORKLOAD")!.degree).toBe("Error");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });

    test("does NOT fire when unassigned sections still exist", () => {
      // add a second section so there's room to fill the gap.
      const twoSectionCtx: AcademicYear = {
        ...insuffCtx,
        course_rules: [
          { id: "cr-1", course_code: "CISC101", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["s-1", "s-2"], is_external: false },
        ],
      };
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(twoSectionCtx, schedule, a);

      expect(violations.filter(v => v.code === "INSUFFICIENT_WORKLOAD")).toHaveLength(0);
    });

    test("does NOT fire when instructor meets their target", () => {
      const metCtx: AcademicYear = {
        ...insuffCtx,
        course_rules: [
          { id: "cr-1", course_code: "CISC101", terms_offered: ["Fall", "Winter"], workload_fulfillment: 1, is_full_year: false, sections_available: ["s-1"], is_external: false },
        ],
      };
      const a1 = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const a2 = makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Winter" });
      const schedule = makeSchedule([a1, a2]);

      const violations = checkInstructorRules(metCtx, schedule, a2);

      expect(violations.filter(v => v.code === "INSUFFICIENT_WORKLOAD")).toHaveLength(0);
    });

    test("ignores external sections when checking for remaining capacity", () => {
      // Only section left is external so doesn't count
      const externalCtx: AcademicYear = {
        ...insuffCtx,
        course_rules: [
          { id: "cr-1", course_code: "CISC101", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["s-1"], is_external: false },
          { id: "cr-ext", course_code: "MATH110", terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: ["s-ext"], is_external: true },
        ],
      };
      const a = makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" });
      const schedule = makeSchedule([a]);

      const violations = checkInstructorRules(externalCtx, schedule, a);

      expect(violations.filter(v => v.code === "INSUFFICIENT_WORKLOAD")).toHaveLength(1);
    });
  });
});

describe("worstDegree", () => {
  test("returns Info when given only Info violations", () => {
    expect(worstDegree([
      { id: "v-1", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Info" },
    ])).toBe("Info");
  });

  test("returns Warning when mix of Info and Warning", () => {
    expect(worstDegree([
      { id: "v-1", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Info" },
      { id: "v-2", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Warning" },
    ])).toBe("Warning");
  });

  test("returns Error when given a mix of all degrees", () => {
    expect(worstDegree([
      { id: "v-1", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Info" },
      { id: "v-2", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Warning" },
      { id: "v-3", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Error" },
    ])).toBe("Error");
  });

  test("returns Error even when 'Error' appears first", () => {
    expect(worstDegree([
      { id: "v-1", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Error" },
      { id: "v-2", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Info" },
    ])).toBe("Error");
  });
});

describe("multi-rule integration", () => {
  test("CROSS_TERM_DUPLICATE (Info) + TERM_NOT_OFFERED (Warning) compose to Warning", () => {
    // CISC204 is only offered in Fall. Assign same instructor in both terms:
    // - Fall: valid term, but cross-term duplicate
    // - Winter: invalid term AND cross-term duplicate
    const fall = makeAssignment({ id: "a-1", course_code: "CISC204", section_id: "s-7", term: "Fall" });
    const winter = makeAssignment({ id: "a-2", course_code: "CISC204", section_id: "s-7", term: "Winter" });
    const schedule = makeSchedule([fall, winter]);

    const violations = checkCourseRules(mockCtx, schedule, winter);

    const codes = violations.map(v => v.code);
    expect(codes).toContain("CROSS_TERM_DUPLICATE");
    expect(codes).toContain("TERM_NOT_OFFERED");
    expect(worstDegree(violations)).toBe("Warning");
    if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
  });
});

describe("checkScheduleRules", () => {
  // Isolated context for schedule-wide rules
  // 1 instructor (workload 1), 1 internal course with 2 sections offered in Fall
  const smallCtx: AcademicYear = {
    id: "year-small",
    name: "2026-2027",
    schedules: [],
    courses: [
      { id: "c-1", name: "Intro", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1 }, { id: "s-2", number: 2 }] },
      { id: "c-ext", name: "Calculus", code: "MATH110", level: "undergrad1", year_introduced: "1990", notes: [], sections: [{ id: "s-ext", number: 1 }] },
    ],
    instructors: [
      { id: "inst-1", name: "Dr. A", workload: 1, email: "a@q.ca", rank: "FullProfessor", prev_taught: [], notes: [] },
    ],
    instructor_rules: [],
    course_rules: [
      {
        id: "cr-1",
        course_code: "CISC101",
        terms_offered: ["Fall"],
        workload_fulfillment: 1,
        is_full_year: false,
        sections_available: ["s-1", "s-2"],
        is_external: false,
      },
      {
        id: "cr-ext",
        course_code: "MATH110",
        terms_offered: ["Fall"],
        workload_fulfillment: 1,
        is_full_year: false,
        sections_available: ["s-ext"],
        is_external: true,
      },
    ],
  };
  describe("SECTION_UNASSIGNED (ERROR)", () => {
    test("fires when all instructors at capacity and internal section unassigned", () => {
      // inst-1 has workload 1, assigned 1 section — at capacity. s-2 in Fall is uncovered.
      const schedule = makeSchedule([
        makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" }),
      ]);

      const violations = checkScheduleRules(smallCtx, schedule);

      expect(violations).toHaveLength(1);
      expect(violations[0]!.code).toBe("SECTION_UNASSIGNED");
      expect(violations[0]!.degree).toBe("Error");
      if (VERBOSE) console.log(JSON.stringify(violations, null, 2));
    });


    test("does NOT fire when instructors still have capacity", () => {
      // inst-1 has workload 1, assigned 0 sections — not at capacity
      const schedule = makeSchedule([]);

      const violations = checkScheduleRules(smallCtx, schedule);

      expect(violations).toHaveLength(0);
    });

    test("does NOT fire when all internal sections are assigned", () => {
      // Both sections covered, inst-1 over capacity but everything is assigned
      const schedule = makeSchedule([
        makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" }),
        makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-2", term: "Fall" }),
      ]);

      const violations = checkScheduleRules(smallCtx, schedule);

      expect(violations).toHaveLength(0);
    });

    test("does NOT fire for external (is_external) sections", () => {
      // inst-1 at capacity, MATH110 section unassigned but it's external
      const schedule = makeSchedule([
        makeAssignment({ id: "a-1", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-1", term: "Fall" }),
        makeAssignment({ id: "a-2", instructor_id: "inst-1", course_code: "CISC101", section_id: "s-2", term: "Fall" }),
      ]);

      const violations = checkScheduleRules(smallCtx, schedule);

      // MATH110 s-ext is unassigned but external — should not fire
      expect(violations.filter(v => v.offending_id === "MATH110")).toHaveLength(0);
    });
  }); 
}); 
