import express from "express";

import {
    getScheduleByID,
    saveSchedule,
    setWorkingSchedule,
    createSnapshot,
    getSchedules,
    deleteSchedule,
    addAssignment,
    removeAssignment,
    validateSchedule,
    getWorkingSchedule
} from "../controllers/scheduleController";

const router = express.Router();

router.get("/schedule/:year/:schedule_id",getScheduleByID)
router.put("/schedule/active/:schedule_id",setWorkingSchedule)
router.get("/schedule/", getWorkingSchedule)

router.get("/schedule/:year",getSchedules)
router.put("/schedule/:year",saveSchedule)
router.post("/schedule/:year", createSnapshot)
router.delete("/schedule/:schedule_id", deleteSchedule)

router.post("/schedule/:year/:schedule_id/assignments", addAssignment)
router.delete("/schedule/:year/:schedule_id/assignments/:assignment_id", removeAssignment)

router.post("/schedule/:year/:schedule_id/validate",validateSchedule)

export default router;

