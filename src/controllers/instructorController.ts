import { Request, Response } from "express";
import { FacultyModel } from "../db/models/faculty";
import { Instructor } from "../types";

// returns all instructors in the department
// optionally filtered by faculty or role
export const getAllInstructors = async (req: Request, res: Response) => {
  const year_id : string = req.params.year as string;
  const faculty_id : string = req.body.faculty_id;

  const doc = await FacultyModel.findOne(
    { id: faculty_id, "academic_years.id": year_id },
    { _id: 0, academic_years: { $elemMatch: { id: year_id } } }
  ).lean();

  const instructors = doc?.academic_years?.[0]?.instructors ?? [];
  return res.json(instructors);
};

// gets an instructor by their ID
export const getInstructorByID = async (req: Request, res: Response) => {
  const year_id : string = req.params.year as string;
  const instructor_id : string = req.params.instructor_id as string;
  const faculty_id : string = req.body.faculty_id;

  const doc = await FacultyModel.findOne(
    { id: faculty_id, "academic_years.id": year_id },
    { _id: 0, academic_years: { $elemMatch: { id: year_id } } }
  ).lean();

  const instructor =
    doc?.academic_years?.[0]?.instructors?.find((i: any) => i.id === instructor_id) ?? null;

  if (!instructor) return res.status(404).json({ error: "Instructor not found" });
  return res.json(instructor);
}

// creates a new instructor profile
export const createInstructor = async (req: Request, res: Response) => {
  const year_id : string = req.params.year as string;
  const faculty_id : string = req.body.faculty_id;
  const instructor : Instructor = req.body.instructor as Instructor;

  const result = await FacultyModel.updateOne(
    {
      id: faculty_id,
      "academic_years.id": year_id,
      // prevent duplicate instructor ids
      "academic_years.instructors.id": { $ne: instructor.id },
    },
    {
      $push: {
        "academic_years.$.instructors": instructor,
      },
    }
  );

  if (result.modifiedCount === 0) {
    return res.status(400).json({ error: "Year not found or instructor already exists" });
  }

  return res.status(201).json(instructor);
}

// updates instructor details as provided in request
export const updateInstructor = async (req: Request, res: Response) => {
  const faculty_id : string = req.body.faculty_id;
  const yearId = req.params.year;
  const instructor_id : string = req.params.instructor_id as string;
  const updatedInstructor : Instructor = req.body.instructor as Instructor;


  // Ensure the id stays consistent
  updatedInstructor.id = instructor_id;

  const result = await FacultyModel.updateOne(
    { id: faculty_id },
    {
      $set: {
        "academic_years.$[year].instructors.$[inst]": updatedInstructor,
      },
    },
    {
      arrayFilters: [
        { "year.id": yearId },
        { "inst.id": instructor_id },
      ],
    }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Faculty/year/instructor not found" });
  }

  return res.json(updatedInstructor);
}

// gets all course or schedule assignments where this instructor is involved
export const getInstructorAssignmentsByID = async (req: Request, res: Response) => {
  const year_id : string = req.params.year as string;
  const instructor_id : string = req.params.instructor_id as string;
  const faculty_id : string = req.body.faculty_id;

  const assignments = await FacultyModel.aggregate([
    { $match: { id: faculty_id } },
    { $unwind: "$academic_years" },
    { $match: { "academic_years.id": year_id } },
    { $unwind: "$academic_years.schedules" },
    { $unwind: "$academic_years.schedules.assignments" },
    { $match: { "academic_years.schedules.assignments.instructor_id": instructor_id } },
    // Optional: include schedule info alongside each assignment
    {
      $project: {
        _id: 0,
        schedule_id: "$academic_years.schedules.id",
        schedule_name: "$academic_years.schedules.name",
        assignment: "$academic_years.schedules.assignments",
      },
    },
  ]);

  return res.json(assignments);
}