import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import apiRouter from "./api";
import authRouter from "./api/authRouter";
import instructorRouter from "./api/instructorRouter";
import scheduleRouter from "./api/scheduleRouter";
import yearRouter from "./api/yearRouter";
import userRouter from "./api/userRouter";
import facultyRouter from "./api/facultyRouter";
import courseRouter from "./api/courseRouter";

import { connectDB } from "./db/connection";
import { verifyToken } from "./controllers/authController";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(apiRouter);
app.use(authRouter);

instructorRouter.use(verifyToken);
app.use(instructorRouter);

courseRouter.use(verifyToken);
app.use(courseRouter);

scheduleRouter.use(verifyToken);
app.use(scheduleRouter);

yearRouter.use(verifyToken);
app.use(yearRouter);

userRouter.use(verifyToken);
app.use(userRouter);

facultyRouter.use(verifyToken);
app.use(facultyRouter);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
