import express from "express";

import { 
    addCourseRule, 
    addInstructorRule, 
    deleteCourseRuleByID, 
    deleteInstructorRuleByID, 
    getCourseRuleByID, 
    getCourseRules, 
    getInstructorRuleByID, 
    getInstructorRules, 
    updateCourseRuleByID, 
    updateInstructorRuleByID 
} from "../controllers/yearController";

const router = express.Router();

/**
 * @openapi
 * /year/:year/rules/courses:
 *  get:
 *      tags:
 *          - Year
 *      summary: Get all course rules for a given year.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: OK 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/course_rule'
 *          401:
 *              description: Invalid user.
 *  post:
 *      tags:
 *          - Year
 *      summary: Create a course rule for a given year.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          201:
 *              description: Rule created successfully 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/course_rule'
 */
router.get("/year/:year/rules/courses", getCourseRules)
router.post("/year/:year/rules/courses", addCourseRule)

/**
 * @openapi
 * /year/:year/rules/courses/:rule_id:
 *  get:
 *      tags:
 *          - Year
 *      summary: Get a specific course rule for a given year by its ID.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *          - in: path
 *            name: rule_id
 *            required: false
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: OK 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/course_rule'
 *          401:
 *              description: Invalid user.
 *  put:
 *      tags:
 *          - Year
 *      summary: Update a course rule for a given year by its ID.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *          - in: path
 *            name: rule_id
 *            required: false
 *            schema:
 *              type: string
 *      responses:
 *          204:
 *              description: Rule updated successfully, no content. 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/course_rule'
 *  delete:
 *      tags:
 *          - Year
 *      summary: Delete a course rule for a given year by its ID.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *          - in: path
 *            name: rule_id
 *            required: false
 *            schema:
 *              type: string
 *      responses:
 *          204:
 *              description: Rule deleted successfully, no content. 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/course_rule'
 */
router.get("/year/:year/rules/courses/:rule_id", getCourseRuleByID)
router.put("/year/:year/rules/courses/:rule_id", updateCourseRuleByID)
router.delete("/year/:year/rules/courses/:rule_id", deleteCourseRuleByID)

/**
 * @openapi
 * /year/:year/rules/instructors:
 *  get:
 *      tags:
 *          - Year
 *      summary: Get all instructor rules for a given year.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: OK 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/instructor_rule'
 *          401:
 *              description: Invalid user.
 *  post:
 *      tags:
 *          - Year
 *      summary: Create an instructor rule for a given year.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          201:
 *              description: Rule created successfully 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/instructor_rule'
 */
router.get("/year/:year/rules/instructors", getInstructorRules)
router.post("/year/:year/rules/instructors", addInstructorRule)

/**
 * @openapi
 * /year/:year/rules/instructors/:rule_id:
 *  get:
 *      tags:
 *          - Year
 *      summary: Get a specific instructor rule for a given year by its ID.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *          - in: path
 *            name: rule_id
 *            required: false
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: OK 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/instructor_rule'
 *          401:
 *              description: Invalid user.
 *  put:
 *      tags:
 *          - Year
 *      summary: Update an instructor rule for a given year by its ID.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *          - in: path
 *            name: rule_id
 *            required: false
 *            schema:
 *              type: string
 *      responses:
 *          204:
 *              description: Rule updated successfully, no content. 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/instructor_rule'
 *  delete:
 *      tags:
 *          - Year
 *      summary: Delete an instructor rule for a given year by its ID.
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: year
 *            required: true
 *            schema:
 *              type: string
 *          - in: path
 *            name: rule_id
 *            required: false
 *            schema:
 *              type: string
 *      responses:
 *          204:
 *              description: Rule deleted successfully, no content. 
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/instructor_rule'
 */
router.get("/year/:year/rules/instructors/:rule_id", getInstructorRuleByID)
router.put("/year/:year/rules/instructors/:rule_id", updateInstructorRuleByID)
router.delete("/year/:year/rules/instructors/:rule_id", deleteInstructorRuleByID)