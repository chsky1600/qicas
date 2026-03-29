import express from "express";

import {
    getAllCourses,
    getCourseByID,
    getCourseAssignmentsbyID,
    createCourse,
    updateCourse
} from "../controllers/courseController";
import { requireRole } from "../controllers/authController";

const router = express.Router();

router.get("/courses/:year", getAllCourses);
router.get("/courses/:year/:course_id", getCourseByID);
router.get("/courses/:year/:course_code/assignments", getCourseAssignmentsbyID);
router.post("/courses/:year", requireRole("admin"), createCourse);
router.patch("/courses/:year/:course_id", requireRole("admin"), updateCourse);

export default router;