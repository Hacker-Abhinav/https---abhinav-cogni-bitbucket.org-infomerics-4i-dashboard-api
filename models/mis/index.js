const { DataTypes, Sequelize } = require("sequelize");
const { MIS_DB_CLIENT } = require("../../mis-db");

const MISReportConfig = MIS_DB_CLIENT.define(
  "mis_report_config",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    config_data: {
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
  },
  {
    tableName: 'mis_report_configs',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
      {
        unique: true,
        fields: ['type']
      },
    ],
    underscored: true,
  }
);

const MISReportRating = MIS_DB_CLIENT.define(
  "mis_report_rating",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    serial_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    final_value: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
  },
  {
    tableName: 'mis_report_rating',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
    ],
    underscored: true,
  }
);

// Instance
const MIS_DB_INSTANCE = MIS_DB_CLIENT;

module.exports = {
  MIS_DB_INSTANCE,
  MISReportConfig,
  MISReportRating,
};
