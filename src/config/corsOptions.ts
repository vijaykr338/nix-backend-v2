import { CorsOptions } from "cors";
import StatusCode from "../api/helpers/httpStatusCode";
import CustomError from "./CustomError";

const allowedOrigins = new Set<string>([
  // frontend localhost origin
  "http://localhost:5173",
  "https://team.dtutimes.com",
  "https://beta.dtutimes.com",
  "https://dtutimes.com",
  "https://dtutimes.dtu.ac.in",
  "http://dtutimes.dtu.ac.in",
  "https://beta.dtutimes.com/",
  "https://dev.dtutimes.com/",
]);

export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // same-origin requests have no origin (origin === undefined)
    if (origin === undefined || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      console.error("CORS origin failed:".red, origin?.red);
      callback(
        new CustomError("Not allowed by CORS", StatusCode.PRECONDITION_FAILED),
      );
    }
  },
  optionsSuccessStatus: StatusCode.OK,
};
