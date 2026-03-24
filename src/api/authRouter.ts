import express from "express";

import {
    getToken,
    refreshToken,
    changePassword,
    verifyToken
} from "../controllers/authController";

const router = express.Router();

router.post("/auth", getToken)
router.post("/auth/refresh", verifyToken, refreshToken)
router.put("/auth/password", verifyToken, changePassword)

export default router;