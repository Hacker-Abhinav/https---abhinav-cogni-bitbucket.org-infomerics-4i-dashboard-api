const { v4: uuidv4, validate } = require("uuid");
const moment = require("moment");
const { error_logger } = require("../../loki-push-agent");
const { LOG_TO_DB } = require("../../logger");
const { Sequelize, QueryTypes } = require("sequelize");
const { stringify } = require("csv-stringify");
const https = require("https");
const fs = require("fs");
const download = require("download");
const decompress = require("decompress");
const csv_parser = require("csv-parse");

const {
  User,
  UserAttribute,
  Company,
  Mandate,
  ContactDetail,
} = require("../../models/modules/onboarding");
const { DB_CLIENT } = require("../../db");

const {
  CHECK_PERMISSIONS,
  APPEND_USER_DATA,
  UPLOAD_TO_AZURE_STORAGE,
  GENERATE_SIX_DIGIT_OTP,
  AES_DECRYPT_DATA,
} = require("../../helpers");
const {
  ComplianceInitialPendingStatus,
  ComplianceSurveillancePendingStatus,
  QuarterlyReviewProcess,
  DelayPeriodicReview,
  MaterialEventTracking,
  MonthlyNDS,
  DebentureInterestPayment,
  NdsQuestions,
  NdsFormResponses,
  NDSDebtPaymentDefault,
  NDSBankPaymentDefault,
  SentMails,
} = require("../../models/modules/compliance");
const {
  RatingCommitteeMeetingRegister,
  RatingCommitteeMeeting,
  RatingCommitteeMeetingCategory,
  RatingCommitteeType,
  MeetingHasMember,
} = require("../../models/modules/rating-committee");
const {
  InitialPendingStatusEditSchema,
  SurveillancePendingStatusEditSchema,
} = require("../../schemas/Compliance");
const {
  GET_COMPLIANCE_DELAY_PERIODIC_REVIEW_DATA,
} = require("../../repositories/DelayInPeriodicReviewData");
const { default: puppeteer } = require("puppeteer");
const { readFileSync, createWriteStream } = require("fs");
const {
  Instrument,
  RatingProcess,
} = require("../../models/modules/rating-model");
const { InstrumentDetail } = require("../../models/modules/rating-model");
const {
  GET_COMPLIANCE_DOC_DATA,
} = require("../../repositories/ComplianceRepository");
const JSZip = require("jszip");
const { SEND_EMAIL } = require("../../services/send-otp");
const {
  WorkflowInstance,
  WorkflowInstanceLog,
} = require("../../models/modules/workflow");
const { default: axios } = require("axios");
const {
  DueDiligence,
  DiligenceData,
  InteractionType,
} = require("../../models/modules/interaction");
const { SEND_GENERAL_EMAIL } = require("../../services/send-email");
const { EMAIL_TEMPLATE } = require("../../constants/constant");
const { start_workflow } = require("../../services/workflow-activities-bl");
const Op = Sequelize.Op;
async function STORE_MAIL_IN_DB(email_obj) {
  try {
    let created_data = await SentMails.create({
      ...email_obj,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log("Mail stored in DB");
  } catch (err) {
    console.log(err);
  }
}
function getPrevMonthName(month) {
  const date = new Date(2000, month - 1, 1); // Creating a date with the given month value
  const monthName = new Intl.DateTimeFormat("en", {
    month: "long",
  }).format(date);
  return monthName;
}

async function compliance_routes(fastify) {
  fastify.register((instance, opts, done) => {
    fastify.addHook("onRequest", async (request, reply) => {
      if (false && !request.user.is_super_account) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_ACCESS_TO_MODULE"],
        });
      }
    });

    fastify.post(
      "/compliance/initial_pending",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "ComplianceInitialPending.List");

          const mandates_initial_pending = await DB_CLIENT.query(
            `SELECT c.name as company_name,m.mandate_id,m.uuid,m.received_date,m.total_size,m.mandate_type,DATEDIFF(day,m.received_date,GETDATE()) as pending_days, cips.remarks,
cips.status,cips.expected_date,u.full_name AS gh_name,u2.full_name AS ra_name FROM companies c inner join mandates m on m.company_id =c.id inner join transaction_instruments ti 
on ti.mandate_id =m.id inner join instrument_details id on id.transaction_instrument_id =ti.id and id.rating_process_id =2 and id.is_active =1
full join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id =id.id left join compliance_initial_pending_status cips on cips.uuid=m.uuid
INNER JOIN users u ON u.id = m.gh_id 
INNER JOIN users u2 ON u2.id = m.ra_id 
where rcmr.instrument_detail_id is null`,
            {
              type: QueryTypes.SELECT,
            }
          );
          // const date = new Date();

          // function days_between(date1, date2) {
          //   // The number of milliseconds in one day
          //   const ONE_DAY = 1000 * 60 * 60 * 24; // Calculate the difference in milliseconds

          //   const differenceMs = Math.abs(date1 - date2); // Convert back to days and return

          //   return Math.round(differenceMs / ONE_DAY);
          // }
          // const replyData = Mandates.map((mandate) => {
          //   let pendingDays = days_between(mandate.received_date, date);
          //   let status_obj;

          //   status_obj = status_track.find(
          //     (status) => status.uuid == mandate.uuid
          //   );

          //   if (status_obj !== undefined) {
          //     (mandate.dataValues.remarks = status_obj.remarks),
          //       (mandate.dataValues.status = status_obj.status ?? "Pending"),
          //       (mandate.dataValues.expected_date = status_obj.expected_date);
          //   } else {
          //     (mandate.dataValues.remarks = ""),
          //       (mandate.dataValues.status = "Pending"),
          //       (mandate.dataValues.expected_date = "");
          //   }

          //   mandate.dataValues.pending_days = pendingDays;
          //   // mandate.dataValues.mandate_uuid = mandate.uuid;
          //   mandate.created_at = Date.now();
          //   mandate.updated_at = Date.now();
          //   mandate.created_by = request.user.id;
          //   mandate.updated_by = request.user.id;
          //   mandate.is_active = true;
          //   delete mandate.id;
          //   return mandate;
          // });

          // const rep2 = replyData
          //   .map((rep) => {
          //     const arr = [];
          //     if (rep.dataValues.remarks && rep.company_id) {
          //       arr.push({
          //         remarks: rep.dataValues.remarks,
          //         company_id: rep.company_id,
          //       });
          //     }
          //     return arr;
          //   })
          //   .filter((d) => d !== undefined);

          // const reply2 = replyData.map((rep) => {
          //   const company_obj = rep2[0].find(
          //     (repl2) => repl2.company_id === rep.company_id
          //   );
          //   if (company_obj) {
          //     rep.dataValues.remarks = company_obj?.remarks;
          //   }
          //   return rep;
          // });

          reply.send({
            success: true,
            data: mandates_initial_pending,
          });
        } catch (error) {
          console.log(error);
          let error_log = {
            api: "v1/compliance/initial_pending",
            activity: "COMPLIANCE_INITIAL_PENDING",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/initial_pending/edit",
      { schema: InitialPendingStatusEditSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "ComplianceInitialPending.Edit");
          const { params } = request.body;

          const mandate = await Mandate.findOne({
            where: {
              uuid: params.uuid,
              is_active: true,
            },
            attributes: [
              "uuid",
              "mandate_id",
              "received_date",
              "mandate_type",
              "total_size",
            ],
            include: [
              {
                model: Company,
                as: "company_mandate",
                attributes: ["uuid", "name"],
              },
            ],
          });

          const createComplianceData =
            await ComplianceInitialPendingStatus.findOne({
              where: {
                uuid: params.uuid,
                is_active: true,
              },
            });

          if (!createComplianceData) {
            const createData = await ComplianceInitialPendingStatus.create({
              uuid: params.uuid,
              remarks: params.remarks,
              status: params.status,
              expected_date: params.expected_date,
              company_id: params.company_id,
              created_at: Date.now(),
              updated_at: Date.now(),
              created_by: request.user.id,
              updated_by: request.user.id,
              is_active: true,
            });
            reply.send({
              success: true,
              data: createData,
            });
          } else {
            const updateData = await ComplianceInitialPendingStatus.update(
              APPEND_USER_DATA(request, {
                remarks: params?.remarks,
                status: params?.status,
                expected_date: params?.expected_date,
                company_id: params.company_id,
                created_at: Date.now(),
                updated_at: Date.now(),
                created_by: request.user.id,
                updated_by: request.user.id,
                is_active: true,
              }),
              {
                where: {
                  uuid: params.uuid,
                },
              }
            );
            reply.send({
              success: true,
              data: updateData,
            });
          }
        } catch (error) {
          let error_log = {
            api: "v1/compliance/initial_pending/edit",
            activity: "COMPLIANCE_INITIAL_PENDING_EDIT",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/surveillance_pending",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(
            request,
            "ComplianceSurveillancePending.List"
          );
          const company_anniversary_data = await DB_CLIENT.query(
            // `SELECT c.uuid as company_uuid,c.name as company,DATEADD(year,1,rcm.meeting_at) as anniversary_date from companies c
            //   INNER JOIN rating_committee_meeting_registers rcmr
            //   ON c.id = rcmr.company_id
            //   INNER JOIN rating_committee_meetings rcm
            //   ON rcmr.rating_committee_meeting_id =rcm.id
            //   and rcm.meeting_at=(select max(meeting_at)
            //   from rating_committee_meetings rcm2
            //   inner join rating_committee_meeting_registers rcmr2
            //   on rcmr2.rating_committee_meeting_id =rcm2.id
            //   where rcmr2.company_id =c.id)
            //   GROUP BY c.name,c.uuid,rcm.meeting_at;`,
            //             `
            // select c.uuid as company_uuid,c.name as company,DATEADD(year,1,rcm.meeting_at) as anniversary_date from companies c inner join mandates m on m.company_id =c.id
            // inner join transaction_instruments ti on ti.mandate_id =m.id inner join instrument_details id on id.transaction_instrument_id=ti.id and id.rating_process_id NOT in (2)
            // inner join rating_committee_meeting_registers rcmr2 on rcmr2.transaction_instrument_id =ti.id left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id
            // where ti.id not in(select ti.id from transaction_instruments ti inner join instrument_details id on id.transaction_instrument_id =ti.id and id.rating_process_id in (5,17,2)
            // inner join financial_years fy on fy.id =id.financial_year_id and fy.id =15 inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id =id.id )AND id.id is null

            //    `

            `select c.uuid as company_uuid,c.name as company,
DATEADD(year,1,rcm2.meeting_at) as anniversary_date,
m.mandate_id as mandate_id
from companies c 
inner join mandates m on m.company_id =c.id 
inner join transaction_instruments ti on ti.mandate_id =m.id 
left join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2) and id.is_workflow_done=1
left join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc
)
inner join rating_committee_meetings rcm2 on rcm2.id=rcmr.rating_committee_meeting_id
where rcmr.long_term_rating_assgined_text not like '%Withdrawn%' 
group by c.uuid,c.name,rcm2.meeting_at,m.mandate_id;`,
            {
              type: QueryTypes.SELECT,
            }
          );

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
                input_obj.status = input_obj.status
                  ? input_obj.status
                  : "Pending";
                val1 = { ...val1, ...input_obj };
                delete val1.uuid;
              }

              return val1;
            }
          );
          let i = 0;
          let final_merged_user_input_and_anniversary = [];
          for (item of merged_user_input_and_anniversary) {
            if (item.revised_expected_date?.length > 0) {
              let revised_expected_arr = JSON.parse(item.revised_expected_date);
              let latest_reduced = await revised_expected_arr.reduce(
                (prev, curr) =>
                  new Date(prev.created_at) > new Date(curr.created_at)
                    ? prev
                    : curr
              );

              item.revised_expected_date =
                latest_reduced?.revised_expected_date;
              let oldest_reduced = await revised_expected_arr.reduce(
                (prev, curr) =>
                  new Date(prev.created_at) < new Date(curr.created_at)
                    ? prev
                    : curr
              );
              item.expected_date = oldest_reduced?.revised_expected_date;
            }
            final_merged_user_input_and_anniversary.push(item);
          }
          console.log(final_merged_user_input_and_anniversary);
          reply.send({
            success: true,
            data: final_merged_user_input_and_anniversary,
          });
        } catch {
          (err) => {
            reply.send(err);
            console.log(err);
          };
        }
      }
    );

    fastify.post(
      "/compliance/surveillance_pending/edit",
      { schema: SurveillancePendingStatusEditSchema },
      async (request, reply) => {
        try {
          const { params } = request.body;
          await CHECK_PERMISSIONS(
            request,
            "ComplianceSurveillancePending.Edit"
          );

          const createdComplianceData =
            await ComplianceSurveillancePendingStatus.findOne({
              where: {
                uuid: params.company_uuid,
                is_active: true,
              },
              raw: true,
            });

          if (!createdComplianceData) {
            const createData = await ComplianceSurveillancePendingStatus.create(
              {
                uuid: params.company_uuid,
                remarks: params.remarks,
                status: params.status,
                created_at: Date.now(),
                created_by: request.user.id,
                is_active: true,
                revised_expected_date: JSON.stringify([
                  {
                    revised_expected_date: params?.expected_date,
                    created_at: new Date(),
                  },
                ]),
              }
            );
            reply.send({
              success: true,
              data: createData,
            });
          } else {
            let rrevised_expected_date = "";

            if (createdComplianceData?.revised_expected_date?.length > 0) {
              console.log(createdComplianceData?.revised_expected_date);
              let prev_data = JSON.parse(
                createdComplianceData?.revised_expected_date
              );
              let prev_data_array = Array.from(prev_data);
              prev_data_array.push({
                revised_expected_date: params?.expected_date,
                created_at: new Date(),
              });
              rrevised_expected_date = JSON.stringify(prev_data_array);
            } else {
              rrevised_expected_date = JSON.stringify([
                {
                  revised_expected_date: params?.expected_date,
                  created_at: new Date(),
                },
              ]);
            }

            const updateData = await ComplianceSurveillancePendingStatus.update(
              APPEND_USER_DATA(request, {
                remarks: params.remarks,
                status: params.status,
                revised_expected_date: rrevised_expected_date,
                updated_at: Date.now(),
                is_active: params.is_active,
              }),
              {
                where: {
                  uuid: params.company_uuid,
                },
              }
            );
            reply.send({
              success: updateData == 1,
            });
          }
        } catch (error) {
          let error_log = {
            api: "v1/compliance/surveillance_pending/edit",
            activity: "COMPLIANCE_SURVEILLANCE_PENDING_EDIT",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/generate/surveillance_csv",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.SurveillancePendingCSV");
          const { params } = request.body;
          const company_anniversary_data = await DB_CLIENT.query(
            `SELECT c.uuid as company_uuid,c.name as company,DATEADD(year,1,rcm.meeting_at) as anniversary_date from companies c 
              INNER JOIN rating_committee_meeting_registers rcmr
              ON c.id = rcmr.company_id
              INNER JOIN rating_committee_meetings rcm 
              ON rcmr.rating_committee_meeting_id =rcm.id
              and rcm.meeting_at=(select max(meeting_at) 
              from rating_committee_meetings rcm2 
              inner join rating_committee_meeting_registers rcmr2 
              on rcmr2.rating_committee_meeting_id =rcm2.id
              where rcmr2.company_id =c.id)
              GROUP BY c.name,c.uuid,rcm.meeting_at;`,
            {
              type: QueryTypes.SELECT,
            }
          );

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

          const GENERATE_UUID = uuidv4();
          const path = `generated/compliance_surveillance_pending_${GENERATE_UUID}.csv`;

          const writableStream = createWriteStream(path);
          const columns = [
            "Company",
            "Anniversary Date",
            "Expected Date",
            "Revised Expected Date",
            "Status",
            "Remarks",
          ];
          const stringifier = stringify({ header: true, columns: columns });
          merged_user_input_and_anniversary.forEach((d) => {
            stringifier.write([
              d.company,
              d.anniversary_date
                ? moment(d.anniversary_date).format("YYYY/MM/DD")
                : "",
              d.expected_date
                ? moment(d.expected_date).format("YYYY/MM/DD")
                : "",
              d.revised_expected_date
                ? moment(d.revised_expected_date).format("YYYY/MM/DD")
                : "",
              d.status,
              d.remarks,
            ]);
          });

          stringifier.pipe(writableStream);

          const doc_url = await file_rosolver(path);

          reply.send({
            success: true,
            document: doc_url,
          });
        } catch (error) {
          console.log(error);
        }
      }
    );

    fastify.post(
      "/compliance/quarterly_review_process",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "QuarterlyReviewProcess.List");
          const company_meeting_data = await DB_CLIENT.query(
            `select id2.id as instrument_detail_id,rcmr.agenda,id2.uuid as instrument_detail_uuid,c.name as company_name,id2.press_release_date,rcmr.instrument_text as infom_instrument_name
,rcmr.sub_category_text as infom_instrument_subcategory_name,rcmr.category_text as infom_instrument_category_name,
rcm2.meeting_at,mc.name as ora_name,mc2.name as ora_mandate_type,ic.category_name as ora_instrument_category,
isc.category_name as ora_instrument_subcategory_name,i.name as ora_instrument_name,rsm.rating_symbol as ora_long_term_rating ,
rsm2.rating_symbol as ora_short_term_rating ,
ora.outlook as ora_outlook,ora.amount as ora_instrument_size from companies c 
inner join mandates m on m.company_id =c.id 
inner join transaction_instruments ti on ti.mandate_id =m.id 
inner join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2) and id.is_workflow_done=1
inner join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
inner join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc
) inner join rating_committee_meetings rcm2 on rcm2.id=rcmr.rating_committee_meeting_id
inner join instrument_details id2 on id2.transaction_instrument_id=ti.id
left join other_rating_agencies ora 
on ora.instrument_detail_id = id2.id
left join master_commons mc 
on mc.id=ora.credit_rating_agency_id
left join master_commons mc2
on ora.mandate_type_id =mc2.id
left join instrument_categories ic 
on ic.id=ora.instrument_category_id
left join instrument_sub_categories isc 
on isc.id=ora.instrument_sub_category_id
left join instruments i 
on i.id=ora.instrument_id
left join rating_symbol_masters rsm 
on rsm.id=ora.long_term_rating_id
left join rating_symbol_masters rsm2 on rsm2.id=ora.short_term_rating_id
where id2.press_release_date is not null and rcmr.long_term_rating_assgined_text not like '%Withdrawn%' `,
            {
              type: QueryTypes.SELECT,
            }
          );

          const user_input = await QuarterlyReviewProcess.findAll({
            raw: true,
          });

          let merged_user_input_and_meeting = company_meeting_data.map(
            (val1) => {
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
                val1.quarterly_review_period =
                  input_obj.quarterly_review_period;
                val1.total_nds_recv = input_obj.total_nds_recv;
                val1.banker_feedback_recv = input_obj.banker_feedback_recv;
                val1.review_required = input_obj.review_required;
                val1.quarterly_result_received =
                  input_obj.quarterly_result_received;
                val1.quarterly_review_process =
                  input_obj.quarterly_review_process;
                val1.quarterly_note_file_link =
                  input_obj.quarterly_note_file_link;
                val1.status = input_obj.status;
                val1.uuid = input_obj.uuid;
              }

              return val1;
            }
          );
          reply.send({
            success: true,
            data: merged_user_input_and_meeting,
          });
        } catch {
          (err) => {
            reply.send(err);
            console.log(err);
          };
        }
      }
    );

    fastify.post(
      "/compliance/quarterly_review_process/create",

      async (request, reply) => {
        const { params } = request.body;
        try {
          await CHECK_PERMISSIONS(request, "QuarterlyReviewProcess.Edit");

          const instrument_detail = await InstrumentDetail.findOne({
            where: {
              uuid: params["instrument_detail_uuid"],
              is_active: true,
            },
            raw: true,
          });

          if (!instrument_detail) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Instrument not found",
            });
            return;
          }

          let created_data = await QuarterlyReviewProcess.create(
            APPEND_USER_DATA(request, {
              uuid: uuidv4(),
              instrument_detail_id: instrument_detail.id,
              quarterly_review_period: params["quarterly_review_period"],
              quarterly_result_received: params["quarterly_result_received"],
              total_nds_recv: params["total_nds_recv"],
              banker_feedback_recv: params["banker_feedback_recv"],
              review_required: params["review_required"],
              quarterly_review_process: params["quarterly_review_process"],
              status: params["status"],
              is_active: true,
            })
          );

          reply.send({
            success: true,
            data: created_data,
          });
        } catch {
          (err) => {
            reply.send(err);
            console.log(err);
          };
        }
      }
    );

    fastify.post(
      "/compliance/quarterly_review_process/edit",

      async (request, reply) => {
        const { params } = request.body;
        try {
          await CHECK_PERMISSIONS(request, "QuarterlyReviewProcess.Edit");
          if (!params.uuid) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "uuid needed",
            });
            return;
          }

          const instrument_detail = await InstrumentDetail.findOne({
            where: {
              uuid: params["instrument_detail_uuid"],
              is_active: true,
            },
            raw: true,
          });

          if (!instrument_detail) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Instrument not found",
            });
            return;
          }

          let update_data = await QuarterlyReviewProcess.update(
            APPEND_USER_DATA(request, {
              instrument_detail_id: instrument_detail.id,
              quarterly_review_period: params["quarterly_review_period"],
              total_nds_recv: params["total_nds_recv"],
              banker_feedback_recv: params["banker_feedback_recv"],
              review_required: params["review_required"],
              quarterly_result_received: params["quarterly_result_received"],
              quarterly_review_process: params["quarterly_review_process"],
              status: params["status"],
              is_active: params["is_active"],
            }),

            {
              where: { uuid: params["uuid"] },
            }
          );

          let updated_data = await QuarterlyReviewProcess.findOne({
            where: { uuid: params["uuid"] },
          });

          reply.send({
            success: true,
            data: updated_data,
          });
        } catch {
          (err) => {
            reply.send(err);
            console.log(err);
          };
        }
      }
    );

    fastify.post(
      "/compliance/quarterly_review_process/view",

      async (request, reply) => {
        const { params } = request.body;
        try {
          await CHECK_PERMISSIONS(request, "QuarterlyReviewProcess.Edit");

          let found_data = await QuarterlyReviewProcess.findOne({
            where: {
              uuid: params["uuid"],
              is_active: true,
            },
            raw: true,
          });

          if (!found_data) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "data not found",
            });
            return;
          }

          reply.send({
            success: true,
            data: found_data,
          });
        } catch {
          (err) => {
            reply.send(err);
            console.log(err);
          };
        }
      }
    );
    fastify.post(
      "/compliance/quarterly_review_process/assign_documents",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "QuarterlyReviewProcess.Edit");
          let quarterly_note_file_link = "";
          let updated_data = 0;
          let instrument_detail;
          if (request.body["instrument_detail_uuid"].value) {
            instrument_detail = await InstrumentDetail.findOne({
              where: {
                uuid: request.body["instrument_detail_uuid"].value,
                is_active: true,
              },
            });
          }
          if (!instrument_detail) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Instrument not found",
            });
            return;
          }
          let response_data;
          if (request.body.quarterly_note_file) {
            const quarterly_note_file =
              await request.body.quarterly_note_file.toBuffer();
            quarterly_note_file_link = await UPLOAD_TO_AZURE_STORAGE(
              quarterly_note_file,
              { path: request.body.quarterly_note_file.filename }
            );

            let this_uuid = request.body.uuid.value ?? uuidv4();

            updated_data = await QuarterlyReviewProcess.upsert(
              APPEND_USER_DATA(request, {
                quarterly_note_file_link: quarterly_note_file_link,
                uuid: this_uuid,
              })
            );

            response_data = await QuarterlyReviewProcess.findOne({
              where: {
                uuid: this_uuid,
              },
            });
          }

          reply.send({
            success: true,
            data: response_data,
            upsert: updated_data,
          });
        } catch (error) {
          let error_log = {
            api: "/compliance/quarterly_review_process/assign_documents",
            activity: "ASSIGN_DOCUMENT_QUARTERLY_REVIEW_PROCESS",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/delay_periodic_review",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "DelayPeriodicReview.List");
          const { params } = request.body;

          const instrumentData = await DB_CLIENT.query(
            `SELECT rcmr.id,rcmr.instrument_text, rcmr.uuid as meeting_register_uuid,c.name as company,rcmr.instrument_text,rcmr.instrument_size_number,
  id2.press_release_date as committee_meeting_date,DATEDIFF(month,id2.press_release_date,GETDATE()) as pending_months
 from companies c 
inner join mandates m on m.company_id =c.id 
inner join transaction_instruments ti on ti.mandate_id =m.id 
left join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2) and id.is_workflow_done=1
left join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc)
inner join instrument_details id2 on id2.id=rcmr.instrument_detail_id
inner join rating_committee_meetings rcm2 on rcm2.id=rcmr.rating_committee_meeting_id
  where (rcmr.instrument_text='Non Convertible Debenture' and id2.press_release_date is not null and DATEADD(month,11,id2.press_release_date)<CURRENT_TIMESTAMP) 
  or
  (rcmr.instrument_text!='Non Convertible Debenture' and id2.press_release_date is not null and  DATEADD(month,14,id2.press_release_date)<CURRENT_TIMESTAMP)
  and rcmr.long_term_rating_assgined_text not like '%Withdrawn%';`,
            {
              type: QueryTypes.SELECT,
            }
          );

          const userInput = await DelayPeriodicReview.findAll({
            raw: true,
          });

          let merged_user_input_and_instrument = instrumentData.map((val1) => {
            let input_obj = userInput.find(
              (val2) => val2.uuid == val1.meeting_register_uuid
            );

            if (!input_obj) {
              val1 = {
                ...val1,
                email_status: "",
                remarks: "",
                is_active: "",
              };
            } else {
              val1 = { ...val1, ...input_obj };
              delete val1.uuid;
            }

            return val1;
          });

          reply.send({
            success: true,
            data: merged_user_input_and_instrument,
          });
        } catch (error) {
          let error_log = {
            api: "/compliance/delay_periodic_review",
            activity: "COMPLIANCE_DELAY_PERIODIC_REVIEW",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/delay_periodic_review/edit",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "DelayPeriodicReview.Edit");
          const { params } = request.body;
          const delayPeriodicReviewData = await DelayPeriodicReview.findOne({
            where: {
              uuid: params.meeting_register_uuid,
              is_active: true,
            },
          });

          if (!delayPeriodicReviewData) {
            const createData = await DelayPeriodicReview.create({
              uuid: params.meeting_register_uuid,
              email_status: params.email_status,
              remarks: params.remarks,
              created_at: Date.now(),
              updated_at: Date.now(),
              created_by: request.user.id,
              updated_by: request.user.id,
              is_active: true,
            });
            reply.send({
              success: true,
              data: createData,
            });
          } else {
            const updateData = await DelayPeriodicReview.update(
              APPEND_USER_DATA(request, {
                uuid: params.meeting_register_uuid,
                remarks: params?.remarks,
                email_status: params?.email_status,
                updated_at: Date.now(),
                updated_by: request.user.id,
                is_active: params?.is_active,
              }),
              {
                where: {
                  uuid: params.meeting_register_uuid,
                },
              }
            );
            reply.send({
              success: true,
              data: updateData,
            });
          }
        } catch (error) {
          let error_log = {
            api: "/compliance/delay_periodic_review/edit",
            activity: "COMPLIANCE_DELAY_PERIODIC_REVIEW_EDIT",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.MaterialEventTracking");
          const { params } = request.body;

          const get_data = await DB_CLIENT.query(
            `SELECT rcmr.long_term_rating_assgined_text,
 met.status, met.reason, met.uuid, met.material_event_date, met.meeting_date,
 met.is_active, met.closed_by_role,
 met.closed_at, met.closed_by_name,
 met.meeting_type,met.meeting_category,c.uuid AS company_uuid, c.name
 ,
 STRING_AGG(rcmr.long_term_rating_assgined_text,',') as rating 
FROM material_event_trackings met 
INNER JOIN companies c ON c.id = met.company_id 
inner join mandates m on m.company_id =c.id 
inner join transaction_instruments ti on ti.mandate_id =m.id 
left join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2) and id.is_workflow_done=1
left join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc
) 
 INNER JOIN workflow_instances wi ON wi.mandate_id = m.id
 INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id
INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id WHERE wc.is_last_activity = 1 and rcmr.long_term_rating_assgined_text not like '%Withdrawn%'  
GROUP BY met.status, met.reason, met.uuid ,met.is_active, c.uuid , c.name, met.closed_by_role, met.closed_by_name, met.meeting_type,
  met.meeting_category ,met.material_event_date, met.meeting_date, met.closed_at,rcmr.long_term_rating_assgined_text`,
            {
              type: QueryTypes.SELECT,
            }
          );

          let get_committee_type;
          let get_committee_category;
          if (get_data.meeting_type) {
            get_committee_type = await RatingCommitteeType.findOne({
              where: {
                id: get_data.meeting_type,
              },
              raw: true,
            });
          }

          if (get_data.get_committee_category) {
            get_committee_category =
              await RatingCommitteeMeetingCategory.findOne({
                where: {
                  id: get_data.meeting_category,
                },
                raw: true,
              });
          }

          const send_data = get_data.map((data) => {
            // if (data.rating.includes("A")) {
            //   data.ig_nig = "IG";
            // } else {
            //   data.ig_nig = "NIG";
            // }
            data.meeting_type = get_committee_type
              ? get_committee_type.name
              : "";
            data.meeting_category = get_committee_category
              ? get_committee_category.name
              : "";
            return data;
          });

          reply.send({
            status: true,
            data: send_data,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking",
            activity: "MATERIAL_EVENT_TRACKING",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking/create",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(
            request,
            "Compliance.MaterialEventTrackingCreate"
          );
          const { params } = request.body;
          const company_data = await Company.findOne({
            where: {
              uuid: params.company_uuid,
            },
          });

          const createMaterialEventData = await MaterialEventTracking.create({
            uuid: uuidv4(),
            company_id: company_data.id,
            material_event_date: params.material_event_date,
            reason: params.reason,
            created_at: Date.now(),
            created_by: request.user.id,
          });

          reply.send({
            success: true,
            materialEventTracking: createMaterialEventData.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking/create",
            activity: "MATERIAL_EVENT_TRACKING_CREATE",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking/edit",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(
            request,
            "Compliance.MaterialEventTrackingEdit"
          );
          const { params } = request.body;
          const materialEventData = await MaterialEventTracking.findOne({
            where: {
              uuid: params.material_event_uuid,
              // is_active: true,
            },
          });

          if (!materialEventData) {
            reply.statusCode = 422;
            reply.send({
              success: false,
              error: "NO MATERIAL EVENT",
            });
            return;
          }

          let meeting_type;
          if (params?.meeting_type_uuid) {
            meeting_type = await RatingCommitteeType.findOne({
              where: {
                uuid: params.meeting_type_uuid,
              },
              raw: true,
            });
          }

          let meeting_category;
          if (params?.meeting_category_uuid) {
            meeting_category = await RatingCommitteeMeetingCategory.findOne({
              where: {
                uuid: params.meeting_category_uuid,
              },
              raw: true,
            });
          }

          const update_data = await MaterialEventTracking.update(
            APPEND_USER_DATA(request, {
              closed_by_name: params.closed_by_name,
              closed_by_role: params.closed_by_role,
              closed_at: params.closed_at,
              meeting_category: meeting_category ? meeting_category.id : null,
              meeting_type: meeting_type ? meeting_type.id : null,
              meeting_date: params.meeting_date,
              remarks: params.remarks,
              reason: params.reason,
              status: params.status,
              workflow_trigger: params.workflow_trigger,
              is_active: params.is_active,
            }),
            {
              where: {
                uuid: params.material_event_uuid,
              },
            }
          );

          reply.send({
            success: true,
            update_done: update_data,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking/edit",
            activity: "MATERIAL_EVENT_TRACKING_EDIT",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking/document",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(
            request,
            "Compliance.MaterialEventTrackingDocument"
          );

          const materialEvent = await MaterialEventTracking.findOne({
            where: {
              uuid: request.body["material_event_uuid"].value,
              is_active: true,
            },
          });

          if (!materialEvent) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: "NO MATERIAL EVENT DATA FOUND",
            });
            return;
          }

          const user_buffer = await request.body[
            "material_event_doc"
          ].toBuffer();
          const user_document_path = await UPLOAD_TO_AZURE_STORAGE(
            user_buffer,
            {
              path: request.body.material_event_doc.filename,
            }
          );

          const updateMaterialEvent = await MaterialEventTracking.update(
            APPEND_USER_DATA(request, {
              document: user_document_path,
            }),
            {
              where: {
                uuid: request.body["material_event_uuid"].value,
              },
            }
          );

          await LOG_TO_DB(request, {
            activity: "ASSIGN_MATERIAL_EVENT_DOCUMENT",
            params: {
              data: request.query,
            },
          });

          reply.send({
            success: true,
            document_url: user_document_path,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking/document",
            activity: "MATERIAL_EVENT_TRACKING_DOCUMENT_UPLOAD",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking/companies",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(
            request,
            "Compliance.MaterialEventTrackingCompanies"
          );

          const get_companies = await DB_CLIENT.query(
            `
            SELECT c.name, c.uuid FROM companies c 
              INNER JOIN rating_committee_meeting_registers rcmr ON c.id = rcmr.company_id  
              INNER JOIN mandates m ON m.company_id  = c.id 
              INNER JOIN transaction_instruments ti oN ti.mandate_id  = m.id
              INNER JOIN instrument_details id ON id.transaction_instrument_id  = ti.id
              INNER JOIN workflow_instances wi ON wi.mandate_id = m.id
              INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id
				      INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
              WHERE wc.is_last_activity = 1
              GROUP BY c.name, c.uuid 
          `,
            {
              type: QueryTypes.SELECT,
            }
          );
          reply.send({
            status: true,
            data: get_companies,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking/companies",
            activity: "MATERIAL_EVENT_TRACKING_COMPANIES",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking/meetings",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "ComplianceCommitteeMeeting.List");
          const { params } = request.body;

          let mhm = await MeetingHasMember.findAll({
            where: {
              member_id: request.user.id,
              is_active: true,
            },
            attributes: ["rating_committee_meeting_id"],
            raw: true,
          });

          let committee_type = await RatingCommitteeType.findOne({
            where: {
              uuid: params.meeting_type_uuid,
            },
            raw: true,
          });
          let committee_category = await RatingCommitteeMeetingCategory.findOne(
            {
              where: {
                uuid: params.meeting_category_uuid,
              },
              raw: true,
            }
          );
          let committee_company = await Company.findOne({
            where: {
              uuid: params.company_uuid,
            },
            raw: true,
          });

          if (!committee_category || !committee_company || !committee_type) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: "NO DATA FOUND",
            });
            return;
          }
          const getMeeting = await DB_CLIENT.query(
            `SELECT TOP 1 rcm.uuid, rcm.meeting_at  FROM rating_committee_meetings rcm 
             INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.rating_committee_meeting_id = rcm.id 
             WHERE rcm.rating_committee_type_id = ${committee_type.id} AND rcm.rating_committee_meeting_category_id = ${committee_category.id} AND rcmr.company_id = ${committee_company.id} ORDER BY rcmr.created_at DESC
            `,
            {
              type: QueryTypes.SELECT,
            }
          );

          let whereClause = {};
          if (Object.keys(params).includes("category_uuid")) {
            let rcmc = await RatingCommitteeMeetingCategory.findOne({
              where: {
                uuid: params?.category_uuid,
                is_active: true,
              },

              raw: true,
            });
            whereClause = rcmc
              ? Object.assign(whereClause, {
                  rating_committee_meeting_category_id: rcmc.id,
                })
              : whereClause;
          }
          if (Object.keys(params).includes("meeting_type_uuid")) {
            let rct = await RatingCommitteeType.findOne({
              where: {
                uuid: params?.meeting_type_uuid,
                is_active: true,
              },
              raw: true,
            });

            whereClause = rct
              ? Object.assign(whereClause, { rating_committee_type_id: rct.id })
              : whereClause;
          }
          mhm = mhm.map((el) => el.rating_committee_meeting_id);

          whereClause = Object.keys(params).includes("is_active")
            ? Object.assign(whereClause, { is_active: params.is_active })
            : whereClause;

          if (request.active_role_name === "Committee Member") {
            Object.assign(whereClause, { id: mhm });
          }

          let rating_committee_meetings = await RatingCommitteeMeeting.findAll({
            where: whereClause,
            raw: true,
            nest: true,
            include: [
              {
                model: RatingCommitteeType,
                as: "rating_committee_type",
                attributes: { exclude: ["id"] },
              },
              {
                model: RatingCommitteeMeetingCategory,
                as: "rating_committee_meeting_category",
                attributes: { exclude: ["id"] },
              },
            ],
            order: [["meeting_at", "ASC"]],
          });

          rating_committee_meetings.map((el) => {
            const db_date = moment(el.meeting_at).format("YYYY-MM-DD HH:mm:ss");

            let d = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
            d = moment(d).add(5, "hours").format("YYYY-MM-DD HH:mm:ss");
            d = moment(d).add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");

            if (db_date <= d && el.status != "Completed") {
              el.status = "Live";
            }
            return el;
          });

          await LOG_TO_DB(request, {
            activity: "LIST_RATING_COMMITTEE_MEETINGS",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_committee_meetings: getMeeting,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking/meetings",
            activity: "LIST_COMPLIANCE_RATING_COMMITTEE_MEETINGS",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/compliance/material_event_tracking/workflow",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.MaterialEventWorkFlow");
          const { params } = request.body;

          const company = await Company.findOne({
            where: {
              uuid: params["company_uuid"],
            },
          });

          const company_data = await DB_CLIENT.query(
            `
              SELECT  m.id FROM companies c 
              INNER JOIN rating_committee_meeting_registers rcmr ON c.id = rcmr.company_id  
              INNER JOIN mandates m ON m.company_id  = c.id 
              INNER JOIN transaction_instruments ti oN ti.mandate_id  = m.id
              INNER JOIN instrument_details id ON id.transaction_instrument_id  = ti.id
              INNER JOIN workflow_instances wi ON wi.mandate_id = m.id
              INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id
			        INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
              WHERE wc.is_last_activity = 1 AND c.uuid = '${params["company_uuid"]}'
              GROUP BY m.id
              `,
            {
              type: QueryTypes.SELECT,
            }
          );

          if (!company) {
            reply.status_code = 422;
            reply.send({
              success: false,
              error: L["NO_COMPANY"],
            });
            return;
          }

          const mandate_ids = [];
          let mandate_object;
          for (let i = 0; i < company_data?.length; i++) {
            mandate_object = await Mandate.findOne({
              where: {
                id: company_data[i].id,
              },
            });
            mandate_ids.push(mandate_object?.id);
          }

          const check_workflow = await DB_CLIENT.query(
            `
            SELECT id.id FROM companies c 
            INNER JOIN mandates m ON  m.company_id = c.id AND c.id = :company_id AND m.is_verified = 1
            INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id
            INNER JOIN instrument_details id ON  id.transaction_instrument_id  = ti.id
            WHERE id.is_workflow_done = 0 
          `,
            {
              type: QueryTypes.SELECT,
              replacements: {
                company_id: company.id,
              },
            }
          );

          console.log(check_workflow, "check workflow");

          if (check_workflow.length > 0) {
            reply.statusCode = 422;
            reply.send({
              success: false,
              error: "WORKFLOW_ALREADY_PRESENT_FOR_THIS_COMPANY",
            });
            return;
          }

          const rating_process = await RatingProcess.findOne({
            where: {
              name: "Material Event",
              is_active: true,
            },
            raw: true,
          });

          let start_workflow_params;
          for (let i = 0; i < mandate_ids.length; i++) {
            start_workflow_params = {
              rating_process: rating_process.id,
              mandate_id: mandate_ids[i],
              company_id: company.id,
              request: request,
              instance: null,
              flag: 0,
            };
          }

          await start_workflow(start_workflow_params);

          reply.send({
            success: true,
          });
        } catch (error) {
          let error_log = {
            api: "v1/compliance/material_event_tracking/workflow",
            activity: "MATERIAL_EVENT_TRACKING_WORKFLOW",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post("/compliance/monthly_nds", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Compliance.MonthlyNDS.List");

        const get_data = await DB_CLIENT.query(
          `SELECT c.name AS company_name, rcmr.instrument_text,STRING_AGG(cd.name,', ') AS client_name,
rcmr.uuid AS register_uuid, rcm2.meeting_at, 
case when rcmr.long_term_rating_recommendation is not null and rcmr.short_term_rating_recommendation is null then
rcmr.long_term_rating_recommendation+'/'+rcmr.long_term_outlook_recommendation 
when rcmr.long_term_rating_recommendation is null and rcmr.short_term_rating_recommendation is not null then
rcmr.short_term_rating_recommendation
when rcmr.long_term_rating_recommendation is not null and rcmr.short_term_rating_recommendation is not null then
rcmr.long_term_rating_recommendation+'/'+ rcmr.long_term_outlook_recommendation+'&'+ rcmr.short_term_rating_recommendation
end as rating,
mn.rating_status, mn.nds_recieved_month, mn.nds_recieved, mn.nds_recieved_on, mn.is_active,
u.full_name AS rating_analyst, u1.full_name AS group_head,u2.full_name AS business_dev 
FROM contact_details cd 
INNER JOIN companies c ON c.id = cd.company_id
inner join mandates m on m.company_id =c.id 
inner join transaction_instruments ti on ti.mandate_id =m.id 
left join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2) and id.is_workflow_done=1
left join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc
)
inner join rating_committee_meetings rcm2 on rcm2.id=rcmr.rating_committee_meeting_id
inner join instrument_details id2 on rcmr.instrument_detail_id =id2.id
INNER JOIN users u ON u.id = m.ra_id
INNER JOIN users u1 ON u1.id = m.gh_id 
INNER JOIN users u2 ON u2.id = m.bd_id
LEFT JOIN monthly_nds mn ON mn.register_id = rcmr.id
WHERE cd.is_primary_contact = 1 AND cd.is_active = 1 AND id2.press_release_date IS NOT NULL and rcmr.long_term_rating_assgined_text not like '%Withdrawn%'
group by rcmr.uuid,c.name,rcmr.instrument_text,rcm2.meeting_at,
rcmr.long_term_outlook_recommendation,
rcmr.short_term_rating_recommendation,rcmr.long_term_rating_recommendation,
mn.rating_status, mn.nds_recieved_month, mn.nds_recieved, mn.nds_recieved_on, mn.is_active,
u.full_name,u1.full_name,u2.full_name`,
          {
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          status: true,
          data: get_data,
        });
      } catch (error) {
        let error_log = {
          api: "v1/compliance/material_event_tracking",
          activity: "MATERIAL_EVENT_TRACKING",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/compliance/monthly_nds/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Compliance.MonthlyNDS.Edit");
        const { params } = request.body;

        const register_data = await RatingCommitteeMeetingRegister.findOne({
          where: {
            uuid: params.register_uuid,
          },
          raw: true,
        });

        let register = register_data ? register_data.id : "";

        const MonthlyNDS_Data = await MonthlyNDS.findOne({
          where: {
            register_id: register,
          },
        });

        const update_data = await MonthlyNDS.upsert(
          APPEND_USER_DATA(request, {
            uuid: MonthlyNDS_Data ? MonthlyNDS_Data.uuid : uuidv4(),
            nds_recieved: params.nds_recieved,
            nds_recieved_month: params.nds_recieved_month,
            nds_recieved_on: params.nds_recieved_on,
            register_id: register,
            rating_status: params.rating_status,
            is_active: params.is_active,
          })
        );

        reply.send({
          success: true,
        });
      } catch (error) {
        let error_log = {
          api: "v1/compliance/monthly_nds/edit",
          activity: "MONTHLY_NDS_EDIT",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post(
      "/compliance/debenture_interest_payments_track/create",
      async (request, reply) => {
        try {
          const { params } = request.body;

          const instrument_detail = await InstrumentDetail.findOne({
            where: {
              uuid: params["instrument_detail_uuid"],
            },
          });
          if (!instrument_detail) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Instrument not found",
            });
            return;
          }

          const created_debenture_interest_payment =
            await DebentureInterestPayment.create({
              uuid: uuidv4(),
              interest_paid_on: params["interest_paid_on"]
                ? new Date(
                    new Date(params["interest_paid_on"]).getTime() +
                      5.5 * 3600 * 1000
                  )
                : null,
              principal_paid_on: params["principal_paid_on"]
                ? new Date(
                    new Date(params["principal_paid_on"]).getTime() +
                      5.5 * 3600 * 1000
                  )
                : null,
              instrument_detail_id: instrument_detail.id,
              remarks: params["remarks"],
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: request.user.id,
            });

          reply.send({
            success: true,
            data: created_debenture_interest_payment,
          });
        } catch (err) {
          let error_log = {
            api: "v1/compliance/debenture_interest_payments_track/create",
            activity: "DEBENTURE_INTEREST_PAYMENT_TRACKING",
            params: {
              error: String(err),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: err["errors"] ?? String(err),
          });
        }
      }
    );

    fastify.post(
      "/compliance/debenture_interest_payments_track/edit",
      async (request, reply) => {
        try {
          const { params } = request.body;

          const instrument_detail = await InstrumentDetail.findOne({
            where: {
              uuid: params["instrument_detail_uuid"],
            },
          });
          if (!instrument_detail) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Instrument not found",
            });
            return;
          }

          const found_debenture_interest_payment =
            await DebentureInterestPayment.findOne({
              where: {
                uuid: params["uuid"],
              },
            });
          if (!found_debenture_interest_payment) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Debenture interest payment not found",
            });
            return;
          }

          const updated_debenture_interest_payment =
            await found_debenture_interest_payment.update({
              interest_paid_on: params["interest_paid_on"]
                ? new Date(
                    new Date(params["interest_paid_on"]).getTime() +
                      5.5 * 3600 * 1000
                  )
                : null,
              principal_paid_on: params["principal_paid_on"]
                ? new Date(
                    new Date(params["principal_paid_on"]).getTime() +
                      5.5 * 3600 * 1000
                  )
                : null,
              is_active: params["is_active"],
              remarks: params["remarks"],
              instrument_detail_id: instrument_detail.id,
              updated_at: new Date(),
              updated_by: request.user.id,
            });

          reply.send({
            success: updated_debenture_interest_payment,
          });
        } catch (err) {
          let error_log = {
            api: "v1/compliance/debenture_interest_payments_track/edit",
            activity: "DEBENTURE_INTEREST_PAYMENT_TRACKING",
            params: {
              error: String(err),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: err["errors"] ?? String(err),
          });
        }
      }
    );

    fastify.post(
      "/compliance/debenture_interest_payments_track",
      async (request, reply) => {
        try {
          const { params } = request.body;
          await CHECK_PERMISSIONS(request, "DebenturePayments.List");
          const debenture_list = await DB_CLIENT.query(
            `select id2.id as instrument_detail_id,id2.uuid as instrument_detail_uuid,
c.name as issuer_name,bl.isin as isin_number,bl.maturity_date as principal_repayment_date,
bl.interest_due_date as interest_due_date,bl.instrument_size as rated_amount,
bl.interest_frequency as interest_frequency ,bl.maturity_date as repayment_date
,bl.repayment_terms as repayment_terms,i.name as instrument_name,
ic.category_name as instrument_category,isc.category_name as instrument_sub_category,
u.full_name as analyst_name,u2.full_name as group_head_name 
from companies c 
inner join mandates m on m.company_id =c.id 
inner join transaction_instruments ti on ti.mandate_id =m.id 
inner join instrument_details id on id.transaction_instrument_id=ti.id
and id.rating_process_id in (2) and id.is_workflow_done=1
inner join rating_committee_meeting_registers rcmr on ti.id=rcmr.transaction_instrument_id 
and rcmr.rating_committee_meeting_id =(
select top 1 rcm.id from rating_committee_meeting_registers rcmr2
left join rating_committee_meetings rcm on rcm.id=rcmr2.rating_committee_meeting_id 
where rcmr2.transaction_instrument_id =ti.id order by rcm.meeting_at desc)
inner join rating_committee_meetings rcm2 on rcm2.id=rcmr.rating_committee_meeting_id
inner join instrument_details id2 on rcmr.instrument_detail_id =id2.id
left join banker_lenders bl on bl.instrument_detail_id =id2.id and bl.updated_at =
(select max(bl2.updated_at) from banker_lenders bl2 right join instrument_details id3 on bl2.instrument_detail_id =id3.id
where bl2.instrument_detail_id =bl.instrument_detail_id) and bl.is_active =1
left join users u on u.id=m.ra_id
left join users u2 on u2.id=m.gh_id
left join instruments i on i.id = ti.instrument_id
left join instrument_categories ic on ic.id = ti.instrument_category_id
left join instrument_sub_categories isc on isc.id=ti.instrument_sub_category_id
where id2.press_release_date is not null and m.is_verified =1 and i.name='Non Convertible Debenture' and rcmr.long_term_rating_assgined_text not like '%Withdrawn%';`,

            {
              type: QueryTypes.SELECT,
            }
          );

          const user_input = await DebentureInterestPayment.findAll({
            raw: true,
          });

          let merged_user_input_and_debentures = debenture_list.map((val1) => {
            let input_obj = user_input.find(
              (val2) => val2.instrument_detail_id == val1.instrument_detail_id
            );

            if (!input_obj) {
              val1 = {
                ...val1,
                interest_paid_on: "",
                principal_paid_on: "",
              };
            } else {
              val1.interest_paid_on = input_obj.interest_paid_on;
              val1.principal_paid_on = input_obj.principal_paid_on;
              val1.uuid = input_obj.uuid;
            }

            return val1;
          });

          reply.send({
            success: true,
            data: merged_user_input_and_debentures,
          });
        } catch (err) {
          let error_log = {
            api: "v1/compliance/debenture_interest_payments_track",
            activity: "DEBENTURE_INTEREST_PAYMENT_TRACKING",
            params: {
              error: String(err),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: err["errors"] ?? String(err),
          });
        }
      }
    );

    fastify.post(
      "/compliance/debenture_interest_payments_track/view",
      async (request, reply) => {
        try {
          const { params } = request.body;
          const instrument_detail = await InstrumentDetail.findOne({
            where: {
              uuid: params["instrument_detail_uuid"],
              is_active: true,
            },
          });
          if (!instrument_detail) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Instrument not found",
            });
            return;
          }

          const found_debenture_interest_payment =
            await DebentureInterestPayment.findOne({
              where: {
                uuid: params["uuid"],
              },
            });
          if (!found_debenture_interest_payment) {
            reply.statusCode = 400;
            reply.send({
              success: false,
              data: "Debenture interest payment not found",
            });
            return;
          }

          reply.send({
            success: true,
            data: found_debenture_interest_payment,
          });
        } catch (err) {
          let error_log = {
            api: "v1/compliance/debenture_interest_payments_track/view",
            activity: "DEBENTURE_INTEREST_PAYMENT_TRACKING",
            params: {
              error: String(err),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: err["errors"] ?? String(err),
          });
        }
      }
    );

    fastify.post("/compliance/generate/pdf", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Compliance.PDF");
        const { params } = request.body;

        const header = () => {
          return `
        <div style="text-align: center; width: 100%;">
          <p style="text-align: center">
            <strong style="font-size: 12pt; font-family: Cambria, serif;">I</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">NFOMERICS</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">V</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">ALUATION AND</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">R</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">ATING</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">P</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">RIVATE</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">L</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif;">IMITED</strong>
          </p>
      <br>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">Head Office - Flat No. 104/106/108, Golf Apartments, Sujan Singh Park,</span>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">&nbsp;New Delhi-110003,</span>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">Email: </span>
          <a href="mailto:vma@infomerics.com" target="_blank" style="font-size: 8pt; font-family: Cambria, serif; color: rgb(5, 99, 193);">vma@infomerics.com</a>
          <span style="font-size: 8pt; font-family: Cambria, serif;">, Website: </span>
          <span style="font-size: 8pt; font-family: Cambria, serif; color: rgb(5, 99, 193);">www.infomerics.com</span>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">Phone: +91-11 24601142, 24611910, Fax: +91 11 24627549</span>
      </p>
      <p style="text-align: center">
          <strong style="font-size: 8pt; font-family: Cambria, serif;">(CIN: U32202DL1986PTC024575)</strong>
      </p>
      <p>
          <br>
      </p>
      <p>
          <br>
      </p>
      </div>
        `;
        };

        const data = await GET_COMPLIANCE_DOC_DATA(params);

        const GENERATE_UUID = uuidv4();
        const path = `generated/${params.file}_pdf_${GENERATE_UUID}.pdf`;
        const browser = await puppeteer.launch({
          headless: false,
          args: ["--headless"],
        });
        const page = await browser.newPage();
        const html = await fastify.view(`templates/pdf/${params.file}.pug`, {
          data: data.data,
          require: require,
        });

        await page.setContent(html, { waitUntil: "domcontentloaded" });
        await page.emulateMediaType("screen");
        await page.pdf({
          displayHeaderFooter: true,
          headerTemplate: header(),
          path: path,
          margin: {
            top: "160px",
            right: "10px",
            bottom: "100px",
            left: "10px",
          },
          format: "A4",
        });

        await browser.close();
        const pdf = readFileSync(path);
        const document_url = await UPLOAD_TO_AZURE_STORAGE(pdf, {
          path: path,
        });
        reply.send({
          success: true,
          document: document_url,
        });
      } catch (error) {
        let error_log = {
          api: "v1/compliance/generate/pdf",
          activity: "Compliance.PDF",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/compliance/generate/csv", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Compliance.CSV");
        const { params } = request.body;
        const data = await GET_COMPLIANCE_DOC_DATA(params);

        const GENERATE_UUID = uuidv4();
        const path = `generated/${params.file}_${GENERATE_UUID}.csv`;

        const writableStream = createWriteStream(path);

        const stringifier = stringify({ header: true, columns: data.columns });

        switch (params.file) {
          case "delayPeriodicReview":
            data.data.forEach((d, key) => {
              const sno = key + 1;
              stringifier.write([
                sno,
                d.company,
                d.instrument_text,
                d.instrument_size_number,
                moment(d.committee_meeting_date).format("DD/MM/YYYY"),
                d.remarks,
              ]);
            });
            break;
          case "surveillancePending":
            data.data.forEach((d, key) => {
              const sno = key + 1;
              stringifier.write([
                d.company,
                d.anniversary_date
                  ? moment(d.anniversary_date).format("YYYY/MM/DD")
                  : "",
                d.expected_date
                  ? moment(d.expected_date).format("YYYY/MM/DD")
                  : "",
                d.revised_expected_date
                  ? moment(d.revised_expected_date).format("YYYY/MM/DD")
                  : "",
                d.status,
                d.remarks,
              ]);
            });
            break;
          case "initialPending":
            data.data[0].forEach((d, key) => {
              stringifier.write([
                d.company_name,
                d.mandate_id,
                d.received_date
                  ? moment(d.received_date).format("YYYY/MM/DD")
                  : "",
                d.mandate_type,
                d.total_size,
                d?.pending_days ? d.pending_days : "",
                d.expected_date
                  ? moment(d.expected_date).format("YYYY/MM/DD")
                  : "",
                d.status,
                d.remarks,
              ]);
            });
            break;
          case "quarterlyReviewProcess":
            data.data.forEach((d, key) => {
              stringifier.write([
                d.company_name ? d.company_name : "",
                d.meeting_at ? moment(d.meeting_at).format("YYYY/MM/DD") : "",
                d.ora_instrument_name ? d.ora_instrument_name : "",
                d.total_size ? d.total_size : "",
                d.ora_mandate_type ? d.ora_mandate_type : "",
                d.ora_instrument_category ? d.ora_instrument_category : "",
                d.ora_instrument_subcategory_name
                  ? d.ora_instrument_subcategory_name
                  : "",
                d.ora_instrument_name ? d.ora_instrument_name : "",
                d.ora_outlook
                  ? d.ora_outlook
                  : "" + "/" + d.ora_long_term_rating
                  ? d.ora_long_term_rating
                  : "",
                d.quarterly_review_period ? d.quarterly_review_period : "",
                d.total_nds_recv ? d.total_nds_recv : "",
                d.banker_feedback_recv ? "Yes" : "No",
                d.quarterly_result_received ? "Yes" : "No",
                d.review_required ? "Yes" : "No",
                d.quarterly_review_process ? "Yes" : "No",
                d.status ? d.status : "",
              ]);
            });
            break;
          case "materialEventTracking":
            data.data.forEach((d, key) => {
              stringifier.write([
                d.name,
                d.mandate_id,
                d.ig_nig,
                moment(d.press_release_date).format("YYYY/MM/DD"),
                d.rating,
                d.status,
                d.reason,
              ]);
            });
            break;
          case "debentureTrusteeInterestPayment":
            data.data.forEach((d, key) => {
              stringifier.write([
                d.issuer_name,
                d.isin_number,
                d.analyst_name,
                d.group_head_name,
                d.interest_frequency,
                d.rated_amount,
                d.repayment_terms,
                d.interest_due_date
                  ? moment(d.interest_due_date).format("YYYY/MM/DD")
                  : "",
                d.interest_paid_on
                  ? moment(d.interest_paid_on).format("YYYY/MM/DD")
                  : "",
                d.principal_repayment_date
                  ? moment(d.principal_repayment_date).format("YYYY/MM/DD")
                  : "",
                d.principal_paid_on
                  ? moment(d.principal_paid_on).format("YYYY/MM/DD")
                  : "",
              ]);
            });
            break;
          case "monthlyNDS":
            data.data.forEach((d, key) => {
              stringifier.write([
                d.client_name,
                d.company_name,
                d.instrument_text,
                d.rating_analyst,
                d.group_head,
                d.business_dev,
                moment(d.meeting_at).format("YYYY/MM/DD"),
                d.rating,
                d.is_active ? "Active" : "InActive",
                d.rating_status,
              ]);
            });
            break;
          default:
            return;
        }
        stringifier.pipe(writableStream);

        const doc_url = await file_rosolver(path);

        reply.send({
          success: true,
          document: doc_url,
        });
      } catch (error) {
        let error_log = {
          api: "v1/compliance/generate/csv",
          activity: "Compliance.CSV",
          params: {
            error: String(err),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: err["errors"] ?? String(err),
        });
      }
    });

    fastify.post(
      "/compliance/nds_form_responses/generate_otp",
      async (request, reply) => {
        try {
          const { params } = request.body;

          const email_uuid = AES_DECRYPT_DATA(params.email);

          const this_mail = await SentMails.findOne({
            where: { uuid: email_uuid },
            raw: true,
          });

          if (
            new Date(this_mail?.created_at).getTime() + 48 * 60 * 60 * 1000 <
            new Date()
          ) {
            reply.statusCode = 200;
            reply.send({
              success: false,
              message: "Link was valid for 48 hours only and is expired",
            });
            return;
          }
          // Get the current date
          const currentDate = new Date();

          // Get the first date of the current month
          const firstDateOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
            currentDate.getHours() + 5,
            currentDate.getMinutes() + 30
          );

          // Get the last date of the current month
          const lastDateOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0,
            currentDate.getHours() + 5,
            currentDate.getMinutes() + 30
          );

          const this_contact = await ContactDetail.findOne({
            where: { email: this_mail.recipient },
          });

          const this_contact_nds_response = await NdsFormResponses.findOne({
            where: {
              company_id: this_contact.company_id,
              created_at: {
                [Op.between]: [firstDateOfMonth, lastDateOfMonth],
              },
            },
          });

          console.log(
            this_contact.company_id,
            this_contact_nds_response,
            lastDateOfMonth,
            firstDateOfMonth
          );
          if (this_contact_nds_response) {
            reply.statusCode = 422;
            reply.send({
              success: false,
              error: "You have already filled NDS form for previous month",
            });
            return;
          }

          const OTP = GENERATE_SIX_DIGIT_OTP();
          const email_recipient = this_mail.recipient;
          const email_subject = "Monthy NDS submission OTP";
          const email_body = "<p>OTP is {{otp}}<p>";
          const body_replacements = {
            otp: OTP,
          };

          const email_obj = await SEND_EMAIL(
            email_recipient,
            email_subject,
            email_body,
            body_replacements
          );

          await SentMails.update(
            { otp: OTP },
            {
              where: {
                uuid: email_uuid,
              },
            }
          );

          await STORE_MAIL_IN_DB(email_obj);
          reply.statusCode = 200;
          reply.send({
            success: true,
            message: "OTP sent on registered email address",
          });
        } catch (err) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: "Unable to send OTP",
          });
          console.log(err);
        }
      }
    );

    fastify.post(
      "/compliance/nds_form_responses/create",
      async (request, reply) => {
        const { params } = request.body;
        try {
          // decrypt email
          const email_uuid = AES_DECRYPT_DATA(request.body.email);
          // find in SentMails table
          const this_mail = await SentMails.findOne({
            where: { uuid: email_uuid },
            raw: true,
          });
          // find contact in ContactDetail table
          const this_contact = await ContactDetail.findOne({
            where: {
              email: this_mail.recipient,
            },
            raw: true,
          });
          // Company_ID for this response
          const this_company_id = this_contact?.company_id;

          // OTP verification
          if (this_mail.otp == request.body.otp) {
            // payload's ques uuids
            const nds_ques_uuids_arr = params.map((val) => val.ques_uuid);

            // ques rows in NdsQuestions table
            const nds_ques_arr = await NdsQuestions.findAll({
              where: {
                uuid: {
                  [Op.in]: nds_ques_uuids_arr,
                },
              },
              raw: true,
            });
            // iterating over payload
            for (val1 of params) {
              const this_nds_ques = nds_ques_arr.find(
                (val2) => val2.uuid == val1.ques_uuid
              );
              if (
                this_nds_ques.ques_num == 9 &&
                val1.response == true &&
                val1.data.length > 0
              ) {
                // add data to NdsFormResponses

                let oneRowObj = {
                  uuid: uuidv4(),
                  nds_question_id: this_nds_ques.id,
                  ques_response: val1.response,
                  is_active: true,
                  company_id: this_company_id,
                  sent_mail_id: this_mail.id,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                };

                const ques_9_response = await NdsFormResponses.create(
                  oneRowObj
                );

                // add data to NDSBankPaymentDefault
                let bulkCreateQues9Arr = [];
                for (item of val1.data) {
                  let oneRow = {
                    uuid: uuidv4(),
                    nds_form_responses_id: ques_9_response.id,
                    name_of_lender: item["name_of_lender"],
                    nature_of_obligation: item["nature_of_obl"],
                    date_of_default: item["date_of_def"],
                    current_default_amount: item["curr_def_amt"],
                    amount_to_be_paid: item["amt_to_be_paid"],
                    date_of_payment: item["actual_date"],
                    remarks: item["remarks"],
                    is_active: true,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                  };
                  bulkCreateQues9Arr.push(oneRow);
                }

                await NDSBankPaymentDefault.create(bulkCreateQues9Arr[0]);
                // await NDSBankPaymentDefault.bulkCreate(bulkCreateQues9Arr);
              } else if (
                this_nds_ques.ques_num == 10 &&
                val1.response == true &&
                val1.data.length > 0
              ) {
                // add data to NdsFormResponses

                let oneRowObj = {
                  uuid: uuidv4(),
                  nds_question_id: this_nds_ques.id,
                  ques_response: val1.response,
                  is_active: true,
                  company_id: this_company_id,
                  sent_mail_id: this_mail.id,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                };
                const ques_10_response = await NdsFormResponses.create(
                  oneRowObj
                );

                // add data to NDSDebtPaymentDefault
                let bulkCreateQues10Arr = [];
                for (item of val1.data) {
                  let oneRow = {
                    uuid: uuidv4(),
                    name_of_instrument: item["name_of_instrument"],
                    isin: item["isis_no"],
                    amount_to_be_paid: item["amt_to_be_paid"],
                    due_date_of_payment: item["due_date"],
                    date_of_payment: item["actual_date"],
                    remarks: item["remarks"],
                    is_active: true,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    nds_form_responses_id: ques_10_response.id,
                  };
                  bulkCreateQues10Arr.push(oneRow);
                }
                await NDSDebtPaymentDefault.create(bulkCreateQues10Arr[0]);
                // await NDSDebtPaymentDefault.bulkCreate(bulkCreateQues10Arr);
              } else {
                // add data to NdsFormResponses
                let oneRowObj = {
                  uuid: uuidv4(),
                  nds_question_id: this_nds_ques.id,
                  ques_response: val1.response,
                  is_active: true,
                  company_id: this_company_id,
                  sent_mail_id: this_mail.id,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                };

                await NdsFormResponses.create(oneRowObj);
              }
            }

            // Update data in monthly NDS table--------------------------------

            // find rcm register_ids in monthy_nds for this email
            const query = `select rcmr.id 
                            as register_id from instrument_details id 
                            left join rating_committee_meeting_registers rcmr on
                            rcmr.instrument_detail_id =id.id 
                            left join rating_committee_meetings rcm 
                            on rcm.id=rcmr.rating_committee_meeting_id 
                            left join transaction_instruments ti on id.transaction_instrument_id =ti.id
                            left join mandates m on m.id=ti.mandate_id and m.is_verified =1
                            left JOIN users u ON u.id = m.ra_id
                            left JOIN users u1 ON u1.id = m.gh_id 
                            left JOIN users u2 ON u2.id = m.bd_id
                            left join companies c on m.company_id =c.id
                            left join contact_details cd on cd.company_id =c.id and cd.is_primary_contact =1 and cd.is_active =1
                            LEFT JOIN monthly_nds mn ON mn.register_id = rcmr.id 
                            where id.rating_process_id in(2,5) and id.press_release_date is not null 
                            and rcmr.id is not null and COALESCE(mn.nds_recieved,0)=0 and cd.email=:email;`;
            // register ids for this email/company
            const register_ids = await DB_CLIENT.query(query, {
              type: QueryTypes.SELECT,
              replacements: {
                email: this_mail.recipient,
              },
            });
            let register_id_arr = register_ids.map((val) => val.register_id);

            // Upserting data in Monthly NDS
            let nds_row_upserted = {};
            const prev_month = getPrevMonthName(new Date().getMonth());
            for (item of register_id_arr) {
              const nds_row = await MonthlyNDS.findOne({
                where: { register_id: item },
                raw: true,
              });

              if (nds_row) {
                nds_row_upserted = await nds_row.update({
                  nds_recieved: true,
                  nds_recieved_month: prev_month,
                  nds_recieved_on: Date.now(),
                  updated_at: Date.now(),
                });
              } else {
                nds_row_upserted = await MonthlyNDS.create({
                  uuid: uuidv4(),
                  nds_recieved: true,
                  nds_recieved_month: prev_month,
                  nds_recieved_on: Date.now(),
                  register_id: item,
                  is_active: true,
                  created_at: Date.now(),
                  updated_at: Date.now(),
                });
              }
            }

            // Sending Acknowledgment mail
            const email_recipient = this_mail.recipient;
            const email_subject = "Monthy NDS submission Acknowledgement";
            const email_body = `<p>Received your NDS successfully for the month of ${prev_month}<p>`;
            const body_replacements = {};

            const email_obj = await SEND_EMAIL(
              email_recipient,
              email_subject,
              email_body,
              body_replacements
            );

            await STORE_MAIL_IN_DB(email_obj);

            // Sending reply
            reply.statusCode = 200;
            reply.send({
              success: true,
              nds_row_upserted: nds_row_upserted,
              message: `NDS submitted for the month of ${prev_month} and acknowledgement sent on email`,
            });
          } else {
            reply.statusCode = 200;
            reply.send({
              success: false,
              message: "OTP is incorrect",
            });
          }
        } catch (err) {
          let error_log = {
            api: "v1/compliance/nds_form_responses/create",
            activity: "NDS_FORM_RESPONSE_CREATE",
            params: {
              error: String(err),
            },
          };
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: err["errors"] ?? String(err),
          });
        }
      }
    );

    done();
  });
}

const file_rosolver = (path) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      const csv_fs = readFileSync(path);
      let document_url = await UPLOAD_TO_AZURE_STORAGE(csv_fs, {
        path,
      });
      resolve(document_url);
    }, 500);
  });
};

const getCompanies = async () => {
  const get_companies = await DB_CLIENT.query(
    `
      SELECT c.name, c.uuid FROM companies c 
      INNER JOIN rating_committee_meeting_registers rcmr ON c.id = rcmr.company_id  
      INNER JOIN mandates m ON m.company_id  = c.id 
      INNER JOIN transaction_instruments ti oN ti.mandate_id  = m.id
      INNER JOIN instrument_details id ON id.transaction_instrument_id  = ti.id
      INNER JOIN workflow_instances wi ON wi.mandate_id = m.id
      INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id
      INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
      WHERE wc.is_last_activity = 1
      GROUP BY c.name, c.uuid
      `,
    {
      type: QueryTypes.SELECT,
    }
  );
  return get_companies;
};

const unzipFile = async (zipFilePath) => {
  try {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        const file = await decompress(
          `generated/${zipFilePath}_CSV.ZIP`,
          "dist"
        );
        resolve(file);
      }, 500);
    });
  } catch (error) {
    console.error("Error occurred during extraction:", error);
  }
};
module.exports = {
  compliance_routes,
  STORE_MAIL_IN_DB,
};
