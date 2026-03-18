import express from "express";

import {
    getScheduleByID,
    saveSchedule,
    setWorkingSchedule,
    createSnapshot,
    getSchedules,
    addAssignment,
    removeAssignment,
    validateSchedule,
    getWorkingSchedule
} from "../controllers/scheduleController";

const router = express.Router();

router.get("/schedule/:year/:schedule_id",getScheduleByID)
router.put("/schedule/:schedule_id",setWorkingSchedule)
router.get("/schedule/", getWorkingSchedule)

router.get("/schedule/:year",getSchedules)
router.put("/schedule/:year",saveSchedule)
router.post("/schedule/:year", createSnapshot)

router.post("/schedule/:year/:schedule_id/assignments", addAssignment)
router.delete("/schedule/:year/:schedule_id/assignments/:assignment_id", removeAssignment)

router.post("/schedule/:year/:schedule_id/validate",validateSchedule)

export default router;

