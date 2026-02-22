import { FacultyModel } from "../db/models/faculty";
import type { CourseRule, InstructorRule } from "../types";

/** Service-layer error with HTTP status for controller responses. */
class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Load a faculty document or throw a 404 service error.
 *
 * @param faculty_id - Faculty identifier
 */
async function getFacultyOrThrow(faculty_id: string) {
  const faculty = await FacultyModel.findOne({ id: faculty_id });
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }
  return faculty;
}

/**
 * Resolve an academic year from a faculty document or throw a 404.
 *
 * @param faculty - Faculty document
 * @param year_id - Academic year identifier
 */
function getYearOrThrow(faculty: any, year_id: string) {
  const year = faculty.academic_years.find((y: any) => y.id === year_id);
  if (!year) {
    throw new ServiceError(404, "Academic year not found");
  }
  return year;
}

/**
 * Type guard for ServiceError so controllers can return status codes.
 *
 * @param err - Unknown error
 * @returns True if the error is a ServiceError
 */
export function isYearRulesServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError;
}

/**
 * Get all course rules for a given academic year.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @returns Array of course rules
 */
export async function getCourseRules(
  faculty_id: string,
  year_id: string
): Promise<CourseRule[]> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  return year.course_rules;
}

/**
 * Get a course rule by its rule id.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule_id - Course rule identifier
 * @returns The matching course rule
 */
export async function getCourseRuleByID(
  faculty_id: string,
  year_id: string,
  rule_id: string
): Promise<CourseRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const rule = year.course_rules.find((r: CourseRule) => r.id === rule_id);
  if (!rule) {
    throw new ServiceError(404, "Course rule not found");
  }
  return rule;
}

/**
 * Add a new course rule to an academic year.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule - Course rule to add
 * @returns The created rule
 */
export async function addCourseRule(
  faculty_id: string,
  year_id: string,
  rule: CourseRule
): Promise<CourseRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const exists = year.course_rules.some((r: CourseRule) => r.id === rule.id);
  if (exists) {
    throw new ServiceError(409, "Course rule id already exists");
  }
  year.course_rules.push(rule);
  await faculty.save();
  return rule;
}

/**
 * Update a course rule by id.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule_id - Course rule identifier
 * @param updates - Partial fields to update
 * @returns The updated rule
 */
export async function updateCourseRuleByID(
  faculty_id: string,
  year_id: string,
  rule_id: string,
  updates: Partial<CourseRule>
): Promise<CourseRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const index = year.course_rules.findIndex((r: CourseRule) => r.id === rule_id);
  if (index === -1) {
    throw new ServiceError(404, "Course rule not found");
  }
  const current = year.course_rules[index] as any;
  const base =
    typeof current?.toObject === "function" ? current.toObject() : current;
  const safeUpdates = updates ?? {};
  const updated: CourseRule = { ...base, ...safeUpdates, id: rule_id };
  year.course_rules[index] = updated;
  await faculty.save();
  return updated;
}

/**
 * Delete a course rule by id.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule_id - Course rule identifier
 * @returns The removed rule
 */
export async function deleteCourseRuleByID(
  faculty_id: string,
  year_id: string,
  rule_id: string
): Promise<CourseRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const index = year.course_rules.findIndex((r: CourseRule) => r.id === rule_id);
  if (index === -1) {
    throw new ServiceError(404, "Course rule not found");
  }
  const [removed] = year.course_rules.splice(index, 1);
  await faculty.save();
  return removed as CourseRule;
}

/**
 * Get all instructor rules for a given academic year.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @returns Array of instructor rules
 */
export async function getInstructorRules(
  faculty_id: string,
  year_id: string
): Promise<InstructorRule[]> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  return year.instructor_rules;
}

/**
 * Get an instructor rule by id.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule_id - Instructor rule identifier
 * @returns The matching instructor rule
 */
export async function getInstructorRuleByID(
  faculty_id: string,
  year_id: string,
  rule_id: string
): Promise<InstructorRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const rule = year.instructor_rules.find((r: InstructorRule) => r.id === rule_id);
  if (!rule) {
    throw new ServiceError(404, "Instructor rule not found");
  }
  return rule;
}

/**
 * Add a new instructor rule to an academic year.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule - Instructor rule to add
 * @returns The created rule
 */
export async function addInstructorRule(
  faculty_id: string,
  year_id: string,
  rule: InstructorRule
): Promise<InstructorRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const exists = year.instructor_rules.some((r: InstructorRule) => r.id === rule.id);
  if (exists) {
    throw new ServiceError(409, "Instructor rule id already exists");
  }
  year.instructor_rules.push(rule);
  await faculty.save();
  return rule;
}

/**
 * Update an instructor rule by id.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule_id - Instructor rule identifier
 * @param updates - Partial fields to update
 * @returns The updated rule
 */
export async function updateInstructorRuleByID(
  faculty_id: string,
  year_id: string,
  rule_id: string,
  updates: Partial<InstructorRule>
): Promise<InstructorRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const index = year.instructor_rules.findIndex((r: InstructorRule) => r.id === rule_id);
  if (index === -1) {
    throw new ServiceError(404, "Instructor rule not found");
  }
  const current = year.instructor_rules[index] as any;
  const base =
    typeof current?.toObject === "function" ? current.toObject() : current;
  const safeUpdates = updates ?? {};
  const updated: InstructorRule = { ...base, ...safeUpdates, id: rule_id };
  year.instructor_rules[index] = updated;
  await faculty.save();
  return updated;
}

/**
 * Delete an instructor rule by id.
 *
 * @param faculty_id - Faculty identifier
 * @param year_id - Academic year identifier
 * @param rule_id - Instructor rule identifier
 * @returns The removed rule
 */
export async function deleteInstructorRuleByID(
  faculty_id: string,
  year_id: string,
  rule_id: string
): Promise<InstructorRule> {
  const faculty = await getFacultyOrThrow(faculty_id);
  const year = getYearOrThrow(faculty, year_id);
  const index = year.instructor_rules.findIndex((r: InstructorRule) => r.id === rule_id);
  if (index === -1) {
    throw new ServiceError(404, "Instructor rule not found");
  }
  const [removed] = year.instructor_rules.splice(index, 1);
  await faculty.save();
  return removed as InstructorRule;
}
