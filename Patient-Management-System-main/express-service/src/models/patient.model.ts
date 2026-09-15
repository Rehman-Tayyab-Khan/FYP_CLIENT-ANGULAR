import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import * as crypto from "crypto";
import { Gender } from "../enums/gender.enum";
import { PatientStatus } from "../enums/patientStatus.enum";

export class Patient extends Model<
  InferAttributes<Patient>,
  InferCreationAttributes<Patient>
> {
  declare id: CreationOptional<string>;
  declare first_name: string;
  declare middle_name: CreationOptional<string | null>;
  declare last_name: string;
  declare date_of_birth: string;
  declare gender: Gender;
  declare cnic: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare mobile: CreationOptional<string | null>;
  declare address: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare state: CreationOptional<string | null>;
  declare zip_code: CreationOptional<string | null>;
  declare country: CreationOptional<string | null>;
  declare emergency_contact_name: CreationOptional<string | null>;
  declare emergency_contact_phone: CreationOptional<string | null>;
  declare primary_physician: CreationOptional<string | null>;
  declare insurance_provider: CreationOptional<string | null>;
  declare insurance_policy_number: CreationOptional<string | null>;
  declare preferred_language: CreationOptional<string>;
  declare patient_status: CreationOptional<PatientStatus>;
  declare registration_date: CreationOptional<Date>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare cases?: NonAttribute<import("./patientCase.model").PatientCase[]>;
  declare appointments?: NonAttribute<
    import("./appointment.model").Appointment[]
  >;
  declare visits?: NonAttribute<import("./visit.model").Visit[]>;

  //INFO: Virtual field — computed from date_of_birth, never persisted
  get age(): NonAttribute<number> {
    const today = new Date();
    const birth = new Date(this.date_of_birth);
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      years--;
    }
    return years;
  }

  static encryptCNIC(cnic: string): string {
    const secret = process.env.SSN_ENCRYPTION_KEY;

    if (!secret) {
      throw new Error("SSN_ENCRYPTION_KEY is missing in .env");
    }

    const key = Buffer.from(secret, "hex");

    if (key.length !== 32) {
      throw new Error(
        "SSN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)",
      );
    }

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    const encrypted = Buffer.concat([
      cipher.update(cnic, "utf8"),
      cipher.final(),
    ]);

    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  static decryptCNIC(encrypted: string): string {
    const secret = process.env.SSN_ENCRYPTION_KEY;

    if (!secret) {
      throw new Error("SSN_ENCRYPTION_KEY is missing in .env");
    }

    if (!encrypted.includes(":")) {
      return encrypted;
    }

    const key = Buffer.from(secret, "hex");

    const [ivHex, encryptedHex] = encrypted.split(":");

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }

  static associate(models: Record<string, any>): void {
    Patient.hasMany(models.PatientCase, {
      foreignKey: "patient_id",
      as: "cases",
    });
    Patient.hasMany(models.Appointment, {
      foreignKey: "patient_id",
      as: "appointments",
    });
    Patient.hasMany(models.Visit, { foreignKey: "patient_id", as: "visits" });
  }

  static initModel(sequelize: Sequelize): typeof Patient {
    Patient.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        first_name: { type: DataTypes.STRING, allowNull: false },
        middle_name: { type: DataTypes.STRING, allowNull: true },
        last_name: { type: DataTypes.STRING, allowNull: false },
        date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
        gender: {
          type: DataTypes.ENUM(...Object.values(Gender)),
          allowNull: false,
        },
        cnic: { type: DataTypes.STRING, allowNull: true, unique: true },
        email: { type: DataTypes.STRING, allowNull: true, unique: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        mobile: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        city: { type: DataTypes.STRING, allowNull: true },
        state: { type: DataTypes.STRING, allowNull: true },
        zip_code: { type: DataTypes.STRING, allowNull: true },
        country: { type: DataTypes.STRING, allowNull: true },
        emergency_contact_name: { type: DataTypes.STRING, allowNull: true },
        emergency_contact_phone: { type: DataTypes.STRING, allowNull: true },
        primary_physician: { type: DataTypes.STRING, allowNull: true },
        insurance_provider: { type: DataTypes.STRING, allowNull: true },
        insurance_policy_number: { type: DataTypes.STRING, allowNull: true },
        preferred_language: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "English",
        },
        patient_status: {
          type: DataTypes.ENUM(...Object.values(PatientStatus)),
          allowNull: false,
          defaultValue: PatientStatus.ACTIVE,
        },
        registration_date: { type: DataTypes.DATE, allowNull: false },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "patients",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        hooks: {
          beforeCreate: (patient: Patient) => {
            if (patient.cnic && !patient.cnic.includes(":")) {
              patient.cnic = Patient.encryptCNIC(patient.cnic);
            }
            if (!patient.registration_date) {
              patient.registration_date = new Date();
            }
          },
          beforeUpdate: (patient: Patient) => {
            if (
              patient.changed("cnic") &&
              patient.cnic &&
              !patient.cnic.includes(":")
            ) {
              patient.cnic = Patient.encryptCNIC(patient.cnic);
            }
          },
        },
        defaultScope: {
          //INFO: CNIC is never exposed in API responses by default
          attributes: { exclude: ["cnic"] },
        },
        scopes: {
          withCNIC: { attributes: { include: ["cnic"] } },
        },
        indexes: [
          //INFO: Prevent duplicate patient records with same first/last name and DOB
          {
            unique: true,
            fields: ["first_name", "last_name", "date_of_birth"],
            name: "unique_patient",
          },
          //INFO: Patient search by name — the most common front-desk operation
          { fields: ["last_name", "first_name"] },
          //INFO: Unique patient email for communication and portal login
          // { unique: true, fields: ['email'] }, // Duplicate: already enforced by email unique:true
          //INFO: Unique encrypted CNIC for identity verification
          // { unique: true, fields: ['cnic'] }, // Duplicate: already enforced by cnic unique:true
          //INFO: DOB used in age-range reports and patient identification
          { fields: ["date_of_birth"] },
          //INFO: Status filter on every patient list view (Active/Inactive/etc.)
          { fields: ["patient_status"] },
          //INFO: Phone lookup when patients call in for appointment scheduling
          { fields: ["phone"] },
          //INFO: Date-range queries for registration reports and analytics
          { fields: ["registration_date"] },
        ],
      },
    );
    return Patient;
  }
}
