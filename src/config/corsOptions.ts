import { CorsOptions } from "cors";
import CustomError from "./CustomError";
import StatusCode from "../api/helpers/httpStatusCode";

export const allowedOrigins = ["http://localhost:5173", "chrome-extension://amknoiejhlmhancpahfcfcfhllgkpbld"];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if ( allowedOrigins.indexOf(origin) !== -1 || (process.env.NODE_ENV === "development" && !origin)) {
      callback(null, true);
    } else {
      console.log("CORS origin:", origin);
      callback(new CustomError("Not allowed by CORS", StatusCode.UNAUTHORIZED));
    }
  },
  optionsSuccessStatus: StatusCode.OK,
};
