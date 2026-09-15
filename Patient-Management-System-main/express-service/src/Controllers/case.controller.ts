import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api-response.util";
import { CaseService } from "../services/case.service";
import {
  createCaseSchema,
  updateCaseSchema,
  paginationQuerySchema,
} from "../validations/case.validation";
import { AppError } from "../utils/app-error.util";
import { isValidUUID } from "../utils/uuid.util";
import { FdoPermission, HttpStatusCode, ResponseMessage, Role } from "../enums";
import { checkFdoHasPermission } from "../utils/checkFdoPermission.util";
import { getPaginatedResponse } from "../utils/pagination.util";

export class CaseController {
  constructor(private caseService: CaseService = new CaseService()) {}

  createCase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.CREATE_CASE)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }
      const caseData = createCaseSchema.parse(req.body);
      const caseRecord = await this.caseService.createCase(caseData);

      return ApiResponse.send(
        res,
        { case: caseRecord },
        ResponseMessage.CASE_CREATED,
        HttpStatusCode.CREATED,
      );
    } catch (error) {
      return next(error);
    }
  };

  getAllCases = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.VIEW_CASES)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }

      const query = paginationQuerySchema.parse(req.query);
      const { page, per_page, ...filters } = query;

      const { rows: cases, count: total } = await this.caseService.getAllCases(
        page,
        per_page,
        filters,
      );

      const paginated = getPaginatedResponse(cases, total, page, per_page, req);

      ApiResponse.send(
        res,
        paginated.data,
        ResponseMessage.CASES_FETCHED,
        HttpStatusCode.OK,
        paginated.links,
        paginated.meta,
      );
    } catch (error) {
      return next(error);
    }
  };

  getCaseById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.VIEW_CASES)
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
            ResponseMessage.INVALID_ID_FORMAT,
          ),
        );
      }

      const caseRecord = await this.caseService.getCaseById(id);

      return ApiResponse.send(
        res,
        { case: caseRecord },
        ResponseMessage.CASE_FETCHED,
      );
    } catch (error) {
      return next(error);
    }
  };

  getCaseByPatient = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.VIEW_CASES)
      ) {
        return next(
          new AppError(HttpStatusCode.FORBIDDEN, ResponseMessage.FORBIDDEN),
        );
      }
      const patientId = Array.isArray(req.params.patient_id)
        ? req.params.patient_id[0]
        : req.params.patient_id;

      if (!isValidUUID(patientId)) {
        return next(
          new AppError(
            HttpStatusCode.BAD_REQUEST,
            ResponseMessage.INVALID_ID_FORMAT,
          ),
        );
      }

      const cases = await this.caseService.getCaseByPatient(patientId);

      return ApiResponse.send(
        res,
        { cases },
        ResponseMessage.PATIENT_CASES_FETCHED,
      );
    } catch (error) {
      return next(error);
    }
  };

  updateCase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        req.userRole === Role.FDO &&
        !checkFdoHasPermission(req.user!, FdoPermission.UPDATE_CASE)
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
            ResponseMessage.INVALID_ID_FORMAT,
          ),
        );
      }

      const updateData = updateCaseSchema.parse(req.body);
      const caseRecord = await this.caseService.updateCase(id, updateData);

      return ApiResponse.send(
        res,
        { case: caseRecord },
        ResponseMessage.CASE_UPDATED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      return next(error);
    }
  };

  deleteCase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!isValidUUID(id)) {
        return next(
          new AppError(
            HttpStatusCode.BAD_REQUEST,
            ResponseMessage.INVALID_UUID_FORMAT,
          ),
        );
      }

      await this.caseService.deleteCase(id);

      return ApiResponse.send(
        res,
        null,
        ResponseMessage.CASE_DELETED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      return next(error);
    }
  };
}
