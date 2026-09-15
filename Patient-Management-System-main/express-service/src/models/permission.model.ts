import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";

export class Permission extends Model<
  InferAttributes<Permission>,
  InferCreationAttributes<Permission>
> {
  declare id: CreationOptional<string>;
  declare permission_name: string;
  declare description: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare userPermissions?: NonAttribute<
    import("./userPermission.model").UserPermission[]
  >;

  static associate(models: Record<string, any>): void {
    Permission.hasMany(models.UserPermission, {
      foreignKey: "permission_id",
      as: "userPermissions",
    });
  }

  static initModel(sequelize: Sequelize): typeof Permission {
    Permission.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        permission_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: { type: DataTypes.STRING, allowNull: true },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "permissions",
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
          //INFO: Permission lookup by name during authorization checks
          // { unique: true, fields: ['permission_name'] }, // Duplicate: already enforced by permission_name unique:true
        ],
      },
    );
    return Permission;
  }
}
