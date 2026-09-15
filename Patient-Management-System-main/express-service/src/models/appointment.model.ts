import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from "sequelize";
import { AppointmentType } from "../enums/appointmentType.enum";
import { AppointmentStatus } from "../enums/appointmentStatus.enum";
import { ReminderMethod } from "../enums/reminderMethod.enum";
import type { PatientCase } from "./patientCase.model";
import type { Patient } from "./patient.model";
import type { DoctorProfile } from "./doctorProfile.model";
import type { Specialty } from "./specialty.model";
import type { PracticeLocation } from "./practiceLocation.model";
import type { User } from "./user.model";

export class Appointment extends Model<
  InferAttributes<Appointment>,
  InferCreationAttributes<Appointment>
> {
  declare id: CreationOptional<string>;
  declare appointment_number: CreationOptional<string>;
  declare case_id: ForeignKey<string>;
  declare patient_id: ForeignKey<string>;
  declare doctor_id: ForeignKey<string>;
  declare appointment_date: string;
  declare appointment_time: string;
  declare appointment_type: AppointmentType;
  declare specialty_id: ForeignKey<CreationOptional<string | null>>;
  declare practice_location_id: ForeignKey<CreationOptional<string | null>>;
  declare duration_minutes: CreationOptional<number>;
  declare status: CreationOptional<AppointmentStatus>;
  declare reminder_sent: CreationOptional<boolean>;
  declare reminder_method: CreationOptional<ReminderMethod>;
  declare notes: CreationOptional<string | null>;
  declare reason_for_visit: CreationOptional<string | null>;
  declare created_by: ForeignKey<CreationOptional<string | null>>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare patientCase?: NonAttribute<PatientCase>;
  declare patient?: NonAttribute<Patient>;
  declare doctor?: NonAttribute<DoctorProfile>;
  declare specialty?: NonAttribute<Specialty>;
  declare practiceLocation?: NonAttribute<PracticeLocation>;
  declare createdBy?: NonAttribute<User>;
  declare visit?: NonAttribute<import("../models/visit.model").Visit>;

  //INFO: Virtual field — computed end time from appointment_time + duration_minutes
  get endTime(): NonAttribute<string> {
    const [hours, minutes] = this.appointment_time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + (this.duration_minutes || 0);
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
    const endM = String(totalMinutes % 60).padStart(2, "0");
    return `${endH}:${endM}:00`;
  }

  static associate(models: Record<string, any>): void {
    Appointment.belongsTo(models.PatientCase, {
      foreignKey: "case_id",
      as: "patientCase",
    });
    Appointment.belongsTo(models.Patient, {
      foreignKey: "patient_id",
      as: "patient",
    });
    Appointment.belongsTo(models.DoctorProfile, {
      foreignKey: "doctor_id",
      as: "doctor",
    });
    Appointment.belongsTo(models.Specialty, {
      foreignKey: "specialty_id",
      as: "specialty",
    });
    Appointment.belongsTo(models.PracticeLocation, {
      foreignKey: "practice_location_id",
      as: "practiceLocation",
    });
    Appointment.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "createdBy",
    });
    Appointment.hasOne(models.Visit, {
      foreignKey: "appointment_id",
      as: "visit",
    });
  }

  static initModel(sequelize: Sequelize): typeof Appointment {
    Appointment.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        appointment_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        case_id: { type: DataTypes.UUID, allowNull: false },
        patient_id: { type: DataTypes.UUID, allowNull: false },
        doctor_id: { type: DataTypes.UUID, allowNull: false },
        appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
        appointment_time: { type: DataTypes.TIME, allowNull: false },
        appointment_type: {
          type: DataTypes.ENUM(...Object.values(AppointmentType)),
          allowNull: false,
        },
        specialty_id: { type: DataTypes.UUID, allowNull: true },
        practice_location_id: { type: DataTypes.UUID, allowNull: true },
        duration_minutes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 30,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(AppointmentStatus)),
          allowNull: false,
          defaultValue: AppointmentStatus.SCHEDULED,
        },
        reminder_sent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        reminder_method: {
          type: DataTypes.ENUM(...Object.values(ReminderMethod)),
          allowNull: false,
          defaultValue: ReminderMethod.NONE,
        },
        notes: { type: DataTypes.TEXT, allowNull: true },
        reason_for_visit: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.UUID, allowNull: true },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "appointments",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        hooks: {
          //INFO: Auto-generate appointment_number in APT-YYYY-NNNNNN format
          beforeValidate: async (instance: Appointment) => {
            if (!instance.appointment_number) {
              const year = new Date().getFullYear();
              const count = await Appointment.unscoped().count();
              const sequence = String(count + 1).padStart(6, "0");
              instance.appointment_number = `APT-${year}-${sequence}`;
            }
          },
        },
        indexes: [
          // { unique: true, fields: ['appointment_number'] }, // Duplicate: already enforced by appointment_number unique:true
          //INFO: Doctor's daily schedule — the single most critical scheduling query
          { fields: ["doctor_id", "appointment_date"] },
          //INFO: Patient's upcoming appointments — viewed on patient detail screen
          { fields: ["patient_id", "appointment_date"] },
          //INFO: Location schedule — used by front desk to see all appointments at a site
          { fields: ["practice_location_id", "appointment_date"] },
          //INFO: Appointments linked to a case for case timeline views
          { fields: ["case_id"] },
          //INFO: Status filter for appointment management (Scheduled/Confirmed/Completed)
          { fields: ["status"] },
          //INFO: Combined date + status for dashboard queries like "today's pending appointments"
          { fields: ["appointment_date", "status"] },
          //INFO: FDO audit trail — who created this appointment
          { fields: ["created_by"] },
          //INFO: Reminder batch job queries unsent reminders by date
          { fields: ["reminder_sent", "appointment_date"] },
        ],
      },
    );
    return Appointment;
  }
}
