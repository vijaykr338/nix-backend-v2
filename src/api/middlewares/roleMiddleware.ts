import { NextFunction, Request, Response } from "express";
import CustomError from "../../config/CustomError";
import StatusCode from "../helpers/httpStatusCode";

/** This protects any modification/deletion to the default role and superuser role */
const never_modify_these_roles = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id || req.body.role_id;
  if (id == process.env.DEFAULT_ROLE_ID || id == process.env.SUPERUSER_ROLE_ID) {
    const error = new CustomError(
      "You cannot delete or update the default or superuser role",
      StatusCode.LOCKED
    );
    return next(error);
  }
  return next();
};

export default never_modify_these_roles;