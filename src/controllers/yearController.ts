import { Request, Response } from "express";
import type { CourseRule, InstructorRule } from "../types";
import {
  addCourseRule as addCourseRuleSvc,
  addInstructorRule as addInstructorRuleSvc,
  deleteCourseRuleByID as deleteCourseRuleByIDSvc,
  deleteInstructorRuleByID as deleteInstructorRuleByIDSvc,
  getCourseRuleByID as getCourseRuleByIDSvc,
  getCourseRules as getCourseRulesSvc,
  getInstructorRuleByID as getInstructorRuleByIDSvc,
  getInstructorRules as getInstructorRulesSvc,
  isYearRulesServiceError,
  updateCourseRuleByID as updateCourseRuleByIDSvc,
  updateInstructorRuleByID as updateInstructorRuleByIDSvc,
} from "../services/yearRulesService";
import { FacultyModel } from "../db/models/faculty";

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
  if (isYearRulesServiceError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
};

/**
 * List all course rules for an academic year.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getCourseRules = async (
  req: Request<{ year: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  if (!year_id) return res.status(400).json({ error: "Missing year" });

  try {
    const rules = await getCourseRulesSvc(faculty_id, year_id);
    res.json(rules);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Fetch a specific course rule by rule id.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getCourseRuleByID = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule_id = req.params.rule_id;
  if (!year_id || !rule_id) {
    return res.status(400).json({ error: "Missing year or rule_id" });
  }

  try {
    const rule = await getCourseRuleByIDSvc(faculty_id, year_id, rule_id);
    res.json(rule);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Create a course rule for an academic year.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const addCourseRule = async (
  req: Request<{ year: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule = req.body as CourseRule;
  if (!year_id || !rule?.id) {
    return res.status(400).json({ error: "Missing year or rule id" });
  }

  try {
    const created = await addCourseRuleSvc(faculty_id, year_id, rule);
    res.status(201).json(created);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Update an existing course rule by id.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const updateCourseRuleByID = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule_id = req.params.rule_id;
  if (!year_id || !rule_id) {
    return res.status(400).json({ error: "Missing year or rule_id" });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Missing update body" });
  }

  try {
    const updated = await updateCourseRuleByIDSvc(
      faculty_id,
      year_id,
      rule_id,
      req.body as Partial<CourseRule>
    );
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Delete a course rule by id.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const deleteCourseRuleByID = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule_id = req.params.rule_id;
  if (!year_id || !rule_id) {
    return res.status(400).json({ error: "Missing year or rule_id" });
  }

  try {
    const removed = await deleteCourseRuleByIDSvc(faculty_id, year_id, rule_id);
    res.json(removed);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * List all instructor rules for an academic year.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getInstructorRules = async (
  req: Request<{ year: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  if (!year_id) return res.status(400).json({ error: "Missing year" });

  try {
    const rules = await getInstructorRulesSvc(faculty_id, year_id);
    res.json(rules);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Fetch a specific instructor rule by rule id.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const getInstructorRuleByID = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule_id = req.params.rule_id;
  if (!year_id || !rule_id) {
    return res.status(400).json({ error: "Missing year or rule_id" });
  }

  try {
    const rule = await getInstructorRuleByIDSvc(faculty_id, year_id, rule_id);
    res.json(rule);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Create an instructor rule for an academic year.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const addInstructorRule = async (
  req: Request<{ year: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule = req.body as InstructorRule;
  if (!year_id || !rule?.id) {
    return res.status(400).json({ error: "Missing year or rule id" });
  }

  try {
    const created = await addInstructorRuleSvc(faculty_id, year_id, rule);
    res.status(201).json(created);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Update an existing instructor rule by id.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const updateInstructorRuleByID = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule_id = req.params.rule_id;
  if (!year_id || !rule_id) {
    return res.status(400).json({ error: "Missing year or rule_id" });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Missing update body" });
  }

  try {
    const updated = await updateInstructorRuleByIDSvc(
      faculty_id,
      year_id,
      rule_id,
      req.body as Partial<InstructorRule>
    );
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
};

/**
 * Delete an instructor rule by id.
 *
 * @param req - Express request
 * @param res - Express response
 */
export const deleteInstructorRuleByID = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  const year_id = req.params.year;
  const rule_id = req.params.rule_id;
  if (!year_id || !rule_id) {
    return res.status(400).json({ error: "Missing year or rule_id" });
  }

  try {
    const removed = await deleteInstructorRuleByIDSvc(
      faculty_id,
      year_id,
      rule_id
    );
    res.json(removed);
  } catch (err) {
    handleError(err, res);
  }
};

export const getYears = async (
  req: Request<{ year: string; rule_id: string }>,
  res: Response
) => {
  const faculty_id = requireFaculty(req, res);
  if (!faculty_id) return;
  try {
    const faculty = await FacultyModel.findOne(
      { id: faculty_id },
      {
        _id: 0,
        academic_years: 1,
      }
    ).lean();

    const years = faculty?.academic_years?.map((year: any) => ({
      id: year.id,
      name: year.name,
    })) ?? []
    res.json(years);
  } catch (err) {
    handleError(err, res);
  }
};