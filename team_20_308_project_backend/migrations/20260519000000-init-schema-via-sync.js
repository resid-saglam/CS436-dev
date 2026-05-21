"use strict";

/**
 * Bootstrap migration — initialises the full schema from the Sequelize models.
 *
 * Why this exists:
 *   The codebase relied on `sequelize.sync()` at app startup to create tables.
 *   In production we must disable that (it can silently alter the live schema
 *   if a model drifts). This migration is the one-time "make the schema match
 *   the models" step that we run against RDS BEFORE the first ECS task ships.
 *
 * How to run:
 *   - Locally (test):  npx sequelize-cli db:migrate
 *   - Against RDS:     same command, but with env vars pointing at RDS
 *                      (DB_HOST=<rds-endpoint> DB_USER=... DB_PASS=...).
 *
 * After this migration is applied, the canonical way to evolve the schema
 * is to write *additional* migrations (e.g. add a column) — never re-enable
 * sync() in production.
 *
 * This migration uses sequelize.sync() internally for the bootstrap because
 * hand-writing 11 createTable() blocks for the existing models would duplicate
 * the model definitions and is error-prone. The next migration (if any
 * schema change is needed) should use proper queryInterface.createTable /
 * addColumn / changeColumn operations.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Require associations.js (which loads every model and wires
    // hasMany/belongsTo). We're using the same Sequelize instance from
    // src/config/db.js.
    const sequelize = require("../src/config/db");
    require("../src/models/associations");

    // sync() against an empty DB creates every table from the model
    // definitions. If a table already exists, this is a no-op.
    await sequelize.sync();
  },

  async down(queryInterface, Sequelize) {
    // Destructive: drop every table the models defined. This is intentional
    // for a clean rollback; only run against a non-production DB.
    const sequelize = require("../src/config/db");
    require("../src/models/associations");
    await sequelize.drop();
  },
};
