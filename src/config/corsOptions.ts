import { CorsOptions } from "cors";
import CustomError from "./CustomError";

export const allowedOrigins = ["https://www.ourwebsite.com"];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if ( allowedOrigins.indexOf(origin) !== -1 || (process.env.NODE_ENV === "development" && !origin)) {
      callback(null, true);
    } else {
      callback(new CustomError("Not allowed by CORS", 401));
    }
  },
  optionsSuccessStatus: 200,
};
