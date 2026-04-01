import express from "express";

import {
    getScheduleByID,
    renameSchedule,
    setRCSchedule,
    setWorkingSchedule,
    createSnapshot,
    getSchedules,
    deleteSchedule,
    addAssignment,
    removeAssignment,
    validateSchedule,
    getWorkingSchedule,
    getScheduleVersion
} from "../controllers/scheduleController";
import { verifyToken, requireRole } from "../controllers/authController";

const router = express.Router();

router.use(verifyToken)

router.get("/schedule/:year/:schedule_id/version", getScheduleVersion)
router.get("/schedule/:year/:schedule_id",getScheduleByID)
router.put("/schedule/active/:schedule_id",setWorkingSchedule)
router.get("/schedule/", getWorkingSchedule)

router.get("/schedule/:year",getSchedules)
router.put("/schedule/:year/rename", requireRole("admin"), renameSchedule)
router.put("/schedule/:year/isrc", requireRole("admin"), setRCSchedule)
router.post("/schedule/:year", requireRole("admin"), createSnapshot)
router.delete("/schedule/:schedule_id", requireRole("admin"), deleteSchedule)

router.post("/schedule/:year/:schedule_id/assignments", requireRole("admin"), addAssignment)
router.delete("/schedule/:year/:schedule_id/assignments/:assignment_id", requireRole("admin"), removeAssignment)

router.post("/schedule/:year/:schedule_id/validate", validateSchedule)

export default router;
