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
import { CaseCategory } from "../enums/caseCategory.enum";
import { CaseType } from "../enums/caseType.enum";
import { CasePriority } from "../enums/casePriority.enum";
import { CaseStatus } from "../enums/caseStatus.enum";
import type { Patient } from "./patient.model";
import type { PracticeLocation } from "./practiceLocation.model";
import type { Insurance } from "./insurance.model";
import type { Firm } from "./firm.model";

export class PatientCase extends Model<
  InferAttributes<PatientCase>,
  InferCreationAttributes<PatientCase>
> {
  declare id: CreationOptional<string>;
  declare case_number: CreationOptional<string>;
  declare patient_id: ForeignKey<string>;
  declare practice_location_id: ForeignKey<string>;
  declare category: CaseCategory;
  declare purpose_of_visit: string;
  declare case_type: CaseType;
  declare priority: CreationOptional<CasePriority>;
  declare case_status: CreationOptional<CaseStatus>;
  declare date_of_accident: CreationOptional<string | null>;
  declare insurance_id: ForeignKey<CreationOptional<string | null>>;
  declare firm_id: ForeignKey<CreationOptional<string | null>>;
  declare referred_by: CreationOptional<string | null>;
  declare referred_doctor_name: CreationOptional<string | null>;
  declare opening_date: string;
  declare closing_date: CreationOptional<string | null>;
  declare clinical_notes: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare patient?: NonAttribute<Patient>;
  declare practiceLocation?: NonAttribute<PracticeLocation>;
  declare insurance?: NonAttribute<Insurance>;
  declare firm?: NonAttribute<Firm>;
  declare appointments?: NonAttribute<
    import("./appointment.model").Appointment[]
  >;
  declare visits?: NonAttribute<import("./visit.model").Visit[]>;

  static associate(models: Record<string, any>): void {
    PatientCase.belongsTo(models.Patient, {
      foreignKey: "patient_id",
      as: "patient",
    });
    PatientCase.belongsTo(models.PracticeLocation, {
      foreignKey: "practice_location_id",
      as: "practiceLocation",
    });
    PatientCase.belongsTo(models.Insurance, {
      foreignKey: "insurance_id",
      as: "insurance",
    });
    PatientCase.belongsTo(models.Firm, { foreignKey: "firm_id", as: "firm" });
    PatientCase.hasMany(models.Appointment, {
      foreignKey: "case_id",
      as: "appointments",
    });
    PatientCase.hasMany(models.Visit, { foreignKey: "case_id", as: "visits" });
  }

  static initModel(sequelize: Sequelize): typeof PatientCase {
    PatientCase.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        case_number: { type: DataTypes.STRING, allowNull: false, unique: true },
        patient_id: { type: DataTypes.UUID, allowNull: false },
        practice_location_id: { type: DataTypes.UUID, allowNull: false },
        category: {
          type: DataTypes.ENUM(...Object.values(CaseCategory)),
          allowNull: false,
        },
        purpose_of_visit: { type: DataTypes.TEXT, allowNull: false },
        case_type: {
          type: DataTypes.ENUM(...Object.values(CaseType)),
          allowNull: false,
        },
        priority: {
          type: DataTypes.ENUM(...Object.values(CasePriority)),
          allowNull: false,
          defaultValue: CasePriority.NORMAL,
        },
        case_status: {
          type: DataTypes.ENUM(...Object.values(CaseStatus)),
          allowNull: false,
          defaultValue: CaseStatus.ACTIVE,
        },
        date_of_accident: { type: DataTypes.DATEONLY, allowNull: true },
        insurance_id: { type: DataTypes.UUID, allowNull: true },
        firm_id: { type: DataTypes.UUID, allowNull: true },
        referred_by: { type: DataTypes.STRING, allowNull: true },
        referred_doctor_name: { type: DataTypes.STRING, allowNull: true },
        opening_date: { type: DataTypes.DATEONLY, allowNull: false },
        closing_date: { type: DataTypes.DATEONLY, allowNull: true },
        clinical_notes: { type: DataTypes.TEXT, allowNull: true },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "patient_cases",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        hooks: {
          //INFO: Auto-generate case_number in CASE-YYYY-NNNNN format before validation
          beforeValidate: async (instance: PatientCase) => {
            if (!instance.case_number) {
              const year = new Date().getFullYear();
              const count = await PatientCase.unscoped().count();
              const sequence = String(count + 1).padStart(5, "0");
              instance.case_number = `CASE-${year}-${sequence}`;
            }
            if (!instance.opening_date) {
              instance.opening_date = new Date().toISOString().split("T")[0];
            }
          },
        },
        indexes: [
          //INFO: Case number is the primary human-readable identifier for all case lookups
          // { unique: true, fields: ['case_number'] }, // Duplicate: already enforced by case_number unique:true
          //INFO: "Show all cases for patient X" — the most frequent case query
          { fields: ["patient_id"] },
          //INFO: "Show active cases for patient X" — case list with status filter
          { fields: ["patient_id", "case_status"] },
          //INFO: Cases filtered by location for location-specific dashboards
          { fields: ["practice_location_id"] },
          //INFO: Status filter on case management views (Active/Closed/On Hold)
          { fields: ["case_status"] },
          //INFO: Priority filter for urgent case triaging and escalation workflows
          { fields: ["priority"] },
          //INFO: Cases linked to a specific insurance for billing/claims queries
          { fields: ["insurance_id"] },
          //INFO: Cases linked to a specific firm for legal case management
          { fields: ["firm_id"] },
          //INFO: Date-range reporting on case openings for analytics
          { fields: ["opening_date"] },
        ],
      },
    );
    return PatientCase;
  }
}
