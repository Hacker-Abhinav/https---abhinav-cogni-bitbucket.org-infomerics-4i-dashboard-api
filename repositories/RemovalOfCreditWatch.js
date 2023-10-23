const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { RatingCommitteeMeeting } = require("../models/modules/rating-committee");
const { Company } = require("../models/modules/onboarding");
const { lt_bp_annexure, st_bp_annexure } = require("../constants/removal_credit_watch_annexure")

// GET_PROV_COMM_BLR_DATA
async function GET_REMOVAL_CREDIT_WATCH_DATA(query) {
  return new Promise(async (resolve, reject) => {
    
    const rating_committee_meeting = await RatingCommitteeMeeting.findOne({
        where:  query.rating_committee_meeting_params,
        raw: true
      })

      if (!rating_committee_meeting) {
        reject({
          success: false,
          error: "NO_RATING_COMMITTEE_MEETING_FOUND",
        });
      }

      const company = await Company.findOne({
        where: query.company_params,
        raw: true
      })

      if (!company) {
        reject({
            success: false,
            error: "NO_COMPANY_FOUND"
        })
      }

      const meeting_details = {}

      const removal_of_credit_watch = await DB_CLIENT.query(`
      SELECT rcmr.category_text, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term, c.name AS company_name, cd.name AS company_contact, ca.address_1, id.rating_letter_date, cd.designation AS designation, rcmr.long_term_rating_assgined_text AS rating, rcmr.rating_action, rcmr.previous_rating, u.full_name AS rating_analyst, u.email AS rating_analyst_email, u1.full_name AS group_head, u1.email AS group_head_email
      FROM rating_committee_meeting_registers rcmr 
      INNER JOIN companies c ON c.id = rcmr.company_id 
      INNER JOIN contact_details cd ON cd.company_id = c.id
      INNER JOIN company_addresses ca ON ca.company_id = c.id
      INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
      INNER JOIN mandates m ON m.id = rcmr.mandate_id
      INNER JOIN users u ON u.id = m.ra_id
      INNER JOIN users u1 ON u1.id = m.gh_id
      WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND c.id = :company_id AND cd.is_primary_contact = 1 AND cd.is_active = 1 AND ca.is_active = 1
          `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT,
      });

      console.log("removal_credit_watch_data========>", removal_of_credit_watch);

      meeting_details.removal_credit_watch_data = removal_of_credit_watch

      const rated_facilites = await DB_CLIENT.query(`
      SELECT DISTINCT rcmr.instrument_text, c.name, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term
      FROM rating_committee_meeting_registers rcmr
      INNER JOIN companies c ON c.id = rcmr.company_id 
      WHERE rcmr.company_id = :company_id AND (rcmr.is_short_term = 1 OR rcmr.is_long_term = 1) AND rcmr.sub_category_text LIKE 'Fund Based%'
      `,
      {
        replacements: {
            company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      meeting_details.long_short_term_fund_facilites = rated_facilites

      const sum_in_rated_facilities = await DB_CLIENT.query(`
      SELECT SUM(rcmr.instrument_size_number) AS total FROM rating_committee_meeting_registers rcmr WHERE rcmr.company_id = :company_id AND (rcmr.is_short_term = 1 OR rcmr.is_long_term = 1) AND rcmr.sub_category_text LIKE 'Fund Based%'
      `, 
      {
        replacements: {
            company_id: company.id
        },
        type: QueryTypes.SELECT
      })
      
        meeting_details.sum_in_rated_facilities = sum_in_rated_facilities

      const rated_facilites_short_term = await DB_CLIENT.query(`
      SELECT DISTINCT rcmr.instrument_text, c.name, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term
      FROM rating_committee_meeting_registers rcmr
      INNER JOIN companies c ON c.id = rcmr.company_id 
      WHERE rcmr.company_id = :company_id AND rcmr.is_short_term = 1 AND rcmr.sub_category_text LIKE 'Non Fund Based%'
      `,
      {
        replacements: {
            company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      meeting_details.short_term_non_fund_facilites = rated_facilites_short_term

      const sum_in_rated_facilities_short_term = await DB_CLIENT.query(`
      SELECT SUM(rcmr.instrument_size_number) AS total FROM rating_committee_meeting_registers rcmr WHERE rcmr.company_id = :company_id AND rcmr.is_short_term = 1 AND rcmr.sub_category_text LIKE 'Non Fund Based%'
      `, {
        replacements: {
            company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      meeting_details.sum_in_rated_facilities_short_term = sum_in_rated_facilities_short_term

      meeting_details.lt_bp_annexure = lt_bp_annexure
      meeting_details.st_bp_annexure = st_bp_annexure

      if (meeting_details) resolve(meeting_details)

    else {
      reject({
        success: false,
        error: "REMOVAL_CREDIT_WATCH_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
    GET_REMOVAL_CREDIT_WATCH_DATA,
}