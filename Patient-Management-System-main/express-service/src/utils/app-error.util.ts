import { HttpStatusCode, ResponseMessage } from "../enums";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number | HttpStatusCode,
    message: string | ResponseMessage,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
