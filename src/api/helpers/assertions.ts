import { Response } from "express";
import mongoose from "mongoose";
import CustomError from "../../config/CustomError";
import { PopulatedUser } from "../models/userModel";
import StatusCode from "./httpStatusCode";

export interface AssertOptions {
  throws?: boolean;
}

/** Assertions for development environment, throws by default */
export function assert<T>(
  condition: T,
  message: string,
  options: AssertOptions = {
    throws: true,
  },
): asserts condition {
  const { throws } = options;

  if (!condition) {
    console.error("Assertion failed".red.bold, message.yellow);
    if (throws) {
      throw new CustomError(
        "Assertion Failed! The server is misconfigured. Please contact the administrator.",
        StatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

/** Assert hydrated user if user is passed through the permission middleware */
export function assertHydratedUser(
  res: Response,
): asserts res is Response & { locals: { user: PopulatedUser } } {
  const { user } = res.locals;
  assert(user, "User not found in res.locals");
}

/** Asset if user is passed through protect middleware */
export function assertProtectedUser(res: Response): asserts res is Response & {
  locals: { user_id: mongoose.Types.ObjectId; email: string };
} {
  assert(res.locals.user_id, "User ID not found in res.locals");
  assert(res.locals.email, "Email not found in res.locals");
}
