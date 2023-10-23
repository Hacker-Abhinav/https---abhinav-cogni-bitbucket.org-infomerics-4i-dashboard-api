const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { RatingCommitteeMeeting } = require("../models/modules/rating-committee");
const { Company } = require("../models/modules/onboarding");

// GET_PROV_COMM_BLR_DATA
async function GET_PROV_COMM_BLR_DATA(query) {
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

      const prov_comm_blr_ratings = await DB_CLIENT.query(`
      SELECT DISTINCT rcmr.category_text, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term, c.name AS company_name, cd.name AS company_contact, cd.email, id.rating_letter_date, cd.designation AS designation, rcmr.long_term_rating_assgined_text AS rating, rcmr.rating_action, ti.complexity_level,
      rcmr.rating_committee_meeting_id
      FROM rating_committee_meeting_registers rcmr 
      LEFT JOIN companies c ON c.id = rcmr.company_id 
      LEFT JOIN contact_details cd ON cd.company_id = c.id
      LEFT JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
      LEFT JOIN transaction_instruments ti ON ti.id = rcmr.transaction_instrument_id
      WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND c.id = :company_id AND cd.is_primary_contact = 1 AND cd.is_active = 1
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT,
      });

      console.log("press_release_ratings========>", prov_comm_blr_ratings);

      const sum_in_blr = await DB_CLIENT.query(`
      SELECT SUM(rcmr.instrument_size_number) AS total FROM rating_committee_meeting_registers rcmr WHERE rcmr.company_id = :company_id AND rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND (rcmr.is_short_term = 1 OR rcmr.is_long_term = 1)
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT
      })

      const company_address = await DB_CLIENT.query(`    
      SELECT DISTINCT ca.address_1 AS address_1 FROM company_addresses ca
      INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = ca.company_id
      WHERE ca.company_id = 124 and rcmr.rating_committee_meeting_id = 207 AND ca.is_active = 1
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
          company_id: company.id
        },
        type: QueryTypes.SELECT,
      })

      const mandate_date = await DB_CLIENT.query(`
      SELECT m.mandate_date FROM mandates m WHERE m.company_id = :company_id
     `, {
      replacements: {
        company_id: company.id
      },
      type: QueryTypes.SELECT
     })

      console.log("sum_in_blr==========>", sum_in_blr);

      console.log("company_address=========>", company_address);
      console.log("mandate_date=========>", mandate_date);

      meeting_details.meeting_data = prov_comm_blr_ratings
      meeting_details.sum_in_blr = sum_in_blr
      meeting_details.company_address = company_address
      meeting_details.mandate_date = mandate_date
    
      if (meeting_details) resolve(meeting_details)

    else {
      reject({
        success: false,
        error: "PROVISIONAL_COMM_BLR_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
    GET_PROV_COMM_BLR_DATA,
}