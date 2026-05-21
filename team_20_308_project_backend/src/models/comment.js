// src/models/comment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./user");
const Product = require("./product");

const Comment = sequelize.define(
  "Comment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Product, key: "id" },
      onDelete: "CASCADE",
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "comments",
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId"], // ❗ aynı kullanıcı aynı ürüne 1 yorum
      },
    ],
    timestamps: true, // createdAt & editedAt’ı manuel yönetiyoruz
    updatedAt: "updatedAt",
  }
);

module.exports = Comment;
