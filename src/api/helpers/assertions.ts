import { Response } from "express";
import mongoose from "mongoose";
import CustomError from "../../config/CustomError";
import { PopulatedUser } from "../models/userModel";
import StatusCode from "./httpStatusCode";

/// Assertions for development environment (disabled in production)
export function assert<T>(condition: T, message: string): asserts condition {
  if (process.env.NODE_ENV === "development") {
    if (!condition) {
      throw new CustomError(
        "Assertion Failed: " + message,
        StatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export function assertHydratedUser(
  res: Response,
): asserts res is Response & { locals: { user: PopulatedUser } } {
  const { user } = res.locals;
  assert(user, "User not found in res.locals");
}

export function assertProtectedUser(res: Response): asserts res is Response & {
  locals: { user_id: mongoose.Types.ObjectId; email: string };
} {
  assert(res.locals.user_id, "User ID not found in res.locals");
  assert(res.locals.email, "Email not found in res.locals");
}
