import express from "express";

import {
    getToken,
    changePassword,
    verifyToken
} from "../controllers/authController";

const router = express.Router();

router.post("/auth", getToken)
router.put("/auth/password", verifyToken, changePassword)

export default router;