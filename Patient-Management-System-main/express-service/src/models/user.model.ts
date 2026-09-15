import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import { hashPassword } from "../utils/bcrypt.util";
import { FdoPermission, Role } from "../enums";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare role: Role;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare password: string;
  declare phone: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  //INFO: Associations are declared as NonAttribute so they are excluded from InferAttributes
  declare doctorProfile?: NonAttribute<
    import("./doctorProfile.model").DoctorProfile
  >;
  declare userPermissions?: NonAttribute<
    import("./userPermission.model").UserPermission[]
  >;
  declare createdAppointments?: NonAttribute<
    import("./appointment.model").Appointment[]
  >;

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }
  isDoctor(): boolean {
    return this.role === Role.DOCTOR;
  }
  isFdo(): boolean {
    return this.role === Role.FDO;
  }
  isPermissionAllowed(permissions: FdoPermission[]): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (
      !this.isFdo() ||
      !this.userPermissions ||
      this.userPermissions.length === 0
    ) {
      return false;
    }
    const userPermissionSet = new Set(
      this.userPermissions.map((up) => up.permission?.permission_name),
    );
    return permissions.every((p) => userPermissionSet.has(p));
  }

  static associate(models: Record<string, any>): void {
    User.hasOne(models.DoctorProfile, {
      foreignKey: "user_id",
      as: "doctorProfile",
    });
    User.hasMany(models.UserPermission, {
      foreignKey: "user_id",
      as: "userPermissions",
    });
    User.hasMany(models.Appointment, {
      foreignKey: "created_by",
      as: "createdAppointments",
    });
  }

  static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        role: {
          type: DataTypes.ENUM(...Object.values(Role)),
          allowNull: false,
        },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: true },
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
        tableName: "users",
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        hooks: {
          beforeCreate: async (user: User) => {
            if (user.password) {
              user.password = await hashPassword(user.password);
            }
          },
          beforeUpdate: async (user: User) => {
            if (user.changed("password")) {
              user.password = await hashPassword(user.password);
            }
          },
        },
        indexes: [
          //INFO: Login/auth queries always filter by email — unique B-tree handles this
          // { unique: true, fields: ['email'] }, // Duplicate: already enforced by email unique:true
          //INFO: Role-based access control filters by role on nearly every admin query
          { fields: ["role"] },
          //INFO: Dashboard queries filter active users by role (e.g. "all active doctors")
          { fields: ["role", "is_active"] },
        ],
        defaultScope: {
          attributes: { exclude: ["password"] },
        },
        scopes: {
          withPassword: { attributes: { include: ["password"] } },
        },
      },
    );
    return User;
  }
}
