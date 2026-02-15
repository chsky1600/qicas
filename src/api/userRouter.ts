import express from "express";

import {
    getUserByID,
    createUser,
    updateUserByID,
    deleteUserByID,
    getAllUsers
} from "../controllers/userController";

const router = express.Router();

router.get("/users/:user_id", getUserByID)
router.put("/users/:user_id", updateUserByID)
router.delete("/users/:user_id", deleteUserByID)

router.post("/users", createUser)
router.get("/users", getAllUsers)