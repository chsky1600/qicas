import { FacultyModel } from "../db/models/faculty";
import { UserModel } from "../db/models/user";
import type { User } from "../types";

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

/**
 * Get all users scoped to a faculty.
 *
 * @param faculty_id - Faculty identifier
 * @returns Array of users for the faculty
 */
export async function getAllUsers(faculty_id: string): Promise<User[]> {
  return UserModel.find({ faculty_id }).lean();
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
  const user = await UserModel.findOne({ faculty_id, id: user_id }).lean();
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
  const exists = await UserModel.findOne({ faculty_id, id: user.id }).lean();
  if (exists) {
    throw new ServiceError(409, "User id already exists");
  }
  const created = await UserModel.create({ ...user, faculty_id });
  const createdUser = created.toObject() as User;

  await FacultyModel.updateOne(
    { id: faculty_id, "users.id": { $ne: createdUser.id } },
    { $push: { users: createdUser } }
  );

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
  const updated = await UserModel.findOneAndUpdate(
    { faculty_id, id: user_id },
    { $set: { ...safeUpdates, id: user_id, faculty_id } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new ServiceError(404, "User not found");
  }
  const syncUpdate = await FacultyModel.updateOne(
    { id: faculty_id, "users.id": user_id },
    { $set: { "users.$": updated } }
  );
  if (syncUpdate.matchedCount === 0) {
    await FacultyModel.updateOne(
      { id: faculty_id, "users.id": { $ne: user_id } },
      { $push: { users: updated } }
    );
  }
  return updated as User;
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
  const deleted = await UserModel.findOneAndDelete({
    faculty_id,
    id: user_id,
  }).lean();
  if (!deleted) {
    throw new ServiceError(404, "User not found");
  }
  await FacultyModel.updateOne(
    { id: faculty_id },
    { $pull: { users: { id: user_id } } }
  );
  return deleted as User;
}
