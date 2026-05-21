'use strict';

// Legacy sequelize-cli seeder. The main demo seed path is now
// `npm run db:seed` (scripts/seed-demo.js). We keep this idempotent so
// `npx sequelize-cli db:seed:all` still works without duplicate-key errors.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const rows = [
      { name: 'Laptops', icon: 'laptop' },
      { name: 'Phones', icon: 'phone' },
      { name: 'TV, Video & Audio', icon: 'tv' },
      { name: 'Headphones', icon: 'headphones' },
      { name: 'Cameras & Drones', icon: 'camera' },
    ];
    const now = new Date();
    await queryInterface.bulkInsert(
      'Categories',
      rows.map((r) => ({ ...r, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', {
      name: [
        'Laptops',
        'Phones',
        'TV, Video & Audio',
        'Headphones',
        'Cameras & Drones',
      ]
    }, {});
  }
};
