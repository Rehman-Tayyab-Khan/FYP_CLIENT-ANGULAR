import { Router } from "express";
import authRoutes from "./auth.routes";
import patientRoutes from "./patient.routes";
import caseRoutes from "./case.routes";
import userRoutes from "./user.routes";
import specialtyRoutes from "./specialty.routes";
import chatRoutes from "./chat.routes";
import { checkAccessToken } from "../middlewares/auth.middleware";
import { checkRoleMiddleware } from "../middlewares/checkRole.middleware";
import { Role } from "../enums";
const router = Router();

router.use("/auth", authRoutes);
router.use("/patients", checkAccessToken, patientRoutes);
router.use("/cases", checkAccessToken, caseRoutes);
router.use("/users", checkAccessToken, userRoutes);
router.use("/specialties", checkAccessToken, specialtyRoutes);
router.use("/chat", checkAccessToken, chatRoutes);

export default router;
