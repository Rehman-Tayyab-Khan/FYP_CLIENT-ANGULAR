import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { checkAccessToken } from "../middlewares/auth.middleware";
import { AuthService } from "../services/auth.service";

const authRouter = Router();
const authController = new AuthController(new AuthService());

authRouter.post("/login", authController.login);
authRouter.post("/logout", checkAccessToken, authController.logout);
// authRouter.get("/refresh-token", authController.refreshToken);
authRouter.get("/me", checkAccessToken, authController.getMe);

export default authRouter;
