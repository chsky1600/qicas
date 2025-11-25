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
 *      204:
 *        description: Schedule saved successfully, no content returned
 *      500:
 *        description: Failed to save schedule
 *  post:
 *    tags:
 *      - Schedule 
 *    summary: Create a new snapshot
 *    description: Creates a new snapshot of the given schedule 
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
 *      201:
 *        description: Snapshot created successfully
 *      500:
 *        description: Failed to create snapshot
*/
router.put("/schedule",saveSchedule)
router.post("/schedule",createSnapshot)

/**
 * @openapi
 * /schedule:
 *  get:
 *    tags:
 *      - Schedule 
 *    summary: Get all schedules / snapshots related to a given faculty
 *    description: Gets all schedules related to a faculty id, meant for some form of selection menu 
 *    parameters:
 *      - in: path
 *        name: faculty_id 
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The faculty's ID 
 *    responses:
 *      200:
 *        description: OK 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/schedule'
 *      404:
 *        description: Couldn't find a faculty with that ID
 *      500:
 *        description: Internal server error
*/ 
router.get("/schedule/:faculty_id",getSchedulesByFacultyID)