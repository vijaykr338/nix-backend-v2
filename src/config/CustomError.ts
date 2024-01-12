

//extend native Error object , according to our need, whenever need to create a error , use this CustomError

class CustomError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    this.isOperational = true; // adding isOperational flag, to handle operational  errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;