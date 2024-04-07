//extend native Error object , according to our need, whenever need to create a error , use this CustomError

import { MongoServerError } from "mongodb";
import StatusCode from "../api/helpers/httpStatusCode";

class CustomError extends Error {
  statusCode: StatusCode;
  status: string;
  isOperational: boolean;

  constructor(
    message: string | MongoServerError | Error,
    statusCode: number = StatusCode.INTERNAL_SERVER_ERROR,
  ) {
    if (message instanceof Error) {
      if (message instanceof MongoServerError) {
        console.error("Mongoose Error".red);
        switch (message.code) {
          case 11000:
            super("Same entry already exists in the database");
            this.statusCode = StatusCode.CONFLICT;
            break;
          default:
            super(`${message.codeName} error in database operation`);
            this.statusCode = StatusCode.INTERNAL_SERVER_ERROR;
        }
      } else {
        super(message.message);
        this.statusCode = statusCode;
      }
    } else {
      super(message);
      this.statusCode = statusCode;
    }

    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    this.isOperational = true; // adding isOperational flag, to handle operational  errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
