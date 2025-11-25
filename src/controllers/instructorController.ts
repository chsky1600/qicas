import { Request, Response } from "express";

// returns all instructors in the department
// optionally filtered by faculty or role
export const getAllInstructors = async (_req: Request, _res: Response) => {
  // TODO: implement instructor listing logic
};

// gets an instructor by their ID
export const getInstructorByID = async (_req: Request, _res: Response) => {
  // TODO: implement single instructor lookup
};

// creates a new instructor profile
export const createInstructor = async (_req: Request, _res: Response) => {
  // TODO: implement instructor creation
};

// updates instructor details as provided in request
export const updateInstructor = async (_req: Request, _res: Response) => {
  // TODO: implement instructor update
};

// gets all course or schedule assignments where this instructor is involved
export const getInstructorAssignmentsByID = async (_req: Request, _res: Response) => {
  // TODO: implement instructor assignment lookup
};

// duplicates an instructor profile into a new record (placeholder copy behaviour)
export const snapshotInstructor = async (_req: Request, _res: Response) => {
  // TODO: implement instructor snapshot
};
