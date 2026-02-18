import { describe, test, expect } from "bun:test";
import { checkCourseRules, worstDegree } from "../../src/services/validatorService";
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
    { id: "inst-1", name: "Dr. Smith", workload: 3, email: "smith@queensu.ca", rank: "FullProfessor", prev_taught: [], notes: [] },
    { id: "inst-4", name: "A. Taylor", workload: 2, email: "taylor@queensu.ca", rank: "TeachingFellow", prev_taught: [], notes: [] },
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
});

describe("worstDegree", () => {
  test("returns Info when only Info violations", () => {
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

  test("returns Error when mix of all degrees", () => {
    expect(worstDegree([
      { id: "v-1", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Info" },
      { id: "v-2", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Warning" },
      { id: "v-3", type: "Course", offending_id: "x", code: "TEST", message: "", degree: "Error" },
    ])).toBe("Error");
  });

  test("returns Error even when it appears first", () => {
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
