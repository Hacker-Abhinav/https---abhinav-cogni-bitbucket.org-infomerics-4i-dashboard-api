const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const MisDataMart = DB_CLIENT.define(
  "mis_data_marts",
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
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    
    meeting_id: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    meeting_date: {
      type: DataTypes.DATE,
      allowNull: false,
      notEmpty: true,
    },
    nature_of_assignment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrument: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_listing_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrument_listing_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    entity_isin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    instrument_isin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    name_of_analyst: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name_of_group_head: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rat_model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model_based_ltr_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model_based_ltr_grade_wgt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    analyst_recomm_ltr_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    analyst_recomm_ltr_grade_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diff_btw_mbltr_arltr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_rat_by_cmte: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_lt_rat_grade_by_cmte: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_lt_rat_grade_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_st_rat_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_st_rat_grade_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_recovery_rat_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    curr_recovery_rat_grade_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diff_btw_cltr_mbr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sector_details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    macro_economic_indicator: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sector: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    basic_industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provisional_com_to_client: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    acceptance_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    acceptance_date: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rat_letter_date: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_of_pr: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pr_to_bse_nse_press: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nsdl_uploading: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_rat: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_rat_date: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_lt_rat_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_lt_rat_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diff_btw_cltrgn_pltrgn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lt_upgrade_downgrade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_st_rat_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_st_rat_grade_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diff_bet_cstrgn_pstgrn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    st_upgrade_downgrade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pre_recovery_rat_grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pre_recovery_rat_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recovery_rating_diff: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recovery_upgrade_downgrade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    banker_details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rat_date_by_other_cra: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rat_assigned_by_other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lt_rat_grade_assigned_by_other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    other_cra_lt_rat_grade_no: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    diff_bwt_cltr_ltr_by_other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diff_bwt_mbr_ltr_by_other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    st_rat_grade_assigned_by_other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    other_cra_st_rat_grade_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diff_bwt_cstra_cstra_by_other_cra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stipulated_time_with_in: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status_of_bank_statement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name_of_the_bank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
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
    combined_notch_diff: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    combined_upgrade_downgrade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrument_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instrument_sub_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    outlook_by_rating_model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    outlook_by_rating_analyst: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    outlook_by_committee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previous_rating_outlook: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
  },
  {
    tableName: "mis_data_marts",
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
  MisDataMart
};
