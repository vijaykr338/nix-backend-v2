/* eslint-disable @typescript-eslint/no-explicit-any */
// todo: add types

import { NextFunction, Request, Response } from "express";
import CustomError from "../../config/CustomError";
import { CastError, Error } from "mongoose";

const devErrors = (res: Response, error: CustomError) => {
  console.error(error);
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error
  });
};

const castErrorHandler = (err: CastError) => {
  const msg = `Invalid value for ${err.path}: ${err.value}!`;
  return new CustomError(msg, 400);
};

const duplicateKeyErrorHandler = (err: any) => {
  const name = err.keyValue.name;
  const msg = `There is already a movie with name ${name}. Please use another name!`;

  return new CustomError(msg, 400);
};

const validationErrorHandler = (err: any) => {
  const errors = Object.values(err.errors).map((val: Error) => val.message);
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data: ${errorMessages}`;

  return new CustomError(msg, 400);
};

const prodErrors = (res: Response, error: CustomError | Error) => {
  console.error(error);
  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong! Please try again later."
    });
  }
};



export default function globalErrorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    //dev errors help developer to get detailed error
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") error = castErrorHandler(error);
    if (error.code === 11000) error = duplicateKeyErrorHandler(error);
    if (error.name === "ValidationError") error = validationErrorHandler(error);

    //production errors are concise and easy to understand
    prodErrors(res, error);
  }
}
