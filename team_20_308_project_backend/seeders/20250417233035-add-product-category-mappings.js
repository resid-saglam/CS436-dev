'use strict';

// Historical seeder. The original file mapped hard-coded productId/categoryId
// pairs that referenced a previous data set which is no longer present in the
// repository. Running it now would create dangling rows or fail with FK errors.
//
// The replacement demo data lives in scripts/seed-demo.js and is invoked via
// `npm run db:seed`. That script wires each demo product to its category
// through the Sequelize many-to-many association, so this CLI seeder is
// intentionally a no-op.
module.exports = {
  up: async (_queryInterface, _Sequelize) => {
    // intentionally empty — see scripts/seed-demo.js
  },

  down: async (_queryInterface, _Sequelize) => {
    // intentionally empty
  },
};
