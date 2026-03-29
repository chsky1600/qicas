import express from "express";

import {
  createInstructor,
  getAllInstructors,
  getInstructorAssignmentsByID,
  getInstructorByID,
  updateInstructor,
} from "../controllers/instructorController";
import { verifyToken, requireRole } from "../controllers/authController";

const router = express.Router();

router.use(verifyToken)

router.get("/instructors/:year", getAllInstructors);
router.get("/instructors/:year/:instructor_id", getInstructorByID);
router.get("/instructors/:year/:instructor_id/assignments", getInstructorAssignmentsByID);
router.post("/instructors/:year", requireRole("admin"), createInstructor);
router.patch("/instructors/:year/:instructor_id", requireRole("admin"), updateInstructor);

export default router;
