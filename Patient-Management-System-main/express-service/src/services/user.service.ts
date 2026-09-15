import z from "zod";
import { Op } from "sequelize";
import { User } from "../models/user.model";
import { AppError } from "../utils/app-error.util";
import {
  createUserSchema,
  updateUserSchema,
} from "../validations/user.validation";
import { HttpStatusCode, ResponseMessage, Role } from "../enums";
import {
  DoctorProfile,
  Permission,
  PracticeLocation,
  Specialty,
  UserPermission,
} from "../models";
import sequelize from "../config/database.config";
import { Transaction } from "sequelize";

type UserListFilters = {
  search?: string;
  role?: Role;
  is_active?: boolean;
  specialty_id?: string;
  practice_location_id?: string;
};

export class UserService {
  createUser = async (userData: z.infer<typeof createUserSchema>) => {
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });
    if (existingUser) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        ResponseMessage.USER_ALREADY_EXISTS,
      );
    }

    return await sequelize.transaction(async (t) => {
      const user = await User.create(userData, { transaction: t });
      return await this.handleRoleSpecificData(user, userData, t);
    });
  };

  getAllUsers = async (
    page: number = 1,
    limit: number = 15,
    filters: UserListFilters = {},
  ) => {
    const offset = (page - 1) * limit;

    const where: Record<string | symbol, unknown> = {};

    if (filters.search) {
      const search = `%${filters.search.trim()}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: search } },
        { last_name: { [Op.like]: search } },
        { email: { [Op.like]: search } },
        { phone: { [Op.like]: search } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (typeof filters.is_active === "boolean") {
      where.is_active = filters.is_active;
    }

    const doctorProfileWhere: Record<string, string> = {};
    if (filters.specialty_id) {
      doctorProfileWhere.specialty_id = filters.specialty_id;
    }
    if (filters.practice_location_id) {
      doctorProfileWhere.practice_location_id = filters.practice_location_id;
    }

    const includeDoctorProfile =
      filters.role === Role.DOCTOR ||
      !!filters.specialty_id ||
      !!filters.practice_location_id;

    const include = includeDoctorProfile
      ? [
          {
            model: DoctorProfile,
            as: "doctorProfile",
            required: Object.keys(doctorProfileWhere).length > 0,
            where:
              Object.keys(doctorProfileWhere).length > 0
                ? doctorProfileWhere
                : undefined,
            include: [
              {
                model: Specialty,
                as: "specialty",
                attributes: ["id", "specialty_name"],
              },
              {
                model: PracticeLocation,
                as: "practiceLocation",
                attributes: ["id", "location_name"],
              },
            ],
          },
        ]
      : undefined;

    return User.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  };

  getUserById = async (id: string) => {
    const user = await User.findByPk(id, {
      include: [
        {
          model: UserPermission,
          as: "userPermissions",
          attributes: ["id", "permission_id"],
          include: [
            {
              model: Permission,
              as: "permission",
              attributes: ["id", "permission_name"],
            },
          ],
        },
        {
          model: DoctorProfile,
          as: "doctorProfile",
          include: [
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "specialty_name"],
            },
            {
              model: PracticeLocation,
              as: "practiceLocation",
              attributes: ["id", "location_name"],
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.USER_NOT_FOUND,
      );
    }

    return user;
  };

  getAllPermissions = async () => {
    return Permission.findAll({
      attributes: ["id", "permission_name"],
      order: [["permission_name", "ASC"]],
    });
  };

  updateUser = async (
    id: string,
    updateData: z.infer<typeof updateUserSchema>,
  ) => {
    return await sequelize.transaction(async (t) => {
      const user = await User.findByPk(id, { transaction: t });

      if (!user) {
        throw new AppError(
          HttpStatusCode.NOT_FOUND,
          ResponseMessage.USER_NOT_FOUND,
        );
      }
      if (updateData.email) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          ResponseMessage.EMAIL_UPDATE_FORBIDDEN,
        );
      }

      // To Check role changes logic
      if (updateData.role && updateData.role !== user.role) {
        if (updateData.role === Role.DOCTOR) {
          if (
            !updateData.specialty_id ||
            !updateData.practice_location_id ||
            !updateData.license_number
          ) {
            throw new AppError(
              HttpStatusCode.BAD_REQUEST,
              ResponseMessage.DOCTOR_FIELDS_REQUIRED,
            );
          }
        } else if (updateData.role === Role.FDO) {
          if (!updateData.permissions || updateData.permissions.length === 0) {
            throw new AppError(
              HttpStatusCode.BAD_REQUEST,
              ResponseMessage.FDO_PERMISSIONS_REQUIRED,
            );
          }
        }
      }

      await user.update(updateData, { transaction: t });

      return await this.handleRoleSpecificData(user, updateData, t);
    });
  };

  deleteUser = async (id: string) => {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.USER_NOT_FOUND,
      );
    }

    await user.destroy();
  };

  private handleRoleSpecificData = async (
    user: User,
    data: any,
    transaction: Transaction,
  ) => {
    let result: any = { ...user.toJSON() };
    const role = data.role ?? user.role;

    if (role === Role.FDO) {
      if (data.permissions) {
        // Destroying existing permissions on update
        await UserPermission.destroy({
          where: { user_id: user.id },
          transaction,
        });

        const permissionRows = data.permissions.map((permission: string) => ({
          user_id: String(user.id),
          permission_id: permission,
        }));
        await UserPermission.bulkCreate(permissionRows, { transaction });
        result.permissions = permissionRows;
      }
    } else if (role === Role.DOCTOR) {
      let doctorProfile = await DoctorProfile.findOne({
        where: { user_id: user.id },
        transaction,
      });

      const allowedFields = [
        "specialty_id",
        "practice_location_id",
        "license_number",
        "availability_schedule",
        "bio",
      ];
      const profileData: any = {};
      allowedFields.forEach((field) => {
        if (data[field] !== undefined) profileData[field] = data[field];
      });

      if (doctorProfile) {
        if (Object.keys(profileData).length > 0) {
          await doctorProfile.update(profileData, { transaction });
        }
      } else {
        profileData.user_id = user.id;
        doctorProfile = await DoctorProfile.create(profileData, {
          transaction,
        });
      }

      result.doctorProfile = doctorProfile;
    }

    return result;
  };
}
