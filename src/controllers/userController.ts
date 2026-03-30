import { Request, Response } from "express";
import type { PublicUser, User } from "../types";
import {
  createUser as createUserSvc,
  deleteUserByID as deleteUserByIDSvc,
  getAllUsers as getAllUsersSvc,
  getUserByID as getUserByIDSvc,
  isUserServiceError,
  updateUserByID as updateUserByIDSvc,
} from "../services/userService";

/**
 * Extract faculty_id from the request body (set by auth middleware).
 *
 * @param req - Express request
 * @param res - Express response
 * @returns faculty_id or null if missing
 */
const requireFaculty = (req: Request, res: Response): string | null => {
  const faculty_id = req.body.faculty_id as string | undefined;
  if (!faculty_id) {
    res.status(400).json({ error: "Missing faculty_id" });
    return null;
  }
  return faculty_id;
};

/**
 * Translate service errors into HTTP responses.
 *
 * @param err - Error thrown by service layer
 * @param res - Express response
 */
const handleError = (err: unknown, res: Response) => {
  if (isUserServiceError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
};

const sanitizeUser = (user: User): PublicUser => {
  const { password, ...rest } = user;
  return rest;
};

/**
 * Get a user by id scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getUserByID = async (
  req: Request<{ user_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const user_id = req.params.user_id;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    const user = await getUserByIDSvc(faculty_id, user_id);
    res.json(sanitizeUser(user));
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Create a new user scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const createUser = async (req: Request, res: Response) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const user = {
    id: req.body?.id,
    faculty_id,
    name: req.body?.name,
    email: req.body?.email,
    password: req.body?.password,
    role: req.body?.user_role,
    must_change_password: req.body?.must_change_password ?? false,
  } as User;
  if (!user?.id || !user?.name || !user?.email || !user?.password || !user?.role) {
    return res.status(400).json({ error: "Missing required user fields" });
  }

  try {
    const created = await createUserSvc(faculty_id, user);
    res.status(201).json(sanitizeUser(created));
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * List all users for the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getAllUsers = async (req: Request, res: Response) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;

  try {
    const users = await getAllUsersSvc(faculty_id);
    res.json(users.map(sanitizeUser));
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Update a user by id scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const updateUserByID = async (
  req: Request<{ user_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const user_id = req.params.user_id;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });
  const hasEditableField =
    req.body?.name !== undefined ||
    req.body?.email !== undefined ||
    req.body?.password !== undefined ||
    req.body?.user_role !== undefined ||
    req.body?.must_change_password !== undefined;
  if (!hasEditableField) {
    return res.status(400).json({ error: "Missing update body" });
  }

  try {
    const updates = {
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
      role: req.body?.user_role,
      must_change_password: req.body?.must_change_password,
    } as Partial<User>;
    const updated = await updateUserByIDSvc(
      faculty_id,
      user_id,
      updates
    );
    res.json(sanitizeUser(updated));
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Delete a user by id scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const deleteUserByID = async (
  req: Request<{ user_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const user_id = req.params.user_id;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    const deleted = await deleteUserByIDSvc(faculty_id, user_id);
    res.json(sanitizeUser(deleted));
  } catch (err) {
    handleError(err, res);
  }
};
