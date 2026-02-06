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
    courses: ["CISC101", "CISC121", "CISC124", "CISC203", "CISC204"],
    instructors: ["inst-1", "inst-2", "inst-3"],
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
