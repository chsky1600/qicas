import { mkdirSync, writeFileSync } from "fs";
import { swaggerSpec } from "../docs/swagger";

const OUTPUT_PATH = "dist/swagger.json";

mkdirSync("dist", { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(swaggerSpec, null, 2));

console.log(`Swagger spec exported to ${OUTPUT_PATH}`);

