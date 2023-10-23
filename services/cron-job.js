const { default: axios } = require("axios");
const cron = require("node-cron");
var fs = require("fs");
const { startTimer } = require("winston");
const { v4: uuidv4 } = require("uuid");
const {
  GET_CMS_MANDATE_DATA,
  CREATE_CRM_BUFFER,
  GET_CMS_MANDATE_DATA_PER_DAY,
  UPDATE_CRM_BUFFER,
} = require("./integration-cms");
const { QueryTypes, Sequelize } = require("sequelize");
const moment = require("moment");
const { DB_CLIENT } = require("../db");

const {
  SEND_NDS_REMINDER_MAIL,
  SEND_EMAIL_IN_BATCHES,
  SEND_GENERAL_EMAIL,
} = require("./send-email");
const { ListingDetail, Company } = require("../models/modules/onboarding");
const { downloadExtractAndGetValues } = require("./download-bhav-copy");
const { MaterialEventTracking } = require("../models/modules/compliance");
const { LatestShareClosePrice } = require("../models/modules/rating-committee");
const { off } = require("process");
const { EMAIL_TEMPLATE } = require("../constants/constant");

const startTime = new Date();

async function send_workflow_email_handler() {
  let provisional_communication_email_pending = await DB_CLIENT.query(
    `SELECT DISTINCT c.name,rp.name AS rating_process,m.mandate_type,m.total_size,rcm.id AS meeting_id, rcm.meeting_at AS meeting_date,
    rcmr.long_term_rating_assgined_text AS rating, u.full_name AS rating_analyst,u.email AS rating_analyst_email,
    u2.full_name AS group_head, u2.email AS group_head_email
    FROM companies c
    INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id AND rcmr.is_fresh = 1
    INNER JOIN mandates m ON m.id = rcmr.mandate_id 
    INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id
    INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
    INNER JOIN rating_processes rp ON rp.id = id.rating_process_id 
    INNER JOIN users u ON u.id = m.ra_id 
    INNER JOIN users u2 ON u2.id = m.gh_id 
    WHERE id.provisional_communication_date IS NULL AND rcmr.long_term_rating_assgined_text IS NOT NULL
    AND DATEDIFF(HOUR, GETDATE(), rcm.meeting_at) > 24;    
    `,
    {
      type: QueryTypes.SELECT,
    }
  );

  console.log("send_workflow_email_handler provisional_communication_email_pending: ", provisional_communication_email_pending);

  for( let i = 0; i< provisional_communication_email_pending.length ; i++){
    const email_params = {
      template_type: EMAIL_TEMPLATE.WORKFLOW_PROVISIONAL_COMMUNICATION,
      meeting_id: provisional_communication_email_pending[i].meeting_id,
      meeting_date: provisional_communication_email_pending[i].meeting_date,
      rating: [provisional_communication_email_pending[i].rating],
      rating_process: provisional_communication_email_pending[i].rating_process,
      to_user_name: provisional_communication_email_pending[i].rating_analyst,
      from_user_name: provisional_communication_email_pending[i].group_head,
      to_user_email: [provisional_communication_email_pending[i].rating_analyst_email, provisional_communication_email_pending[i].group_head_email],
      company: provisional_communication_email_pending[i].name,
      mandate_type: [provisional_communication_email_pending[i].mandate_type],
      total_size: [provisional_communication_email_pending[i].total_size],
    };
    while(i+1 < provisional_communication_email_pending.length && provisional_communication_email_pending[i+1].name=== provisional_communication_email_pending[i].name ){
      email_params.mandate_type.push(provisional_communication_email_pending[i+1].mandate_type);
      email_params.rating.push(provisional_communication_email_pending[i+1].rating);
      i++;
    }
    console.log("send_workflow_email_handler email_params: ", email_params);
    SEND_GENERAL_EMAIL(email_params);
  }

  let press_release_email_pending = await DB_CLIENT.query(
    `SELECT DISTINCT c.name,rp.name AS rating_process,m.mandate_type,m.total_size,rcm.id AS meeting_id, rcm.meeting_at AS meeting_date,
    rcmr.long_term_rating_assgined_text AS rating, u.full_name AS rating_analyst,u.email AS rating_analyst_email,
    u2.full_name AS group_head, u2.email AS group_head_email
    FROM companies c
    INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id AND rcmr.is_fresh = 1
    INNER JOIN mandates m ON m.id = rcmr.mandate_id 
    INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id
    INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
    INNER JOIN rating_processes rp ON rp.id = id.rating_process_id 
    INNER JOIN users u ON u.id = m.ra_id 
    INNER JOIN users u2 ON u2.id = m.gh_id 
    WHERE id.press_release_date IS NULL AND id.provisional_communication_date IS NOT NULL;    
    `,
    {
      type: QueryTypes.SELECT,
    }
  );

  console.log("send_workflow_email_handler press_release_email_pending: ", press_release_email_pending);

  for( let i = 0; i< press_release_email_pending.length ; i++){
    const email_params = {
      template_type: EMAIL_TEMPLATE.WORKFLOW_PRESS_RELEASE,
      meeting_id: press_release_email_pending[i].meeting_id,
      meeting_date: press_release_email_pending[i].meeting_date,
      rating: [press_release_email_pending[i].rating],
      rating_process: press_release_email_pending[i].rating_process,
      to_user_name: press_release_email_pending[i].rating_analyst,
      from_user_name: press_release_email_pending[i].group_head,
      to_user_email: [press_release_email_pending[i].rating_analyst_email, press_release_email_pending[i].group_head_email],
      company: press_release_email_pending[i].name,
      mandate_type: [press_release_email_pending[i].mandate_type],
      total_size: [press_release_email_pending[i].total_size],
    };
    while(i+1 < press_release_email_pending.length && press_release_email_pending[i+1].name=== press_release_email_pending[i].name ){
      email_params.mandate_type.push(press_release_email_pending[i+1].mandate_type);
      email_params.rating.push(press_release_email_pending[i+1].rating);
      i++;
    }
    console.log("send_workflow_email_handler email_params: ", email_params);
    SEND_GENERAL_EMAIL(email_params);
  }
}

async function NDS_EMAIL_DATA() {
  let emails_data = new Set();
  let email_arr = await DB_CLIENT.query(
    `select cd.email,c.name as company_name,u.email as ra_email,u1.email as gh_email,u2.email as bd_email,COALESCE(mn.nds_recieved,0),mn.is_active  
from companies c inner join mandates m on m.company_id =c.id and m.is_verified =1
left JOIN users u ON u.id = m.ra_id
left JOIN users u1 ON u1.id = m.gh_id 
left JOIN users u2 ON u2.id = m.bd_id
inner join transaction_instruments ti on ti.mandate_id =m.id 
left join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2,5) and id.is_workflow_done=1
left join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc
)
inner join rating_committee_meetings rcm2 on rcm2.id=rcmr.rating_committee_meeting_id
LEFT JOIN monthly_nds mn ON mn.register_id = rcmr.id
left join contact_details cd on cd.company_id =c.id and cd.is_primary_contact =1 and cd.is_active =1
where id.rating_process_id in(2,5) and id.press_release_date is not null 
and rcmr.id is not null and COALESCE(mn.nds_recieved,0)=0 and rcmr.long_term_rating_assgined_text not like '%Withdrawn%';`,
    {
      type: QueryTypes.SELECT,
    }
  );

  for (item of email_arr) {
    if (item["email"] !== undefined && item["email"] !== null) {
      emails_data.add(item);
    }
  }

  emails_data = Array.from(emails_data);
  return emails_data;
}

exports.initScheduledJobs = async () => {
  // const scheduledJobFunction = cron.schedule("0 0 * * *", async () => {
  //   const mandates = await GET_CMS_MANDATE_DATA_PER_DAY();
  //   if (mandates.length > 0) {
  //     UPDATE_CRM_BUFFER(mandates);
  //   }
  // });
  // scheduledJobFunction.start();

  let currentDate = new Date();
  const dayOfMonth = currentDate.getDate();
  const lastDateOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const last_day = lastDateOfMonth.getDate();

  const NDSMonthlyReminder = cron.schedule(
    `0 0 10 ${last_day},2,5,7 * *`,
    async function nds_mail_handler() {
      let emails_data = await NDS_EMAIL_DATA(); 
      console.log("recipients:", emails_data);

      if (emails_data.length > 0) {
        switch (dayOfMonth) {
          case last_day:
            SEND_EMAIL_IN_BATCHES(emails_data, "Monthly NDS First Mail");
            break;

          case 2:
            SEND_EMAIL_IN_BATCHES(emails_data, "Monthly NDS Reminder 1");
            break;

          case 5:
            SEND_EMAIL_IN_BATCHES(emails_data, "Monthly NDS Reminder 2");
            break;

          case 7:
            SEND_EMAIL_IN_BATCHES(emails_data, "Monthly NDS Reminder 3");
            break;

          default:
            break;
        }
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
  NDSMonthlyReminder.start();

  const CompanySharePriceTrack = cron.schedule(
    "0 20 * * 1-5",
    // "* * * * *",

    async function share_price_track_handler() {
      const formatDateToDdmmyy = () => {
        const date = new Date();
        const day = date.getDate().toString().padStart(2, "0");
        // change here
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(-2);
        return `${day}${month}${year}`;
      };
      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      let current_datetime = new Date();
      const todayDateDdmmyy = formatDateToDdmmyy();
      console.log(todayDateDdmmyy);

      const todayMMM = months[current_datetime.getMonth()];
      const todayDD = current_datetime
        .getDate()
        // change here
        .toString()
        .padStart(2, "0");
      const todayYYYY = current_datetime.getFullYear();
      console.log(
        `${todayYYYY}/${todayMMM}/cm${todayDD + todayMMM + todayYYYY}bhav`
      );

      const bhav_details = [
        {
          fileName: `EQ_ISINCODE_${todayDateDdmmyy}.zip`,
          url: `https://www.bseindia.com/download/BhavCopy/Equity/EQ_ISINCODE_${todayDateDdmmyy}.zip`,
          column1Name: "SC_CODE",
          column2Name: "CLOSE",
        },
        {
          fileName: `cm${(todayDD, todayMMM, todayYYYY)}bhav.csv.zip`,
          url: `https://archives.nseindia.com/content/historical/EQUITIES/${todayYYYY}/${todayMMM}/cm${
            todayDD + todayMMM + todayYYYY
          }bhav.csv.zip`,
          column1Name: "SYMBOL",
          column2Name: "CLOSE",
        },
      ];
      // SC_CODE and CLOSE of BSE and NSE
      let bhav_response = [];
      for (item of bhav_details) {
        await downloadExtractAndGetValues(
          item.fileName,
          item.url,
          item.column1Name,
          item.column2Name
        )
          .then(async (valuesArray) => {
            if (valuesArray !== null) {
              if (item.column1Name == "SYMBOL") {
                valuesArray = await valuesArray.map((valuesArray_item) => {
                  valuesArray_item.SC_CODE = valuesArray_item.SYMBOL;
                  delete valuesArray_item.SYMBOL;
                  return valuesArray_item;
                });
              }
            } else {
              console.log("Error occurred or no values found.");
            }
            bhav_response = [...bhav_response, ...valuesArray];
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }

      // "scrip_code", "id", "company_id", "exchange" stored in db
      let local_scrip_objs_arr = await ListingDetail.findAll({
        where: {
          listed_status: "equity",
          is_active: true,
        },
        raw: true,
        attributes: [
          "scrip_code",
          ["id", "listing_detail_id"],
          "company_id",
          "exchange",
        ],
      });

      // past prices with scrip code
      let past_prices_for_percentage = await DB_CLIENT.query(
        `SELECT ld.exchange,ld.scrip_code,c.id,rcmr.nse_close_price,rcmr.bse_close_price
  from companies c INNER JOIN rating_committee_meeting_registers rcmr
  ON c.id = rcmr.company_id
  INNER JOIN rating_committee_meetings rcm 
  ON rcmr.rating_committee_meeting_id =rcm.id
  and rcm.meeting_at=(select max(meeting_at) 
  from rating_committee_meetings rcm2 
  inner join rating_committee_meeting_registers rcmr2 
  on rcmr2.rating_committee_meeting_id =rcm2.id
  where rcmr2.company_id =c.id)
  left join listing_details ld on ld.company_id =c.id
  group by c.id,rcmr.nse_close_price,rcmr.bse_close_price,ld.scrip_code,ld.exchange`,
        {
          type: QueryTypes.SELECT,
        }
      );

      let joined_local_bhav_obj = {};

      for (item of local_scrip_objs_arr) {
        joined_local_bhav_obj[item.scrip_code] = item;
        joined_local_bhav_obj[item.scrip_code].created_at = new Date();
        joined_local_bhav_obj[item.scrip_code].updated_at = new Date();
        joined_local_bhav_obj[item.scrip_code].uuid = uuidv4();
      }

      for (item of bhav_response) {
        if (Object.keys(joined_local_bhav_obj).includes(item.SC_CODE)) {
          joined_local_bhav_obj[item.SC_CODE].share_price_today = parseFloat(
            item.CLOSE
          );
        }
      }
      console.log(past_prices_for_percentage);
      for (item of past_prices_for_percentage) {
        if (
          Object.keys(joined_local_bhav_obj).includes(item.scrip_code) &&
          item.exchange
        ) {
          let previous_price = 0.0;
          previous_price =
            item.exchange == "NSE"
              ? parseFloat(item.nse_close_price)
              : item.exchange == "BSE"
              ? parseFloat(item.bse_close_price)
              : null;
          console.log("previous_price->", previous_price);
          if (
            joined_local_bhav_obj[item.scrip_code].share_price_today &&
            previous_price
          ) {
            let today_price = 0.0;
            today_price = parseFloat(
              joined_local_bhav_obj[item.scrip_code].share_price_today
            );
            console.log("today_price =>", today_price);
            let percentange_change = 0.0;
            percentange_change = parseFloat(
              ((today_price - previous_price) / previous_price).toFixed(2)
            );
            console.log("percentange_change=>", percentange_change);

            joined_local_bhav_obj[
              item.scrip_code
            ].percentage_change_from_last_review = percentange_change;
            joined_local_bhav_obj[item.scrip_code].previous_price =
              previous_price;

            if (percentange_change <= -0.2) {
              const found_material_event = await MaterialEventTracking.findOne({
                where: {
                  company_id: joined_local_bhav_obj[item.scrip_code].company_id,
                  reason: "Decline in share prices",
                },
              });
              if (!found_material_event) {
                const createMaterialEventData =
                  await MaterialEventTracking.create({
                    uuid: uuidv4(),
                    company_id:
                      joined_local_bhav_obj[item.scrip_code].company_id,
                    material_event_date: new Date(),
                    reason: "Decline in share prices",
                    created_at: new Date(),
                  });

                console.log("Material event created", createMaterialEventData);
              } else {
                console.log("Material event already exists");
              }
            }
          }
        }
      }

      let joined_local_bhav_arr = Object.values(joined_local_bhav_obj);
      console.log(joined_local_bhav_arr, "joined_local_bhav_arr");
      try {
        const created = await LatestShareClosePrice.bulkCreate(
          joined_local_bhav_arr
        );
        console.log(created);
      } catch (e) {
        console.log(e);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
  CompanySharePriceTrack.start();

  const WorkflowEmailAlertsTrack = cron.schedule(
    "0 0 * * 1-5",
    // "* * * * *",
    async function handler(){
    await send_workflow_email_handler();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
   
  );
  WorkflowEmailAlertsTrack.start();

  const FreezeCommitteeMeeting = cron.schedule(
    "0 0 * * 1-5",
    // "* * * * *",
    async function handler(){
      await DB_CLIENT.query(
        `exec FreezeCommitteeMeetings`,
        {
          type: QueryTypes.SELECT,
        }
      );
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
   
  );
  FreezeCommitteeMeeting.start();
};
