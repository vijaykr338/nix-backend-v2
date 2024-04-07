import { CorsOptions } from "cors";
import StatusCode from "../api/helpers/httpStatusCode";
import CustomError from "./CustomError";

export const allowedOrigins = [
  // nix frontend origin
  "134.209.159.97:5173",
  // frontend localhost origin
  "localhost:5173",
  "localhost:3000",
  // frontend localhost origin
  "127.0.0.1:5173",
  "127.0.0.1:3000",
  // vs code live server plugin port
  "localhost:5500",
  // hoppscotch extension
  "moz-extension://aa18bae2-65b3-4d24-9ed8-80054a9c21f5",
  "next.dtutimes.com",
  "team.dtutimes.com",
  "beta.dtutimes.com",
  "dtutimes.com",
  "dtutimes.dtu.ac.in",
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (
      (process.env.NODE_ENV === "development" && !origin) ||
      (origin &&
        allowedOrigins.indexOf(origin.split("://")[1] || origin) !== -1)
    ) {
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
