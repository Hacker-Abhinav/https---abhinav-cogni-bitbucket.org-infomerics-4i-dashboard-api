const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { RatingCommitteeMeeting } = require("../models/modules/rating-committee");

// GET_RATING_SHEET_DATA
async function GET_AGENDA_SHEET_DATA(query) {
  return new Promise(async (resolve, reject) => {
    
    const rating_committee_meeting = await RatingCommitteeMeeting.findOne({
        where:  query,
        raw: true
      })

      if (!rating_committee_meeting) {
        reject({
          success: false,
          error: "NO_RATING_COMMITTEE_MEETING_FOUND",
        });
      }

      const meeting_details = {};

      const rating_sheet_data = await DB_CLIENT.query(`
      SELECT DISTINCT c.name AS entity_name, c.cin AS company_cin, m.mandate_type AS instrument, rcmr.instrument_size_number AS size_in_crore, 
      rp.name AS nature_of_assignment, rcm.id AS rating_committee_meeting_id, 
      CASE 
      	WHEN rct.name = 'Internal' THEN 'IRCM'
      	WHEN rct.name = 'External' THEN 'RCM'
      END AS committee_type, rcm.meeting_at AS meeting_at, rcm.meeting_type 
      FROM  rating_committee_meeting_registers rcmr 
      INNER JOIN companies c ON c.id = rcmr.company_id
      INNER JOIN mandates m ON m.id = rcmr.mandate_id
      INNER JOIN instrument_categories ic ON ic.id = rcmr.instrument_category_id
      INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
      INNER JOIN rating_processes rp ON rp.id = id.rating_process_id
      INNER JOIN rating_committee_types rct ON rct.id = rcmr.rating_committee_type_id 
      INNER JOIN rating_committee_meetings rcm ON rcm.id = :rating_committee_meeting_id
      WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
      `, {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      });

      var docs_data = [];
      var companies_props = [];

      rating_sheet_data.forEach(row => {
      const company_prop = row['entity_name'];
      if (companies_props.includes(company_prop)) {
        docs_data.forEach(company => {
        
          if (company['entity_name'] === company_prop) {
            company['instruments'].push({
              instrument: row['instrument'],
              size_in_crore: row['size_in_crore'],
              nature_of_assignment: row['nature_of_assignment'],
              existing_rating: row['existing_rating'],
              proposed_rating: row['proposed_rating'],
              committee_assigned_rating: row['committee_assigned_rating'],
              rating_committee_meeting_id: row['rating_committee_meeting_id'],
              meeting_at: row['meeting_at'],
              meeting_type: row['meeting_type'],
              committee_type: row['committee_type']
            });
          }
        
        });
      }

      else {
        companies_props.push(company_prop);
        docs_data.push({
          entity_name: row['entity_name'],
          instruments: [{
            instrument: row['instrument'],
            size_in_crore: row['size_in_crore'],
            nature_of_assignment: row['nature_of_assignment'],
            existing_rating: row['existing_rating'],
            proposed_rating: row['proposed_rating'],
            committee_assigned_rating: row['committee_assigned_rating'],
            rating_committee_meeting_id: row['rating_committee_meeting_id'],
            meeting_at: row['meeting_at'],
            meeting_type: row['meeting_type'],
            committee_type: row['committee_type']
          }]
        });
      }
    });

    meeting_details.docs_data = docs_data

    try{
      const penultimate_meeting_details = await DB_CLIENT.query(`
    SELECT rcm.id AS rating_committee_meeting_id, rcm.meeting_at AS meeting_at FROM rating_committee_meetings rcm
    WHERE (rcm.id < :rating_committee_meeting_id AND rcm.rating_committee_type_id = :rating_committee_type_id AND rcm.rating_committee_meeting_category_id = :rating_committee_meeting_category_id) ORDER BY rcm.id DESC
    `, {
      replacements: {
        rating_committee_meeting_id: rating_committee_meeting.id,
        rating_committee_type_id: rating_committee_meeting.rating_committee_type_id,
        rating_committee_meeting_category_id: rating_committee_meeting.rating_committee_meeting_category_id,
      },
      type: QueryTypes.SELECT
    })

    meeting_details.penultimate_meeting_details = penultimate_meeting_details
  }catch(error) {
      console.log("--------------------NO_PENULTIMATE_DATA---------------------------")
      reject(JSON.stringify({
        success: false,
        error: "NO_PENULTIMATE_DATA"
      }))
    }
    
      if (meeting_details) resolve(meeting_details)

    else {
      reject({
        success: false,
        error: "AGENDA_SHEET_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
    GET_AGENDA_SHEET_DATA,
}