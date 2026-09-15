import { z } from "zod";
import {
  optionalBooleanQuery,
  optionalTrimmedString,
  optionalUuidQuery,
  preprocessOptionalNativeEnum,
  withRequiredPreprocess,
} from "./validation.utils";
import { Role } from "../enums";

const baseUser = z.object({
  first_name: withRequiredPreprocess(
    z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters"),
  ),
  last_name: withRequiredPreprocess(
    z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters"),
  ),
  email: withRequiredPreprocess(
    z.email("Please provide a valid email address"),
  ),
  password: withRequiredPreprocess(
    z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password cannot exceed 100 characters"),
  ),
  phone: withRequiredPreprocess(
    z.string().max(20, "Phone number cannot exceed 20 characters"),
  ),
  is_active: z.boolean(),
});
const doctorSchema = baseUser.extend({
  role: z.literal(Role.DOCTOR),
  specialty_id: withRequiredPreprocess(
    z.string().min(1, "Specialty is required"),
  ),
  practice_location_id: withRequiredPreprocess(
    z.string().min(1, "Practice location is required"),
  ),
  license_number: withRequiredPreprocess(
    z.string().min(1, "License number is required"),
  ),
  availability_schedule: z.json().optional(),
  bio: withRequiredPreprocess(
    z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  ),
});
export const fdoSchema = baseUser.extend({
  role: z.literal(Role.FDO),
  permissions: z
    .array(z.string().uuid("Permission ID must be a valid UUID"))
    .min(1, "At least one permission is required"),
});

const userRoleGuardSchema = z
  .looseObject({
    role: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    //INFO: if role is missing or empty, add an issue for the role field
    if (typeof data.role !== "string" || data.role.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: "Role is required",
      });
      return;
    }
    //INFO: if role is not doctor or fdo, add an issue for the role field
    if (![Role.DOCTOR, Role.FDO].includes(data.role as Role)) {
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: "Role must be either doctor or fdo",
      });
    }
  });

export const createUserSchema = userRoleGuardSchema.pipe(
  z.discriminatedUnion("role", [doctorSchema, fdoSchema]),
);

export const updateUserSchema = z
  .object({
    ...doctorSchema.shape,
    ...fdoSchema.shape,
    role: z.enum([Role.DOCTOR, Role.FDO]).optional(),
  })
  .partial();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(15),
  search: optionalTrimmedString,
  role: preprocessOptionalNativeEnum(Role),
  is_active: optionalBooleanQuery,
  specialty_id: optionalUuidQuery,
  practice_location_id: optionalUuidQuery,
});
