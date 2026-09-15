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
import type { User } from "./user.model";
import type { Specialty } from "./specialty.model";
import type { PracticeLocation } from "./practiceLocation.model";

export class DoctorProfile extends Model<
  InferAttributes<DoctorProfile>,
  InferCreationAttributes<DoctorProfile>
> {
  declare id: CreationOptional<string>;
  declare user_id: ForeignKey<string>;
  declare specialty_id: ForeignKey<string>;
  declare practice_location_id: ForeignKey<string>;
  declare license_number: string;
  declare availability_schedule: CreationOptional<Record<string, any> | null>;
  declare bio: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare user?: NonAttribute<User>;
  declare specialty?: NonAttribute<Specialty>;
  declare practiceLocation?: NonAttribute<PracticeLocation>;
  declare appointments?: NonAttribute<
    import("./appointment.model").Appointment[]
  >;
  declare visits?: NonAttribute<import("./visit.model").Visit[]>;

  static associate(models: Record<string, any>): void {
    DoctorProfile.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    DoctorProfile.belongsTo(models.Specialty, {
      foreignKey: "specialty_id",
      as: "specialty",
    });
    DoctorProfile.belongsTo(models.PracticeLocation, {
      foreignKey: "practice_location_id",
      as: "practiceLocation",
    });
    DoctorProfile.hasMany(models.Appointment, {
      foreignKey: "doctor_id",
      as: "appointments",
    });
    DoctorProfile.hasMany(models.Visit, {
      foreignKey: "doctor_id",
      as: "visits",
    });
  }

  static initModel(sequelize: Sequelize): typeof DoctorProfile {
    DoctorProfile.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        specialty_id: { type: DataTypes.UUID, allowNull: false },
        practice_location_id: { type: DataTypes.UUID, allowNull: false },
        license_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        availability_schedule: { type: DataTypes.JSON, allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "doctor_profiles",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          //INFO: One-to-one with users — each user has at most one doctor profile
          // { unique: true, fields: ['user_id'] }, // Duplicate: already enforced by user_id unique:true
          //INFO: License verification lookups by regulatory systems
          // { unique: true, fields: ['license_number'] }, // Duplicate: already enforced by license_number unique:true
          //INFO: "Show all doctors in Cardiology" — specialty-based doctor filtering
          { fields: ["specialty_id"] },
          //INFO: "Show all doctors at Location X" — location-based doctor filtering
          { fields: ["practice_location_id"] },
        ],
      },
    );
    return DoctorProfile;
  }
}
