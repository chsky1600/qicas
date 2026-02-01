import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import apiRouter from "./api";
import authRouter from "./api/authRouter"
import instructorRouter from "./api/instructorRouter"

import { swaggerSpec } from "./docs/swagger";
import mongoose from "mongoose";
import { verifyToken } from "./controllers/authController";

const app = express();

app.use(cors());
app.use(express.json());

// Serve interactive API docs generated from JSDoc annotations.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use(apiRouter);
app.use(authRouter);
instructorRouter.use(verifyToken)
app.use(instructorRouter);

// move this to seperate file
await mongoose.connect("mongodb://127.0.0.1:27017/mongoose-app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});