import { FacultyModel } from "../db/models/faculty";
import type { User, UserRole } from "../types";

class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Type guard for ServiceError so controllers can return status codes. */
export function isUserServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError;
}

function assertValidRole(role: unknown): asserts role is UserRole {
  if (role !== "admin" && role !== "support") {
    throw new ServiceError(400, "Role must be admin or support");
  }
}

function assertValidPassword(password: string) {
  if (password.length < 8) {
    throw new ServiceError(400, "Password must be at least 8 characters");
  }
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as Partial<T>;
}

async function countAdmins(faculty_id: string): Promise<number> {
  const faculty = await FacultyModel.findOne(
    { id: faculty_id },
    { users: 1, _id: 0 }
  ).lean();
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }
  return faculty.users.filter((user: User) => user.role === "admin").length;
}

async function getFacultyDocument(faculty_id: string) {
  const faculty = await FacultyModel.findOne({ id: faculty_id });
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }
  return faculty;
}

/**
 * Get all users scoped to a faculty.
 *
 * @param faculty_id - Faculty identifier
 * @returns Array of users for the faculty
 */
export async function getAllUsers(faculty_id: string): Promise<User[]> {
  const faculty = await FacultyModel.findOne(
    { id: faculty_id },
    { users: 1, _id: 0 }
  ).lean();
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }
  return faculty.users as User[];
}

/**
 * Get a user by id scoped to a faculty.
 *
 * @param faculty_id - Faculty identifier
 * @param user_id - User identifier
 * @returns The user or throws if not found
 */
export async function getUserByID(
  faculty_id: string,
  user_id: string
): Promise<User> {
  const faculty = await FacultyModel.findOne(
    { id: faculty_id },
    { users: 1, _id: 0 }
  ).lean();
  if (!faculty) {
    throw new ServiceError(404, "Faculty not found");
  }
  const user = faculty.users.find((candidate: User) => candidate.id === user_id);
  if (!user) {
    throw new ServiceError(404, "User not found");
  }
  return user as User;
}

/**
 * Create a new user scoped to a faculty.
 *
 * @param faculty_id - Faculty identifier
 * @param user - User to create
 * @returns The created user
 */
export async function createUser(
  faculty_id: string,
  user: User
): Promise<User> {
  assertValidRole(user.role);
  assertValidPassword(user.password);
  const faculty = await getFacultyDocument(faculty_id);
  const exists = faculty.users.some((candidate: User) => candidate.id === user.id);
  if (exists) {
    throw new ServiceError(409, "User id already exists");
  }

  const hashedPassword = await Bun.password.hash(user.password);
  const createdUser = {
    ...user,
    faculty_id,
    password: hashedPassword,
    must_change_password: user.must_change_password ?? false,
  } as User;

  faculty.users.push(createdUser);
  await faculty.save();

  return createdUser;
}

/**
 * Partially update a user by id scoped to a faculty.
 *
 * @param faculty_id - Faculty identifier
 * @param user_id - User identifier
 * @param updates - Partial fields to update
 * @returns The updated user
 */
export async function updateUserByID(
  faculty_id: string,
  user_id: string,
  updates: Partial<User>
): Promise<User> {
  const safeUpdates = updates ?? {};
  const faculty = await getFacultyDocument(faculty_id);
  const existingIndex = faculty.users.findIndex(
    (candidate: User) => candidate.id === user_id
  );
  if (existingIndex === -1) {
    throw new ServiceError(404, "User not found");
  }
  const existing = faculty.users[existingIndex] as User;

  if (safeUpdates.role !== undefined) {
    assertValidRole(safeUpdates.role);
    if (
      existing.role === "admin" &&
      safeUpdates.role !== "admin" &&
      (await countAdmins(faculty_id)) <= 1
    ) {
      throw new ServiceError(409, "Faculty must retain at least one admin");
    }
  }

  const updatePayload = omitUndefined({
    name: safeUpdates.name,
    email: safeUpdates.email,
    role: safeUpdates.role,
    must_change_password: safeUpdates.must_change_password,
  });

  const userDoc = faculty.users[existingIndex] as User & {
    toObject?: () => User;
    password?: string;
  };

  if (updatePayload.name !== undefined) userDoc.name = updatePayload.name;
  if (updatePayload.email !== undefined) userDoc.email = updatePayload.email;
  if (updatePayload.role !== undefined) userDoc.role = updatePayload.role;
  if (updatePayload.must_change_password !== undefined) userDoc.must_change_password = updatePayload.must_change_password;
  if (safeUpdates.password !== undefined) {
    assertValidPassword(safeUpdates.password);
    userDoc.password = await Bun.password.hash(safeUpdates.password);
  }

  await faculty.save();
  return typeof userDoc.toObject === "function"
    ? (userDoc.toObject() as User)
    : (userDoc as User);
}

/**
 * Delete a user by id scoped to a faculty.
 *
 * @param faculty_id - Faculty identifier
 * @param user_id - User identifier
 * @returns The deleted user
 */
export async function deleteUserByID(
  faculty_id: string,
  user_id: string
): Promise<User> {
  const faculty = await getFacultyDocument(faculty_id);
  const existingIndex = faculty.users.findIndex(
    (candidate: User) => candidate.id === user_id
  );
  if (existingIndex === -1) {
    throw new ServiceError(404, "User not found");
  }
  const existing = faculty.users[existingIndex] as User;
  if (existing.role === "admin" && (await countAdmins(faculty_id)) <= 1) {
    throw new ServiceError(409, "Faculty must retain at least one admin");
  }

  faculty.users.splice(existingIndex, 1);
  await faculty.save();
  return existing;
}
