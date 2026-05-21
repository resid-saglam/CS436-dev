// Sequelize CLI configuration.
// Loaded by sequelize-cli (via ../../.sequelizerc) for db:migrate / db:seed.
// Reads the same env vars as src/config/db.js so local Docker MySQL and
// Amazon RDS MySQL both work without code changes.
//
// dotenv loads /team_20_308_project_backend/.env when sequelize-cli runs
// from the backend folder. Inside Docker the env comes from docker-compose.
require("dotenv").config();

const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  dialect: "mysql",
  logging: false,
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
