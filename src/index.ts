import express from "express";
import cors from "cors";

import apiRouter from "./api";
import authRouter from "./api/authRouter"
import instructorRouter from "./api/instructorRouter"

import { connectDB } from "./db/connection";
import { verifyToken } from "./controllers/authController";

const app = express();

app.use(cors());
app.use(express.json());

app.use(apiRouter);
app.use(authRouter);
instructorRouter.use(verifyToken)
app.use(instructorRouter);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
