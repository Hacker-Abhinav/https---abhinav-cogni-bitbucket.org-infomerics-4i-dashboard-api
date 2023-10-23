const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const {
  RatingCommitteeMeeting,
} = require("../models/modules/rating-committee");

// GET_RATING_SHEET_DATA
async function GET_RATING_SHEET_DATA(query) {
  return new Promise(async (resolve, reject) => {
    const rating_committee_meeting = await RatingCommitteeMeeting.findOne({
      where: query,
      raw: true,
    });

    if (!rating_committee_meeting) {
      reject({
        success: false,
        error: "NO_RATING_COMMITTEE_MEETING_FOUND",
      });
    }

    let sum = 0;

    const meeting_details = {};

    const rating_sheet_data = await DB_CLIENT.query(
      `
      select rcmr.instrument_size_number AS size_in_crore, rcm.meeting_type, c.name as entity_name, CONCAT(CAST(rcmr.category_text AS NVARCHAR(255)), '-', CAST(rcmr.sub_category_text AS NVARCHAR(255)), '-', CAST(rcmr.instrument_text AS NVARCHAR(255))) AS instrument, rp.name AS nature_of_assignment, 
      rcmr.previous_rating AS existing_rating, 
      CASE 
	    WHEN rcmr.is_long_term = 1 AND rcmr.is_short_term = 0 OR rcmr.long_term_rating_recommendation IS NOT NULL OR rcmr.long_term_outlook_recommendation IS NOT NULL THEN CONCAT(rcmr.long_term_rating_recommendation, '/', rcmr.long_term_outlook_recommendation)
      WHEN rcmr.is_short_term = 1 AND rcmr.is_short_term = 0 OR rcmr.short_term_rating_recommendation IS NOT NULL OR rcmr.short_term_outlook_recommendation IS NOT NULL THEN rcmr.short_term_rating_recommendation
      WHEN rcmr.is_long_term = 1 AND rcmr.is_short_term = 1 THEN CONCAT(rcmr.long_term_rating_recommendation, '/', rcmr.long_term_outlook_recommendation, '&', rcmr.short_term_rating_recommendation)
      END AS proposed_rating, rcmr.long_term_rating_assgined_text AS current_assigned_rating, rcm.id AS rating_committee_meeting_id, rcm.meeting_at AS meeting_at,
      CASE
      	WHEN rct.name = 'Internal' THEN 'IRCM'
      	WHEN rct.name = 'External' THEN 'RCM'
      END AS committee_type
      from rating_committee_meeting_registers rcmr 
      inner join instrument_categories ic ON ic.id = rcmr.instrument_category_id
      inner join instrument_details id ON id.id = rcmr.instrument_detail_id
      inner join rating_processes rp ON rp.id = id.rating_process_id
      inner join companies c on c.id = rcmr.company_id
      inner join rating_committee_types rct on rct.id = rcmr.rating_committee_type_id
      inner join rating_committee_meetings rcm ON rcm.id = :rating_committee_meeting_id
      where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
      group by rcm.meeting_type, rct.name, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term, rcmr.long_term_rating_recommendation,
      rcmr.long_term_outlook_recommendation, rcmr.short_term_rating_recommendation, rcmr.short_term_outlook_recommendation,
      c.name, CAST(rcmr.category_text AS NVARCHAR(255)), CAST(rcmr.sub_category_text AS NVARCHAR(255)), CAST(rcmr.instrument_text AS NVARCHAR(255)), rp.name, rcmr.previous_rating, rcmr.long_term_rating_assgined_text, rcmr.long_term_rating_assgined_text, rcm.id, rcm.meeting_at, rcmr.long_term_rating_recommendation
      `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    console.log("rating_sheet_data===================>", rating_sheet_data);

    meeting_details.rating_sheet_data = rating_sheet_data

    const sum_in_rating_sheet = await DB_CLIENT.query(`
      select SUM(rcmr.instrument_size_number) AS total, c.name as company_name
      from rating_committee_meeting_registers rcmr 
      inner join companies c on c.id = rcmr.company_id
      where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
      group by c.name
    `, {
      replacements: {
        rating_committee_meeting_id: rating_committee_meeting.id
      },
      type: QueryTypes.SELECT
    })

    console.log("sum_in_rating_sheet==============>", sum_in_rating_sheet);

    var docs_data = [];
    var companies_props = [];

    rating_sheet_data.forEach((row) => {
      const company_prop = row["entity_name"];
      if (companies_props.includes(company_prop)) {
        docs_data.forEach((company) => {
          if (company["entity_name"] === company_prop) {
            company["instruments"].push({
              instrument: row["instrument"],
              size_in_crore: row["size_in_crore"],
              nature_of_assignment: row["nature_of_assignment"],
              existing_rating: row["existing_rating"],
              proposed_rating: row["proposed_rating"],
              committee_assigned_rating: row["current_assigned_rating"],
              rating_committee_meeting_id: row["rating_committee_meeting_id"],
              meeting_at: row["meeting_at"],
              meeting_type: row["meeting_type"],
              committee_type: row["committee_type"]
            });
          }
        });
      } else {
        companies_props.push(company_prop);
        docs_data.push({
          entity_name: row["entity_name"],
          instruments: [
            {
              instrument: row["instrument"],
              size_in_crore: row["size_in_crore"],
              nature_of_assignment: row["nature_of_assignment"],
              existing_rating: row["existing_rating"],
              proposed_rating: row["proposed_rating"],
              committee_assigned_rating: row["current_assigned_rating"],
              rating_committee_meeting_id: row["rating_committee_meeting_id"],
              meeting_at: row["meeting_at"],
              meeting_type: row["meeting_type"],
              committee_type: row["committee_type"]
            },
          ],
        });
      }
    });
    meeting_details.docs_data = docs_data;

    try {
      const penultimate_meeting_details = await DB_CLIENT.query(
        `
    SELECT rcm.id AS rating_committee_meeting_id, rcm.meeting_at AS meeting_at FROM rating_committee_meetings rcm
    WHERE (rcm.id < :rating_committee_meeting_id AND rcm.rating_committee_type_id <= :rating_committee_type_id AND rcm.rating_committee_meeting_category_id <= :rating_committee_meeting_category_id) ORDER BY rcm.id DESC
    `,
        {
          replacements: {
            rating_committee_meeting_id: rating_committee_meeting.id,
            rating_committee_type_id:
              rating_committee_meeting.rating_committee_type_id,
            rating_committee_meeting_category_id:
              rating_committee_meeting.rating_committee_meeting_category_id,
          },
          type: QueryTypes.SELECT,
        }
      );

      meeting_details.penultimate_meeting_details = penultimate_meeting_details;
    } catch (error) {
      console.log(
        "--------------------NO_PENULTIMATE_DATA---------------------------"
      );
      reject(
        JSON.stringify({
          success: false,
          error: "NO_PENULTIMATE_DATA",
        })
      );
    }

    if (meeting_details) resolve(meeting_details);
    else {
      reject({
        success: false,
        error: "RATING_SHEET_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
  GET_RATING_SHEET_DATA,
};
