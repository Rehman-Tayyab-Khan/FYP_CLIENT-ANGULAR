import { FdoPermission } from "../enums";
import { User } from "../models";

export const checkFdoHasPermission = (
  user: User,
  permission: FdoPermission,
): boolean => {
  return user.isPermissionAllowed([permission]);
};
