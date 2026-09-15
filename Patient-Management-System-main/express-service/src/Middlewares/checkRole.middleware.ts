import { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpStatusCode, ResponseMessage, Role } from "../enums";
import { AppError } from "../utils/app-error.util";
import { Permission, User, UserPermission } from "../models";

export const checkRoleMiddleware = (
  roles: Role[],
  allowAdmin = true,
): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (allowAdmin && req.userRole === Role.ADMIN) {
        next();
        return;
      }

      if (!roles.includes(req.userRole as Role)) {
        return next(
          new AppError(
            HttpStatusCode.UNAUTHORIZED,
            ResponseMessage.UNAUTHORIZED,
          ),
        );
      }

      if (req.userRole === Role.FDO) {
        const user = await User.findByPk(req.userId, {
          include: [
            {
              model: UserPermission,
              as: "userPermissions",
              include: [
                {
                  model: Permission,
                  as: "permission",
                  attributes: ["permission_name"],
                },
              ],
            },
          ],
        });

        if (!user) {
          return next(
            new AppError(
              HttpStatusCode.NOT_FOUND,
              ResponseMessage.USER_NOT_FOUND,
            ),
          );
        }

        req.user = user;
      }

      next();
      return;
    } catch (error) {
      return next(error);
    }
  };
};
