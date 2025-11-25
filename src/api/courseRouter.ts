import express from "express";

import {
    getAllCourses,
    getCourseByID,
    getCourseAssignmentsbyID,
    snapshotCourse,
    createCourse,
    updateCourse
} from "../controllers/courseController";

const router = express.Router();

/**
 * @openapi
 * /courses:
 *  get:
 *    tags:
 *      - Courses
 *    summary: List courses
 *    description: Get all courses in the department, optionally filtered by term or academic year.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: query
 *        name: term
 *        required: false
 *        schema:
 *          type: string
 *          enum: [FALL, WINTER, FULL_YEAR]
 *        description: Optional filter by term.
 *      - in: query
 *        name: year
 *        required: false
 *        schema:
 *          type: integer
 *        description: Optional filter by academic year.
 *    responses:
 *      200:
 *        description: List of courses.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Course'
 *      401:
 *        description: Unauthorized.
 *
 *  post:
 *    tags:
 *      - Courses
 *    summary: Create a new course
 *    description: Create a new course record. Admin role required.
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CourseCreateInput'
 *    responses:
 *      201:
 *        description: Course created.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Course'
 *      400:
 *        description: Invalid input.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 * 
 * /courses/:course_id:
 *  get:
 *    tags:
 *      - Courses
 *    summary: Get a course by ID
 *    description: Get the details of a single course.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: course_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The course ID.
 *    responses:
 *      200:
 *        description: Course details.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Course'
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Course not found.
 *
 *  patch:
 *    tags:
 *      - Courses
 *    summary: Update a course's detials
 *    description: Update properties of an existing course. Admin role required.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: course_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The course ID.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CourseUpdateInput'
 *    responses:
 *      200:
 *        description: Updated course.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Course'
 *      400:
 *        description: Invalid update.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Course not found.
 *
 *  delete:
 *    tags:
 *      - Courses
 *    summary: Archive a course
 *    description: Archive or deactivate a course so it is no longer used in new schedules. Admin role required.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: course_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The course ID.
 *    responses:
 *      204:
 *        description: Course archived.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Course not found.
 *
 * /courses/:course_id/assignments:
 *  get:
 *    tags:
 *      - Courses
 *    summary: List schedule assignments for a course
 *    description: Get all schedule entries where this course is assigned.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: course_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The course ID.
 *      - in: query
 *        name: year
 *        required: false
 *        schema:
 *          type: integer
 *        description: Optional filter by academic year.
 *    responses:
 *      200:
 *        description: List of assignments for this course.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/CourseAssignment'
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Course not found.
 *
 * /courses/:course_id/snapshot:
 *  post:
 *    tags:
 *      - Courses
 *    summary: Snapshot a course
 *    description: >
 *      Duplicate an existing course into a new course object with a new ID.
 *      Intended for reusing course details when preparing a new offering.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: course_id
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the course to snapshot.
 *    requestBody:
 *      required: false
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              year:
 *                type: integer
 *                description: Optional academic year to associate with the new course record.
 *              titleSuffix:
 *                type: string
 *                description: Optional suffix to append to the new course title.
 *    responses:
 *      201:
 *        description: Snapshot course created.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Course'
 *      400:
 *        description: Invalid snapshot request.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Forbidden.
 *      404:
 *        description: Source course not found.
 */

router.get("/courses", getAllCourses);
router.get("/courses/:course_id", getCourseByID);
router.get("/courses/:course_id/assignments", getCourseAssignmentsbyID);
router.post("/courses/snapshot", snapshotCourse);
router.post("/courses", createCourse);
router.patch("/courses/:course_id", updateCourse);



export default router;