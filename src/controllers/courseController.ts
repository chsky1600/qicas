import { Request, Response } from "express";
import { FacultyModel } from "../db/models/faculty";
import { Course } from "../types/course";

function normalizeCourseCapacity(course: Course, ensureDefaultSection: boolean): Course {
    const sections = Array.isArray(course.sections) ? course.sections : [];
    if (sections.length === 0) {
        course.sections = ensureDefaultSection ? [{ id: "SEC001", number: 1, capacity: 0 }] : [];
    } else {
        course.sections = sections.map((s) => ({
            ...s,
            capacity: typeof s.capacity === "number" ? s.capacity : 0,
        }));
    }
    course.capacity = course.sections.reduce((sum, s) => sum + (s.capacity ?? 0), 0);
    return course;
}

// returns all courses in the department 
// optionally filtered by academic year or term
// router.get("/courses/:year", getAllCourses);
export const getAllCourses = async (req : Request, res : Response) => {
    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;

    const faculty = await FacultyModel.findOne(
        { id: faculty_id },
        {
            _id: 0,
            academic_years: { $elemMatch: { id: year_id } },
        }
    ).lean();

    res.json(faculty?.academic_years?.[0]?.courses ?? [])
}

// gets a course by its ID
// router.get("/courses/:year/:course_id", getCourseByID);
export const getCourseByID = async (req : Request, res : Response) => {
    const year_id : string = req.params.year as string;
    const course_id : string = req.params.course_id as string;
    const faculty_id : string = req.body.faculty_id;

    const faculty = await FacultyModel.findOne(
    { id: faculty_id },
    {
        _id: 0,
        academic_years: { $elemMatch: { id: year_id } },
    }
    ).lean();

    if (!faculty){
        res.json(null);
        return;
    }

    const year = faculty.academic_years?.[0];

    if (!year){
        res.json(null);
        return;
    }
    const course = year.courses.find((c: any) => c.id === course_id);
    res.json(course ?? null)
}

// creates a new course, not based on any existing
// router.post("/courses/:year", createCourse);
export const createCourse = async (req : Request, res : Response) => {
    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;
    const course : Course = normalizeCourseCapacity(req.body.course as Course, true);

    const result = await FacultyModel.updateOne(
        {
            id: faculty_id,
            "academic_years.id": year_id,
        },
        {
            $push: {
                "academic_years.$.courses": course,
        },
        }
    );

    if(result.modifiedCount > 0){
        res.json(course)
    } else {
        res.sendStatus(200)
    }
}

// updates the course details as provided in request
// router.patch("/courses/:year/:course_id", updateCourse);
export const updateCourse = async (req : Request, res : Response) => {

    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;
    const updatedCourse : Course = normalizeCourseCapacity(req.body.course as Course, false);

    const result = await FacultyModel.updateOne(
        {
            id: faculty_id,
        },
        {
            $set: {
                "academic_years.$[year].courses.$[course]": updatedCourse,
            },
        },
        {
            arrayFilters: [
                { "year.id": year_id },
                { "course.id": updatedCourse.id },
            ],
        }
    );

    res.json(updatedCourse)
}

// gets all schedule entries where this course is assigned
// router.get("/courses/:year/:course_id/assignments", getCourseAssignmentsbyID);
export const getCourseAssignmentsbyID = async (req : Request, res : Response) => {
    const year_id : string = req.params.year as string;
    const course_code : string = req.params.course_code as string;
    const faculty_id : string = req.body.faculty_id;

    const result = await FacultyModel.aggregate([
        { $match: { id: faculty_id } },
        { $unwind: "$academic_years" },
        { $match: { "academic_years.id": year_id } },
        { $unwind: "$academic_years.schedules" },
        { $unwind: "$academic_years.schedules.assignments" },
        { $match: { "academic_years.schedules.assignments.course_code": course_code } },
        { $replaceRoot: { newRoot: "$academic_years.schedules.assignments" } },
    ]);
    res.json(result ?? [])
}
