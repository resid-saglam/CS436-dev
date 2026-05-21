// models/category.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Category = sequelize.define("Category", {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:      { type: DataTypes.STRING,  allowNull: false, unique: true },
    icon:      { type: DataTypes.STRING,  allowNull: false, defaultValue: "tag" }
});

module.exports = Category;
