const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const {
  RatingCommitteeMeeting,
} = require("../models/modules/rating-committee");

function checkDuplicates(array, value) {
  if (!array.includes(value) && value !== null) {
    array.push(value);
  }
}

// GET_RATING_SHEET_DATA
async function GET_MOM_SHEET_DATA(query) {
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

    const meeting_details = {};

    const mom_sheet_data = await DB_CLIENT.query(
      `
      SELECT rcmr.instrument_size_number, c.name AS entity_name,
      CASE WHEN rcmr.is_long_term = 1 AND rcmr.is_short_term = 0 THEN CONCAT('Long Term ', rcmr.category_text)
      WHEN rcmr.is_short_term = 1  AND rcmr.is_long_term = 0 THEN CONCAT('Short Term ', rcmr.category_text)
      WHEN rcmr.is_short_term = 1 AND rcmr.is_long_term = 1 THEN CONCAT('Long/ Short Term ', rcmr.category_text)
      END AS instrument, rp.name AS nature_of_assignment, 
      rcmr.previous_rating AS existing_rating, 
      CASE 
	    WHEN rcmr.is_long_term = 1 AND rcmr.is_short_term = 0 OR rcmr.long_term_rating_recommendation IS NOT NULL OR rcmr.long_term_outlook_recommendation IS NOT NULL THEN CONCAT(rcmr.long_term_rating_recommendation, '/', rcmr.long_term_outlook_recommendation)
      WHEN rcmr.is_short_term = 1 AND rcmr.is_short_term = 0 OR rcmr.short_term_rating_recommendation IS NOT NULL OR rcmr.short_term_outlook_recommendation IS NOT NULL THEN rcmr.short_term_rating_recommendation
      WHEN rcmr.is_long_term = 1 AND rcmr.is_short_term = 1 THEN CONCAT(rcmr.long_term_rating_recommendation, '/', rcmr.long_term_outlook_recommendation, '&', rcmr.short_term_rating_recommendation)
      END AS proposed_rating,
      CASE WHEN rcmr.long_term_rating_assgined_text IS NOT NULL THEN rcmr.long_term_rating_assgined_text END AS current_assigned_rating, 
      rcm.id AS rating_committee_meeting_id, rcm.meeting_at AS meeting_at, rcm.meeting_type,
      CASE 
      	WHEN rct.name = 'Internal' THEN 'IRCM'
      	WHEN rct.name = 'External' THEN 'RCM'
      END AS committee_type
      FROM rating_committee_meeting_registers rcmr 
      INNER JOIN companies c ON c.id = rcmr.company_id
      INNER JOIN mandates m ON m.id = rcmr.mandate_id
      INNER JOIN instrument_categories ic ON ic.id = rcmr.instrument_category_id
      INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
      INNER JOIN rating_processes rp ON rp.id = id.rating_process_id
      INNER JOIN meeting_has_members mhm ON mhm.rating_committee_meeting_id = rcmr.rating_committee_meeting_id
      INNER JOIN users u ON u.id = m.ra_id
      INNER JOIN rating_committee_types rct ON rct.id = rcmr.rating_committee_type_id
      LEFT JOIN rating_committee_meetings rcm ON rcm.id = :rating_committee_meeting_id
      LEFT JOIN rating_committee_voting_metadata rcvm ON rcvm.id = :rating_committee_meeting_id
      WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
      GROUP BY rcmr.instrument_size_number, rct.name, c.name, rcmr.category_text, rp.name, rcmr.previous_rating, rcmr.long_term_rating_recommendation, 
      rcmr.long_term_outlook_recommendation, rcmr.long_term_outlook, rcmr.short_term_rating_recommendation, rcmr.short_term_outlook_recommendation,
      rcmr.long_term_rating_assgined_text, rcm.id, rcm.meeting_at, rcm.meeting_type, rcmr.is_long_term, rcmr.is_short_term
      `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    console.log("mom_sheet_data=============>", mom_sheet_data);

    const minutes = await DB_CLIENT.query(
      `
      SELECT cm.discussion_paragraph AS rating_analyst_points, cm.comments_paragraph AS post_presentation_committee_discussed_issue FROM committee_minutes cm
      WHERE cm.rating_committee_meeting_id = :rating_committee_meeting_id
      `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    meeting_details.minutes = minutes

    const penultimate_meeting_details = await DB_CLIENT.query(
      `
    SELECT TOP(1) rcm.id AS rating_committee_meeting_id, rcm.meeting_at AS meeting_at FROM rating_committee_meetings rcm
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

    const rating_committee_members_present = await DB_CLIENT.query(
      `
      select DISTINCT 
	    CASE 
	  	  WHEN SUBSTRING(u1.full_name, 1, 3) != 'Mr.' AND ua.gender = 'MALE' THEN CONCAT('Mr. ', u1.full_name)
	  	  WHEN SUBSTRING(u1.full_name, 1, 3) != 'Ms.' AND ua.gender = 'FEMALE' THEN CONCAT('Ms. ', u1.full_name)
	  	  ELSE u1.full_name
	    END AS rating_committee_members_present from rating_committee_meeting_registers rcmr
      inner join mandates m on m.id = rcmr.mandate_id
      inner join meeting_has_members mhm ON mhm.rating_committee_meeting_id = rcmr.rating_committee_meeting_id
      inner join users u1 on u1.id = mhm.member_id AND mhm.is_active = 1
      inner join user_attributes ua on ua.user_id = u1.id
      where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
    `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    meeting_details.rating_committee_members_present =
      rating_committee_members_present;

    const rating_analysts_chairman = await DB_CLIENT.query(
      `
      DECLARE @flag int
      SET @flag = 0
      SELECT DISTINCT
      CASE
        WHEN ua.gender = 'MALE' AND SUBSTRING(u5.full_name, 1, 3) != 'Mr.' THEN 1
        WHEN ua.gender = 'FEMALE' AND SUBSTRING(u5.full_name, 1, 3) != 'Ms.' THEN 2
        ELSE 3
      END AS chairman_count,
      CASE
        WHEN (SELECT @flag) = 1 THEN CONCAT('Mr.', u5.full_name)
        WHEN (SELECT @flag) = 2 THEN CONCAT('Ms.', u5.full_name)
        ELSE u5.full_name
      END AS chairman,
      CASE
        WHEN SUBSTRING(u.full_name, 1, 3) != 'Mr.' AND ua.gender = 'MALE' THEN CONCAT('Mr. ', u.full_name)
        WHEN SUBSTRING(u.full_name, 1, 3) != 'Ms.' AND ua.gender = 'FEMALE' THEN CONCAT('Ms. ', u.full_name)
        ELSE u.full_name
      END AS rating_analyst
      FROM rating_committee_meeting_registers rcmr
      INNER JOIN mandates m ON m.id = rcmr.mandate_id
      INNER JOIN users u ON u.id = m.ra_id
      INNER JOIN meeting_has_members mhm1 ON mhm1.rating_committee_meeting_id = rcmr.rating_committee_meeting_id
      INNER JOIN users u5 ON u5.id = mhm1.member_id
      INNER JOIN user_attributes ua ON ua.user_id = u.id
      WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
      AND mhm1.is_chairman = 1;
    `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    meeting_details.chairman = rating_analysts_chairman[0].chairman
    meeting_details.rating_analyst = rating_analysts_chairman[0].rating_analyst

    const group_heads = await DB_CLIENT.query(
      `
      select DISTINCT 
      CASE 
	    WHEN SUBSTRING(u3.full_name, 1, 3) != 'Mr.' AND ua.gender = 'MALE' THEN CONCAT('Mr. ', u3.full_name) 
      WHEN SUBSTRING(u3.full_name, 1, 3) != 'Ms.' AND ua.gender = 'FEMALE' THEN CONCAT('Ms. ', u3.full_name)
      ELSE u3.full_name
      END AS gh_persons_attended_rcm, r1.name as persons_roles_gh from rating_committee_meeting_registers rcmr
      inner join mandates m on m.id = rcmr.mandate_id
      inner join users u3 on u3.id = m.gh_id
      inner join user_has_roles uhr1 on uhr1.user_id = u3.id
      inner join roles r1 on r1.id = uhr1.role_id
      inner join user_attributes ua on ua.user_id = u3.id
      where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
    `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    const rating_analysts = await DB_CLIENT.query(
      `
      select DISTINCT 
      CASE 
	    WHEN SUBSTRING(u3.full_name, 1, 3) != 'Mr.' AND ua.gender = 'MALE' THEN CONCAT('Mr. ', u3.full_name) 
      WHEN SUBSTRING(u3.full_name, 1, 3) != 'Ms.' AND ua.gender = 'FEMALE' THEN CONCAT('Ms. ', u3.full_name) 
      ELSE u3.full_name
      END AS ra_persons_attended_rcm, r1.name as persons_roles_ra from rating_committee_meeting_registers rcmr
      inner join mandates m on m.id = rcmr.mandate_id
      inner join users u3 on u3.id = m.ra_id
      inner join user_has_roles uhr1 on uhr1.user_id = u3.id
      inner join roles r1 on r1.id = uhr1.role_id
      inner join user_attributes ua on ua.user_id = u3.id
      where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
  `,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    const rating_heads = await DB_CLIENT.query(
      `
      select DISTINCT 
      CASE 
	    WHEN SUBSTRING(u3.full_name, 1, 3) != 'Mr.' AND ua.gender = 'MALE' THEN CONCAT('Mr. ', u3.full_name) 
      WHEN SUBSTRING(u3.full_name, 1, 3) != 'Ms.' AND ua.gender = 'FEMALE' THEN CONCAT('Ms. ', u3.full_name) 
      ELSE u3.full_name
      END AS rh_persons_attended_rcm, r1.name as persons_roles_rh from rating_committee_meeting_registers rcmr
      inner join mandates m on m.id = rcmr.mandate_id
      inner join users u3 on u3.id = m.rh_id
      inner join user_has_roles uhr1 on uhr1.user_id = u3.id
      inner join roles r1 on r1.id = uhr1.role_id
      inner join user_attributes ua on ua.user_id = u3.id
      where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
`,
      {
        replacements: {
          rating_committee_meeting_id: rating_committee_meeting.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    let persons_rcm = [];

    group_heads.forEach((item) => {
      persons_rcm.push({
        name: item["gh_persons_attended_rcm"],
        position: item["persons_roles_gh"],
      });
    });

    rating_analysts.forEach(item => {
      persons_rcm.push({
        name: item['ra_persons_attended_rcm'],
        position: item['persons_roles_ra']
      })
    })

    rating_heads.forEach(item => {
      persons_rcm.push({
        name: item['rh_persons_attended_rcm'],
        position: item['persons_roles_rh']
      })
    })

    console.log("persons_rcm============>", persons_rcm);

    meeting_details.persons_rcm = persons_rcm

    meeting_details.penultimate_meeting_details = penultimate_meeting_details;

    const dissent_remark = await DB_CLIENT.query(`
    select DISTINCT rcv.dissent_remark from rating_committee_meeting_registers rcmr
    inner join rating_committee_votings rcv on rcv.rating_committee_meeting_id = rcmr.rating_committee_meeting_id
    where rcmr.rating_committee_meeting_id = :rating_committee_meeting_id and rcv.dissent = 1
    `, {
      replacements: {
        rating_committee_meeting_id: rating_committee_meeting.id
      },
      type: QueryTypes.SELECT
    })

    meeting_details.dissent_remark = dissent_remark

    var docs_data = [];
    var companies_props = [];

    mom_sheet_data.forEach((row) => {
      const company_prop = row["entity_name"];
      if (companies_props.includes(company_prop)) {
        docs_data.forEach((company) => {
          if (company["entity_name"] === company_prop) {
            console.log("row====================>", row, "company==============>", company, "company.agenda_table_data_1==========>", company.agenda_table_data_1);
            company.agenda_table_data_1[0].instruments.push({
              [company.agenda_table_data_1[0].instruments[0].instrument]: company.agenda_table_data_1[0].instruments[0].instrument.push(row["instrument"])
            })
            company.agenda_table_data_1.push({
              [company.agenda_table_data_1[0].size]: company.agenda_table_data_1[0].size.push(row["instrument_size_number"]),
              [company.agenda_table_data_1[0].rating_process]: company.agenda_table_data_1[0].rating_process.push(row["nature_of_assignment"]),
              [company.agenda_table_data_1[0].existing_rating]: company.agenda_table_data_1[0].existing_rating.push(row["existing_rating"]),
              [company.agenda_table_data_1[0].proposed_rating]: company.agenda_table_data_1[0].proposed_rating.push(row["proposed_rating"]),
              [company.agenda_table_data_1[0].current_assigned_rating]: company.agenda_table_data_1[0].current_assigned_rating.push(row["current_assigned_rating"]),
              [company.agenda_table_data_1[0].meeting_type]: company.agenda_table_data_1[0].meeting_type.push(row["meeting_type"]),
              [company.agenda_table_data_1[0].committee_type]: company.agenda_table_data_1[0].committee_type.push(row["committee_type"])
            });
          }
        });
      } else {
        companies_props.push(company_prop);
        docs_data.push({
          entity_name: row["entity_name"],
          agenda_table_data_1: [
            {
              instruments: [
                {
                  entity_name: row["entity_name"],
                  instrument: [row["instrument"]],
                  rating_committee_meeting_id:
                  row["rating_committee_meeting_id"],
                  meeting_at: row["meeting_at"],
                },
              ],
              size: [row["instrument_size_number"]],
              rating_process: [row["nature_of_assignment"]],
              existing_rating: [row["existing_rating"]],
              proposed_rating: [row["proposed_rating"]],
              current_assigned_rating: [row["current_assigned_rating"]],
              meeting_type: [row["meeting_type"]],
              committee_type: [row["committee_type"]]
            },
          ],
        });
      }
    });

    // rating_sheet_data.forEach(rating => {

    // })

    console.log("sheet data in docs_data====================>", docs_data);

    // docs_data.push(minutes);

    meeting_details.docs_data = docs_data;

    if (meeting_details) resolve(meeting_details);
    else {
      reject({
        success: false,
        error: "MOM_SHEET_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
  GET_MOM_SHEET_DATA,
};
