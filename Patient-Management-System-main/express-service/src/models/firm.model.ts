import {
  Model, DataTypes, Sequelize,
  InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute,
} from 'sequelize';
import { FirmType } from '../enums/firmType.enum';

export class Firm extends Model<InferAttributes<Firm>, InferCreationAttributes<Firm>> {
  declare id: CreationOptional<string>;
  declare firm_name: string;
  declare firm_type: FirmType;
  declare address: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare contact_person: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  declare patientCases?: NonAttribute<import('./patientCase.model').PatientCase[]>;

  static associate(models: Record<string, any>): void {
    Firm.hasMany(models.PatientCase, { foreignKey: 'firm_id', as: 'patientCases' });
  }

  static initModel(sequelize: Sequelize): typeof Firm {
    Firm.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        firm_name: { type: DataTypes.STRING, allowNull: false },
        firm_type: { type: DataTypes.ENUM(...Object.values(FirmType)), allowNull: false },
        address: { type: DataTypes.TEXT, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        contact_person: { type: DataTypes.STRING, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'firms',
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
          //INFO: Firm name search when linking a case to a law firm or organization
          { fields: ['firm_name'] },
          //INFO: Type filter (legal/corporate/etc.) for categorized firm listings
          { fields: ['firm_type'] },
          //INFO: Active filter on every firm dropdown in case management
          { fields: ['is_active'] },
        ],
      },
    );
    return Firm;
  }
}
