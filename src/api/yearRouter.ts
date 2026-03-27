import express from "express";

import {
    addCourseRule,
    addInstructorRule,
    deleteCourseRuleByID,
    deleteInstructorRuleByID,
    getCourseRuleByID,
    getCourseRules,
    getInstructorRuleByID,
    getInstructorRules,
    getYears,
    updateCourseRuleByID,
    updateInstructorRuleByID
} from "../controllers/yearController";
import { requireRole } from "../controllers/authController";

const router = express.Router();

router.get("/year", getYears)

router.get("/year/:year/rules/courses", getCourseRules)
router.post("/year/:year/rules/courses", requireRole("admin"), addCourseRule)

router.get("/year/:year/rules/courses/:rule_id", getCourseRuleByID)
router.put("/year/:year/rules/courses/:rule_id", requireRole("admin"), updateCourseRuleByID)
router.delete("/year/:year/rules/courses/:rule_id", requireRole("admin"), deleteCourseRuleByID)

router.get("/year/:year/rules/instructors", getInstructorRules)
router.post("/year/:year/rules/instructors", requireRole("admin"), addInstructorRule)

router.get("/year/:year/rules/instructors/:rule_id", getInstructorRuleByID)
router.put("/year/:year/rules/instructors/:rule_id", requireRole("admin"), updateInstructorRuleByID)
router.delete("/year/:year/rules/instructors/:rule_id", requireRole("admin"), deleteInstructorRuleByID)

export default router;
