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
import type { Insurance } from "./insurance.model";

export class InsuranceAddress extends Model<
  InferAttributes<InsuranceAddress>,
  InferCreationAttributes<InsuranceAddress>
> {
  declare id: CreationOptional<string>;
  declare insurance_id: ForeignKey<string>;
  declare address: string;
  declare phone: string;
  declare is_primary: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare insurance?: NonAttribute<Insurance>;

  static associate(models: Record<string, any>): void {
    InsuranceAddress.belongsTo(models.Insurance, {
      foreignKey: "insurance_id",
      as: "insurance",
    });
  }

  static initModel(sequelize: Sequelize): typeof InsuranceAddress {
    InsuranceAddress.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        insurance_id: { type: DataTypes.UUID, allowNull: false },
        address: { type: DataTypes.TEXT, allowNull: false },
        phone: {
          type: DataTypes.STRING(11),
          allowNull: false,
          validate: {
            len: [11, 11],
          },
        },
        is_primary: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "insurance_addresses",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          //INFO: All addresses for a given insurance — used in insurance detail view
          { fields: ["insurance_id"] },
          //INFO: Fast primary-address resolution during claims and case creation
          { unique: true, fields: ["insurance_id", "is_primary"] },
        ],
      },
    );
    return InsuranceAddress;
  }
}
