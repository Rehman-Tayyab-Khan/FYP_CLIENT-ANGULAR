import app from "./app";
import { connectDB } from "./config/database.config";
import { env } from "./config/env.config";
import logger from "./config/logger.config";
import "./types";
import "./models";

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
};

startServer();
