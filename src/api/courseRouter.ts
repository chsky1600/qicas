import express from "express";

import {
    getAllCourses,
    getCourseByID,
    getCourseAssignmentsbyID,
    createCourse,
    updateCourse
} from "../controllers/courseController";

const router = express.Router();

router.get("/courses/:year", getAllCourses);
router.get("/courses/:year/:course_id", getCourseByID);
router.get("/courses/:year/:course_id/assignments", getCourseAssignmentsbyID);
router.post("/courses/:year", createCourse);
router.patch("/courses/:year/:course_id", updateCourse);

export default router;