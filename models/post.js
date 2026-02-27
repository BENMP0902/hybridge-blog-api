'use strict';
const { Model } = require('sequelize');


module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      // Un post PERTENECE A un autor
      Post.belongsTo(models.Author, {
        foreignKey: 'authorId',
        as: 'author'              // include: { as: 'author' }
      });
    }
  }
  Post.init({
    title: DataTypes.STRING,       // VARCHAR(255)
    content: DataTypes.TEXT,        // TEXT (sin límite)
    authorId: DataTypes.INTEGER,    // FK a Authors.id
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Post',
    paranoid: true,
    timestamps: true
  });
  return Post;
};
