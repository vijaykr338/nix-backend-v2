import "dotenv/config";
import "colors";
process.on("uncaughtException", (err) => {
  console.log(err.name.red.underline, err.message.red.underline);
  console.log("Uncaught Exception occured! Shutting down...".magenta);
  process.exit(1);
});
import cors from "cors";
import cookieParser from 'cookie-parser';
import express from "express";
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from "./config/swagger/swagger-config.js";
import connectDB from "./config/DatabaseConfig.js";
import CustomError from "./config/CustomError.js";
import globalErrorHandler from "./api/helpers/globalErrorHandler.js";
import userRouter from "./api/routes/userRoute.js"
import authRouter from "./api/routes/authRouter.js"
import roleRouter from "./api/routes/roleRoute.js"
import { corsOptions } from "./config/corsOptions.js";
import { credentials } from "./api/middlewares/credentials.js";

//creating express server
const app = express();

//connecting to db
connectDB();

//handle options credentials check before CORS
app.use(credentials);

//cors
app.use(cors(corsOptions)); 

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse cookies
app.use(cookieParser())

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//
app.use("/api/v1/user",userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/role", roleRouter);


//middleware for swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


//fallback route
app.all("*", (req, res, next) => {
  const err = new CustomError(
    `Can't find ${req.originalUrl} on the server`,
    404
  );
  //pass it to global error handler
  next(err);
});

//global error handler
app.use(globalErrorHandler);

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`App listening on port ${port}`.yellow.underline);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name.magenta, err.message.magenta);
  console.log("Unhandled rejection occured! Shutting down...".red);
  server.close(() => {
    process.exit(1);
  });
});
