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

const router = express.Router();

router.get("/faculty", getFaculties)
router.post("/faculty", createFaculty)

router.get("/faculty/:faculty_id", getFacultyByID)
router.delete("/faculty/:faculty_id", deleteFacultyByID)

router.post("/faculty/:faculty_id/migrate", migrateFacultyToNewYear)
router.post("/faculty/:faculty_id/:user_id", addUserToFacultyByID)
router.delete("/faculty/:faculty_id/:user_id", removeUserFromFacultyByID)

export default router;
