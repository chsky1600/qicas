import express from "express";
import cors from "cors";


import apiRouter from "./api";
import authRouter from "./api/authRouter"
import instructorRouter from "./api/instructorRouter"
import scheduleRouter from "./api/scheduleRouter";
import courseRouter from "./api/courseRouter";

import { connectDB } from "./db/connection";
import { verifyToken } from "./controllers/authController";

const cookieParser = require('cookie-parser');

const app = express();

app.use(cors());
app.use(express.json());

app.use(apiRouter);
app.use(authRouter);
instructorRouter.use(verifyToken)
app.use(instructorRouter);
courseRouter.use(verifyToken)
app.use(courseRouter)
scheduleRouter.use(verifyToken)
app.use(scheduleRouter);
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
