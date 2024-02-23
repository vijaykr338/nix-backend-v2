import { CorsOptions } from "cors";
import CustomError from "./CustomError";
import StatusCode from "../api/helpers/httpStatusCode";

export const allowedOrigins = [
  // nix frontend origin
  "http://134.209.159.97:5173",
  // frontend localhost origin
  "http://localhost:5173",
  // frontend localhost origin
  "http://127.0.0.1:5173",
  // vs code live server plugin port
  "http://localhost:5500",
  // hoppscotch extension
  "moz-extension://aa18bae2-65b3-4d24-9ed8-80054a9c21f5",
  "http://next.dtutimes.com",
  "https://next.dtutimes.com"
];

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
