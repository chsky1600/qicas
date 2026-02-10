import express from "express";

import {
    getAllCourses,
    getCourseByID,
    getCourseAssignmentsbyID,
    createCourse,
    updateCourse
} from "../controllers/courseController";

const router = express.Router();

/**
 * @openapi
 * /courses/:year:
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
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the course relates to.
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
 * /courses/:year/:course_id:
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
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the course relates to.
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
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the course relates to.
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
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the course relates to.
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
 * /courses/:year/:course_id/assignments:
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
 *      - in: path
 *        name: year
 *        required: true
 *        schema:
 *          type: string
 *        description: The year the course relates to.
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
 */

router.get("/courses/:year", getAllCourses);
router.get("/courses/:year/:course_id", getCourseByID);
router.get("/courses/:year/:course_id/assignments", getCourseAssignmentsbyID);
router.post("/courses/:year", createCourse);
router.patch("/courses/:year/:course_id", updateCourse);

export default router;