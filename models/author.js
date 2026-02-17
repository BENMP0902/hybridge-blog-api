'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Author extends Model {
    static associate(models) {
      // Asociacion, ya que un autor tiene muchos posts
      Author.hasMany(models.Post, {
        foreignKey: 'authorId',
        as: 'posts' 
      });
    }
  }
  Author.init({
    name: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Author',
    paranoid:true, 
    timestamps: true
  });
  
  return Author;
};