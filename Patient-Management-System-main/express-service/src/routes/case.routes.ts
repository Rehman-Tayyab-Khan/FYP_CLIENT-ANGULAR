import { Router } from "express";
import { checkAccessToken } from "../middlewares/auth.middleware";
import { CaseController } from "../controllers/case.controller";
import { checkRoleMiddleware } from "../middlewares/checkRole.middleware";
import { Role } from "../enums";

const caseRouter = Router();
const caseController = new CaseController();

caseRouter.post(
  "/",
  checkRoleMiddleware([Role.FDO, Role.ADMIN]),
  caseController.createCase,
);

caseRouter.get(
  "/",
  checkRoleMiddleware([Role.FDO, Role.DOCTOR, Role.ADMIN]),
  caseController.getAllCases,
);

caseRouter.get(
  "/:id",
  checkRoleMiddleware([Role.FDO, Role.DOCTOR, Role.ADMIN]),
  caseController.getCaseById,
);

// separate route for patient
caseRouter.get(
  "/patient/:patient_id",
  checkRoleMiddleware([Role.FDO, Role.DOCTOR, Role.ADMIN]),
  caseController.getCaseByPatient,
);

caseRouter.put(
  "/:id",
  checkRoleMiddleware([Role.FDO, Role.ADMIN]),
  caseController.updateCase,
);
caseRouter.patch(
  "/:id",
  checkRoleMiddleware([Role.FDO, Role.ADMIN]),
  caseController.updateCase,
);

caseRouter.delete(
  "/:id",
  checkRoleMiddleware([Role.ADMIN]),
  caseController.deleteCase,
);

export default caseRouter;
