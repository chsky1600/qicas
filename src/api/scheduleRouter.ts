import express from "express";

import {
    getScheduleByID,
    saveSchedule,
    setWorkingSchedule,
    createSnapshot,
    getSchedules
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
router.put("/schedule/:schedule_id",setWorkingSchedule)
 
/**
 * @openapi
 * /schedule:
 *  get:
 *    tags:
 *      - Schedule 
 *    summary: Get the list of all existing schedules based on the users login credentials
 *    description: Get the list of all schedules that exist within the faculty that the user requesting is a part of
 *    parameters:
 *      - in: cookie    
 *        name: token
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/schedule'
 *  put:
 *    tags:
 *      - Schedule 
 *    summary: Saves a schedule
 *    description: Saves a schedule by overriding the existing schedule with the same ID
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/schedule'
 *    responses:
 *      204:
 *        description: Schedule saved successfully, no content to return 
 *      404:
 *        description: Requested schedule does not exist
 *  post:
 *    tags:
 *      - Schedule 
 *    summary: Create a new snapshot based on the provided schedule
 *    description: Creates a new schedule based on the provided schedule with a fresh ID and returns it, if no schedule passed, create a new one and return it.
 *    requestBody:
 *      required: false
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
 *      403:
 *          description: Forbidden, invalid or no token
 *      500:
 *        description: Failed to create a snapshot of the given schedule
 * 
 */
router.get("/schedule",getSchedules)
router.put("/schedule",saveSchedule)
router.post("/schedule", createSnapshot)


export default router;

