import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";

export class PracticeLocation extends Model<
  InferAttributes<PracticeLocation>,
  InferCreationAttributes<PracticeLocation>
> {
  declare id: CreationOptional<string>;
  declare location_name: string;
  declare address: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare state: CreationOptional<string | null>;
  declare zip: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare patientCases?: NonAttribute<
    import("./patientCase.model").PatientCase[]
  >;
  declare appointments?: NonAttribute<
    import("./appointment.model").Appointment[]
  >;
  declare doctorProfiles?: NonAttribute<
    import("./doctorProfile.model").DoctorProfile[]
  >;

  static associate(models: Record<string, any>): void {
    PracticeLocation.hasMany(models.PatientCase, {
      foreignKey: "practice_location_id",
      as: "patientCases",
    });
    PracticeLocation.hasMany(models.Appointment, {
      foreignKey: "practice_location_id",
      as: "appointments",
    });
    PracticeLocation.hasMany(models.DoctorProfile, {
      foreignKey: "practice_location_id",
      as: "doctorProfiles",
    });
  }

  static initModel(sequelize: Sequelize): typeof PracticeLocation {
    PracticeLocation.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        location_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        address: { type: DataTypes.TEXT, allowNull: true },
        city: { type: DataTypes.STRING, allowNull: true },
        state: { type: DataTypes.STRING, allowNull: true },
        zip: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "practice_locations",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          //INFO: Active filter on every location dropdown/list across the application
          { fields: ["is_active"] },
          //INFO: Geographic filtering for multi-location practices and reporting
          { fields: ["city", "state"] },
        ],
      },
    );
    return PracticeLocation;
  }
}
