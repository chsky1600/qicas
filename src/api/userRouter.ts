import express from "express";

import {
    getUserByID,
    createUser,
    updateUserByID,
    deleteUserByID,
    getAllUsers
} from "../controllers/userController";
import { requireRole } from "../controllers/authController";

const router = express.Router();

router.get("/users/:user_id", getUserByID)
router.put("/users/:user_id", requireRole("admin"), updateUserByID)
router.delete("/users/:user_id", requireRole("admin"), deleteUserByID)

router.post("/users", requireRole("admin"), createUser)
router.get("/users", getAllUsers)

export default router;
