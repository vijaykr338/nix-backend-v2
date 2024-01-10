//whichever function have async and await wrap it in asyncErrorHandler, to catch error automatically

import { NextFunction, Request, Response } from "express";

export default function asyncErrorHandler(func: (req: Request, res: Response, next: NextFunction)=> Promise<any> ) {
  return function (req: Request, res: Response, next: NextFunction) {
    func(req, res, next).catch((err) => next(err)); // passing to global error handler
  };
}
