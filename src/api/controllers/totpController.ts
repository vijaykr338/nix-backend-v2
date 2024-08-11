import { TOTP } from "totp-generator";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import CustomError from "../../config/CustomError";

export const get_totp = asyncErrorHandler(async (_req, res, _next) => {
  const secret = process.env.TOTP_SECRET;

  if (!secret) {
    throw new CustomError(
      "TOTP Secret is not set",
      StatusCode.INTERNAL_SERVER_ERROR,
    );
  }

  const { otp } = TOTP.generate(secret);

  return res.status(StatusCode.OK).json({
    status: "success",
    message: otp,
  });
});
