export enum ResponseMessage {
  // Auth
  LOGIN_SUCCESS = "Login successful",
  LOGOUT_SUCCESS = "Logout successful",
  INVALID_CREDENTIALS = "Invalid email or password",
  ACCOUNT_INACTIVE = "User account is inactive",
  PASSWORD_MISSING = "User password is missing",
  ROLE_NOT_ALLOWED = "User role is not allowed",
  UNAUTHORIZED = "Unauthorized",
  FORBIDDEN = "You are not authorized to perform this action",

  // User
  USER_CREATED = "User created successfully",
  USER_FETCHED = "User fetched successfully",
  USERS_FETCHED = "Users fetched successfully",
  PERMISSIONS_FETCHED = "Permissions fetched successfully",
  USER_UPDATED = "User updated successfully",
  USER_DELETED = "User deleted successfully",
  USER_NOT_FOUND = "User not found",
  USER_ALREADY_EXISTS = "User with this email already exists",
  EMAIL_UPDATE_FORBIDDEN = "Email can not be updated",
  DOCTOR_FIELDS_REQUIRED = "Specialty, practice location, and license number are required when changing role to Doctor",
  FDO_PERMISSIONS_REQUIRED = "Permissions are required when changing role to FDO",

  // Patient
  PATIENT_CREATED = "Patient created successfully",
  PATIENT_FETCHED = "Patient fetched successfully",
  PATIENTS_FETCHED = "Patients fetched successfully",
  PATIENT_UPDATED = "Patient updated successfully",
  PATIENT_DELETED = "Patient deleted successfully",
  PATIENT_NOT_FOUND = "Patient not found",
  PATIENT_ALREADY_EXISTS = "Patient already exists",
  PATIENT_CREATION_FAILED = "Patient record could not be created",

  // Case
  CASE_CREATED = "Case created successfully",
  CASE_FETCHED = "Case fetched successfully",
  CASES_FETCHED = "Cases fetched successfully",
  PATIENT_CASES_FETCHED = "Patient cases fetched successfully",
  CASE_UPDATED = "Case updated successfully",
  CASE_DELETED = "Case deleted successfully",
  CASE_NOT_FOUND = "Case not found",
  CASE_CREATION_FAILED = "Case record could not be created",

  // Specialty
  SPECIALTY_CREATED = "Specialty Created",
  SPECIALTY_NOT_FOUND = "Specialty not found",
  SPECIALTIES_FETCHED = "Specialties fetched successfully",
  SPECIALTY_FETCHED = "Specialty fetched successfully",
  SPECIALTY_UPDATED = "Specialty updated successfully",
  SPECIALTY_DELETED = "Specialty deleted successfully",
  SPECIALTY_CREATION_FAILED = "Specialty record could not be created",

  // Validation
  INVALID_ID_FORMAT = "Invalid ID format.",
  INVALID_PATIENT_ID = "Invalid patient ID",
  INVALID_PATIENT_ID_FORMAT = "Invalid patient ID format",
  INVALID_UUID_FORMAT = "Invalid ID format. ID must be a UUID.",

  // Chat
  CHAT_RESPONSE_GENERATED = "Response generated successfully",
  CHAT_MESSAGE_REQUIRED = "Message is required",
  CHAT_SERVICE_UNAVAILABLE = "Chat service is temporarily unavailable",
}
