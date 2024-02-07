import { NextFunction, Request, Response } from "express";
import { allowedOrigins } from "../../config/corsOptions";

export const credentials = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    // add Access-Control-Allow-Credentials header to response to true
    // todo: reminder: check if this is needed (it was true as a boolean earlier but type should be string | string[])
    res.header("Access-Control-Allow-Credentials", "true");
  }
  next();
};