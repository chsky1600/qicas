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

const router = express.Router();

router.get("/year", getYears)

router.get("/year/:year/rules/courses", getCourseRules)
router.post("/year/:year/rules/courses", addCourseRule)

router.get("/year/:year/rules/courses/:rule_id", getCourseRuleByID)
router.put("/year/:year/rules/courses/:rule_id", updateCourseRuleByID)
router.delete("/year/:year/rules/courses/:rule_id", deleteCourseRuleByID)

router.get("/year/:year/rules/instructors", getInstructorRules)
router.post("/year/:year/rules/instructors", addInstructorRule)

router.get("/year/:year/rules/instructors/:rule_id", getInstructorRuleByID)
router.put("/year/:year/rules/instructors/:rule_id", updateInstructorRuleByID)
router.delete("/year/:year/rules/instructors/:rule_id", deleteInstructorRuleByID)

export default router;
