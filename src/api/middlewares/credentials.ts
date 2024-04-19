import { NextFunction, Request, Response } from "express";
import { allowedOrigins } from "../../config/corsOptions";

export const credentials = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const original_origin = req.headers.origin;
  const origin = original_origin?.split("://")[1] || original_origin;
  console.log("Credential step Origin:", origin);
  if (origin && allowedOrigins.has(origin)) {
    // add Access-Control-Allow-Credentials header to response to true
    // todo: reminder: check if this is needed (it was true as a boolean earlier but type should be string | string[])
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Referrer-Policy", "origin");
  }
  next();
};
