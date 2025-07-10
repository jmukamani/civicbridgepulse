import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Determine if we're in production (Azure) or local development
const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('azure') || process.env.DB_HOST?.includes('postgres.database.azure.com');

const sequelizeConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Only add SSL configuration for production environments
if (isProduction) {
  sequelizeConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, sequelizeConfig);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully.');
    console.log(`🔐 SSL ${isProduction ? 'ENABLED' : 'DISABLED'} for ${isProduction ? 'production' : 'local development'}`);
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });

export default sequelize;