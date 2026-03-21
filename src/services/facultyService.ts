import { FacultyModel } from "../db/models/faculty";
import { UserModel } from "../db/models/user";
import type { AcademicYear, Faculty, User } from "../types";

class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Type guard for ServiceError so controllers can return status codes. */
export function isFacultyServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError;
}

function normalizeForClone<T>(value: T): T {
  const anyValue = value as any;
  if (anyValue && typeof anyValue === "object") {
    const maybeToObject = anyValue.toObject as (() => unknown) | undefined;
    if (typeof maybeToObject === "function") {
      return maybeToObject.call(anyValue) as T;
    }
  }
  return value;
}

function cloneWithoutMongoIds<T>(value: T): T {
  if (value === null || value === undefined) return value;

  const normalized = normalizeForClone(value);

  if (normalized instanceof Date) {
    return new Date(normalized.getTime()) as T;
  }

  if (Array.isArray(normalized)) {
    return normalized.map((item) => cloneWithoutMongoIds(item)) as T;
  }

  if (typeof normalized === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(
      normalized as Record<string, unknown>
    )) {
      if (key === "_id" || key === "__v") continue;
      result[key] = cloneWithoutMongoIds(val as unknown);
    }
    return result as T;
  }

  return normalized;
}

/**
 * Get the authenticated faculty (as a list of one).
 *
 * @param faculty_id - Faculty identifier from JWT
 * @returns Array containing the faculty if found
 */
export async function getFaculties(faculty_id: string): Promise<Faculty[]> {
  return FacultyModel.find({ id: faculty_id }).lean();
}

/**
 * Get a faculty by id, scoped to the authenticated faculty.
 *
 * @param faculty_id - Faculty identifier from JWT
 * @param target_id - Faculty id from route param
 * @returns Faculty document
 */
export async function getFacultyByID(
  faculty_id: string,
  target_id: string
): Promise<Faculty> {
  if (target_id !== faculty_id) {
    throw new ServiceError(404, "Faculty not found");
  }
  const faculty = await FacultyModel.findOne({ id: faculty_id }).lean();
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }
  return faculty as Faculty;
}

/**
 * Create a new faculty scoped to the authenticated faculty.
 *
 * @param faculty_id - Faculty identifier from JWT
 * @param faculty - Faculty payload
 * @returns Created faculty
 */
export async function createFaculty(
  faculty_id: string,
  faculty: Faculty
): Promise<Faculty> {
  if (faculty.id !== faculty_id) {
    throw new ServiceError(400, "Faculty id must match token faculty_id");
  }
  const exists = await FacultyModel.findOne({ id: faculty_id }).lean();
  if (exists) {
    throw new ServiceError(409, "Faculty id already exists");
  }

  const created = await FacultyModel.create({
    ...faculty,
    users: faculty.users ?? [],
    academic_years: faculty.academic_years ?? [],
  });
  return created.toObject() as Faculty;
}

/**
 * Delete a faculty by id, scoped to the authenticated faculty.
 *
 * @param faculty_id - Faculty identifier from JWT
 * @param target_id - Faculty id from route param
 * @returns Deleted faculty
 */
export async function deleteFacultyByID(
  faculty_id: string,
  target_id: string
): Promise<Faculty> {
  if (target_id !== faculty_id) {
    throw new ServiceError(404, "Faculty not found");
  }
  const deleted = await FacultyModel.findOneAndDelete({ id: faculty_id }).lean();
  if (!deleted) {
    throw new ServiceError(404, "Faculty not found");
  }
  return deleted as Faculty;
}

/**
 * Add an existing user to the faculty's embedded users list.
 *
 * @param faculty_id - Faculty identifier from JWT
 * @param target_id - Faculty id from route param
 * @param user_id - User id to add
 * @returns Updated faculty
 */
export async function addUserToFacultyByID(
  faculty_id: string,
  target_id: string,
  user_id: string
): Promise<Faculty> {
  if (target_id !== faculty_id) {
    throw new ServiceError(404, "Faculty not found");
  }

  const user = await UserModel.findOne({ id: user_id, faculty_id }).lean();
  if (!user) {
    throw new ServiceError(404, "User not found");
  }

  const faculty = await FacultyModel.findOne({ id: faculty_id });
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }

  const already = faculty.users.some((u: User) => u.id === user_id);
  if (already) {
    throw new ServiceError(409, "User already in faculty");
  }

  faculty.users.push(user as User);
  await faculty.save();
  return faculty.toObject() as Faculty;
}

/**
 * Remove a user from the faculty's embedded users list.
 *
 * @param faculty_id - Faculty identifier from JWT
 * @param target_id - Faculty id from route param
 * @param user_id - User id to remove
 * @returns Updated faculty
 */
export async function removeUserFromFacultyByID(
  faculty_id: string,
  target_id: string,
  user_id: string
): Promise<Faculty> {
  if (target_id !== faculty_id) {
    throw new ServiceError(404, "Faculty not found");
  }

  const faculty = await FacultyModel.findOne({ id: faculty_id });
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }

  faculty.users = faculty.users.filter((u: User) => u.id !== user_id);
  await faculty.save();
  return faculty.toObject() as Faculty;
}

/**
 * Clone rules/courses/instructors into a new academic year with empty schedules.
 * Uses a deep clone and strips Mongo _id fields to avoid shared references.
 *
 * @param faculty_id - Faculty identifier from JWT
 * @param target_id - Faculty id from route param
 * @param source_year_id - Existing year to copy from
 * @param new_year_id - New year id to create
 * @param name - Optional display name
 * @returns Updated faculty
 */
export async function migrateFacultyToNewYear(
  faculty_id: string,
  target_id: string,
  source_year_id: string,
  new_year_id: string,
  name?: string,
  schedule_ids?: string[]
): Promise<Faculty> {
  if (target_id !== faculty_id) {
    throw new ServiceError(404, "Faculty not found");
  }

  const faculty = await FacultyModel.findOne({ id: faculty_id });
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }

  const existing = faculty.academic_years.find(
    (y: AcademicYear) => y.id === new_year_id
  );
  if (existing) {
    throw new ServiceError(409, "Academic year already exists");
  }

  const source = faculty.academic_years.find(
    (y: AcademicYear) => y.id === source_year_id
  );
  if (!source) {
    throw new ServiceError(404, "Source academic year not found");
  }

  const pickedSchedules = schedule_ids?.length
    ? source.schedules.filter(s => schedule_ids.includes(s.id))
    : [];

  const clonedSchedules = cloneWithoutMongoIds(pickedSchedules).map(s => ({
    ...s,
    year_id: new_year_id,
  }));

  const newYear: AcademicYear = {
    id: new_year_id,
    name: name ?? `${source.name} (Copy)`,
    schedules: clonedSchedules,
    courses: cloneWithoutMongoIds(source.courses),
    instructors: cloneWithoutMongoIds(source.instructors),
    instructor_rules: cloneWithoutMongoIds(source.instructor_rules),
    course_rules: cloneWithoutMongoIds(source.course_rules),
  };

  faculty.academic_years.push(newYear);
  await faculty.save();
  return faculty.toObject() as Faculty;
}
