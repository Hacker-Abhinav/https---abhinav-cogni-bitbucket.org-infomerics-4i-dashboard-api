const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { DelayPeriodicReview } = require("../models/modules/compliance");

async function GET_COMPLIANCE_DELAY_PERIODIC_REVIEW_DATA(query) {
  return new Promise(async (resolve, reject) => {
    const instrument_data = await DB_CLIENT.query(
      `SELECT rcmr.uuid as meeting_register_uuid,c.name as company,rcmr.instrument_text,rcmr.instrument_size_number,
              rcm.meeting_at as committee_meeting_date from companies c 
              INNER JOIN rating_committee_meeting_registers rcmr
              ON c.id = rcmr.company_id
              INNER JOIN rating_committee_meetings rcm 
              ON rcmr.rating_committee_meeting_id =rcm.id
              and rcm.meeting_at=(select max(meeting_at) 
              from rating_committee_meetings rcm2 
              inner join rating_committee_meeting_registers rcmr2 
              on rcmr2.rating_committee_meeting_id =rcm2.id
              where rcmr2.company_id =c.id)
              where (rcmr.instrument_text='Non Convertible Debenture' and DATEADD(month,2,rcm.meeting_at)<CURRENT_TIMESTAMP) 
              or
              (rcmr.instrument_text!='Non Convertible Debenture' and DATEADD(month,1,rcm.meeting_at)<CURRENT_TIMESTAMP)
              GROUP BY c.name,rcm.meeting_at,rcmr.instrument_text,rcmr.instrument_size_number,rcmr.uuid;`,
      {
        type: QueryTypes.SELECT,
      }
    );

    if (!instrument_data) {
      reject({
        success: false,
        error: "No Delay Periodic Review Data Found!",
      });
      return;
    }

    const userInput = await DelayPeriodicReview.findAll({
      raw: true,
    });

    let merged_user_input_and_instrument = instrument_data.map((val1) => {
      let input_obj = userInput.find(
        (val2) => val2.uuid == val1.meeting_register_uuid
      );

      if (!input_obj) {
        val1 = {
          ...val1,
          email_status: "",
          remarks: "",
        };
      } else {
        val1 = { ...val1, ...input_obj };
        delete val1.uuid;
      }

      return val1;
    });

    const docs_data = [];
    const company_names = [];
    if (query !== "csv") {
      merged_user_input_and_instrument.forEach((instrument) => {
        const company_name = instrument["company"];
        if (company_names.includes(company_name)) {
          docs_data.forEach((data) => {
            if (data.company_name == instrument.company) {
              if (!data.reason_for_delay) {
                data.reason_for_delay = instrument["remarks"];
              }
              data["instruments"].push({
                type: instrument["instrument_text"],
                size: instrument["instrument_size_number"],
              });
            }
          });
        } else {
          company_names.push(company_name);
          docs_data.push({
            company_name: instrument["company"],
            reason_for_delay: instrument["remarks"],
            last_review_date: instrument["committee_meeting_date"],
            instruments: [
              {
                type: instrument["instrument_text"],
                size: instrument["instrument_size_number"],
              },
            ],
          });
        }
      });
    } else {
      docs_data.push(...merged_user_input_and_instrument);
    }
    resolve(docs_data);
  });
}

module.exports = { GET_COMPLIANCE_DELAY_PERIODIC_REVIEW_DATA };
