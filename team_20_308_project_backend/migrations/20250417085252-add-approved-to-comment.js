"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Comments tablosuna "approved" sütunu ekle
    await queryInterface.addColumn("Comments", "approved", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Geri alırken sütunu sil
    await queryInterface.removeColumn("Comments", "approved");
  },
};
// s