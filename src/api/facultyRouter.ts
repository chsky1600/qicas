import express from "express";

import {
    createFaculty,
    addUserToFacultyByID,
    migrateFacultyToNewYear,
    removeUserFromFacultyByID,
    getFacultyByID,
    deleteFacultyByID,
    getFaculties
} from "../controllers/facultyController";

const router = express.Router();

/**
 * @openapi
 * /faculty:
 *  get:
 *    tags:
 *      - Faculty
 *    summary: Get list of faculties
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/faculty'
 *  post:
 *    tags:
 *      - Faculty
 *    summary: Create a new faculty
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      201:
 *        description: Faculty created successfully 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/faculty'
 *      409:
 *        description: Faculty already exists
 *      500:
 *        description: Failed to create faculty member
*/
router.get("/faculty", getFaculties)
router.post("/faculty", createFaculty)

/**
 * @openapi
 * /faculty/:faculty_id:
 *  get:
 *    tags:
 *      - Faculty
 *    summary: Gets the faculty represented by the given ID
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: faculty_id
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: OK 
 *  delete:
 *    tags:
 *      - Faculty
 *    summary: Delete the faculty represented by the given ID
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: faculty_id
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      204:
 *        description: OK, no content. 
*/
router.get("/faculty/:faculty_id", getFacultyByID)
router.delete("/faculty/:faculty_id", deleteFacultyByID)

/**
 * @openapi
 * /faculty/:faculty_id/:user_id:
 *  post:
 *    tags:
 *      - Faculty
 *    summary: Add a user to a faculty by their respective IDs.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: faculty_id
 *        required: true
 *        schema:
 *          type: string
 *      - in: path
 *        name: user_id
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      204:
 *        description: User successfully added to faculty. 
 *  delete:
 *    tags:
 *      - Faculty
 *    summary: Remove a user from a faculty.
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: faculty_id
 *        required: true
 *        schema:
 *          type: string
 *      - in: path
 *        name: user_id
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      204:
 *        description: User successfully removed from faculty. 
*/
router.post("/faculty/:faculty_id/:user_id", addUserToFacultyByID)
router.delete("/faculty/:faculty_id/:user_id", removeUserFromFacultyByID)
