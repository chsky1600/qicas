import express from "express";

import {
    createFaculty,
    assignUserToFacultyByID,
    migrateFacultyToNewYear
} from "../controllers/facultyController";

const router = express.Router();

/**
 * @openapi
 * /faculty:
 *  post:
 *    tags:
 *      - Faculty
 *    summary: Create a new faculty
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
router.post("/faculty", createFaculty)
