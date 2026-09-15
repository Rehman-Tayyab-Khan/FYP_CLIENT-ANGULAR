import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api-response.util";
import { UserService } from "../services/user.service";
import {
  createUserSchema,
  updateUserSchema,
  paginationQuerySchema,
} from "../validations/user.validation";
import { AppError } from "../utils/app-error.util";
import { isValidUUID } from "../utils/uuid.util";
import { HttpStatusCode, ResponseMessage } from "../enums";
import { getPaginatedResponse } from "../utils/pagination.util";

export class UserController {
  constructor(private userService: UserService = new UserService()) {}

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const user = await this.userService.createUser(userData);

      return ApiResponse.send(
        res,
        { user },
        ResponseMessage.USER_CREATED,
        HttpStatusCode.CREATED,
      );
    } catch (error) {
      return next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = paginationQuerySchema.parse(req.query);
      const { page, per_page, ...filters } = query;

      const { rows: users, count: total } = await this.userService.getAllUsers(
        page,
        per_page,
        filters,
      );

      const paginated = getPaginatedResponse(users, total, page, per_page, req);

      ApiResponse.send(
        res,
        paginated.data,
        ResponseMessage.USERS_FETCHED,
        HttpStatusCode.OK,
        paginated.links,
        paginated.meta,
      );
    } catch (error) {
      next(error);
    }
  };

  getAllPermissions = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const permissions = await this.userService.getAllPermissions();

      return ApiResponse.send(
        res,
        { permissions },
        ResponseMessage.PERMISSIONS_FETCHED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      return next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      const user = await this.userService.getUserById(id);

      return ApiResponse.send(res, { user }, ResponseMessage.USER_FETCHED);
    } catch (error) {
      return next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      const updateData = updateUserSchema.parse(req.body);
      const user = await this.userService.updateUser(id, updateData);

      return ApiResponse.send(res, { user }, ResponseMessage.USER_UPDATED);
    } catch (error) {
      return next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      await this.userService.deleteUser(id);

      return ApiResponse.send(res, null, ResponseMessage.USER_DELETED);
    } catch (error) {
      return next(error);
    }
  };
}
