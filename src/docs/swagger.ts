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
  // can add re-usable object schemas here so that we can use $ref to reference objects in our route definitions 
  components: {
    schemas: {
      schedule:{
        type : "object",
        properties:{
          id : {
            type: "integer",
            description: "A unique identifier for the schedule"
          },
          year : {
            type: "string",
            description: "The academic year the schedule is for"
          }
        }
      },
      user: {
        type : "object",
        required: ["name", "id"],
        properties: {
          name: {
            type: "string",
            description: "The users name"
          },
          id: {
            type: "integer",
            description: "The users ID number"
          }
        },
        example:{
          name: "Michael Reyez",
          id: 1
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./src/**/*.ts"],
});

