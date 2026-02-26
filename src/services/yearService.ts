import type { AcademicYear } from "../types";
import { FacultyModel } from "../db/models/faculty";

/**
 * Service for managing academic year data and constraints.
 */

/**
 * Retrieves the constraints/rules for a given academic year.
 * Used by ValidatorService to get the context for validation.
 *
 * @param year_id - The unique identifier of the academic year
 * @returns The academic year with all associated rules
 * @throws Error if the academic year is not found in any faculty
 */
export async function getYearConstraints(
  year_id: string
): Promise<AcademicYear> {
  const doc = await FacultyModel.findOne(
    { "academic_years.id": year_id },
    { _id: 0, "academic_years.$": 1 }
  ).lean();

  if (!doc || !doc.academic_years?.length) {
    throw new Error(`Academic year '${year_id}' not found`);
  }

  return doc.academic_years[0] as AcademicYear;
}
