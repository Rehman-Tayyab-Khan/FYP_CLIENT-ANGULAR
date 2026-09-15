import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";

export class Insurance extends Model<
  InferAttributes<Insurance>,
  InferCreationAttributes<Insurance>
> {
  declare id: CreationOptional<string>;
  declare insurance_name: string;
  declare insurance_code: string;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare addresses?: NonAttribute<
    import("./insuranceAddress.model").InsuranceAddress[]
  >;
  declare primaryAddress?: NonAttribute<
    import("./insuranceAddress.model").InsuranceAddress
  >;
  declare patientCases?: NonAttribute<
    import("./patientCase.model").PatientCase[]
  >;

  static associate(models: Record<string, any>): void {
    Insurance.hasMany(models.InsuranceAddress, {
      foreignKey: "insurance_id",
      as: "addresses",
    });
    Insurance.hasOne(models.InsuranceAddress, {
      foreignKey: "insurance_id",
      as: "primaryAddress",
      scope: { is_primary: true },
    });
    Insurance.hasMany(models.PatientCase, {
      foreignKey: "insurance_id",
      as: "patientCases",
    });
  }

  static initModel(sequelize: Sequelize): typeof Insurance {
    Insurance.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        insurance_name: { type: DataTypes.STRING, allowNull: false },
        insurance_code: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
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
        tableName: "insurances",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          //INFO: Insurance code is the standard industry identifier used in claims processing
          // { unique: true, fields: ['insurance_code'] }, // Duplicate: already enforced by insurance_code unique:true
          //INFO: Insurance name search when front desk selects a payer
          { fields: ["insurance_name"] },
          //INFO: Active filter on every insurance dropdown in case creation
          { fields: ["is_active"] },
        ],
      },
    );
    return Insurance;
  }
}
