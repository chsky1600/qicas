import express from "express";

import {
    getScheduleByID,
    saveSchedule,
    setWorkingSchedule,
    createSnapshot,
    getSchedulesByFacultyID
} from "../controllers/scheduleController";

const router = express.Router();

/**
 * @openapi
 * /schedule/:schedule_id:
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
 *      - in: cookie  
 *        name: faculty_id
 *        schema:
 *          $ref: '#/components/schemas/faculty'
 *        description: The faculty the requesting user is a part of. 
 *    responses:
 *      200:
 *        description: OK 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/schedule'
 *      404:
 *        description: Requested schedule does not exist
 */

/**
 * @openapi
 * /schedule:
 *  put:
 *    tags:
 *      - Schedule
 *    summary: Set a schedule/snapshot as the current working schedule
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
 */
router.get("/schedule/:schedule_id",getScheduleByID)
// this may be a little unintuitive but might be fine
router.put("/schedule/:schedule_id",setWorkingSchedule)

/**
 * @openapi
 * /schedule:
 *  put:
 *    tags:
 *      - Schedule 
 *    summary: Saves a schedule
 *    description: Saves a schedule by either overriding the existing schedule with the same ID, or creating a new one? 
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
 * 
 */
router.get("/schedule/:schedule_id",getScheduleByID)
router.post("/schedule/snapshot", createSnapshot)
router.put("/schedule",saveSchedule)
router.put("/schedule/select/:schedule_id",setWorkingSchedule)

export default router;

