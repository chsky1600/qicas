import express from "express";

import {
    getScheduleByID,
    saveSchedule,
    setWorkingSchedule,
    createSnapshot,
    getSchedules,
    validateSchedule
} from "../controllers/scheduleController";

const router = express.Router();

router.get("/schedule/:year/:schedule_id",getScheduleByID)
router.put("/schedule/:year/:schedule_id",setWorkingSchedule)
 
router.get("/schedule/:year",getSchedules)
router.put("/schedule/:year",saveSchedule)
router.post("/schedule/:year", createSnapshot)

router.post("/schedule/:year/:schedule_id/validate",validateSchedule)

export default router;

