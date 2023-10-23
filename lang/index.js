function LANG_DATA() {
  const data = {
    BAD_CREDENTIALS: "Unable to process the request, credentials are wrong.",
    NO_ACCESS_TO_MODULE: "User have no access to the following module.",
    NO_ROLE: "No such role exists.",
    NO_COMPANY: "No such company exists.",
    NO_PERMISSIONS_SELECTED: "You have selected no permissions for the role.",
    NO_NAVIGATION_SELECTED:
      "You have selected no navigation for the permission.",
    NO_NAVIGATION_FOUND: "Parent navigation not found.",
    NO_DOCUMENT: "Error while uploading documents.",
    NO_FACTOR_SELECTED: "You have selected no factor for the parameter.",
    NO_RISK_TYPE_SELECTED: "You have selected no risk type.",
    NO_RATING_MODEL_SELECTED: "You have selected no rating model.",
    NO_RATING_MODEL_RISK_TYPE_FOUND:
      "No rating_model_has_risk_type module found.",
    NO_INSTRUMENT_DETAIL_SELECTED: "You have selected no instrument detail.",
    NO_TRANSACTION_INSTRUMENT_FOUND: "No Transaction Instrument Found.",
    NO_INSTRUMENT_SUB_CATEGORY_FOUND: "No Instrument Sub Category Found.",
    NO_BUSINESS_DEVELOPER_FOUND: "No Business Developer Found.",
    NO_GROUP_HEAD_FOUND: "No Group Head Found.",
    NO_RATING_HEAD_FOUND: "No Rating Head Found.",
    NO_RATING_ANALYST_FOUND: "No Rating Analyst Found.",
    NO_MADATE_FOUND: "No Mandate Found.",
    NO_FACTOR_FOUND: "No Factor Found",
    NO_RISK_TYPE_FOUND: "No Risk Type Found",
    NO_NOTCHING_MODEL: "No Notching Model Found",
    NO_INSTRUMENT_DETAIL_FOUND: "No Instrument Detail Found",
    NO_INSTRUMENT_CATEGORY_FOUND: "No Instrument Category Found",
    NO_INSTRUMENT_SUB_CATEGORY_FOUND: "No Instrument Sub Category Found",
    NO_RATING_COMMITTEE_MEETING_FOUND: "No Rating Committee Meeting Found",
    NO_RATING_COMMITTEE_MEETING_CATEGORY_FOUND:
      "No Rating Committee Meeting Category Found",
    NO_RATING_COMMITTEE_TYPE_FOUND: "No Rating Committee Type Found",
    NO_ACTIVITY_FOUND: "No activity found",
    NO_RATING_PROCESS: "No Rating Process Found",
    NO_WORKFLOW_INSTANCE: "No Workflow Instance Found",
    NO_INDUSTRY_MODEL_MAPPING_FOUND: "No Industry Model Mapping Found",
    NO_SUB_INDUSTRY_FOUND: "No Sub Industry Found",
    NO_FINANCIAL_YEAR_FOUND: "No Financial year Found",
    NO_COMMITTEE_MINUTES_FOUND: "No Committee Minutes Found",
    NO_COUNTRY: "No Country Found",
    NO_STATE: "No State Found",
    MATERIAL_EVENT_WORKFLOW_PRESENT:
      "Workflow for this material event already running",
    NO_QUORUM:
      "The chosen meeting does not meet the minimum quorum requirement of 3 members.",
  };
  return data;
}

const PR_REPORT_HEADER=
[
  {
    name:"Date of Press Release",
    selector:"pr_date"
  },
  {
    name:"Name of the Company",
    selector:"company_name"
  },
  {
    name:"Type",
    selector:"type"
  },
  {

    name:"Facilities",
    selector:"facilities"
  },
  {
    name:"Term",
    selector:"term"
  },
  {
    name:"Based",
    selector:"based"
  },
  {
    name:"Asset",
    selector:"asset"
  },
  {
    name:"Instrument",
    selector:"instrument"
  },

  {
    name:"Size (in Crore)",
    selector:"size"
  },
  {
    name:"Rating Action",
    selector:"rating_action"
  },
  {
    name:"Nature of Assignment",
    selector:"nature_of_assignment"
  },
  {
    name:"Rating Acceptance Date",
    selector:"rating_acceptance_date"
  },
  {
    name:"Rating Letter Date",
    selector:"rating_letter_date"
  },
  {
    name:"Rating Date",
    selector:"rating_date"
  },
  {
    name:"Old Rating",
    selector:"old_rating"
  },
  {
    name:"Old Rating Date",
    selector:"old_rating_date"
  },
  {
    name: "Industry",
    selector: "industry",
  },
  {
    name:"Sector",
    selector:"sector"
  },
  {
    name:"Name of Analyst",
    selector:"name_of_analyst"
  },
  {
    name:"Listing Status Company",
    selector:"listing_status_company"
  },
  {
    name:"Listing Status Instrument",
    selector:"listing_status_instrument"
  },
  {
    name:"ISIN Entity",
    selector:"isin_entity"
  },
  {
    name:"ISIN Instrument",
    selector:"isin_instrument"
  },
  {
    name:"Timeline For Press Release",
    selector:"timeline_for_press_release"
  },
  {
    name:"Intervening Holidays",
    selector:"intervening_holidays"
  },
  {
    name:"Status of Bank Statement",
    selector:"status_of_bank_statement"
  },
  {
    name:"Bank Name",
    selector:"bank_name"
  },
  {
    name:"Complexity Level",
    selector:"complexity_level"
  },
  {
    name:"Trigger Event",
    selector:"trigger_event"
  },
  {
    name: "Remarks",
    selector: "remarks",
  },
  {
    name:"Stipulated Time",
    selector:"stipulated_time"
  },
  {
    name:"Is Active",
    selector:"is_active"
  }]

const RATING_MIS_REPORT=
[
  {
    name: "Nature of assignment",
    selector: "company_name",
  },
  {
    name: "Meeting",
    selector: "meeting_id",
  },
  {
    name: "Date of Meeting",
    selector: "meeting_date",
  },
  {
    name: "nature_of_assignment",
    selector: "Instrument",
  },
  {
    name: "Size (in Crore)",
    selector: "size",
  },
  {
    name: "Listing Status",
    selector: "listing_status",
  },
  {
    name: "Name of Analyst",
    selector: "name_of_analyst",
  },
  {
    name: "Name of Group Head",
    selector: "name_of_group_head",
  },
  {
    name: "Rating Model Applied",
    selector: "rat_model",
  },
  {
    name: "Model based LT Rating Grade",
    selector: "model_based_ltr_grade",
  },
  {
    name: "Model based LT Rating Grade No.",
    selector: "model_based_ltr_grade_wgt",
  },
  {
    name: "Analyst Recommended LT Rating Grade",
    selector: "analyst_recomm_ltr_grade",
  },
  {
    name: "Analyst Recommended LT Rating Grade No.",
    selector: "analyst_recomm_ltr_grade_no",
  },
  {
    name: "Difference between Model based LT Rating and Analyst recommended LT Rating",
    selector: "diff_btw_mbltr_arltr",
  },
  {
    name: "Current Rating Assigned by the Committee",
    selector: "curr_rat_by_cmte",
  },
  {
    name: "Current LT Rating Grade assigned by the Committee",
    selector: "curr_lt_rat_grade_by_cmte",
  },
  {
    name: "Current LT Rating Grade No.",
    selector: "curr_lt_rat_grade_no",
  },
  {
    name: "Current ST Rating Grade",
    selector: "curr_st_rat_grade",
  },
  {
    name: "Current ST Rating Grade No.",
    selector: "curr_st_rat_grade_no",
  },
  {
    name: "Current Recovery Rating Grade",
    selector: "curr_recovery_rat_grade",
  },
  {
    name: "Current Recovery Rating Grade No.",
    selector: "curr_recovery_rat_grade_no",
  },
  {
    name: "Notch Difference between Current LT Rating and Model based Rating",
    selector: "diff_btw_cltr_mbr",
  },
  {
    name: "Sector Details",
    selector: "sector_details",
  },
  {
    name: "Macro Economic Indicator",
    selector: "macro_economic_indicator",
  },
  {
    name: "Sector",
    selector: "sector",
  },
  {
    name: "Industry",
    selector: "industry",
  },
  {
    name: "Basic Industry",
    selector: "basic_industry",
  },
  {
    name: "Provisional Communication to Client",
    selector: "provisional_com_to_client",
  },
  {
    name: "Acceptance/Non-Acceptance",
    selector: "acceptance_status",
  },
  {
    name: "Date of Acceptance",
    selector: "acceptance_date",
  },
  {
    name: "Rating Letter Date",
    selector: "rat_letter_date",
  },
  {
    name: "Date of PR",
    selector: "date_of_pr",
  },
  {
    name: "PR to BSE/NSE/PRESS",
    selector: "pr_to_bse_nse_press",
  },
  {
    name: "NSDL Uploading",
    selector: "nsdl_uploading",
  },
  {
    name: "Previous Rating",
    selector: "previous_rat",
  },
  {
    name: "Previous rating date",
    selector: "previous_rat_date",
  },
  {
    name: "Previous LT Rating Grade",
    selector: "previous_lt_rat_grade",
  },
  {
    name: "Previous LT Rating No.",
    selector: "previous_lt_rat_no",
  },
  {
    name: "Notch Difference between Current and Previous LT Rating",
    selector: "diff_btw_cltrgn_pltrgn",
  },
  {
    name: "LT Rating Upgrade/ Downgrade",
    selector: "lt_upgrade_downgrade",
  },
  {
    name: "Previous ST Rating Grade",
    selector: "previous_st_rat_grade",
  },
  {
    name: "Previous ST Rating Grade No.",
    selector: "previous_st_rat_grade_no",
  },
  {
    name: "Notch Difference between Current and Previous ST Rating",
    selector: "diff_bet_cstrgn_pstgrn",
  },
  {
    name: "ST Rating Upgrade/ Downgrade",
    selector: "st_upgrade_downgrade",
  },
  {
    name: "Previous Recovery Rating Grade",
    selector: "pre_recovery_rat_grade",
  },
  {
    name: "Previous Recovery Rating No.",
    selector: "pre_recovery_rat_no",
  },
  {
    name: "Recovery Rating Notch Difference",
    selector: "recovery_rating_diff",
  },
  {
    name: "Recovery Rating Upgrade/ Downgrade",
    selector: "recovery_upgrade_downgrade",
  },
  {
    name: "Banker Details",
    selector: "banker_details",
  },
  {
    name: "Other CRA",
    selector: "other_cra",
  },
  {
    name: "Date of Rating by other CRA",
    selector: "rat_date_by_other_cra",
  },
  {
    name: "Rating Assigned by other CRA",
    selector: "rat_assigned_by_other_cra",
  },
  {
    name: "LT Rating Grade assigned by other CRA",
    selector: "lt_rat_grade_assigned_by_other_cra",
  },
  {
    name: "Other CRA LT Rating Grade No.",
    selector: "other_cra_lt_rat_grade_no",
  },
  {
    name: "Notch Difference between current LT Rating assigned and LT rating assigned by other CRA",
    selector: "diff_bwt_cltr_ltr_by_other_cra",
  },
  {
    name: "Notch Difference between Model based rating and LT rating assigend by other CRA",
    selector: "diff_bwt_mbr_ltr_by_other_cra",
  },
  {
    name: "ST Rating Grade assigned by other CRA",
    selector: "st_rat_grade_assigned_by_other_cra",
  },
  {
    name: "Other CRA ST Rating Grade No.",
    selector: "other_cra_st_rat_grade_no",
  },
  {
    name: "Notch Difference between current ST rating assigned and ST rating assigned by other CRA",
    selector: "diff_bwt_cstra_cstra_by_other_cra",
  },
  {
    name: "Stipulated time (With in)",
    selector: "stipulated_time_with_in",
  },
  {
    name: "Status 0f Bank Statement",
    selector: "status_of_bank_statement",
  },
  {
    name: "Name of the bank",
    selector: "name_of_the_bank",
  },
  {
    name: "Remarks",
    selector: "remarks",
  },
  {
    name:"Is Active",
    selector:"is_active"
  }]

  let INVESTMENTMAP = new Map();  
  INVESTMENTMAP.set('BBB-', 'Investment Grade');
  INVESTMENTMAP.set('BBB', 'Investment Grade');
  INVESTMENTMAP.set('BBB+', 'Investment Grade');
  INVESTMENTMAP.set('A-', 'Investment Grade');
  INVESTMENTMAP.set('A', 'Investment Grade');
  INVESTMENTMAP.set('A+', 'Investment Grade');
  INVESTMENTMAP.set('AA-', 'Investment Grade');
  INVESTMENTMAP.set('AA', 'Investment Grade');
  INVESTMENTMAP.set('AA+', 'Investment Grade');
  INVESTMENTMAP.set('AAA', 'Investment Grade');
  INVESTMENTMAP.set('BB+', 'Non Investment Grade');
  INVESTMENTMAP.set('BB', 'Non Investment Grade');
  INVESTMENTMAP.set('BB-', 'Non Investment Grade');
  INVESTMENTMAP.set('B+', 'Non Investment Grade');
  INVESTMENTMAP.set('B', 'Non Investment Grade');
  INVESTMENTMAP.set('B-', 'Non Investment Grade');
  INVESTMENTMAP.set('c+', 'Non Investment Grade');
  INVESTMENTMAP.set('c', 'Non Investment Grade');
  INVESTMENTMAP.set('c-', 'Non Investment Grade');
  INVESTMENTMAP.set('D', 'Non Investment Grade');
  
// rating summary report
const RATINGSUMMARY=[
  {
    name:"Sr. No.",
    selector:"key"
  },
  {
    name:"Parameter",
    selector:"name"
  },
  {
    name:"No. of ratings",
    selector:"no_of_ratings"
  },
  {
    name:"Amount of debt rated (`millions)",
    selector:"amount"
  },
] 

const ANNEXUREIIAREPORT=[
  {
    name:"Sr. No.",
    selector:"key"
  },
  {
    name:"Name of the Issuer",
    selector:"company_name"
  },
  {
    name:"Sector",
    selector:"sector"
  },
  {
    name:"Type of Instrument being rated",
    selector:"instrument"
  },
  {
    name:"Listing Status",
    selector:"instrument"
  },
  {
    name:"Rating Prior to revision",
    selector:"previous_rat"
  },
  {
    name:"Rating Post Revision",
    selector:"curr_rat_by_cmte"
  },
  {
    name:"Date of Press Release for Rating Upgrade",
    selector:"date_of_pr"
  },
  {
    name:"Notch Difference",
    selector:"combined_notch_diff"
  },
  {
    name:"Trigger Event",
    selector:""
  },

] 
const DOWNGRADE='Downgrade';
const UPGRADE='Upgrade';
module.exports = {
  LANG_DATA,
  PR_REPORT_HEADER,
  RATING_MIS_REPORT,
  INVESTMENTMAP,
  RATINGSUMMARY,
  DOWNGRADE,
  UPGRADE,
  ANNEXUREIIAREPORT
};
