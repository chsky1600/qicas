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

router.get("/instructors", getAllInstructors);
router.get("/instructors/:instructor_id", getInstructorByID);
router.get("/instructors/:instructor_id/assignments", getInstructorAssignmentsByID);
router.post("/instructors", createInstructor);
router.patch("/instructors/:instructor_id", updateInstructor);

export default router;
