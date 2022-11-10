import dotenv from "dotenv";
dotenv.config();
import Sequelize from "sequelize";
import loadModels from "./loadModels.js";

const { DataTypes } = Sequelize;

// you need to set DATABASE credentials inside your .env file
const {
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_HOST,
  DATABASE_DIALECT = "postgres",
} = process.env;

const sequelize = new Sequelize(
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD,
  {
    host: DATABASE_HOST,
    dialect: DATABASE_DIALECT,
    minifyAliases: true,
    benchmark: true,
    // in production, you would want to set this to false
    logging: false,
  }
);

const models = await loadModels(sequelize, DataTypes);

export default { sequelize, models };
