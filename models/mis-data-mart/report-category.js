const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const MisReportType = DB_CLIENT.define(
  "misReportType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    trashed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }, 
  },
  {
    tableName: "misReportType",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      }
    ],
    underscored: true,
  });

  const MIS_DB_INSTANCE = DB_CLIENT;

module.exports = {
  MIS_DB_INSTANCE,
  MisReportType
};
