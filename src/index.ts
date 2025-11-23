import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import apiRouter from "./api";
import { swaggerSpec } from "./docs/swagger";

const app = express();

app.use(cors());
app.use(express.json());

// Serve interactive API docs generated from JSDoc annotations.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use(apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});