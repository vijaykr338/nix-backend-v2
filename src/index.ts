import "colors";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import globalErrorHandler from "./api/helpers/globalErrorHandler";
import StatusCode from "./api/helpers/httpStatusCode";
import { credentials } from "./api/middlewares/credentials";
import router from "./api/routes";
import CustomError from "./config/CustomError";
import connectDB from "./config/DatabaseConfig";
import { corsOptions } from "./config/corsOptions";

process.on("uncaughtException", (err) => {
  console.error(err.name.red.underline, err.message.red.underline);
  console.error("Uncaught Exception occured! Shutting down...".magenta);
  process.exit(1);
});

const API_URL = "/api/v1";

//creating express server
const app = express();

//connecting to db
connectDB();

app.use(compression());

//handle options credentials check before CORS
app.use(credentials);

//cors
app.use(cors(corsOptions));

// set reffer policy
app.use((req, res, next) => {
  res.header("Referrer-Policy", "origin");
  next();
});

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse cookies
app.use(cookieParser());
//logger
app.use(
  morgan("common", {
    skip: (req) => {
      return req.originalUrl.includes("/images/");
    },
  }),
);

//test route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the DTU Times API",
  });
});

//app router
app.use(`${API_URL}`, router);

//fallback route
app.all("*", (req, res, next) => {
  const err = new CustomError(
    `Can't find ${req.originalUrl} on the server! Are you sure you wanted to make a ${req.method} request?`,
    StatusCode.NOT_FOUND,
  );
  //pass it to global error handler
  next(err);
});

//global error handler
app.use(globalErrorHandler);

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, "127.0.0.1", () => {
  console.log(
    `App listening on port ${port}`.yellow.underline,
    app.settings.env,
  );
});

process.on("unhandledRejection", (err: Error) => {
  console.error(err.name.magenta, err.message.magenta);
  console.error("Unhandled rejection occured! Shutting down...".red);
  server.close(() => {
    process.exit(1);
  });
});
