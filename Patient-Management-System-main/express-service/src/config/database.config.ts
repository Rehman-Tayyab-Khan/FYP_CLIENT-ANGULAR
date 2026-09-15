import { Sequelize } from 'sequelize';
import logger from './logger.config';
import dotenv from 'dotenv';
import { initModels } from '../models/index';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging:
      process.env.NODE_ENV === 'development'
        ? (msg: string) => logger.debug(msg)
        : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
);

//INFO: Initializes all model schemas and associations against this Sequelize instance
initModels(sequelize);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully.');
    //INFO: No sync — Laravel owns all migrations
    logger.info('Models loaded successfully.');
  } catch (error) {
    logger.error(`Unable to connect to the database: ${error}`);
    process.exit(1);
  }
};

export default sequelize;
