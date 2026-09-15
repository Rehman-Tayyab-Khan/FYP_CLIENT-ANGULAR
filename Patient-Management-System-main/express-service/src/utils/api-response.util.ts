import { Response } from "express";
import { PaginationLinks, PaginationMeta } from "../types";
export class ApiResponse {
  static send<T>(
    res: Response,
    data: T,
    message = "",
    statusCode: number = 200,
    links?: PaginationLinks,
    meta?: PaginationMeta,
  ): void {
    if (links && meta) {
      res.status(statusCode).json({
        success: true,
        data,
        links,
        meta,
      });
      return;
    }

    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }
}
