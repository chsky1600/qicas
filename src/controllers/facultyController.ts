import { Request, Response } from "express";
import type { Faculty } from "../types";
import {
  addUserToFacultyByID as addUserToFacultyByIDSvc,
  createFaculty as createFacultySvc,
  deleteFacultyByID as deleteFacultyByIDSvc,
  getFaculties as getFacultiesSvc,
  getFacultyByID as getFacultyByIDSvc,
  isFacultyServiceError,
  migrateFacultyToNewYear as migrateFacultyToNewYearSvc,
  removeUserFromFacultyByID as removeUserFromFacultyByIDSvc,
} from "../services/facultyService";

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
  if (isFacultyServiceError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
};

/**
 * List the authenticated faculty (as an array of one).
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getFaculties = async (req: Request, res: Response) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;

  try {
    const faculties = await getFacultiesSvc(faculty_id);
    res.json(faculties);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Get a faculty by id, scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getFacultyByID = async (
  req: Request<{ faculty_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const target_id = req.params.faculty_id;
  if (!target_id) return res.status(400).json({ error: "Missing faculty_id" });

  try {
    const faculty = await getFacultyByIDSvc(faculty_id, target_id);
    res.json(faculty);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Create a faculty scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const createFaculty = async (req: Request, res: Response) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const faculty = req.body as Faculty;
  if (!faculty?.id) {
    return res.status(400).json({ error: "Missing faculty id" });
  }

  try {
    const created = await createFacultySvc(faculty_id, faculty);
    res.status(201).json(created);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Delete a faculty by id, scoped to the authenticated faculty.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const deleteFacultyByID = async (
  req: Request<{ faculty_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const target_id = req.params.faculty_id;
  if (!target_id) return res.status(400).json({ error: "Missing faculty_id" });

  try {
    const deleted = await deleteFacultyByIDSvc(faculty_id, target_id);
    res.json(deleted);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Add an existing user to the faculty's embedded users list.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const addUserToFacultyByID = async (
  req: Request<{ faculty_id: string; user_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const target_id = req.params.faculty_id;
  const user_id = req.params.user_id;
  if (!target_id || !user_id) {
    return res.status(400).json({ error: "Missing faculty_id or user_id" });
  }

  try {
    const updated = await addUserToFacultyByIDSvc(
      faculty_id,
      target_id,
      user_id
    );
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Remove a user from the faculty's embedded users list.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const removeUserFromFacultyByID = async (
  req: Request<{ faculty_id: string; user_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const target_id = req.params.faculty_id;
  const user_id = req.params.user_id;
  if (!target_id || !user_id) {
    return res.status(400).json({ error: "Missing faculty_id or user_id" });
  }

  try {
    const updated = await removeUserFromFacultyByIDSvc(
      faculty_id,
      target_id,
      user_id
    );
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Migrate a faculty to a new academic year by cloning rules/courses/instructors.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const migrateFacultyToNewYear = async (
  req: Request<{ faculty_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const target_id = req.params.faculty_id;
  if (!target_id) return res.status(400).json({ error: "Missing faculty_id" });

  const { source_year_id, new_year_id, name, schedule_ids } = req.body ?? {};
  if (!source_year_id || !new_year_id) {
    return res.status(400).json({ error: "Missing source_year_id or new_year_id" });
  }
  if (schedule_ids !== undefined && !Array.isArray(schedule_ids)) {
    return res.status(400).json({ error: "schedule_ids must be an array of strings" });
  }

  try {
    const updated = await migrateFacultyToNewYearSvc(
      faculty_id,
      target_id,
      source_year_id,
      new_year_id,
      name,
      schedule_ids
    );
    res.status(201).json(updated);
  } catch (err) {
    handleError(err, res);
  }
};
