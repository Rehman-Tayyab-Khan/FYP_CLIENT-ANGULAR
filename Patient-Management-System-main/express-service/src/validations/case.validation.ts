import { z } from "zod";
import {
  optionalDateQuery,
  optionalTrimmedString,
  optionalUuidQuery,
  preprocessOptionalEnum,
  withRequiredPreprocess,
} from "./validation.utils";
import { enumToArray } from "../utils/enum.util";

import { CaseCategory } from "../enums/caseCategory.enum";
import { CasePriority } from "../enums/casePriority.enum";
import { CaseStatus } from "../enums/caseStatus.enum";
import { CaseType } from "../enums/caseType.enum";

const caseSchemaBase = z.object({
  patient_id: withRequiredPreprocess(
    z.uuid({ message: "Patient ID must be a valid UUID" }),
  ),

  practice_location_id: withRequiredPreprocess(
    z.uuid({ message: "Practice location ID must be a valid UUID" }),
  ),

  category: withRequiredPreprocess(z.enum(enumToArray(CaseCategory))),

  purpose_of_visit: withRequiredPreprocess(
    z
      .string()
      .min(5, "Purpose must be at least 5 characters")
      .max(1000, "Purpose too long"),
  ),

  case_type: withRequiredPreprocess(z.enum(enumToArray(CaseType))),

  // Use preprocess to handle null/empty strings for optional enums
  priority: withRequiredPreprocess(
    z.enum(enumToArray(CasePriority)).optional(),
  ),

  case_status: withRequiredPreprocess(
    z.enum(enumToArray(CaseStatus)).optional(),
  ),

  // For Dates: we must handle null before coercion
  date_of_accident: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.coerce.date().optional(),
    )
    .refine(
      (date) => !date || date <= new Date(),
      "Accident date cannot be in the future",
    ),

  // For Optional UUIDs: convert null/empty to undefined
  insurance_id: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.uuid({ message: "Insurance ID must be a valid UUID" }).optional(),
  ),

  firm_id: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.uuid({ message: "Firm ID must be a valid UUID" }).optional(),
  ),

  referred_by: withRequiredPreprocess(z.string().max(100).optional()),

  referred_doctor_name: withRequiredPreprocess(z.string().max(100).optional()),

  opening_date: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.date().optional(),
  ),

  closing_date: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.coerce.date().optional(),
    )
    .refine(
      (date) => !date || date <= new Date(),
      "Closing date cannot be in the future",
    ),

  clinical_notes: withRequiredPreprocess(z.string().max(2000).optional()),
});

export const createCaseSchema = caseSchemaBase.refine(
  (data) => {
    if (data.closing_date && data.opening_date) {
      return data.closing_date >= data.opening_date;
    }
    return true;
  },
  {
    message: "Closing date must be after opening date",
    path: ["closing_date"],
  },
);

export const updateCaseSchema = caseSchemaBase.partial().refine(
  (data) => {
    if (data.closing_date && data.opening_date) {
      return data.closing_date >= data.opening_date;
    }
    return true;
  },
  {
    message: "Closing date must be after opening date",
    path: ["closing_date"],
  },
);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(15),
  search: optionalTrimmedString,
  case_number: optionalTrimmedString,
  patient_id: optionalUuidQuery,
  practice_location_id: optionalUuidQuery,
  insurance_id: optionalUuidQuery,
  firm_id: optionalUuidQuery,
  category: preprocessOptionalEnum(enumToArray(CaseCategory)),
  case_type: preprocessOptionalEnum(enumToArray(CaseType)),
  priority: preprocessOptionalEnum(enumToArray(CasePriority)),
  case_status: preprocessOptionalEnum(enumToArray(CaseStatus)),
  opening_date_from: optionalDateQuery,
  opening_date_to: optionalDateQuery,
});
