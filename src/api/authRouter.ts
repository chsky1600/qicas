import express from "express";

import {
    getToken
} from "../controllers/authController";

const router = express.Router();

/**
 * @openapi
 * /auth:
 *  post:
 *      tags:
 *          - Auth
 *      summary: Login to receive an Auth Token
 *      description: Send your credentials to receive a token to be used in further requests
 *      requestBody:
 *          description: The credentials being used to login
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref : '#/components/schemas/login_credentials'
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      
 */
router.post("/auth", getToken)