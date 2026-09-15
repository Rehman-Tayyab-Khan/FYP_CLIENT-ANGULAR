import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.config";
import { AppError } from "../utils/app-error.util";
import { verifyJwtToken } from "../utils/jwt.util";

export const checkAccessToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.cookies?.accessToken as string | undefined;

    if (!accessToken) throw new AppError(401, "Access token is required");

    const payload = verifyJwtToken(accessToken, env.JWT_SECRET);
    if (!payload.userId || typeof payload.userId !== "string") {
      throw new AppError(401, "Invalid access token");
    }

    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, "Invalid or expired access token"));
  }
};
