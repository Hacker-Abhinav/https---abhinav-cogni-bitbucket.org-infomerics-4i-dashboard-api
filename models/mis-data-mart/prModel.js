const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");

const PRDataMart = DB_CLIENT.define(
    "pr_data_marts",
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
        pr_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue:null
        },
        meeting_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        company_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        company_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        facilities: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        term: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        based: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        asset: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        
        instrument: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        rating_action: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        nature_of_assignment: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        rating_acceptance_date: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue:null
        },
        rating_letter_date: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue:null
        },
        rating_date: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue:null
        },
        old_rating: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        old_rating_date: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue:null
        },
        industry: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sector: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        name_of_analyst: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        listing_status_company: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        listing_status_instrument: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isin_entity: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        isin_instrument: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        timeline_for_press_release: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        intervening_holidays: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status_of_bank_statement: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        bank_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        complexity_level: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        trigger_event: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        stipulated_time:{
          type: DataTypes.STRING,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          default: true,
        },
        created_by:{
          type: DataTypes.STRING,
          allowNull: true,
        },
        updated_by:{
          type: DataTypes.STRING,
          allowNull: true,
        },
        trashed_by:{
          type: DataTypes.STRING,
          allowNull: true,
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
      tableName: "pr_data_marts",
      indexes: [
        {
          unique: true,
          fields: ["uuid"],
        }
      ],
      underscored: true,
    }
  );
  const PR_DB_INSTANCE = DB_CLIENT;
module.exports = {

  PR_DB_INSTANCE,
  PRDataMart
};