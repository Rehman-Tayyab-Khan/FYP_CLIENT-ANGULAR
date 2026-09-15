import z from "zod";
import { Op } from "sequelize";
import { Patient } from "../models/patient.model";
import { AppError } from "../utils/app-error.util";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../validations/patient.validation";
import { HttpStatusCode, PatientStatus, ResponseMessage } from "../enums";
import { Appointment, DoctorProfile } from "../models";
type CreatePatientInput = {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
} & Record<string, unknown>;

type PatientListFilters = {
  search?: string;
  gender?: string;
  patient_status?: string;
  city?: string;
  state?: string;
  country?: string;
  registration_date_from?: string;
  registration_date_to?: string;
};

export class PatientService {
  createPatient = async (patientData: z.infer<typeof createPatientSchema>) => {
    const existing = await Patient.findOne({
      where: {
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        date_of_birth: patientData.date_of_birth,
      },
    });

    if (existing) {
      throw new AppError(
        HttpStatusCode.CONFLICT,
        ResponseMessage.PATIENT_ALREADY_EXISTS,
      );
    }

    const patient = await Patient.create({
      ...patientData,
      patient_status: patientData.patient_status as PatientStatus,
      date_of_birth: patientData.date_of_birth as any,
      registration_date: (patientData.registration_date ?? new Date()) as any,
    });

    if (!patient) {
      throw new AppError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ResponseMessage.PATIENT_CREATION_FAILED,
      );
    }

    return patient;
  };

  getAllPatients = async (
    page: number = 1,
    limit: number = 15,
    filters: PatientListFilters = {},
    userId?: string,
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
        { mobile: { [Op.like]: search } },
      ];
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.patient_status) {
      where.patient_status = filters.patient_status;
    }

    if (filters.city) {
      where.city = { [Op.like]: `%${filters.city}%` };
    }

    if (filters.state) {
      where.state = { [Op.like]: `%${filters.state}%` };
    }

    if (filters.country) {
      where.country = { [Op.like]: `%${filters.country}%` };
    }

    if (filters.registration_date_from || filters.registration_date_to) {
      const registrationDateRange: Record<string | symbol, unknown> = {};
      if (filters.registration_date_from) {
        registrationDateRange[Op.gte] = filters.registration_date_from;
      }
      if (filters.registration_date_to) {
        registrationDateRange[Op.lte] = filters.registration_date_to;
      }
      where.registration_date = registrationDateRange;
    }
    //INFO: This is to ensure that doctors can only see their own patients. Admins can see all patients.

    const include: any[] = [];

    if (userId) {
      const doctorProfile = await DoctorProfile.findOne({
        where: {
          user_id: userId,
        },
        attributes: ["id"],
      });

      if (!doctorProfile) {
        return {
          rows: [],
          count: 0,
        };
      }

      include.push({
        model: Appointment,
        as: "appointments",
        attributes: [],
        required: true,
        where: {
          doctor_id: doctorProfile.id,
        },
      });
    }

    return Patient.findAndCountAll({
      include,
      where,
      distinct: true,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  };

  getPatientById = async (id: string) => {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.PATIENT_NOT_FOUND,
      );
    }

    return patient;
  };

  updatePatient = async (
    id: string,
    updatedData: z.infer<typeof updatePatientSchema>,
  ) => {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.PATIENT_NOT_FOUND,
      );
    }

    await patient.update(updatedData as any);

    return patient;
  };

  deletePatient = async (id: string) => {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        ResponseMessage.PATIENT_NOT_FOUND,
      );
    }

    await patient.destroy();
  };
}
