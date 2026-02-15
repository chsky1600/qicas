import express from "express";

import {
    getToken
} from "../controllers/authController";

const router = express.Router();

router.post("/auth", getToken)

export default router;