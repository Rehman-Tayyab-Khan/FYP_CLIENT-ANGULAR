import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../utils/api-response.util";
import { PatientService } from "../services/patient.service";
import {
  createPatientSchema,
  updatePatientSchema,
  paginationQuerySchema,
} from "../validations/patient.validation";
import { AppError } from "../utils/app-error.util";
import { isValidUUID } from "../utils/uuid.util";
import { FdoPermission, HttpStatusCode, ResponseMessage, Role } from "../enums";
import { checkFdoHasPermission } from "../utils/checkFdoPermission.util";
import { getPaginatedResponse } from "../utils/pagination.util";

export class PatientController {
  constructor(private patientService: PatientService = new PatientService()) {}

  createPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientData = createPatientSchema.parse(req.body);
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.CREATE_PATIENT)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }
      const patient = await this.patientService.createPatient(patientData);
      return ApiResponse.send(
        res,
        { patient },
        ResponseMessage.PATIENT_CREATED,
        HttpStatusCode.CREATED,
      );
    } catch (error) {
      return next(error);
    }
  };

  // Get all patients (paginated)
  getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.VIEW_PATIENTS)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }

      const query = paginationQuerySchema.parse(req.query);
      const { page, per_page, ...filters } = query;

      //INFO: For doctors, we will filter patients to only those that have appointments with the doctor. Admins can see all patients.
      const { rows: patients, count: total } =
        await this.patientService.getAllPatients(
          page,
          per_page,
          filters,
          req.userRole === Role.DOCTOR ? req.userId : undefined,
        );

      const paginated = getPaginatedResponse(
        patients,
        total,
        page,
        per_page,
        req,
      );

      ApiResponse.send(
        res,
        paginated.data,
        ResponseMessage.PATIENTS_FETCHED,
        HttpStatusCode.OK,
        paginated.links,
        paginated.meta,
      );
    } catch (error) {
      next(error);
    }
  };

  // Get patient by ID
  getPatientById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.VIEW_PATIENTS)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!isValidUUID(id)) {
        return next(
          new AppError(
            HttpStatusCode.BAD_REQUEST,
            ResponseMessage.INVALID_PATIENT_ID,
          ),
        );
      }

      const patient = await this.patientService.getPatientById(id);
      ApiResponse.send(
        res,
        { patient },
        ResponseMessage.PATIENT_FETCHED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      next(error);
    }
  };

  // Update patient
  updatePatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.UPDATE_PATIENT)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!isValidUUID(id)) {
        return next(
          new AppError(
            HttpStatusCode.BAD_REQUEST,
            ResponseMessage.INVALID_PATIENT_ID,
          ),
        );
      }

      const updatedData = updatePatientSchema.parse(req.body);
      const patient = await this.patientService.updatePatient(id, updatedData);

      ApiResponse.send(
        res,
        { patient },
        ResponseMessage.PATIENT_UPDATED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      next(error);
    }
  };

  // Soft delete patient
  deletePatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!isValidUUID(id)) {
        return next(
          new AppError(
            HttpStatusCode.BAD_REQUEST,
            ResponseMessage.INVALID_PATIENT_ID_FORMAT,
          ),
        );
      }

      await this.patientService.deletePatient(id);
      ApiResponse.send(
        res,
        null,
        ResponseMessage.PATIENT_DELETED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      next(error);
    }
  };
}
