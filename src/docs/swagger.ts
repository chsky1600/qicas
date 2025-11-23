import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.1.0",
  info: {
    title: "qicas API",
    version: "1.0.0",
    description: "Auto-generated API documentation powered by Swagger.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./src/**/*.ts"],
});

