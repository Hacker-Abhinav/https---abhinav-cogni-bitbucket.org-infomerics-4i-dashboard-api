const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { RatingCommitteeMeeting } = require("../models/modules/rating-committee");
const { Company } = require("../models/modules/onboarding");

// GET_PRESS_RELEASE_DATA
async function GET_PRESS_RELEASE_DATA(query) {
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

      const press_release_ratings = await DB_CLIENT.query(`
        SELECT CONCAT(rcmr.category_text, '-', rcmr.sub_category_text, '-', rcmr.instrument_text) AS instrument, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term, rcmr.long_term_rating_assgined_text AS rating, rcmr.rating_action, ti.complexity_level,
        rcmr.rating_committee_meeting_id
        FROM rating_committee_meeting_registers rcmr 
        INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
        INNER JOIN transaction_instruments ti ON ti.id = rcmr.transaction_instrument_id
        WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND rcmr.company_id = :company_id
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT,
      });

      console.log("press_release_ratings in repository========>", press_release_ratings);

      meeting_details.rating_data = press_release_ratings

      const sum_in_pr = await DB_CLIENT.query(`
        SELECT SUM(rcmr.instrument_size_number) AS total FROM rating_committee_meeting_registers rcmr WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND rcmr.company_id = :company_id
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      meeting_details.sum_in_pr = sum_in_pr

      const pr_contact_details = await DB_CLIENT.query(`
        SELECT DISTINCT c.name AS company_name, cd.name AS company_contact, ca.address_1, id.press_release_date, cd.designation AS designation
        FROM rating_committee_meeting_registers rcmr
        INNER JOIN companies c ON c.id = rcmr.company_id
        INNER JOIN contact_details cd ON cd.company_id = c.id
        INNER JOIN company_addresses ca ON ca.company_id = c.id
        INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
        WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND c.id = :company_id AND cd.is_primary_contact = 1
        AND cd.is_active = 1 AND ca.is_active = 1
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      meeting_details.pr_contact_details = pr_contact_details

      const rating_history = await DB_CLIENT.query(`
      SELECT rcmr.instrument_text AS instrument, rcmr.instrument_size_number AS amount_outstanding, rcmr.sub_category_text AS current_type,
        rcmr.long_term_outlook_recommendation AS rating_outlook, rcmr.long_term_rating_recommendation AS rating, fy.reference_date, id.press_release_date, u.full_name AS rating_analyst, u.email
        FROM rating_committee_meeting_registers rcmr
        LEFT JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
        LEFT JOIN financial_years fy ON fy.id = id.financial_year_id
        INNER JOIN mandates m ON m.id = rcmr.mandate_id
        INNER JOIN users u ON u.id = m.ra_id
        WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND rcmr.company_id = :company_id
      `, {
        replacements: {
            rating_committee_meeting_id: rating_committee_meeting.id,
            company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      meeting_details.rating_history = rating_history
    
    if (meeting_details) resolve(meeting_details)

    else {
      reject({
        success: false,
        error: "PRESS_RELEASE_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
    GET_PRESS_RELEASE_DATA,
}