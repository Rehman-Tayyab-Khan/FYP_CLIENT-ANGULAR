import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { Role } from "../enums";
import { checkRoleMiddleware } from "../middlewares/checkRole.middleware";

const router = Router();
const chatController = new ChatController();

router.post(
  "/",
  checkRoleMiddleware([Role.DOCTOR, Role.FDO], false),
  chatController.sendMessage,
);

export default router;
