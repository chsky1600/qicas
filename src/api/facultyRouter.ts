import express from "express";

import {
    createFaculty,
    addUserToFacultyByID,
    migrateFacultyToNewYear,
    removeUserFromFacultyByID,
    getFacultyByID,
    deleteFacultyByID,
    getFaculties
} from "../controllers/facultyController";
import { requireRole } from "../controllers/authController";

const router = express.Router();

router.get("/faculty", getFaculties)
router.post("/faculty", requireRole("admin"), createFaculty)

router.get("/faculty/:faculty_id", getFacultyByID)
router.delete("/faculty/:faculty_id", requireRole("admin"), deleteFacultyByID)

router.post("/faculty/migrate", requireRole("admin"), migrateFacultyToNewYear)
router.post("/faculty/:faculty_id/:user_id", requireRole("admin"), addUserToFacultyByID)
router.delete("/faculty/:faculty_id/:user_id", requireRole("admin"), removeUserFromFacultyByID)

export default router;
