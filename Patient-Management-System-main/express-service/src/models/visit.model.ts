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
import { VisitStatus } from "../enums/visitStatus.enum";
import type { Appointment } from "./appointment.model";
import type { PatientCase } from "./patientCase.model";
import type { Patient } from "./patient.model";
import type { DoctorProfile } from "./doctorProfile.model";
import type { Diagnoses } from "./diagnoses.model";

export class Visit extends Model<
  InferAttributes<Visit>,
  InferCreationAttributes<Visit>
> {
  declare id: CreationOptional<string>;
  declare visit_number: string;
  declare appointment_id: ForeignKey<string>;
  declare case_id: ForeignKey<string>;
  declare patient_id: ForeignKey<string>;
  declare doctor_id: ForeignKey<string>;
  declare visit_date: string;
  declare visit_time: CreationOptional<string | null>;
  declare visit_duration_minutes: CreationOptional<number | null>;
  declare diagnoses_id: ForeignKey<CreationOptional<string | null>>;
  declare treatment: CreationOptional<string | null>;
  declare treatment_plan: CreationOptional<string | null>;
  declare prescription: CreationOptional<string | null>;
  declare prescription_documents: CreationOptional<string[] | null>;
  declare notes: CreationOptional<string | null>;
  declare vital_signs: CreationOptional<Record<string, any> | null>;
  declare symptoms: CreationOptional<string | null>;
  declare follow_up_required: CreationOptional<boolean>;
  declare follow_up_date: CreationOptional<string | null>;
  declare referral_made: CreationOptional<boolean>;
  declare referral_to: CreationOptional<string | null>;
  declare visit_status: CreationOptional<VisitStatus>;
  declare completed_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare appointment?: NonAttribute<Appointment>;
  declare patientCase?: NonAttribute<PatientCase>;
  declare patient?: NonAttribute<Patient>;
  declare doctor?: NonAttribute<DoctorProfile>;
  declare diagnoses?: NonAttribute<Diagnoses>;

  //INFO: Factory method — creates a Visit from a completed Appointment
  static async createFromAppointment(appointment: Appointment): Promise<Visit> {
    const year = new Date().getFullYear();
    const count = await Visit.unscoped().count();
    const sequence = String(count + 1).padStart(6, "0");
    const now = new Date();

    return Visit.create({
      visit_number: `VST-${year}-${sequence}`,
      appointment_id: appointment.id,
      case_id: appointment.case_id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      visit_date: now.toISOString().split("T")[0],
      visit_time: now.toTimeString().split(" ")[0],
      visit_status: VisitStatus.DRAFT,
    });
  }

  static associate(models: Record<string, any>): void {
    Visit.belongsTo(models.Appointment, {
      foreignKey: "appointment_id",
      as: "appointment",
    });
    Visit.belongsTo(models.PatientCase, {
      foreignKey: "case_id",
      as: "patientCase",
    });
    Visit.belongsTo(models.Patient, {
      foreignKey: "patient_id",
      as: "patient",
    });
    Visit.belongsTo(models.DoctorProfile, {
      foreignKey: "doctor_id",
      as: "doctor",
    });
    Visit.belongsTo(models.Diagnoses, {
      foreignKey: "diagnoses_id",
      as: "diagnoses",
    });
  }

  static initModel(sequelize: Sequelize): typeof Visit {
    Visit.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        visit_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        appointment_id: { type: DataTypes.UUID, allowNull: false },
        case_id: { type: DataTypes.UUID, allowNull: false },
        patient_id: { type: DataTypes.UUID, allowNull: false },
        doctor_id: { type: DataTypes.UUID, allowNull: false },
        visit_date: { type: DataTypes.DATEONLY, allowNull: false },
        visit_time: { type: DataTypes.TIME, allowNull: true },
        visit_duration_minutes: { type: DataTypes.INTEGER, allowNull: true },
        diagnoses_id: { type: DataTypes.UUID, allowNull: true },
        treatment: { type: DataTypes.TEXT, allowNull: true },
        treatment_plan: { type: DataTypes.TEXT, allowNull: true },
        prescription: { type: DataTypes.TEXT, allowNull: true },
        prescription_documents: { type: DataTypes.JSON, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        vital_signs: { type: DataTypes.JSON, allowNull: true },
        symptoms: { type: DataTypes.TEXT, allowNull: true },
        follow_up_required: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        follow_up_date: { type: DataTypes.DATEONLY, allowNull: true },
        referral_made: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        referral_to: { type: DataTypes.STRING, allowNull: true },
        visit_status: {
          type: DataTypes.ENUM(...Object.values(VisitStatus)),
          allowNull: false,
          defaultValue: VisitStatus.DRAFT,
        },
        completed_at: { type: DataTypes.DATE, allowNull: true },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "visits",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          //INFO: Visit number is the primary human-readable identifier
          // { unique: true, fields: ['visit_number'] }, // Duplicate: already enforced by visit_number unique:true
          //INFO: One-to-one with appointment — each appointment produces at most one visit
          { unique: true, fields: ["appointment_id"] },
          //INFO: Doctor's visit history by date — used for productivity reports
          { fields: ["doctor_id", "visit_date"] },
          //INFO: Patient's visit history by date — used on patient timeline screen
          { fields: ["patient_id", "visit_date"] },
          //INFO: Visits linked to a case for case timeline views
          { fields: ["case_id"] },
          //INFO: Status filter for visit management (Draft/Completed/Billed)
          { fields: ["visit_status"] },
          //INFO: Diagnosis-based reporting for clinical analytics
          { fields: ["diagnoses_id"] },
          //INFO: Follow-up scheduling — finds visits requiring follow-up by date
          { fields: ["follow_up_required", "follow_up_date"] },
          //INFO: Referral tracking for care coordination reporting
          { fields: ["referral_made"] },
        ],
      },
    );
    return Visit;
  }
}
