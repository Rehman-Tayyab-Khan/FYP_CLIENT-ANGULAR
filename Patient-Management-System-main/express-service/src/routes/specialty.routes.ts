import { Router } from "express";
// import { checkAccessToken } from "../Middlewares/auth.middleware";
import { SpecialtyController } from "../Controllers/specialty.controller";
import { checkRoleMiddleware } from "../middlewares/checkRole.middleware";
import { Role } from "../enums";

const specialtyRouter = Router();
const specialtyController = new SpecialtyController();

specialtyRouter.get(
  "/",
  checkRoleMiddleware([Role.FDO]),
  // checkAccessToken,
  specialtyController.getAllSpecialties,
);
specialtyRouter.post(
  "/",
  checkRoleMiddleware([Role.ADMIN]),
  specialtyController.createSpecialty,
);
specialtyRouter.get(
  "/:id",
  // checkAccessToken,
  specialtyController.getSpecialtyById,
);
specialtyRouter.put(
  "/:id",
  checkRoleMiddleware([Role.ADMIN]),
  // checkAccessToken,
  specialtyController.updateSpecialty,
);
specialtyRouter.delete(
  "/:id",
  checkRoleMiddleware([Role.ADMIN]),
  // checkAccessToken,
  specialtyController.deleteSpecialty,
);

export default specialtyRouter;
