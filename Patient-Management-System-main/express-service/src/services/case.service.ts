import z from "zod";
import { Op } from "sequelize";
import { PatientCase } from "../models/patientCase.model";
import { Patient } from "../models/patient.model";
import { PracticeLocation } from "../models/practiceLocation.model";
import { Insurance } from "../models/insurance.model";
import { Firm } from "../models/firm.model";

import { AppError } from "../utils/app-error.util";
import { createCaseSchema, updateCaseSchema } from "../validations";
import { HttpStatusCode, ResponseMessage } from "../enums";

type CaseListFilters = {
  search?: string;
  case_number?: string;
  patient_id?: string;
  practice_location_id?: string;
  insurance_id?: string;
  firm_id?: string;
  category?: string;
  case_type?: string;
  priority?: string;
  case_status?: string;
  opening_date_from?: string;
  opening_date_to?: string;
};

export class CaseService {
  createCase = async (caseData: z.infer<typeof createCaseSchema>) => {
    const patientCase = await PatientCase.create(caseData as any);
    if (!patientCase) {
      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ResponseMessage.CASE_CREATION_FAILED,
      );
    }
    return patientCase;
  };

  getAllCases = async (
    page: number = 1,
    limit: number = 15,
    filters: CaseListFilters = {},
  ) => {
    const offset = (page - 1) * limit;

    const where: Record<string | symbol, unknown> = {};

    if (filters.search) {
      const search = `%${filters.search.trim()}%`;
      const matchedPatients = await Patient.findAll({
        attributes: ["id"],
        where: {
          [Op.or]: [
            { first_name: { [Op.like]: search } },
            { last_name: { [Op.like]: search } },
          ],
        },
      });

      const matchedPatientIds = matchedPatients.map((patient) => patient.id);

      where[Op.or] = [
        { case_number: { [Op.like]: search } },
        { category: { [Op.like]: search } },
        { case_type: { [Op.like]: search } },
        { priority: { [Op.like]: search } },
        { case_status: { [Op.like]: search } },
        ...(matchedPatientIds.length
          ? [{ patient_id: { [Op.in]: matchedPatientIds } }]
          : []),
      ];
    }

    if (filters.case_number) {
      where.case_number = { [Op.like]: `%${filters.case_number}%` };
    }

    if (filters.patient_id) {
      where.patient_id = filters.patient_id;
    }

    if (filters.practice_location_id) {
      where.practice_location_id = filters.practice_location_id;
    }

    if (filters.insurance_id) {
      where.insurance_id = filters.insurance_id;
    }

    if (filters.firm_id) {
      where.firm_id = filters.firm_id;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.case_type) {
      where.case_type = filters.case_type;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.case_status) {
      where.case_status = filters.case_status;
    }

    if (filters.opening_date_from || filters.opening_date_to) {
      const openingDateRange: Record<string | symbol, unknown> = {};
      if (filters.opening_date_from) {
        openingDateRange[Op.gte] = filters.opening_date_from;
      }
      if (filters.opening_date_to) {
        openingDateRange[Op.lte] = filters.opening_date_to;
      }
      where.opening_date = openingDateRange;
    }

    return PatientCase.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "first_name", "last_name"],
        },
      ],
    });
  };

  getCaseById = async (id: string) => {
    const patientCase = await PatientCase.findByPk(id, {
      include: [
        {
          model: Patient,
          as: "patient",
        },
        {
          model: PracticeLocation,
          as: "practiceLocation",
          attributes: ["id", "location_name"],
        },
        {
          model: Insurance,
          as: "insurance",
          attributes: ["id", "insurance_name"],
        },
        {
          model: Firm,
          as: "firm",
          attributes: ["id", "firm_name"],
        },
      ],
    });

    if (!patientCase) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.CASE_NOT_FOUND,
      );
    }

    return patientCase;
  };

  getCaseByPatient = async (patientId: string) => {
    return PatientCase.findAll({
      where: { patient_id: patientId },
    });
  };

  updateCase = async (
    id: string,
    updateData: z.infer<typeof updateCaseSchema>,
  ) => {
    const patientCase = await PatientCase.findByPk(id);

    if (!patientCase) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.CASE_NOT_FOUND,
      );
    }

    await patientCase.update(updateData as any);

    return patientCase;
  };

  deleteCase = async (id: string) => {
    const patientCase = await PatientCase.findByPk(id);
    if (!patientCase) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.CASE_NOT_FOUND,
      );
    }

    await patientCase.destroy();
  };
}
