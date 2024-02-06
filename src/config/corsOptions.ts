import { CorsOptions } from "cors";
import CustomError from "./CustomError";
import StatusCode from "../api/helpers/httpStatusCode";

export const allowedOrigins = ["http://localhost:5173", "http://localhost:5500", "chrome-extension://amknoiejhlmhancpahfcfcfhllgkpbld"];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if ((process.env.NODE_ENV === "development" && !origin) || (origin && allowedOrigins.indexOf(origin) !== -1)) {
      callback(null, true);
    } else {
      console.log("CORS origin:", origin);
      callback(new CustomError("Not allowed by CORS", StatusCode.UNAUTHORIZED));
    }
  },
  optionsSuccessStatus: StatusCode.OK,
};
