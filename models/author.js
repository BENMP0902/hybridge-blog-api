'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Author extends Model {
    static associate(models) {
      // Un autor tiene MUCHOS posts
      // foreignKey: columna en Posts que apunta a Authors
      // as: alias para usar en queries (include: { as: 'posts' })
      Author.hasMany(models.Post, {
        foreignKey: 'authorId',
        as: 'posts'
      });
    }
  }
  Author.init({
    name: DataTypes.STRING,      // VARCHAR(255) en PostgreSQL
    deletedAt: DataTypes.DATE     // Para soft delete
  }, {
    sequelize,
    modelName: 'Author',
    paranoid: true,               // Habilita soft delete
    timestamps: true              // createdAt + updatedAt automáticos
  });
  return Author;
};
