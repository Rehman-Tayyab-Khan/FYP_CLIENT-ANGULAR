import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";

export class Diagnoses extends Model<
  InferAttributes<Diagnoses>,
  InferCreationAttributes<Diagnoses>
> {
  declare id: CreationOptional<string>;
  declare icd_code: string;
  declare diagnoses_name: string;
  declare description: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare visits?: NonAttribute<import("./visit.model").Visit[]>;

  static associate(models: Record<string, any>): void {
    Diagnoses.hasMany(models.Visit, {
      foreignKey: "diagnoses_id",
      as: "visits",
    });
  }

  static initModel(sequelize: Sequelize): typeof Diagnoses {
    Diagnoses.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        icd_code: { type: DataTypes.STRING, allowNull: false, unique: true },
        diagnoses_name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "diagnoses",
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
          //INFO: ICD code is the international standard identifier — doctors search by it
          // { unique: true, fields: ['icd_code'] }, // Duplicate: already enforced by icd_code unique:true
          //INFO: Diagnoses name search for doctors selecting from the master list
          { fields: ["diagnoses_name"] },
          //INFO: Active filter to hide deprecated ICD codes from the selection UI
          { fields: ["is_active"] },
        ],
      },
    );
    return Diagnoses;
  }
}
