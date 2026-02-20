import express from "express";

import {
  createInstructor,
  getAllInstructors,
  getInstructorAssignmentsByID,
  getInstructorByID,
  updateInstructor,
} from "../controllers/instructorController";
import { verifyToken } from "../controllers/authController";

const router = express.Router();

router.use(verifyToken)

router.get("/instructors/:year", getAllInstructors);
router.get("/instructors/:year/:instructor_id", getInstructorByID);
router.get("/instructors/:year/:instructor_id/assignments", getInstructorAssignmentsByID);
router.post("/instructors/:year", createInstructor);
router.patch("/instructors/:year/:instructor_id", updateInstructor);

export default router;
