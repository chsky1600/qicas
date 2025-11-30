import express from "express";

import {
    getUserByID,
    createUser,
    updateUserByID,
    deleteUserByID,
    getAllUsers
} from "../controllers/userController";

const router = express.Router();


/**
 * @openapi
 * /users/:user_id:
 *  get:
 *    tags:
 *      - Users
 *    summary: Get a user by their ID 
 *    parameters:
 *      - in: path
 *        name: user_id 
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The users ID
 *    responses:
 *      200:
 *        description: OK 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/user'
 *      404:
 *        description: User does not exist
 *  put:
 *    tags:
 *      - Users 
 *    summary: Override a users data
 *    parameters:
 *      - in: path
 *        name: user_id 
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The users ID
 *    responses:
 *      200:
 *        description: OK 
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/user'
 *      404:
 *        description: User does not exist
 *  delete:
 *    tags:
 *      - Users 
 *    summary: Delete a user
 *    parameters:
 *      - in: path
 *        name: user_id
 *        required : true
 *        schema:
 *          type: integer 
 *          minimum: 1
 *        description: The users ID
 *    responses:
 *      204:
 *        description: User deleted successfully 
 *      404:
 *        description: User does not exist
 */
router.get("/users/:user_id", getUserByID)
router.put("/users/:user_id", updateUserByID)
router.delete("/users/:user_id", deleteUserByID)

/**
 * @openapi
 * /users:
 *  get:
 *    tags:
 *      - Users
 *    summary: Returns a list of all existing users
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/user'
 *  post:
 *    tags:
 *      - Users
 *    summary: Add a user 
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/user'
 *    responses:
 *      201:
 *        description: User added successfully
 *      500:
 *        description: Something went wrong on our end...
 */
router.post("/users", createUser)
router.get("/users", getAllUsers)