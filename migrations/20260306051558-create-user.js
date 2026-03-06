'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING, // VARCHAR(255) por defecto
        allowNull: false,       // NOT NULL: no puede quedaar vacio
        unique: true            // UNIQUR constraint: previene emails duplicados a nivel DB
      },
      password: {
        type: Sequelize.STRING, // Almacena el HASH, nunca en texto plano
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE    // Soft delete: marca como eliminado sin borrar datos
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};