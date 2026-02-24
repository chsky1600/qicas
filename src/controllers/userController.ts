import { Request, Response } from "express";
import type { User } from "../types";
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
    res.json(user);
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
  const user = req.body as User;
  if (!user?.id) {
    return res.status(400).json({ error: "Missing user id" });
  }

  try {
    const created = await createUserSvc(faculty_id, user);
    res.status(201).json(created);
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
    res.json(users);
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
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Missing update body" });
  }

  try {
    const updated = await updateUserByIDSvc(
      faculty_id,
      user_id,
      req.body as Partial<User>
    );
    res.json(updated);
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
    res.json(deleted);
  } catch (err) {
    handleError(err, res);
  }
};
