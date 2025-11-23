import { Router } from "express";

const api = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Checks if the service is running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
api.get("/health", (_req, res) => {
  res.json({ ok: true });
});

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
api.route("/users")
  .get((req, res) => {

  })
  .post((req, res)=>{
    
  })

/**
 * @openapi
 * /users/{user_id}:
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
api.route("/users/:user_id")
  .get((req,res)=>{

  })
  .put((req,res)=> {

  })
  .delete((req, res)=>{

  })

export default api;

