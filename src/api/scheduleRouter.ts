import express from "express";

import {
    getScheduleByID,
    saveSchedule,
    setWorkingSchedule,
    saveSnapshot
} from "../controllers/scheduleController";

const router = express.Router();

/**
 * @openapi
 * /schedule/{schedule_id}:
 *  get:
 *    tags:
 *      - Schedule
 *    summary: Get a schedule by its ID 
 *    parameters:
 *      - in: path
 *        name: schedule_id 
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The schedules ID
 *    responses:
 *      200:
 *        description: OK 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/schedule'
 *      404:
 *        description: Requested schedule does not exist
 * /schedule:
 *  put:
 *    tags:
 *      - Schedule 
 *    summary: Saves a schedule
 *    description: Saves a schedule by either overriding the existing schedule with the same ID, or creating a new one? 
 *    parameters:
 *      - in: path
 *        name: schedule_id 
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The schedules ID
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/schedule'
 *    responses:
 *      200:
 *        description: OK 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/schedule'
 *      404:
 *        description: Requested schedule does not exist
 * /schedule:
 *  post:
 * 
 */
router.get("/schedule/{schedule_id}",getScheduleByID)
router.post("/schedule/snapshot", saveSnapshot)
router.put("/schedule",saveSchedule)
router.put("/schedule/select/{schedule_id}",setWorkingSchedule)