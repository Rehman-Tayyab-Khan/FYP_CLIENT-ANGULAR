import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.util";
import logger from "../config/logger.config";
import {
  UniqueConstraintError,
  ValidationError,
  ForeignKeyConstraintError,
  OptimisticLockError,
} from "sequelize";
import { ZodError } from "zod";
import { env } from "../config/env.config";

type NormalizedIssue = {
  field: string;
  message: string;
  isRequired: boolean;
};

const normalizeFieldPath = (path: readonly PropertyKey[]): string => {
  if (path.length === 0) return "field";

  return path.map((segment) => String(segment).replace(/_/g, " ")).join(".");
};

const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
    });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path).join(", ");
    res.status(409).json({
      success: false,
      message: `${fields} already exists`,
    });
    return;
  }

  if (err instanceof ZodError) {
    const normalizedIssues: NormalizedIssue[] = err.issues.map((issue) => {
      const field = normalizeFieldPath(issue.path);
      const rawMessage = issue.message || "Validation failed";
      const isRequiredIssue =
        issue.code === "invalid_type" &&
        rawMessage.toLowerCase().includes("received undefined");
      const isGenericTypeMismatchIssue =
        issue.code === "invalid_type" &&
        /expected\s+\w+\s*,\s*received\s+\w+/i.test(rawMessage);

      return {
        field,
        message: isRequiredIssue
          ? `${capitalize(field)} is required`
          : isGenericTypeMismatchIssue
            ? `${capitalize(field)} has an invalid value`
            : rawMessage,
        isRequired: isRequiredIssue,
      };
    });

    const fieldsWithRequiredIssue = new Set(
      normalizedIssues
        .filter((issue) => issue.isRequired)
        .map((issue) => issue.field),
    );

    const filteredMessages = normalizedIssues
      .filter((issue) => {
        if (!issue.isRequired && fieldsWithRequiredIssue.has(issue.field)) {
          return false;
        }
        return true;
      })
      .map((issue) => issue.message)
      .filter(Boolean);

    const message =
      Array.from(new Set(filteredMessages)).join(", ") || "Validation failed";

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message).join(", ");
    res.status(400).json({
      success: false,
      message: messages,
    });
    return;
  }

  if (err instanceof ForeignKeyConstraintError) {
    res.status(400).json({
      success: false,
      message: "Referenced record does not exist",
    });
    return;
  }

  if (err instanceof OptimisticLockError) {
    res.status(400).json({
      success: false,
      message:
        "The requested resource to update has been updated by someone else please refresh and try again",
    });
  }

  logger.error(`Unexpected Error: ${err.message}\n${err.stack}`);

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "development" ? err.message : "Internal Server Error",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
