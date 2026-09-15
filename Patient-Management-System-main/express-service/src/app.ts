import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { env } from "./config/env.config";
import { AppError } from "./utils/app-error.util";
import logger from "./config/logger.config";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

//INFO: Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/express/check", (req, res, next) => {
  res.json({ message: "You are on express server" });
});

//INFO: Routes
app.use("/api", routes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Cannot find ${req.method} ${req.originalUrl}`));
});
declare global {
  namespace Express {
    export interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

app.use(errorHandler);

export default app;
