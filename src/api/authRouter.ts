import express from "express";

import {
    getToken,
    refreshToken,
    changePassword,
    updateAccount,
    verifyToken,
    requirePasswordChangeSatisfied,
    getSession,
    logout,
} from "../controllers/authController";

const router = express.Router();

router.post("/auth", getToken)
router.get("/auth/me", verifyToken, getSession)
router.post("/auth/refresh", verifyToken, refreshToken)
router.post("/auth/logout", logout)
router.put("/auth/account", verifyToken, requirePasswordChangeSatisfied, updateAccount)
router.put("/auth/password", verifyToken, changePassword)

export default router;
