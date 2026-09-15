import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { checkAccessToken } from "../middlewares/auth.middleware";
import { checkRoleMiddleware } from "../middlewares/checkRole.middleware";
import { Role } from "../enums";

const patientRouter = Router();
const patientController = new PatientController();

patientRouter.post(
  "/",
  checkAccessToken,
  checkRoleMiddleware([Role.FDO]),
  patientController.createPatient,
);
patientRouter.get(
  "/",
  checkAccessToken,
  checkRoleMiddleware([Role.FDO, Role.DOCTOR]),
  patientController.getAllPatients,
);
patientRouter.get(
  "/:id",
  checkRoleMiddleware([Role.FDO]),
  patientController.getPatientById,
);
patientRouter.put(
  "/:id",
  checkRoleMiddleware([Role.FDO]),
  patientController.updatePatient,
);

patientRouter.delete("/:id", patientController.deletePatient);

export default patientRouter;
