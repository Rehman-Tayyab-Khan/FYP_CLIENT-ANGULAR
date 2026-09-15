import z from "zod";
import { Op } from "sequelize";
import { Specialty } from "../models/specialty.model";
import { AppError } from "../utils/app-error.util";
import { createSpecialtySchema, updateSpecialtySchema } from "../validations";
import { HttpStatusCode, ResponseMessage } from "../enums";

type SpecialtyListFilters = {
  search?: string;
  is_active?: boolean;
};

export class SpecialtyService {
  createSpecialty = async (data: z.infer<typeof createSpecialtySchema>) => {
    const specialty = await Specialty.create(data as any);

    if (!specialty) {
      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ResponseMessage.SPECIALTY_CREATION_FAILED,
      );
    }

    return specialty;
  };

  getAllSpecialties = async (
    page: number = 1,
    limit: number = 15,
    filters: SpecialtyListFilters = {},
  ) => {
    const offset = (page - 1) * limit;

    const where: Record<string | symbol, unknown> = {};

    if (filters.search) {
      const search = `%${filters.search.trim()}%`;
      where[Op.or] = [
        { specialty_name: { [Op.like]: search } },
        { description: { [Op.like]: search } },
      ];
    }

    if (typeof filters.is_active === "boolean") {
      where.is_active = filters.is_active;
    }

    return Specialty.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  };

  getSpecialtyById = async (id: string) => {
    const specialty = await Specialty.findByPk(id);

    if (!specialty) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.SPECIALTY_NOT_FOUND,
      );
    }

    return specialty;
  };

  updateSpecialty = async (
    id: string,
    data: z.infer<typeof updateSpecialtySchema>,
  ) => {
    const specialty = await Specialty.findByPk(id);

    if (!specialty) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.SPECIALTY_NOT_FOUND,
      );
    }

    await specialty.update(data as any);

    return specialty;
  };

  deleteSpecialty = async (id: string) => {
    const specialty = await Specialty.findByPk(id);

    if (!specialty) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.SPECIALTY_NOT_FOUND,
      );
    }

    await specialty.destroy();
  };
}
