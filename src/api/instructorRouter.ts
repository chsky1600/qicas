import express from "express";

import {
  createInstructor,
  getAllInstructors,
  getInstructorAssignmentsByID,
  getInstructorByID,
  updateInstructor,
} from "../controllers/instructorController";

const router = express.Router();

/**
 * @openapi
 * /instructors/:year:
 *  get:
 *    tags:
 *      - Instructors
 *    summary: List instructors
 *    description: Get all instructors in the department, optionally filtered by role or faculty.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: query
 *        name: faculty
 *        required: false
 *        schema:
 *          type: string
 *        description: Optional filter by faculty identifier.
 *      - in: query
 *        name: role
 *        required: false
 *        schema:
 *          type: string
 *          enum: [LECTURER, PROFESSOR, TA]
 *        description: Optional filter by academic role.
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the instructor relates to.
 *    responses:
 *      200:
 *        description: List of instructors.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Instructor'
 *      401:
 *        description: Unauthorized.
 *
 *  post:
 *    tags:
 *      - Instructors
 *    summary: Create a new instructor
 *    description: Create a new instructor profile. Admin role required.
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/InstructorCreateInput'
 *    responses:
 *      201:
 *        description: Instructor created.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Instructor'
 *      400:
 *        description: Invalid input.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *
 * /instructors/:year/:instructor_id:
 *  get:
 *    tags:
 *      - Instructors
 *    summary: Get an instructor by ID
 *    description: Get the details of a single instructor.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: instructor_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The instructor ID.
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the instructor relates to.
 *    responses:
 *      200:
 *        description: Instructor details.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Instructor'
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Instructor not found.
 *
 *  patch:
 *    tags:
 *      - Instructors
 *    summary: Update an instructor's details
 *    description: Update properties of an existing instructor. Admin role required.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: instructor_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The instructor ID.
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the instructor relates to.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/InstructorUpdateInput'
 *    responses:
 *      200:
 *        description: Updated instructor.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Instructor'
 *      400:
 *        description: Invalid update.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Instructor not found.
 *
 *  delete:
 *    tags:
 *      - Instructors
 *    summary: Archive an instructor
 *    description: Archive or deactivate an instructor so they are no longer assigned to new schedules. Admin role required.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: instructor_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The instructor ID.
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the instructor relates to.
 *    responses:
 *      204:
 *        description: Instructor archived.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Instructor not found.
 *
 * /instructors/:year/:instructor_id/assignments:
 *  get:
 *    tags:
 *      - Instructors
 *    summary: List schedule assignments for an instructor
 *    description: Get all schedule entries where this instructor is assigned.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: instructor_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The instructor ID.
 *      - in: query
 *        name: year
 *        required: false
 *        schema:
 *          type: integer
 *        description: Optional filter by academic year.
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the instructor relates to.
 *    responses:
 *      200:
 *        description: List of assignments for this instructor.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/InstructorAssignment'
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Instructor not found.
 */

router.get("/instructors", getAllInstructors);
router.get("/instructors/:instructor_id", getInstructorByID);
router.get("/instructors/:instructor_id/assignments", getInstructorAssignmentsByID);
router.post("/instructors", createInstructor);
router.patch("/instructors/:instructor_id", updateInstructor);

export default router;
