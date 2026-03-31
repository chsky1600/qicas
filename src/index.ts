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
import { requirePasswordChangeSatisfied, verifyToken } from "./controllers/authController";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(apiRouter);
app.use(authRouter);

instructorRouter.use(verifyToken);
instructorRouter.use(requirePasswordChangeSatisfied);
app.use(instructorRouter);

courseRouter.use(verifyToken);
courseRouter.use(requirePasswordChangeSatisfied);
app.use(courseRouter);

scheduleRouter.use(verifyToken);
scheduleRouter.use(requirePasswordChangeSatisfied);
app.use(scheduleRouter);

yearRouter.use(verifyToken);
yearRouter.use(requirePasswordChangeSatisfied);
app.use(yearRouter);

userRouter.use(verifyToken);
userRouter.use(requirePasswordChangeSatisfied);
app.use(userRouter);

facultyRouter.use(verifyToken);
facultyRouter.use(requirePasswordChangeSatisfied);
app.use(facultyRouter);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
