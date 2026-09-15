import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";

export class Specialty extends Model<
  InferAttributes<Specialty>,
  InferCreationAttributes<Specialty>
> {
  declare id: CreationOptional<string>;
  declare specialty_name: string;
  declare description: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare doctorProfiles?: NonAttribute<
    import("./doctorProfile.model").DoctorProfile[]
  >;
  declare appointments?: NonAttribute<
    import("./appointment.model").Appointment[]
  >;

  static associate(models: Record<string, any>): void {
    Specialty.hasMany(models.DoctorProfile, {
      foreignKey: "specialty_id",
      as: "doctorProfiles",
    });
    Specialty.hasMany(models.Appointment, {
      foreignKey: "specialty_id",
      as: "appointments",
    });
  }

  static initModel(sequelize: Sequelize): typeof Specialty {
    Specialty.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        specialty_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: { type: DataTypes.TEXT, allowNull: true },
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
        tableName: "specialties",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          //INFO: Specialty name is queried for dropdowns and used as a natural key
          // { unique: true, fields: ['specialty_name'] }, // Duplicate: already enforced by specialty_name unique:true
          //INFO: Active filter on every specialty dropdown/list in the UI
          { fields: ["is_active"] },
        ],
      },
    );
    return Specialty;
  }
}
