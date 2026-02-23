import type { AcademicYear } from "../types";

/**
 * Service for managing academic year data and constraints.
 */

/**
 * Retrieves the constraints/rules for a given academic year.
 * Used by ValidatorService to get the context for validation.
 *
 * @param year_id - The unique identifier of the academic year
 * @returns The academic year with all associated rules
 */
export async function getYearConstraints(
  year_id: string
): Promise<AcademicYear> {
  // FIXME: Replace with actual db lookups once config and seeded
  return {
    id: year_id,
    name: "2026-2027",
    schedules: [{
      id: "sched-1",
      name: "Working Draft",
      year_id: year_id,
      date_created: new Date("2026-02-14"),
      is_rc: false,
      assignments: [
        // Dr. Smith assigned to CISC101-001 in both terms (CROSS_TERM_DUPLICATE if not full-year)
        { id: "a-1", degree: "Valid", instructor_id: "inst-1", section_id: "s-1", course_code: "CISC101", term: "Fall" },
        { id: "a-2", degree: "Valid", instructor_id: "inst-1", section_id: "s-1", course_code: "CISC101", term: "Winter" },
        // CISC490 full-year: only Fall assigned, Winter missing (FULLYEAR_HALF_OPEN)
        { id: "a-3", degree: "Valid", instructor_id: "inst-3", section_id: "s-8", course_code: "CISC490", term: "Fall" },
        // Dr. Jones assigned to CISC101-002 twice in Fall (DUPLICATE_ASSIGNMENT)
        { id: "a-4", degree: "Valid", instructor_id: "inst-2", section_id: "s-2", course_code: "CISC101", term: "Fall" },
        { id: "a-5", degree: "Valid", instructor_id: "inst-2", section_id: "s-2", course_code: "CISC101", term: "Fall" },
        // 3 instructors on CISC101-003 in Fall (SECTION_OVERASSIGNED, limit=2)
        { id: "a-6", degree: "Valid", instructor_id: "inst-1", section_id: "s-3", course_code: "CISC101", term: "Fall" },
        { id: "a-7", degree: "Valid", instructor_id: "inst-2", section_id: "s-3", course_code: "CISC101", term: "Fall" },
        { id: "a-8", degree: "Valid", instructor_id: "inst-3", section_id: "s-3", course_code: "CISC101", term: "Fall" },
        // Teaching Fellow assigned to graduate course (RANK_MISMATCH)
        { id: "a-9", degree: "Valid", instructor_id: "inst-4", section_id: "s-9", course_code: "CISC890", term: "Winter" },
        // CISC204 assigned in Winter but only offered in Fall (TERM_NOT_OFFERED)
        { id: "a-10", degree: "Valid", instructor_id: "inst-3", section_id: "s-7", course_code: "CISC204", term: "Winter" },
      ],
    }],
    courses: [
      { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1 }, { id: "s-2", number: 2 }, { id: "s-3", number: 3 }] },
      { id: "c-2", name: "Intro to Computer Science", code: "CISC121", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-4", number: 1 }] },
      { id: "c-3", name: "Intro to CS II", code: "CISC124", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-5", number: 1 }] },
      { id: "c-4", name: "Data Structures", code: "CISC203", level: "undergrad2", year_introduced: "2000", notes: [], sections: [{ id: "s-6", number: 1 }] },
      { id: "c-5", name: "Logic for Computing", code: "CISC204", level: "undergrad2", year_introduced: "2000", notes: [], sections: [{ id: "s-7", number: 1 }] },
      { id: "c-6", name: "Senior Thesis", code: "CISC490", level: "undergrad4", year_introduced: "2010", notes: [], sections: [{ id: "s-8", number: 1 }] },
      { id: "c-7", name: "Advanced Topics in AI", code: "CISC890", level: "graduate", year_introduced: "2015", notes: [], sections: [{ id: "s-9", number: 1 }] },
      { id: "c-8", name: "Calculus I", code: "MATH110", level: "undergrad1", year_introduced: "1990", notes: [], sections: [{ id: "s-10", number: 1 }] },
    ],
    instructors: [
      { id: "inst-1", name: "Dr. Smith", workload: 3, email: "smith@queensu.ca", rank: "FullProfessor", prev_taught: [
        { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
        { id: "c-5", name: "Logic for Computing", code: "CISC204", level: "undergrad2", year_introduced: "2000", notes: [], sections: [] },
      ], notes: [] },
      { id: "inst-2", name: "Dr. Jones", workload: 4, email: "jones@queensu.ca", rank: "AssociateProfessor", prev_taught: [
        { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
        { id: "c-2", name: "Intro to Computer Science", code: "CISC121", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
      ], notes: [] },
      { id: "inst-3", name: "Dr. Lee", workload: 4, email: "lee@queensu.ca", rank: "AssistantProfessor", prev_taught: [
        { id: "c-3", name: "Intro to CS II", code: "CISC124", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
        { id: "c-4", name: "Data Structures", code: "CISC203", level: "undergrad2", year_introduced: "2000", notes: [], sections: [] },
      ], notes: [] },
      { id: "inst-4", name: "A. Taylor", workload: 2, email: "taylor@queensu.ca", rank: "TeachingFellow", prev_taught: [
        { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [] },
      ], notes: [] },
    ],
    instructor_rules: [
      {
        id: "ir-1",
        instructor_id: "inst-1",
        designations: ["undergrad-coordinator"],
        workload_delta: -1,
        courses: [],
        declined_courses: [],
      },
      {
        id: "ir-2",
        instructor_id: "inst-2",
        designations: [],
        workload_delta: 0,
        courses: ["CISC101", "CISC121"],
        declined_courses: [],
      },
    ],
    course_rules: [
      {
        id: "cr-1",
        course_code: "CISC101",
        terms_offered: ["Fall", "Winter"],
        workload_fulfillment: 1,
        is_full_year: false,
        sections_available: ["001", "002", "003"],
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
        id: "cr-3",
        course_code: "CISC490",
        terms_offered: ["Fall", "Winter"],
        workload_fulfillment: 2,
        is_full_year: true,
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
        id: "cr-5",
        course_code: "MATH110",
        terms_offered: ["Fall", "Winter"],
        workload_fulfillment: 1,
        is_full_year: false,
        sections_available: ["001"],
        is_external: true,
      },
    ],
  };
}
