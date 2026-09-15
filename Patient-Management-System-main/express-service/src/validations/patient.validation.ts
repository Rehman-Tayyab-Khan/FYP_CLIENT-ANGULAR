import { z } from "zod";
import {
  optionalDateQuery,
  optionalTrimmedString,
  preprocessOptionalNativeEnum,
  withRequiredPreprocess,
} from "./validation.utils";
import { Gender } from "../enums/gender.enum";
import { PatientStatus } from "../enums/patientStatus.enum";

// phone regex (supports +, country code, dashes, spaces)
const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{1,4}[-.\s]?\d{3}[-.\s]?\d{4}$/;

const basePatientSchema = z.object({
  first_name: withRequiredPreprocess(z.string().min(3).max(50)),

  middle_name: withRequiredPreprocess(z.string().max(50).optional()),

  last_name: withRequiredPreprocess(z.string().min(3).max(50)),

  date_of_birth: withRequiredPreprocess(z.coerce.date()),

  gender: withRequiredPreprocess(z.enum(Gender)),

  cnic: withRequiredPreprocess(
    z
      .string()
      .regex(/^\d{5}-\d{7}-\d{1}$/)
      .optional(),
  ),

  email: withRequiredPreprocess(z.email().optional()),

  phone: withRequiredPreprocess(z.string().regex(phoneRegex).optional()),

  mobile: withRequiredPreprocess(z.string().regex(phoneRegex).optional()),

  address: withRequiredPreprocess(z.string().max(100).optional()),

  city: withRequiredPreprocess(z.string().max(50).optional()),

  state: withRequiredPreprocess(z.string().max(50).optional()),

  zip_code: withRequiredPreprocess(
    z
      .string()
      .regex(/^\d{5}(-\d{4})?$/)
      .optional(),
  ),

  country: withRequiredPreprocess(z.string().max(50).optional()),

  emergency_contact_name: withRequiredPreprocess(z.string().max(50).optional()),

  emergency_contact_phone: withRequiredPreprocess(
    z.string().regex(phoneRegex).optional(),
  ),

  primary_physician: withRequiredPreprocess(z.string().max(50).optional()),

  insurance_provider: withRequiredPreprocess(z.string().max(50).optional()),

  insurance_policy_number: withRequiredPreprocess(
    z.string().max(50).optional(),
  ),

  preferred_language: withRequiredPreprocess(z.string().max(30).optional()),

  patient_status: withRequiredPreprocess(
    z.enum(["active", "inactive", "deceased", "transferred"]),
  ),

  registration_date: z.coerce.date().optional(),
});

export const createPatientSchema = basePatientSchema
  .refine((data) => data.date_of_birth <= new Date(), {
    message: "Date of birth cannot be in the future",
    path: ["date_of_birth"],
  })
  .refine(
    (data) => {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      return data.date_of_birth > minDate;
    },
    {
      message: "Invalid date of birth",
      path: ["date_of_birth"],
    },
  );

export const updatePatientSchema = basePatientSchema.partial();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(15),
  search: optionalTrimmedString,
  gender: preprocessOptionalNativeEnum(Gender),
  patient_status: preprocessOptionalNativeEnum(PatientStatus),
  city: optionalTrimmedString,
  state: optionalTrimmedString,
  country: optionalTrimmedString,
  registration_date_from: optionalDateQuery,
  registration_date_to: optionalDateQuery,
});
