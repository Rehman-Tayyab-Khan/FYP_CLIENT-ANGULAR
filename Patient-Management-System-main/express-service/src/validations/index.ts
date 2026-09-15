import { loginSchema } from "./auth.validation";
import { createCaseSchema, updateCaseSchema } from "./case.validation";
import { createPatientSchema, updatePatientSchema } from "./patient.validation";
import {
  createSpecialtySchema,
  updateSpecialtySchema,
} from "./specialty.validation";
import { createUserSchema, updateUserSchema } from "./user.validation";
import {
  normalizeOptionalQueryValue,
  optionalBooleanQuery,
  optionalDateQuery,
  optionalTrimmedString,
  optionalUuidQuery,
  preprocessOptionalEnum,
  preprocessOptionalNativeEnum,
} from "./validation.utils";

const validations = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createPatientSchema,
  updatePatientSchema,
  createCaseSchema,
  updateCaseSchema,
  createSpecialtySchema,
  updateSpecialtySchema,
  normalizeOptionalQueryValue,
  optionalTrimmedString,
  optionalBooleanQuery,
  optionalDateQuery,
  optionalUuidQuery,
  preprocessOptionalEnum,
  preprocessOptionalNativeEnum,
};

export {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createPatientSchema,
  updatePatientSchema,
  createCaseSchema,
  updateCaseSchema,
  createSpecialtySchema,
  updateSpecialtySchema,
  normalizeOptionalQueryValue,
  optionalTrimmedString,
  optionalBooleanQuery,
  optionalDateQuery,
  optionalUuidQuery,
  preprocessOptionalEnum,
  preprocessOptionalNativeEnum,
};
export default validations;
