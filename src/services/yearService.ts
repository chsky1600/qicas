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
    name: "2024-2025",
    schedules: [],
    courses: [
      { id: "c-1", name: "Intro to Computing", code: "CISC101", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-1", number: 1 }, { id: "s-2", number: 2 }, { id: "s-3", number: 3 }] },
      { id: "c-2", name: "Intro to Computer Science", code: "CISC121", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-4", number: 1 }] },
      { id: "c-3", name: "Intro to CS II", code: "CISC124", level: "undergrad1", year_introduced: "2000", notes: [], sections: [{ id: "s-5", number: 1 }] },
      { id: "c-4", name: "Data Structures", code: "CISC203", level: "undergrad2", year_introduced: "2000", notes: [], sections: [{ id: "s-6", number: 1 }] },
      { id: "c-5", name: "Logic for Computing", code: "CISC204", level: "undergrad2", year_introduced: "2000", notes: [], sections: [{ id: "s-7", number: 1 }] },
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
    ],
    instructor_rules: [
      {
        id: "ir-1",
        instructor_id: "inst-1",
        designations: ["undergrad-coordinator"],
        workload_delta: -1,
        courses: [],
      },
      {
        id: "ir-2",
        instructor_id: "inst-2",
        designations: [],
        workload_delta: 0,
        courses: ["CISC101", "CISC121"],
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
      },
      {
        id: "cr-2",
        course_code: "CISC204",
        terms_offered: ["Fall"],
        workload_fulfillment: 1,
        is_full_year: false,
        sections_available: ["001"],
      },
    ],
  };
}
