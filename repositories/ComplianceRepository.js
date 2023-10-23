const { QueryTypes, Op } = require("sequelize");
const { DB_CLIENT } = require("../db");
const {
  DelayPeriodicReview,
  ComplianceSurveillancePendingStatus,
  ComplianceInitialPendingStatus,
  QuarterlyReviewProcess,
  DebentureInterestPayment,
} = require("../models/modules/compliance");
const { Mandate, Company } = require("../models/modules/onboarding");

async function GET_COMPLIANCE_DOC_DATA(query) {
  switch (query.file) {
    case "delayPeriodicReview":
      return {
        data: await getDelayPeriodicReviewData(query.type),
        columns: [
          "S. No.",
          "Name of the Issuer",
          "Name/Type of Instrument",
          "Size of the issue(Rs. in Crores)",
          "Date of last review/Rating",
          "Reason for delay in periodic review",
        ],
      };
    case "surveillancePending":
      return {
        data: await getSurveillancePending(query.type),
        columns: [
          "Company",
          "Anniversary Date",
          "Expected Date",
          "Revised Expected Date",
          "Status",
          "Remarks",
        ],
      };
    case "initialPending":
      return {
        data: await getInitialPendingData(),
        columns: [
          "Company",
          "Mandate ID",
          "Mandate Received",
          "Category",
          "Size (in Cr.)",
          "Pending Days",
          "Expcted Date of Completion",
          "Status",
          "Remarks",
        ],
      };
    case "quarterlyReviewProcess":
      return {
        data: await getQuarterlyReviewProcessData(),
        columns: [
          "Company",
          "Committee Meeting Date",
          "Other Rating Agency Name",
          "Other Rating Agency Mandate Type",
          "Other Rating Agency Instrument Category",
          "Other Rating Agency Instrument Sub Category",
          "Other Rating Agency Instrument Name",
          "Other Rating Agency Outlook/Rating",
          "Quarterly Review Period",
          "Total number of NDS reveived",
          "Banker Feedback Received",
          "Quarterly Result Received",
          "Review Required",
          "Quarterly Review Process",
          "Status",
        ],
      };
    case "materialEventTracking":
      return {
        data: await getMaterialEventTrackingData(),
        columns: [
          "Company",
          "Mandate ID",
          "Investment/Non Investment Grade",
          "Press Release Date",
          "Rating Assigned",
          "Status",
          "Reason",
        ],
      };
    case "debentureTrusteeInterestPayment":
      return {
        data: await getDebentureTrusteeInterestPayment(),
        columns: [
          "Issuer Name",
          "ISIN Number",
          "Analyst Name",
          "Group Head Name",
          "Frequency of Interest",
          "NCD Rated Amount",
          "Interest Repayment Terms",
          "Interest Repayment Date",
          "Interest Paid On",
          "Principal Repayment Date",
          "Principal Paid On",
        ],
      };
    case "monthlyNDS":
      return {
        data: await getMonthlyNDSDATA(),
        columns: [
          "Client Name",
          "Company Name",
          "Instrument Name",
          "Rating Analyst",
          "Group Head",
          "Buisness Developer",
          "Rating Date",
          "Rating Assigned",
          "NDS Status",
          "Rating Status",
        ],
      };
    default:
      return;
  }
}

async function getDelayPeriodicReviewData(query) {
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

async function getSurveillancePending(query) {
  return new Promise(async (resolve, reject) => {
    const company_anniversary_data = await DB_CLIENT.query(
      `select c.uuid as company_uuid,c.name as company,DATEADD(year,1,rcm.meeting_at) as anniversary_date from companies c inner join mandates m on m.company_id =c.id
inner join transaction_instruments ti on ti.mandate_id =m.id inner join instrument_details id on id.transaction_instrument_id=ti.id and id.rating_process_id NOT in (2)
inner join rating_committee_meeting_registers rcmr2 on rcmr2.transaction_instrument_id =ti.id left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where ti.id not in(select ti.id from transaction_instruments ti inner join instrument_details id on id.transaction_instrument_id =ti.id and id.rating_process_id in (5,17,2)
inner join financial_years fy on fy.id =id.financial_year_id and fy.id =15 inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id =id.id )AND id.id is null
  `,
      {
        type: QueryTypes.SELECT,
      }
    );

    if (!company_anniversary_data) {
      reject({
        success: false,
        error: "No Surveillance Pending Data Found!",
      });
      return;
    }

    const user_input = await ComplianceSurveillancePendingStatus.findAll({
      raw: true,
    });
    let merged_user_input_and_anniversary = company_anniversary_data.map(
      (val1) => {
        let input_obj = user_input.find(
          (val2) => val2.uuid == val1.company_uuid
        );
        if (!input_obj) {
          val1 = {
            ...val1,
            remarks: "",
            status: "Pending",
            expected_date: "",
            revised_expected_date: "",
          };
        } else {
          val1 = { ...val1, ...input_obj };
          delete val1.uuid;
        }

        return val1;
      }
    );

    const docs_data = [];
    const company_names = [];
    // if (query !== "csv") {
    //   merged_user_input_and_anniversary.forEach((instrument) => {
    //     const company_name = instrument["company"];
    //     if (company_names.includes(company_name)) {
    //       docs_data.forEach((data) => {
    //         if (data.company_name == instrument.company) {
    //           if (!data.reason_for_delay) {
    //             data.reason_for_delay = instrument["remarks"];
    //           }
    //           data["instruments"].push({
    //             type: instrument["instrument_text"],
    //             size: instrument["instrument_size_number"],
    //           });
    //         }
    //       });
    //     } else {
    //       company_names.push(company_name);
    //       docs_data.push({
    //         company_name: instrument["company"],
    //         reason_for_delay: instrument["remarks"],
    //         last_review_date: instrument["committee_meeting_date"],
    //         instruments: [
    //           {
    //             type: instrument["instrument_text"],
    //             size: instrument["instrument_size_number"],
    //           },
    //         ],
    //       });
    //     }
    //   });
    // } else {
    docs_data.push(...merged_user_input_and_anniversary);
    // }
    resolve(docs_data);
  });
}

async function getInitialPendingData(query) {
  return new Promise(async (resolve, reject) => {
    const Mandates = await Mandate.findAll({
      where: {
        is_active: true,
        is_verified: true,
      },
      attributes: [
        "id",
        "uuid",
        "mandate_id",
        "received_date",
        "mandate_type",
        "total_size",
        "company_id",
      ],
      include: [
        {
          model: Company,
          as: "company_mandate",
          attributes: ["uuid", "name"],
        },
      ],
      raw: true,
    });

    const mandate_ids = Mandates.map((val) => val.uuid);

    const status_track = await ComplianceInitialPendingStatus.findAll({
      where: {
        uuid: {
          [Op.in]: mandate_ids,
        },
        is_active: true,
      },
      attributes: ["uuid", "remarks", "status", "expected_date", "company_id"],
      raw: true,
    });

    const date = new Date();

    function days_between(date1, date2) {
      // The number of milliseconds in one day
      const ONE_DAY = 1000 * 60 * 60 * 24; // Calculate the difference in milliseconds

      const differenceMs = Math.abs(date1 - date2); // Convert back to days and return

      return Math.round(differenceMs / ONE_DAY);
    }
    const replyData = Mandates.map((mandate) => {
      let pendingDays = days_between(mandate.received_date, date);

      let status_obj = status_track.find(
        (status) => status.uuid == mandate.uuid
      );

      if (status_obj !== undefined) {
        (mandate.remarks = status_obj.remarks),
          (mandate.status = status_obj.status ?? "Pending"),
          (mandate.expected_date = status_obj.expected_date);
      } else {
        (mandate.remarks = ""),
          (mandate.status = "Pending"),
          (mandate.expected_date = "");
      }

      mandate.pending_days = pendingDays;

      delete mandate.id;
      return mandate;
    });

    const rep2 = replyData
      .map((rep) => {
        const arr = [];
        if (rep.remarks && rep.company_id) {
          arr.push({
            remarks: rep.remarks,
            company_id: rep.company_id,
          });
        }

        return arr;
      })
      .filter((d) => d !== undefined);

    const reply2 = replyData.map((rep) => {
      const company_obj = rep2[0].find(
        (repl2) => repl2.company_id === rep.company_id
      );
      if (company_obj) {
        rep.remarks = company_obj?.remarks;
      }

      return rep;
    });

    const mandates_initial_pending = await DB_CLIENT.query(
      `
        SELECT c.name as company_name,m.mandate_id,m.uuid,m.received_date,m.total_size,m.mandate_type,DATEDIFF(day,m.received_date,GETDATE()) as pending_days, cips.remarks,
        cips.status,cips.expected_date FROM companies c inner join mandates m on m.company_id =c.id inner join transaction_instruments ti 
        on ti.mandate_id =m.id inner join instrument_details id on id.transaction_instrument_id =ti.id and id.rating_process_id =2 and id.is_active =1
        full join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id =id.id left join compliance_initial_pending_status cips on cips.uuid=m.uuid
        where rcmr.instrument_detail_id is null
      `,
      {
        type: QueryTypes.SELECT,
      }
    );

    const docs_data = [];
    const companies = [];

    docs_data.push(mandates_initial_pending);
    resolve(docs_data);
  });
}

async function getQuarterlyReviewProcessData(query) {
  return new Promise(async (resolve, reject) => {
    const company_meeting_data = await DB_CLIENT.query(
      `select id.id as instrument_detail_id,id.uuid as instrument_detail_uuid,c.name as company_name,id.press_release_date,rcmr.instrument_text as infom_instrument_name
,rcmr.sub_category_text as infom_instrument_subcategory_name,rcmr.category_text as infom_instrument_category_name,
rcm.meeting_at,mc.name as ora_name,mc2.name as ora_mandate_type,ic.category_name as ora_instrument_category,
isc.category_name as ora_instrument_subcategory_name,i.name as ora_instrument_name,rsm.rating_symbol as ora_long_term_rating ,
rsm2.rating_symbol as ora_short_term_rating ,
ora5.outlook as ora_outlook,ora5.amount as ora_instrument_size
from companies c right join mandates m 
on c.id=m.company_id 
right join transaction_instruments ti 
on ti.mandate_id =m.id
right join instrument_details id on 
id.transaction_instrument_id =ti.id
left join rating_committee_meeting_registers rcmr on
rcmr.instrument_detail_id =id.id
left join rating_committee_meetings rcm 
on rcm.id=rcmr.rating_committee_meeting_id
left join other_rating_agencies ora 
on ora.instrument_detail_id = id.id
left join master_commons mc 
on mc.id=ora.credit_rating_agency_id
left join other_rating_agencies ora2 
on mc.id=ora2.credit_rating_agency_id
left join master_commons mc2
on ora2.mandate_type_id =mc2.id
left join other_rating_agencies ora3 
on mc2.id=ora3.mandate_type_id
left join instrument_categories ic 
on ic.id=ora3.instrument_category_id
left join other_rating_agencies ora4 
on ora4.instrument_detail_id =ic.id
left join instrument_sub_categories isc 
on isc.id=ora.instrument_sub_category_id
left join other_rating_agencies ora5 
on ora5.instrument_sub_category_id =isc.id 
left join instruments i 
on i.id=ora5.instrument_id
left join rating_symbol_masters rsm 
on rsm.id=ora5.long_term_rating_id
left join other_rating_agencies ora6 on rsm.id=ora6.long_term_rating_id
left join rating_symbol_masters rsm2 on rsm2.id=ora6.short_term_rating_id
where id.rating_process_id in(2,5) and id.press_release_date is not null and m.is_verified=1

`,
      {
        type: QueryTypes.SELECT,
      }
    );

    const user_input = await QuarterlyReviewProcess.findAll({
      raw: true,
    });

    const docs_data = [];

    let merged_user_input_and_meeting = company_meeting_data.map((val1) => {
      let input_obj = user_input.find(
        (val2) => val2.instrument_detail_id == val1.instrument_detail_id
      );

      if (!input_obj) {
        val1 = {
          ...val1,
          quarterly_review_period: "",
          total_nds_recv: "",
          banker_feedback_recv: "",
          review_required: "",
          quarterly_result_received: "",
          quarterly_review_process: "",
          quarterly_note_file_link: "",
          status: "",
        };
      } else {
        val1.quarterly_review_period = input_obj.quarterly_review_period;
        val1.total_nds_recv = input_obj.total_nds_recv;
        val1.banker_feedback_recv = input_obj.banker_feedback_recv;
        val1.review_required = input_obj.review_required;
        val1.quarterly_result_received = input_obj.quarterly_result_received;
        val1.quarterly_review_process = input_obj.quarterly_review_process;
        val1.quarterly_note_file_link = input_obj.quarterly_note_file_link;
        val1.status = input_obj.status;
        val1.uuid = input_obj.uuid;
      }

      return val1;
    });
    docs_data.push(...merged_user_input_and_meeting);
    resolve(docs_data);
  });
}

async function getMaterialEventTrackingData(query) {
  return new Promise(async (resolve, reject) => {
    const get_data = await DB_CLIENT.query(`
            SELECT DISTINCT  met.status, met.reason, met.uuid, met.material_event_date, met.meeting_date  ,met.is_active, met.closed_by_role,met.closed_at, met.closed_by_name, met.meeting_type, met.meeting_category  ,c.uuid AS company_uuid, c.name, STRING_AGG(rcmr.long_term_rating_assgined_text,',') as rating, id.press_release_date  FROM material_event_trackings met 
            INNER JOIN companies c ON c.id = met.company_id 
            INNER JOIN rating_committee_meeting_registers rcmr ON c.id = rcmr.company_id  
             INNER JOIN mandates m ON m.company_id  = c.id  
             INNER JOIN transaction_instruments ti oN ti.mandate_id  = m.id
            INNER JOIN instrument_details id ON id.transaction_instrument_id  = ti.id  
             INNER JOIN workflow_instances wi ON wi.mandate_id = m.id
              INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id
				INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
              WHERE wc.is_last_activity = 1
              GROUP BY met.status, met.reason, met.uuid ,met.is_active, c.uuid , c.name, id.press_release_date, met.closed_by_role, met.closed_by_name, met.meeting_type, met.meeting_category ,met.material_event_date, met.meeting_date, met.closed_at
          `);
    let get_committee_type;
    let get_committee_category;
    const docs_data = [];
    const send_data = get_data[0].map((data) => {
      data.meeting_type = get_committee_type ? get_committee_type.name : "";
      data.meeting_category = get_committee_category
        ? get_committee_category.name
        : "";
      return data;
    });
    docs_data.push(...send_data);
    resolve(docs_data);
  });
}

async function getDebentureTrusteeInterestPayment(query) {
  return new Promise(async (resolve, reject) => {
    const debenture_list = await DB_CLIENT.query(
      `select id.id as instrument_detail_id, id.uuid as instrument_detail_uuid,
            c.name as issuer_name,bl.isin as isin_number,bl.maturity_date as principal_repayment_date,bl.interest_due_date as interest_due_date,bl.rated_amount as rated_amount,
bl.interest_frequency as interest_frequency ,bl.maturity_date as repayment_date
,bl.repayment_terms as repayment_terms,i.name as instrument_name,
ic.category_name as instrument_category,isc.category_name as instrument_sub_category,
u.full_name as analyst_name,u2.full_name as group_head_name 
from banker_lenders bl right join instrument_details id on bl.instrument_detail_id =id.id and bl.updated_at =
(select max(bl2.updated_at) from banker_lenders bl2
right join instrument_details id2 on bl2.instrument_detail_id =id2.id
where bl2.instrument_detail_id =bl.instrument_detail_id) 
left join transaction_instruments ti on ti.id=id.transaction_instrument_id
left join instruments i on i.id = ti.instrument_id
left join transaction_instruments ti2 on ti.id=ti2.id
left join instrument_categories ic on ic.id = ti2.instrument_category_id
left join transaction_instruments ti3 on ti3.id=ti2.id
left join instrument_sub_categories isc on isc.id=ti3.instrument_sub_category_id
left join transaction_instruments ti4 on ti.id=ti4.id
left join mandates m on m.id=ti.mandate_id 
left join users u on u.id=m.ra_id
left join mandates m2 on m2.id=m.id
left join users u2 on u2.id=m2.gh_id 
left join mandates m3 on m2.id=m3.id
left join companies c on c.id =m.company_id
where bl.is_active =1 and id.press_release_date is not null and m.is_verified =1`,
      {
        type: QueryTypes.SELECT,
      }
    );

    const user_input = await DebentureInterestPayment.findAll({
      raw: true,
    });

    const docs_data = [];
    let merged_user_input_and_debentures = debenture_list.map((val1) => {
      let input_obj = user_input.find(
        (val2) => val2.instrument_detail_id == val1.ins_det_id
      );

      if (!input_obj) {
        val1 = {
          ...val1,
          interest_due_on: "",
          principal_due_on: "",
          interest_paid_on: "",
          principal_paid_on: "",
        };
      } else {
        val1 = { ...val1, ...input_obj };
      }

      return val1;
    });
    docs_data.push(...merged_user_input_and_debentures);
    resolve(docs_data);
  });
}

async function getMonthlyNDSDATA(query) {
  return new Promise(async (resolve, reject) => {
    const get_data = await DB_CLIENT.query(
      `
            SELECT DISTINCT cd.name AS client_name, c.name AS company_name, rcmr.instrument_text, rcmr.uuid AS register_uuid, rcm.meeting_at, rcmr.long_term_rating_assgined_text as rating, mn.rating_status, mn.nds_recieved_month, mn.nds_recieved, mn.nds_recieved_on, mn.is_active, u.full_name AS rating_analyst, u1.full_name AS group_head, u2.full_name AS business_dev FROM contact_details cd 
            INNER JOIN companies c ON c.id = cd.company_id
            INNER JOIN rating_committee_meeting_registers rcmr ON cd.company_id = rcmr.company_id 
            LEFT JOIN monthly_nds mn ON mn.register_id = rcmr.id 
            INNER JOIN rating_committee_meetings rcm ON rcmr.rating_committee_meeting_id = rcm.id 
            INNER JOIN mandates m ON m.company_id = cd.company_id 
            INNER JOIN users u ON u.id = m.ra_id
            INNER JOIN users u1 ON u1.id = m.gh_id 
            INNER JOIN users u2 ON u2.id = m.bd_id
            INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id
            INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id
            WHERE cd.is_primary_contact = 1 AND cd.is_active = 1 AND id.press_release_date IS NOT NULL
          `,
      {
        type: QueryTypes.SELECT,
      }
    );

    const docs_data = [];
    docs_data.push(...get_data);
    resolve(docs_data);
  });
}

module.exports = { GET_COMPLIANCE_DOC_DATA };
