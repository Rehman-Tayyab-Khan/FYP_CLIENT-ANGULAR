import { z } from "zod";
import { isValidUUID } from "../utils/uuid.util";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const withRequiredPreprocess = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    // keep Date intact
    if (value instanceof Date) return value;

    // trim strings before emptiness check so whitespace-only values become undefined
    if (typeof value === "string") {
      value = value.trim();
    }

    // convert empty values to undefined (NOT "")
    if (value === null || value === undefined || value === "") {
      return undefined;
    }
    return value;
  }, schema);

export const normalizeOptionalQueryValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  return value;
};

export const optionalTrimmedString = z.preprocess(
  normalizeOptionalQueryValue,
  z.string().optional(),
);

export const optionalUuidQuery = z.preprocess(
  normalizeOptionalQueryValue,
  z.string().uuid().optional(),
);

export const optionalDateQuery = z.preprocess(
  normalizeOptionalQueryValue,
  z
    .string()
    .regex(DATE_ONLY_REGEX, "Date must be in YYYY-MM-DD format")
    .optional(),
);

export const optionalBooleanQuery = z.preprocess((value) => {
  const normalized = normalizeOptionalQueryValue(value);

  if (normalized === undefined) {
    return undefined;
  }

  if (typeof normalized === "boolean") {
    return normalized;
  }

  if (typeof normalized === "string") {
    const lowered = normalized.toLowerCase();
    if (lowered === "true" || lowered === "1") return true;
    if (lowered === "false" || lowered === "0") return false;
  }

  return normalized;
}, z.boolean().optional());

export const preprocessOptionalEnum = <T extends [string, ...string[]]>(
  values: T,
) => z.preprocess(normalizeOptionalQueryValue, z.enum(values).optional());

export const preprocessOptionalNativeEnum = <
  T extends Record<string, string | number>,
>(
  enumObject: T,
) => z.preprocess(normalizeOptionalQueryValue, z.enum(enumObject).optional());

export const isValidSpecialtyId = (id: string): boolean => {
  const numericIdPattern = /^\d+$/;
  return isValidUUID(id) || numericIdPattern.test(id);
};
