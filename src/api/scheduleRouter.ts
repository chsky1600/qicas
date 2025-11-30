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
 * /schedule/:year/:schedule_id:
 *  get:
 *    tags:
 *      - Schedule
 *    summary: Get a schedule by its ID 
 *    security:
 *      - bearerAuth: []
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
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the schedule relates to.
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
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: schedule_id 
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The schedules ID
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the schedule relates to.
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
router.get("/schedule/:year/:schedule_id",getScheduleByID)
router.put("/schedule/:year/:schedule_id",setWorkingSchedule)
 
/**
 * @openapi
 * /schedule/:year:
 *  get:
 *    tags:
 *      - Schedule 
 *    summary: Get the list of all existing schedules in the users faculty.
 *    security:
 *      - bearerAuth: []
 *    description: Get the list of all schedules that exist within the faculty that the user requesting is a part of
 *    parameters:
 *      - in: cookie    
 *        name: token
 *        schema:
 *          type: string
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the schedule relates to.
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
 *    security:
 *      - bearerAuth: []
 *    description: Saves a schedule by overriding the existing schedule with the same ID
 *    parameters:
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the schedule relates to.
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
 *    parameters:
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the schedule relates to.
 *    security:
 *      - bearerAuth: []
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

