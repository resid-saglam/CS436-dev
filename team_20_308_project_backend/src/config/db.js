// config/db.js
//
// Sequelize connection. In production (NODE_ENV=production) we connect over
// TLS to Amazon RDS for MySQL; in development we connect to local Docker
// MySQL without SSL. All credentials come from environment variables; in
// production those env values are sourced from AWS Systems Manager Parameter
// Store and injected by the ECS task definition.

const { Sequelize } = require("sequelize");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    // RDS requires TLS. We accept the AWS-issued RDS CA without strict
    // pinning here; for tighter security, bundle rds-combined-ca-bundle.pem
    // and set rejectUnauthorized: true.
    ...(isProduction && {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),
  }
);

module.exports = sequelize;
