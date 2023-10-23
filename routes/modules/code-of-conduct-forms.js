const { v4: uuidv4, validate } = require("uuid");
const moment = require("moment");
const { error_logger } = require("../../loki-push-agent");
const { LOG_TO_DB } = require("../../logger");
const {
  FormInvestmentData,
  FormMetadata,
  Relative,
  FormType,
  FormWitnesses,
  RelationshipType,
  DirectorInvestment,
  SecurityType,
  InvestmentTransaction,
} = require("../../models/modules/code_of_conduct");
const { Sequelize, QueryTypes } = require("sequelize");
const { stringify } = require("csv-stringify");
const {
  User,
  UserAttribute,
  Mandate,
  Company,
  BoardOfDirector,
} = require("../../models/modules/onboarding");
const { DB_CLIENT } = require("../../db");
const Op = Sequelize.Op;
const { createWriteStream } = require("fs");

const find_cur_financial_year_obj = () => {
  return FinancialYear.findOne({
    where: {
      start_date: {
        [Op.lte]: new Date(),
      },
      end_date: {
        [Op.gte]: new Date(),
      },
    },
    raw: true,
  });
};

const {
  CHECK_PERMISSIONS,
  APPEND_USER_DATA,
  UPLOAD_TO_AZURE_STORAGE,
} = require("../../helpers");
const {
  FormDataListSchema,
  FormDataCreateSchema,
} = require("../../schemas/CodeOfConduct/formData");
const {
  FinancialYear,
  TransactionInstrument,
} = require("../../models/modules/rating-model");
const { fetchData } = require("../../repositories/EmployeeFormsStatusReport");
const { default: puppeteer } = require("puppeteer");
const { readFileSync } = require("fs");

async function code_of_conduct_form_routes(fastify) {
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
      "/code_of_conduct/view_history",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "COCFormDataViewHistory.List");
          const form_type = await FormType.findOne({
            where: {
              uuid: request.body.params.form_type_uuid,
              is_active: true,
            },
          });
          let cur_financial_year = await find_cur_financial_year_obj();
          const forms = await FormMetadata.findAll({
            where: {
              created_by: request.user.id,
              form_type_id: form_type.id,
              is_active: true,
              status: { [Op.or]: ["Approved", "Rejected"] },
              financial_year: { [Op.ne]: cur_financial_year.id },
            },
            attributes: ["submission_date", "status", "remarks"],
          });

          reply.send({
            success: true,
            data: forms,
          });
        } catch (error) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    /* PDF Report */
    fastify.post(
      "/code_of_conduct/review/report_pdf",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "COCFormDataViewHistory.List");
          const forms = await fetchData();
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

          const GENERATE_UUID = uuidv4();
          const path = `generated/employee_forms_status_report${GENERATE_UUID}.pdf`;
          const browser = await puppeteer.launch({
            headless: false,
            args: ["--headless"],
          });

          const page = await browser.newPage();
          const html = await fastify.view(
            `templates/pdf/employeeFormsStatusReport.pug`,
            {
              data: forms,
              require: require,
            }
          );
          await page.setContent(html, { waitUntil: "domcontentloaded" });
          await page.emulateMediaType("screen");
          await page.pdf({
            displayHeaderFooter: true,
            headerTemplate: header(),
            path: path,
            margin: {
              top: "140px",
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
          console.log("Error", error);
          return reply.send({
            error: String(error),
          });
        }
      }
    );

    /* CSV Report */
    fastify.post(
      "/code_of_conduct/review/report_csv",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.DelayReview");

          const forms = await fetchData(true);
          const GENERATE_UUID = uuidv4();
          const path = `generated/employee_forms_status_report${GENERATE_UUID}.csv`;
          const writableStream = createWriteStream(path);
          const columns = [
            "S. No.",
            "Name of Employee",
            "Employee Code",
            "Form Name",
            "Form Status",
          ];
          const stringifier = stringify({ header: true, columns: columns });

          const processData = () => {
            return new Promise((resolve, reject) => {
              stringifier.pipe(writableStream);
              forms.forEach((d, key) => {
                const sno = key + 1;
                stringifier.write([
                  sno,
                  d.full_name,
                  d.employee_code,
                  d.form_name,
                  d.form_status,
                  //  moment(d.committee_meeting_date).format("DD/MM/YYYY"),
                ]);
              });
              stringifier.end();
              setTimeout(async () => {
                let document_url = await UPLOAD_TO_AZURE_STORAGE(
                  readFileSync(path),
                  {
                    path,
                  }
                );
                resolve(document_url);
              }, 1000);
            });
          };
          let document_url = await processData();

          reply.send({
            success: true,
            document: document_url,
          });

          // const doc_url = await file_resolver(path);
        } catch (error) {
          console.log(error);
        }
      }
    );

    /* Review */
    fastify.post(
      "/code_of_conduct/review",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "COCFormDataReview.List");

          const forms = await DB_CLIENT.query(
            `select u.uuid as user_uuid,u.full_name,u.employee_code,ua.designation 
              from form_metadata fm 
              left join users u on u.id=fm.created_by
              left join user_attributes ua on ua.user_id=u.id
              where fm.status in ('Approved', 'Rejected', 'Pending for approval')
              and fm.is_active=1
              group by u.uuid,u.full_name,u.employee_code,ua.designation  `,
            {
              type: QueryTypes.SELECT,
            }
          );

          reply.send({
            success: true,
            data: forms,
          });
        } catch (error) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/code_of_conduct/submit_form",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "CodeofConduct.List");
          const { params } = request.body;
          // cur financial year
          let financial_year = await find_cur_financial_year_obj();
          let this_user_id;
          if (params.user_uuid?.length > 0) {
            let found_user = await User.findOne({
              where: {
                uuid: params.user_uuid,
                is_active: true,
              },
              raw: true,
            });
            this_user_id = found_user.id;
          } else this_user_id = request.user.id;

          // array of all submit form type
          const formType = await FormType.findAll({
            where: {
              category: "submit",
              is_active: true,
            },
            raw: true,
          });

          if (formType.length > 0) {
            // find all form type ids
            const form_type_ids = formType.map((val) => val.id);

            let formMeta = [];
            try {
              // and their formmetadata
              formMeta = await FormMetadata.findAll({
                where: {
                  form_type_id: {
                    [Op.in]: form_type_ids,
                  },
                  created_by: this_user_id,
                  is_active: true,
                  financial_year: financial_year.id,
                },
                raw: true,
              });

              let merged_form_data = [];
              // merge form_type(name col.) & form metadata(last edited,status col.)
              merged_form_data = await formType.map((type_obj) => {
                let meta_obj = formMeta.find(
                  (meta) => meta.form_type_id == type_obj.form_number
                );
                if (meta_obj !== undefined) {
                  type_obj.status = meta_obj.status;
                  type_obj.last_edited = meta_obj.last_edited;
                  type_obj.form_uuid = meta_obj.uuid;
                  type_obj.form_id = meta_obj.id;
                  type_obj.remarks = meta_obj.remarks;
                } else {
                  type_obj.status = "To be filled";
                  type_obj.last_edited = "";
                  type_obj.form_uuid = "";
                  type_obj.form_id = "";
                  type_obj.remarks = "";
                }
                return type_obj;
              });

              reply.send({
                success: true,
                data: merged_form_data,
              });
            } catch (err) {
              console.log(err);
              reply.statusCode = 422;
              reply.send({
                success: false,
                error: String(err),
              });
            }
          }
        } catch (error) {
          console.log(error);
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    /*Create Form Data*/
    fastify.post(
      "/code_of_conduct/submit_form/create",
      async (request, reply) => {
        reply.statusCode = 200;

        try {
          await CHECK_PERMISSIONS(request, "CodeofConduct.Create");
          const {
            relatives_data,
            relative_investment,
            user_investment,
            witness_data,
            director_investment,
            director_data,
          } = request.body.params;
          // find user

          const user = await User.findOne({
            where: { id: request.user.id, is_active: true },
          });

          // find user attributes

          const user_attributes = await UserAttribute.findOne({
            where: { user_id: request.user.id },
          });
          // find form type
          const form_type = await FormType.findOne({
            where: {
              uuid: request.body.params.form_type_uuid,
              is_active: true,
            },
            raw: true,
          });

          if (!form_type) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: "NO FORM TYPE",
            });
            return;
          }

          let financial_year = await find_cur_financial_year_obj();

          const search_data = await FormMetadata.findOne({
            where: {
              form_type_id: form_type.id,
              financial_year: financial_year.id,
              created_by: request.user.id,
              is_active: true,
            },
          });

          if (search_data) {
            reply.statusCode = 400;
            reply.send({
              message: "Form already exists for this user, kindly use edit api",
            });
            return;
          }

          const create_form_metadata = await FormMetadata.create(
            APPEND_USER_DATA(request, {
              uuid: uuidv4(),
              status: request.body.params.status,
              signature: request.body.params.signature,
              last_edited: Date.now(),
              form_date: Date.now(),
              user_name: user.full_name,
              designation: user_attributes?.designation ?? "NA",
              address: user_attributes?.address,
              telephone: user_attributes?.contact_number,
              branch: user_attributes?.location ?? "NA",
              created_at: Date.now(),
              created_by: request.user.id,
              is_active: true,
              form_type_id: form_type.id,
              financial_year: financial_year.id,
              submission_date: ["Pending for approval", "Submitted"].includes(
                request.body.params.status
              )
                ? Date.now()
                : null,
            })
          );
          if (form_type.form_number == "1") {
            // save data to witness and form_metadata table

            const updated_witness_data = await FormWitnesses.create(
              APPEND_USER_DATA(request, {
                uuid: uuidv4(),
                form_id: create_form_metadata.id,
                is_active: true,
                created_at: Date.now(),
                created_by: request.user.id,
                ...witness_data,
              })
            );
          } else if (form_type.form_number == "2") {
            const resolver = () => {
              // return new Promise((resolve, reject) => {
              // remove above
              // promise that waits for all promises in map function to resolve
              return Promise.all(
                relatives_data.map(async ({ relationship_uuid, name }) => {
                  // find relationship object for relationship uuid
                  const relation_object = await RelationshipType.findOne({
                    where: { uuid: relationship_uuid },
                  });
                  return {
                    uuid: uuidv4(),
                    form_id: create_form_metadata.id,
                    // add relationship_id in relative_data
                    relationship_id: relation_object.id,
                    name,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    created_by: request.user.id,
                    updated_by: request.user.id,
                    is_active: true,
                  };
                })
              )
                .then((response) => {
                  // resolve(response);
                  return response;
                })
                .catch((err) =>
                  //  reject(err)
                  console.log(err)
                );
              // });
              // remove above
            };
            // array of relatives
            const relative_bulk_data = [...(await resolver())];

            // creating all the relatives in one go
            await Relative.bulkCreate(relative_bulk_data);
          } else if (
            [7, 8].includes(form_type.form_number) &&
            request.body.params.status == "Submitted"
          ) {
            let company_data = [];
            let security_type_data = [];
            let relatives_data = [];

            if (relative_investment?.length) {
              const relative_uuids = relative_investment.map(
                (val) => val.relative_uuid
              );

              try {
                relatives_data = await Relative.findAll({
                  where: {
                    uuid: {
                      [Op.in]: relative_uuids,
                    },
                    is_active: true,
                  },
                  raw: true,
                });
              } catch (err) {
                console.log(err);
                reply.statusCode = 422;
                reply.send({
                  success: false,
                  error: String(err),
                });
              }
            }

            const company_names = new Set(
              [...relative_investment, ...user_investment].map(
                (val) => val.company_name
              )
            );

            const security_type_names = new Set();
            [...relative_investment, ...user_investment].forEach((val) => {
              [
                val.name_securities_acquired || "",
                val.name_securities_disposed || "",
                val.name_securities_held || "",
              ].forEach((item) => security_type_names.add(item));
            });

            company_data = await Company.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(company_names),
                },
                is_active: true,
              },
              raw: true,
            });

            security_type_data = await SecurityType.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(security_type_names),
                },
                is_active: true,
              },
              raw: true,
            });

            // Found company,security and relative_data

            let user_relative_investment = [
              ...relative_investment,
              ...user_investment,
            ];

            const storeMyData = async (val1) => {
              console.log(val1);
              return new Promise((res, rej) => {
                InvestmentTransaction.create({ ...val1, uuid: uuidv4() })
                  .then((data) => {
                    FormInvestmentData.create({ ...val1, uuid: uuidv4() });
                  })
                  .then((data2) => {
                    res("success");
                  })
                  .catch((err) => rej(err));
              });
            };

            for (let val1 of user_relative_investment) {
              val1.created_at = Date.now();
              val1.created_by = request.user.id;
              val1.updated_at = Date.now();
              val1.updated_by = request.user.id;
              val1.form_id = create_form_metadata.id;
              val1.financial_year_id = financial_year.id;
              val1.is_active = true;

              // appending relative_id,company_id for storing
              let relative_obj = {};
              if (val1.relative_uuid)
                relative_obj = relatives_data.find(
                  (val2) => val2.uuid == val1.relative_uuid
                );
              if (Object.keys(relative_obj)?.length > 0)
                val1.relative_id = relative_obj.id;

              let company_obj = {};
              if (val1.company_name)
                company_obj = company_data.find(
                  (val2) => val2.name == val1.company_name
                );
              if (Object.keys(company_obj)?.length > 0)
                val1.company_id = company_obj.id;

              // replacing name with security_type_id
              [
                "name_securities_acquired",
                "name_securities_disposed",
                "name_securities_held",
              ].forEach((key) => {
                if (val1[key]) {
                  let security_obj = security_type_data.find(
                    (val2) => val2.name == val1[key]
                  );

                  val1.security_type_id = security_obj.id;
                  if (key.substring(0, 5) == "name_") {
                    let new_key = `${key.substring(5)}_id`;
                    val1[new_key] = security_obj.id;
                  }
                  delete val1[key];
                }
              });
              // if form 7 sec after 1 apr, set acquired and cons paid
              //  ''''' find+ increase closing_stock and sum aggregate acquired by held and sum_cons_paid by consideration paid

              // if form 7 sec before 1 apr, find+increase opening and closing stock by held

              if (form_type.form_number == 7) {
                if (
                  new Date(val1.acquisition_date) <
                  new Date(financial_year.start_date)
                ) {
                  console.log("bought before");
                  val1.increase_opening_stock_by =
                    val1["num_securities_held"] || 0;
                  val1.increase_closing_stock_by =
                    val1["num_securities_held"] || 0;
                  delete val1.consideration_paid;
                } else {
                  console.log("bought after");
                  val1.num_securities_acquired =
                    val1["num_securities_held"] || 0;
                  val1.consideration_paid = val1["consideration_paid"] || 0;
                }
              }
              let latest_data_query = "";
              let prev_year_data_query = "";
              let sum_query = "";

              if (val1.relative_id) {
                sum_query = `SELECT sum(num_securities_acquired) as num_aggregate_acquired, sum(num_securities_disposed)
as num_aggregate_disposed, sum(consideration_paid ) as aggregate_cons_paid,sum(consideration_received)
as aggregate_cons_received from investments_transactions 
         WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} AND face_value = ${val1.face_value} AND
          security_type_id = ${val1.security_type_id} and relative_id=${val1.relative_id} AND financial_year_id = ${val1.financial_year_id}  AND is_active=1`;

                // latest closing picked by updated_at and fin year
                latest_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock, 
                    COALESCE(opening_stock,0) as opening_stock from investments_transactions 
        WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} AND
         face_value = ${val1.face_value} AND security_type_id = ${val1.security_type_id} and relative_id=${val1.relative_id} AND is_active=1
          ORDER BY updated_at DESC`;
                //  prev closing picked by updated_at and fin year-1
                prev_year_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock, 
                    COALESCE(opening_stock,0) as opening_stock from investments_transactions
         WHERE created_by = ${val1.created_by} AND company_id = ${
                  val1.company_id
                } AND face_value = ${val1.face_value} AND
          security_type_id = ${val1.security_type_id} and relative_id=${
                  val1.relative_id
                } AND financial_year_id = ${
                  val1.financial_year_id - 1
                }  AND is_active=1 ORDER BY updated_at DESC`;
              } else {
                sum_query = `SELECT sum(num_securities_acquired) as num_aggregate_acquired, sum(num_securities_disposed)
as num_aggregate_disposed, sum(consideration_paid ) as aggregate_cons_paid,sum(consideration_received)
as aggregate_cons_received from investments_transactions WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} 
AND face_value = ${val1.face_value} AND security_type_id = ${val1.security_type_id} 
and relative_id is null AND financial_year_id = ${val1.financial_year_id}  AND is_active=1`;

                // latest closing picked by updated_at and fin year
                latest_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock,
                     COALESCE(opening_stock,0) as opening_stock from investments_transactions 
        WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} AND
         face_value = ${val1.face_value} AND security_type_id = ${val1.security_type_id} 
         AND is_active=1 and relative_id is null ORDER BY updated_at DESC`;

                //  prev closing picked by updated_at and fin year-1
                prev_year_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock,
                     COALESCE(opening_stock,0) as opening_stock from investments_transactions
         WHERE created_by = ${val1.created_by} AND company_id = ${
                  val1.company_id
                } AND face_value = ${val1.face_value} AND
          security_type_id = ${
            val1.security_type_id
          } and relative_id is null AND financial_year_id = ${
                  val1.financial_year_id - 1
                }  AND is_active=1 ORDER BY updated_at DESC`;
              }

              let latest_data = await DB_CLIENT.query(latest_data_query, {
                type: Sequelize.QueryTypes.SELECT,
              });

              val1["closing_stock"] = latest_data[0]?.closing_stock
                ? latest_data[0].closing_stock
                : 0;
              // take last closing stock, increase by acquired and if form 7, by held also
              console.log(
                val1["closing_stock"] || 0,
                val1["num_securities_acquired"] || 0,
                val1["increase_closing_stock_by"] || 0,
                val1["num_securities_disposed"] || 0
              );

              val1["closing_stock"] =
                Number(val1["closing_stock"] || 0) +
                Number(val1["num_securities_acquired"] || 0) +
                Number(val1["increase_closing_stock_by"] || 0) -
                Number(val1["num_securities_disposed"] || 0);
              console.log(
                val1["closing_stock"] || 0,
                val1["num_securities_acquired"] || 0,
                val1["increase_closing_stock_by"] || 0,
                val1["num_securities_disposed"] || 0
              );
              if (val1["closing_stock"] < 0) {
                reply.statusCode = 200;
                reply.send({
                  success: false,
                  error:
                    "Investment disposed is greater than declared as possessed by user or his/her relative",
                });
                return;
              }

              // if opening stock latest entry 0, then take prev year closing stock
              let prev_year_data;
              if (
                latest_data[0]?.opening_stock == 0 ||
                latest_data[0]?.opening_stock == undefined
              ) {
                prev_year_data = await DB_CLIENT.query(prev_year_data_query, {
                  type: Sequelize.QueryTypes.SELECT,
                });

                // make last year closing as opening
                val1["opening_stock"] = prev_year_data[0]?.closing_stock
                  ? prev_year_data[0]["closing_stock"]
                  : 0;
                // if form 7 increase by held
                val1["opening_stock"] =
                  Number(val1["opening_stock"] || 0) +
                  Number(val1["increase_opening_stock_by"] || 0);
              } else {
                // set cur year opening stock and if form 7 increase by held
                val1["opening_stock"] =
                  Number(latest_data[0]?.opening_stock || 0) +
                  Number(val1["increase_opening_stock_by"] || 0);
              }
              // aggregate values
              let sum_data = await DB_CLIENT.query(sum_query, {
                type: Sequelize.QueryTypes.SELECT,
              });

              // increase sum_acquired, for form 7 purchase after 1 apr, value of acquired is held
              val1.num_aggregate_acquired =
                Number(sum_data[0]?.num_aggregate_acquired ?? 0) +
                Number(val1.num_securities_acquired || 0);
              val1.aggregate_cons_paid =
                Number(sum_data[0]?.aggregate_cons_paid ?? 0) +
                Number(val1.consideration_paid || 0);

              if (form_type.form_number == 8) {
                val1.num_aggregate_disposed =
                  Number(sum_data[0]?.num_aggregate_disposed ?? 0) +
                  Number(val1.num_securities_disposed || 0);

                val1.aggregate_cons_received =
                  Number(sum_data[0]?.aggregate_cons_received ?? 0) +
                  Number(val1.consideration_received || 0);
              }

              // storing data
              await storeMyData(val1);
            }
          } else if (form_type.form_number == 10) {
            if (director_investment.length) {
              const getCompanyNames = director_investment.map(
                (investment) => investment.company_name
              );
              const getUserAttributeData = await UserAttribute.findOne({
                where: {
                  user_id: request.user.id,
                },
              });
              let common_data = {
                created_at: Date.now(),
                created_by: request.user.id,
                form_id: create_form_metadata.id,
                user_id: getUserAttributeData.id,
              };
              const getCompanies = await Company.findAll({
                where: {
                  name: { [Op.in]: getCompanyNames },
                },
                raw: true,
              });
              const director_investment_bulk_data = director_investment.map(
                (investment) => {
                  let obj = getCompanies.find(
                    (company) => company.name === investment.company_name
                  );
                  delete investment.company_name;
                  investment.company_id = obj.id;
                  investment.uuid = uuidv4();
                  investment = {
                    ...investment,
                    ...common_data,
                    ...director_data,
                  };
                  return investment;
                }
              );
              await DirectorInvestment.bulkCreate(
                director_investment_bulk_data
              );
            }

            await LOG_TO_DB(request, {
              activity: "CREATE_DIRECTOR_INVESTMENT_DATA",
              params: {},
            });

            reply.send({
              success: true,
              form_uuid: create_form_metadata.uuid,
            });
          } else {
            let company_data = [];
            let security_type_data = [];
            let relatives_data = [];

            if (relative_investment.length) {
              const relative_uuids = relative_investment.map(
                (val) => val.relative_uuid
              );

              try {
                relatives_data = await Relative.findAll({
                  where: {
                    uuid: {
                      [Op.in]: relative_uuids,
                    },
                    is_active: true,
                  },
                  raw: true,
                });
              } catch (err) {
                console.log(err);
                reply.statusCode = 422;
                reply.send({
                  success: false,
                  error: String(err),
                });
              }
            }

            const company_names = new Set(
              [...relative_investment, ...user_investment].map(
                (val) => val.company_name
              )
            );

            const security_type_names = new Set();
            [...relative_investment, ...user_investment].forEach((val) => {
              [
                val.name_securities_acquired || "",
                val.name_securities_disposed || "",
                val.name_securities_held_fny_start || "",
                val.name_securities_held_fny_end || "",
                val.name_securities_to_be_disposed || "",
                val.name_securities_to_be_dealt || "",
                val.name_securities_held || "",
              ].forEach((item) => security_type_names.add(item));
            });

            company_data = await Company.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(company_names),
                },
                is_active: true,
              },
              raw: true,
            });

            security_type_data = await SecurityType.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(security_type_names),
                },
                is_active: true,
              },
              raw: true,
            });

            let common_data = {
              created_at: Date.now(),
              created_by: request.user.id,
              form_id: create_form_metadata.id,
            };

            let user_relative_investment_bulk = [
              ...relative_investment,
              ...user_investment,
            ].map((val1) => {
              let relative_obj = {};
              if (val1.relative_uuid)
                relative_obj = relatives_data.find(
                  (val2) => val2.uuid == val1.relative_uuid
                );
              if (Object.keys(relative_obj).length > 0)
                val1.relative_id = relative_obj.id;

              let company_obj = {};
              if (val1.company_name)
                company_obj = company_data.find(
                  (val2) => val2.name == val1.company_name
                );
              if (Object.keys(company_obj).length > 0)
                val1.company_id = company_obj.id;

              [
                "name_securities_acquired",
                "name_securities_disposed",
                "name_securities_held_fny_start",
                "name_securities_held_fny_end",
                "name_securities_to_be_disposed",
                "name_securities_to_be_dealt",
                "name_securities_held",
              ].forEach((key) => {
                if (val1[key]) {
                  let security_obj = security_type_data.find(
                    (val2) => val2.name == val1[key]
                  );

                  if (key.substring(0, 5) == "name_") {
                    let new_key = `${key.substring(5)}_id`;
                    val1[new_key] = security_obj.id;
                  }
                  delete val1[key];
                }
              });

              val1.uuid = uuidv4();
              val1.is_active = true;
              val1.created_by = request.user.id;
              val1.updated_at = Date.now();
              val1 = { ...val1, ...common_data };
              return val1;
            });

            await FormInvestmentData.bulkCreate(user_relative_investment_bulk);
          }
          await LOG_TO_DB(request, {
            activity: "CREATE_INVESTMENT_DATA",
            params: {},
          });

          reply.send({
            success: true,
            form_uuid: create_form_metadata.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/code_of_conduct/submit_form/create",
            activity: "CREATE_INVESTMENT_DATA",
            params: {
              error: String(error),
            },
          };
          console.log(error);
          error_logger.info(JSON.stringify(error_log));
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });
        }
      }
    );

    /*Edit Form Data*/
    fastify.post(
      "/code_of_conduct/submit_form/edit",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "CodeofConduct.Edit");

          const {
            relatives_data,
            relative_investment,
            user_investment,
            witness_data,
            director_investment,
            director_data,
          } = request.body.params;

          // find form
          const form = await FormMetadata.findOne({
            where: {
              uuid: request.body.params.form_uuid,
              is_active: true,
            },
          });

          if (!form) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: "NO FORM",
            });
            return;
          }
          const form_type = await FormType.findOne({
            where: { id: form.form_type_id, is_active: true },
          });

          let financial_year = await find_cur_financial_year_obj();

          // find user attributes
          const user_attributes = await UserAttribute.findOne({
            where: { user_id: request.user.id },
          });
          // update data in form_metadata table
          let common_update_obj = request.body.params.review
            ? // &&
              // request.active_role_name === "Compliance"
              {
                status: request.body.params.status,
                approved_at: Date.now(),
                approved_by: request.user.id,
              }
            : {
                status: request.body.params.status,
                signature: request.body.params.signature,
                last_edited: Date.now(),
                user_name: request.user.full_name,
                designation: user_attributes?.designation ?? "NA",
                address: user_attributes?.address,
                telephone: user_attributes?.contact_number,
                branch: user_attributes?.location ?? "NA",
                submission_date: ["Pending for approval", "Submitted"].includes(
                  request.body.params.status
                )
                  ? Date.now()
                  : null,
              };

          const update_form_metadata = await FormMetadata.update(
            APPEND_USER_DATA(request, common_update_obj),
            {
              where: {
                uuid: form.uuid,
                is_active: true,
              },
            }
          );

          if (form_type.form_number == "1") {
            // update data in witness table
            const updated_witness_data = await FormWitnesses.update(
              APPEND_USER_DATA(request, {
                is_active: request.body.params.is_active || true,
                signature: request.body.params.witness_signature,
                ...witness_data,
              }),
              {
                where: { form_id: form.id, is_active: true },
              }
            );
          } else if (form_type.form_number == "2") {
            (async function update_relatives_data() {
              let relationship_type_data = [];
              let relationship_type_uuids = [];
              if (relatives_data?.length > 0) {
                relationship_type_uuids = relatives_data.map(
                  (val) => val.relationship_uuid
                );
              }
              try {
                relationship_type_data = await RelationshipType.findAll({
                  where: {
                    uuid: {
                      [Op.in]: relationship_type_uuids,
                    },
                    is_active: true,
                  },
                  raw: true,
                });
              } catch (err) {
                console.log(err);
                reply.statusCode = 422;
                reply.send({
                  success: false,
                  error: String(err),
                });
              }
              let common_data = {
                created_at: Date.now(),
                created_by: request.user.id,
                form_id: form.id,
              };

              let relative_bulk_data = relatives_data.map((relative) => {
                let relationship_obj = relationship_type_data.find(
                  (relation) => relation.uuid === relative.relationship_uuid
                );

                if (relationship_obj)
                  relative.relationship_id = relationship_obj.id;
                relative = { ...relative, ...common_data };
                return relative;
              });

              for (let i = 0; i < relative_bulk_data.length; i++) {
                let [updated_val, updateOrNot] = await Relative.upsert(
                  APPEND_USER_DATA(request, {
                    ...relative_bulk_data[i],
                    uuid: relative_bulk_data[i].uuid
                      ? relative_bulk_data[i].uuid
                      : uuidv4(),
                  })
                );
              }
            })();
          } else if (form_type.form_number == "10") {
            let company_uuids = [];
            let company_names = [];

            for (let i = 0; i < director_investment.length; i++) {
              company_uuids.push(director_investment[i].uuid);
              company_names.push(director_investment[i].company_name);
            }

            let director_investment_data = [];
            let company_data = [];
            try {
              director_investment_data = await DirectorInvestment.findAll({
                where: {
                  uuid: {
                    [Op.in]: company_uuids,
                  },
                  is_active: true,
                },
                raw: true,
              });
              company_data = await Company.findAll({
                where: {
                  name: {
                    [Op.in]: company_names,
                  },
                  is_active: true,
                },
                raw: true,
              });
            } catch (err) {
              console.log(err);
              reply.statusCode = 422;
              reply.send({
                success: false,
                error: String(err),
              });
            }
            const getUserAttributeData = await UserAttribute.findOne({
              where: {
                user_id: request.user.id,
              },
            });
            let common_data = {
              updated_at: Date.now(),
              updated_by: request.user.id,
              form_id: form.id,
              user_id: getUserAttributeData.id,
            };

            const director_investment_bulk_data = director_investment.map(
              (investment) => {
                let obj = director_investment_data.find(
                  (di) => investment.uuid === di.uuid
                );
                let companyObj = company_data.find(
                  (company) => company.name === investment.company_name
                );
                delete investment.company_name;
                investment.company_id = companyObj.id;
                investment = {
                  ...investment,
                  ...common_data,
                  ...director_data,
                };
                return investment;
              }
            );

            for (let i = 0; i < director_investment_bulk_data.length; i++) {
              await DirectorInvestment.upsert(
                APPEND_USER_DATA(request, {
                  ...director_investment_bulk_data[i],
                  created_by: director_investment_bulk_data[i].created_by
                    ? director_investment_bulk_data[i].created_by
                    : request.user.id,
                  created_at: director_investment_bulk_data[i].created_at
                    ? director_investment_bulk_data[i].created_at
                    : Date.now(),
                  uuid: director_investment_bulk_data[i].uuid
                    ? director_investment_bulk_data[i].uuid
                    : uuidv4(),
                })
              );
            }

            await LOG_TO_DB(request, {
              activity: "CREATE_DIRECTOR_INVESTMENT_DATA",
              params: {},
            });
          } else if (
            [7, 8].includes(form_type.form_number) &&
            request.body.params.status == "Submitted"
          ) {
            let company_data = [];
            let security_type_data = [];
            let relatives_data = [];

            if (relative_investment?.length) {
              const relative_uuids = relative_investment.map(
                (val) => val.relative_uuid
              );

              try {
                relatives_data = await Relative.findAll({
                  where: {
                    uuid: {
                      [Op.in]: relative_uuids,
                    },
                    is_active: true,
                  },
                  raw: true,
                });
              } catch (err) {
                console.log(err);
                reply.statusCode = 422;
                reply.send({
                  success: false,
                  error: String(err),
                });
              }
            }

            const company_names = new Set(
              [...relative_investment, ...user_investment].map(
                (val) => val.company_name
              )
            );

            const security_type_names = new Set();
            [...relative_investment, ...user_investment].forEach((val) => {
              [
                val.name_securities_acquired || "",
                val.name_securities_disposed || "",
                val.name_securities_held || "",
              ].forEach((item) => security_type_names.add(item));
            });

            company_data = await Company.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(company_names),
                },
                is_active: true,
              },
              raw: true,
            });

            security_type_data = await SecurityType.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(security_type_names),
                },
                is_active: true,
              },
              raw: true,
            });
            console.log(security_type_names);

            // Found company,security and relative_data

            let user_relative_investment = [
              ...relative_investment,
              ...user_investment,
            ];

            const storeMyData = async (val1) => {
              console.log(val1);
              return new Promise((res, rej) => {
                InvestmentTransaction.create({ ...val1, uuid: uuidv4() })
                  .then((data) => {
                    FormInvestmentData.upsert({
                      ...val1,
                      uuid: val1.uuid ?? uuidv4(),
                    });
                  })
                  .then((data2) => {
                    res("success");
                  })
                  .catch((err) => rej(err));
              });
            };

            for (let val1 of user_relative_investment) {
              val1.created_at = Date.now();
              val1.created_by = request.user.id;
              val1.updated_at = Date.now();
              val1.updated_by = request.user.id;
              val1.form_id = form.id;
              val1.financial_year_id = financial_year.id;
              // val1.is_active = true;

              // appending relative_id,company_id for storing
              let relative_obj = {};
              if (val1.relative_uuid)
                relative_obj = relatives_data.find(
                  (val2) => val2.uuid == val1.relative_uuid
                );
              if (Object.keys(relative_obj)?.length > 0)
                val1.relative_id = relative_obj.id;

              let company_obj = {};
              if (val1.company_name)
                company_obj = company_data.find(
                  (val2) => val2.name == val1.company_name
                );
              if (Object.keys(company_obj)?.length > 0)
                val1.company_id = company_obj.id;

              // replacing name with security_type_id
              [
                "name_securities_acquired",
                "name_securities_disposed",
                "name_securities_held",
              ].forEach((key) => {
                if (val1[key]) {
                  let security_obj = security_type_data.find(
                    (val2) => val2.name == val1[key]
                  );

                  val1.security_type_id = security_obj.id;

                  if (key.substring(0, 5) == "name_") {
                    let new_key = `${key.substring(5)}_id`;
                    val1[new_key] = security_obj.id;
                  }
                  delete val1[key];
                }
              });
              // if form 7 sec after 1 apr, set acquired and cons paid
              //  ''''' find+ increase closing_stock and sum aggregate acquired by held and sum_cons_paid by consideration paid

              // if form 7 sec before 1 apr, find+increase opening and closing stock by held

              if (form_type.form_number == 7) {
                if (
                  new Date(val1.acquisition_date) <
                  new Date(financial_year.start_date)
                ) {
                  console.log("bought before");
                  val1.increase_opening_stock_by =
                    val1["num_securities_held"] || 0;
                  val1.increase_closing_stock_by =
                    val1["num_securities_held"] || 0;
                  delete val1.consideration_paid;
                } else {
                  console.log("bought after");
                  val1.num_securities_acquired =
                    val1["num_securities_held"] || 0;
                  val1.consideration_paid = val1["consideration_paid"] || 0;
                }
              }
              let latest_data_query = "";
              let prev_year_data_query = "";
              let sum_query = "";

              if (val1.relative_id) {
                sum_query = `SELECT sum(num_securities_acquired) as num_aggregate_acquired, sum(num_securities_disposed)
as num_aggregate_disposed, sum(consideration_paid ) as aggregate_cons_paid,sum(consideration_received)
as aggregate_cons_received from investments_transactions 
         WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} AND face_value = ${val1.face_value} AND
          security_type_id = ${val1.security_type_id} and relative_id=${val1.relative_id} AND financial_year_id = ${val1.financial_year_id}  AND is_active=1`;

                // latest closing picked by updated_at and fin year
                latest_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock, 
                    COALESCE(opening_stock,0) as opening_stock from investments_transactions 
        WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} AND
         face_value = ${val1.face_value} AND security_type_id = ${val1.security_type_id} and relative_id=${val1.relative_id} AND is_active=1
          ORDER BY updated_at DESC`;
                //  prev closing picked by updated_at and fin year-1
                prev_year_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock, 
                    COALESCE(opening_stock,0) as opening_stock from investments_transactions
         WHERE created_by = ${val1.created_by} AND company_id = ${
                  val1.company_id
                } AND face_value = ${val1.face_value} AND
          security_type_id = ${val1.security_type_id} and relative_id=${
                  val1.relative_id
                } AND financial_year_id = ${
                  val1.financial_year_id - 1
                }  AND is_active=1 ORDER BY updated_at DESC`;
              } else {
                sum_query = `SELECT sum(num_securities_acquired) as num_aggregate_acquired, sum(num_securities_disposed)
as num_aggregate_disposed, sum(consideration_paid ) as aggregate_cons_paid,sum(consideration_received)
as aggregate_cons_received from investments_transactions WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} 
AND face_value = ${val1.face_value} AND security_type_id = ${val1.security_type_id} 
and relative_id is null AND financial_year_id = ${val1.financial_year_id}  AND is_active=1`;

                // latest closing picked by updated_at and fin year
                latest_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock,
                     COALESCE(opening_stock,0) as opening_stock from investments_transactions 
        WHERE created_by = ${val1.created_by} AND company_id = ${val1.company_id} AND
         face_value = ${val1.face_value} AND security_type_id = ${val1.security_type_id} 
         AND is_active=1 and relative_id is null ORDER BY updated_at DESC`;

                //  prev closing picked by updated_at and fin year-1
                prev_year_data_query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock,
                     COALESCE(opening_stock,0) as opening_stock from investments_transactions
         WHERE created_by = ${val1.created_by} AND company_id = ${
                  val1.company_id
                } AND face_value = ${val1.face_value} AND
          security_type_id = ${
            val1.security_type_id
          } and relative_id is null AND financial_year_id = ${
                  val1.financial_year_id - 1
                }  AND is_active=1 ORDER BY updated_at DESC`;
              }

              let latest_data = await DB_CLIENT.query(latest_data_query, {
                type: Sequelize.QueryTypes.SELECT,
              });

              val1["closing_stock"] = latest_data[0]?.closing_stock
                ? latest_data[0].closing_stock
                : 0;
              // take last closing stock, increase by acquired and if form 7, by held also
              console.log(
                val1["closing_stock"] || 0,
                val1["num_securities_acquired"] || 0,
                val1["increase_closing_stock_by"] || 0,
                val1["num_securities_disposed"] || 0
              );

              val1["closing_stock"] =
                Number(val1["closing_stock"] || 0) +
                Number(val1["num_securities_acquired"] || 0) +
                Number(val1["increase_closing_stock_by"] || 0) -
                Number(val1["num_securities_disposed"] || 0);

              if (val1["closing_stock"] < 0) {
                reply.statusCode = 200;
                return reply.send({
                  success: false,
                  error:
                    "Investment disposed is greater than declared as possessed by user or his/her relative",
                });
              }

              console.log(
                val1["closing_stock"] || 0,
                val1["num_securities_acquired"] || 0,
                val1["increase_closing_stock_by"] || 0,
                val1["num_securities_disposed"] || 0
              );

              // if opening stock latest entry 0, then take prev year closing stock
              let prev_year_data;
              if (
                latest_data[0]?.opening_stock == 0 ||
                latest_data[0]?.opening_stock == undefined
              ) {
                prev_year_data = await DB_CLIENT.query(prev_year_data_query, {
                  type: Sequelize.QueryTypes.SELECT,
                });

                // make last year closing as opening
                val1["opening_stock"] = prev_year_data[0]?.closing_stock
                  ? prev_year_data[0]["closing_stock"]
                  : 0;
                // if form 7 increase by held
                val1["opening_stock"] =
                  Number(val1["opening_stock"] || 0) +
                  Number(val1["increase_opening_stock_by"] || 0);
              } else {
                // set cur year opening stock and if form 7 increase by held
                val1["opening_stock"] =
                  Number(latest_data[0]?.opening_stock || 0) +
                  Number(val1["increase_opening_stock_by"] || 0);
              }
              // aggregate values
              let sum_data = await DB_CLIENT.query(sum_query, {
                type: Sequelize.QueryTypes.SELECT,
              });

              // increase sum_acquired, for form 7 purchase after 1 apr, value of acquired is held
              val1.num_aggregate_acquired =
                Number(sum_data[0]?.num_aggregate_acquired ?? 0) +
                Number(val1.num_securities_acquired || 0);
              val1.aggregate_cons_paid =
                Number(sum_data[0]?.aggregate_cons_paid ?? 0) +
                Number(val1.consideration_paid || 0);

              if (form_type.form_number == 8) {
                val1.num_aggregate_disposed =
                  Number(sum_data[0]?.num_aggregate_disposed ?? 0) +
                  Number(val1.num_securities_disposed || 0);

                val1.aggregate_cons_received =
                  Number(sum_data[0]?.aggregate_cons_received ?? 0) +
                  Number(val1.consideration_received || 0);
              }

              // storing data
              await storeMyData(val1);
            }
          } else {
            let company_data = [];
            let security_type_data = [];
            let relatives_data = [];

            console.log(
              user_investment,
              relative_investment,
              "bottom========>"
            );

            if (relative_investment.length) {
              const relative_uuids = relative_investment.map(
                (val) => val.relative_uuid
              );

              try {
                relatives_data = await Relative.findAll({
                  where: {
                    uuid: {
                      [Op.in]: relative_uuids,
                    },
                    is_active: true,
                  },
                  raw: true,
                });
              } catch (err) {
                console.log(err);
                reply.statusCode = 422;
                reply.send({
                  success: false,
                  error: String(err),
                });
              }
            }

            const company_names = new Set(
              [...relative_investment, ...user_investment].map(
                (val) => val.company_name
              )
            );

            const security_type_names = new Set();
            [...relative_investment, ...user_investment].forEach((val) => {
              [
                val.name_securities_acquired,
                val.name_securities_disposed,
                val.name_securities_held_fny_start,
                val.name_securities_held_fny_end,
                val.name_securities_to_be_disposed,
                val.name_securities_to_be_dealt,
                val.name_securities_held,
              ].forEach((item) => security_type_names.add(item));
            });

            company_data = await Company.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(company_names),
                },
                is_active: true,
              },
              raw: true,
            });

            security_type_data = await SecurityType.findAll({
              where: {
                name: {
                  [Op.in]: Array.from(security_type_names),
                },
                is_active: true,
              },
              raw: true,
            });

            let common_data = {
              created_at: Date.now(),
              created_by: request.user.id,
              form_id: form.id,
            };

            let user_relative_investment_bulk = [
              ...relative_investment,
              ...user_investment,
            ].map((val1) => {
              if (request.body.params.review == true)
                val1.investment_approval_date = new Date();
              let relative_obj = {};
              if (val1.relative_uuid)
                relative_obj = relatives_data.find(
                  (val2) => val2.uuid == val1.relative_uuid
                );
              if (Object.keys(relative_obj).length > 0)
                val1.relative_id = relative_obj.id;

              let company_obj = {};
              if (val1.company_name)
                company_obj = company_data.find(
                  (val2) => val2.name == val1.company_name
                );
              if (Object.keys(company_obj).length > 0)
                val1.company_id = company_obj.id;

              [
                "name_securities_acquired",
                "name_securities_disposed",
                "name_securities_held_fny_start",
                "name_securities_held_fny_end",
                "name_securities_to_be_disposed",
                "name_securities_to_be_dealt",
                "name_securities_held",
              ].forEach((key) => {
                if (val1[key]) {
                  let security_obj = security_type_data.find(
                    (val2) => val2.name == val1[key]
                  );

                  if (key.substring(0, 5) == "name_") {
                    let new_key = `${key.substring(5)}_id`;
                    val1[new_key] = security_obj.id;
                  }
                  delete val1[key];
                }
              });

              // val1.uuid = uuidv4();
              // val1.is_active = true;
              val1.created_by = request.user.id;
              val1.updated_at = Date.now();
              val1 = { ...val1, ...common_data };
              return val1;
            });

            for (let i = 0; i < user_relative_investment_bulk.length; i++) {
              let [updated_val, updateOrNot] = await FormInvestmentData.upsert(
                APPEND_USER_DATA(request, {
                  ...user_relative_investment_bulk[i],
                  uuid: user_relative_investment_bulk[i].uuid
                    ? user_relative_investment_bulk[i].uuid
                    : uuidv4(),
                })
              );
            }
          }

          reply.send({ success: true });
        } catch (error) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    // View Investments
    fastify.post(
      "/code_of_conduct/submit_form/view-investments",
      async (request, reply) => {
        let investment_data = [];
        try {
          await CHECK_PERMISSIONS(request, "CodeofConduct.View");
          const query = `SELECT st.name as security_name,c.name as company_name,it.face_value,
          it.closing_stock as num_securities_held_fny_end,it.opening_stock as num_securities_held_fny_start,
  it.num_aggregate_disposed as num_securities_disposed ,it.relative_id,
it.aggregate_cons_received as consideration_received ,it.num_aggregate_acquired as num_securities_acquired,it.financial_year_id,it.aggregate_cons_paid as consideration_paid,it.updated_at
FROM companies c inner join
 investments_transactions it on c.id=it.company_id 
INNER JOIN (
  SELECT security_type_id ,face_value, company_id, financial_year_id ,created_by,relative_id, MAX(updated_at) AS latest_date
    FROM investments_transactions
    GROUP BY security_type_id ,face_value, company_id,financial_year_id, created_by,relative_id) sq
    on it.security_type_id=sq.security_type_id and it.face_value =sq.face_value and it.company_id =sq.company_id and it.created_by=sq.created_by
    and it.updated_at =sq.latest_date and it.financial_year_id=sq.financial_year_id 
    inner join security_types st on st.id=sq.security_type_id
    where it.created_by =:created_by`;
          investment_data = await DB_CLIENT.query(query, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { created_by: request.user.id },
          });
        } catch (err) {
          console.log(err);
        }
        reply.send({
          success: true,
          investment_data: investment_data,
        });
      }
    );

    /*View Form Data*/
    fastify.post(
      "/code_of_conduct/submit_form/view",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "CodeofConduct.View");

          if (request.body.params.holdings) {
            let investment_data = [];
            try {
              await CHECK_PERMISSIONS(request, "CodeofConduct.View");
              const query = `select 'system' as source,r.name+'('+rt.name+')' as relative_name,sup1.* from relatives r right join 
 (SELECT st.name as security_name,c.name as company_name,it.face_value,
 it.closing_stock as num_securities_held_fny_end,it.opening_stock as num_securities_held_fny_start,
  it.num_aggregate_disposed as num_securities_disposed ,it.relative_id,
it.aggregate_cons_received as consideration_received ,
it.num_aggregate_acquired as num_securities_acquired,it.financial_year_id,it.aggregate_cons_paid as consideration_paid,it.updated_at
FROM companies c inner join
 investments_transactions it on c.id=it.company_id
INNER JOIN 
(
  SELECT security_type_id ,face_value, company_id, financial_year_id ,created_by,relative_id, MAX(updated_at) AS latest_date
    FROM investments_transactions
    GROUP BY security_type_id ,face_value, company_id,financial_year_id, created_by,relative_id)
    sq
    on it.security_type_id=sq.security_type_id and it.face_value =sq.face_value and it.company_id =sq.company_id and it.created_by=sq.created_by
    and it.updated_at =sq.latest_date and it.financial_year_id=sq.financial_year_id 
    inner join security_types st on st.id=sq.security_type_id
    where it.created_by =:created_by)
    as sup1
    on sup1.relative_id=r.id left join relationship_types rt on rt.id=r.relationship_id `;
              investment_data = await DB_CLIENT.query(query, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: { created_by: request.user.id },
              });
            } catch (err) {
              console.log(err);
            }
            reply.send({
              success: true,
              investment_data: investment_data,
            });
          }

          const form_uuid = request.body.params.form_uuid;
          // find form

          const form = await FormMetadata.findOne({
            where: {
              uuid: form_uuid,
              is_active: true,
            },
          });

          if (!form) {
            reply.send({
              success: true,
              message: "form not found",
            });
            return;
          }
          let formType = await FormType.findOne({
            where: {
              id: form.form_type_id,
              is_active: true,
            },
          });

          if (formType.form_number == "1") {
            // find form data
            const form_data = await FormWitnesses.findOne({
              where: {
                form_id: form.id,
                is_active: true,
              },
              include: [
                {
                  model: FormMetadata,
                  as: "coc_user_data",
                  // attributes: {
                  //   exclude: ["id"],
                  // },
                },
              ],
            });
            form_data.form_id = form.id;

            reply.send({
              success: true,
              witness_data: form_data,
            });
            return;
          } else if (formType.form_number == "2") {
            // find form data
            const form_data = await Relative.findAll({
              where: {
                form_id: form.id,
                is_active: true,
              },
              attributes: ["name", "uuid"],
              include: [
                {
                  model: RelationshipType,
                  as: "coc_relationship",
                  attributes: ["name"],
                },
              ],
            });
            form.form_id = form.id;

            reply.send({
              success: true,
              relative_data: form_data,
              form_metadata: form,
            });
          } else if (
            [3, 5].includes(formType.form_number) &&
            request.body.params.review == true
          ) {
            const formInvestmentDataReview = await DB_CLIENT.query(
              `select inv.*,COALESCE(r.name,'self') as relative_name,
              COALESCE(rt.name,'self') as relationship
              from form_metadata fm inner join form_investments inv
              on fm.id=inv.form_id 
              left join relatives r on
              r.id=inv.relative_id left join relationship_types rt
              on r.relationship_id =rt.id
              where inv.form_id =:form_id;
              `,
              {
                replacements: {
                  form_id: form.id,
                },
                type: QueryTypes.SELECT,
              }
            );

            let company_ids = formInvestmentDataReview.map(
              (item) => item.company_id
            );

            let company_objs = await Company.findAll({
              where: {
                id: {
                  [Op.in]: company_ids,
                },
              },
              raw: true,
            });
            let security_ids = new Set();

            formInvestmentDataReview.map((item) => {
              if (item.securities_held_id)
                security_ids.add(item.securities_held_id);
              if (item.securities_to_be_dealt_id)
                security_ids.add(item.securities_to_be_dealt_id);

              if (item.securities_to_be_disposed_id)
                security_ids.add(item.securities_to_be_disposed_id);
            });

            let security_ids_arr = Array.from(security_ids);
            console.log(security_ids_arr);

            let security_objs_arr = await SecurityType.findAll({
              where: {
                id: {
                  [Op.in]: security_ids_arr,
                },
              },
              raw: true,
            });

            let merged_data = [];
            // merge form_type(name col.) & form metadata(last edited,status col.)
            merged_data = await formInvestmentDataReview.map(
              (investment_item) => {
                let this_company = company_objs.find(
                  (company_item) =>
                    investment_item.company_id == company_item.id
                );

                let this_security_held_name = security_objs_arr.find(
                  (security_item) =>
                    security_item.id == investment_item.securities_held_id
                );

                if (this_security_held_name)
                  investment_item.name_securities_held =
                    this_security_held_name.name;

                let this_security_to_be_disposed_name = security_objs_arr.find(
                  (security_item) =>
                    security_item.id ==
                    investment_item.securities_to_be_disposed_id
                );

                if (this_security_to_be_disposed_name)
                  investment_item.name_securities_to_be_disposed =
                    this_security_to_be_disposed_name.name;

                if (formType.form_number == 5)
                  investment_item.nature_of_transaction = "Sale";

                let this_security_dealt_name = security_objs_arr.find(
                  (security_item) =>
                    security_item.id ==
                    investment_item.securities_to_be_dealt_id
                );
                if (this_security_dealt_name)
                  investment_item.name_securities_to_be_dealt =
                    this_security_dealt_name.name;
                if (this_company !== undefined) {
                  investment_item.company_name = this_company.name;
                } else {
                  investment_item.company_name = "";
                }
                return investment_item;
              }
            );

            reply.send({
              success: true,
              investment_data: merged_data,
              form_metadata: form,
            });
          }
          // else if (formType.form_number === 9) {
          //   const investment_data=FormInvestmentData.find
          // const investment_data = await InvestmentTransaction.findAll({
          //   where: {
          //     form_id: form.id,
          //     is_active: true,
          //   },
          //   include: [
          //     {
          //       model: SecurityType,
          //       as: "security_type_id_as",
          //       attributes: ["name", "uuid"],
          //     },
          //     {
          //       model: Company,
          //       as: "company_id_as",
          //       attributes: ["name", "uuid"],
          //     },
          //     {
          //       model: SecurityType,
          //       as: "securities_held_id_as",
          //       attributes: { exclude: ["id"] },
          //     },

          //   ],
          // });
          // form.form_id = form.id;
          // reply.send({
          //   success: true,
          //   investment_data: investment_data,
          //   form_metadata: form,
          // });
          // }
          else if (formType.form_number === 10) {
            const { params } = request.body;
            let this_form_id;
            if (params.form_uuid?.length > 0) {
              let found_form = await FormMetadata.findOne({
                where: {
                  uuid: params.form_uuid,
                  is_active: true,
                },
                raw: true,
              });
              this_form_id = found_form.id;
            }

            const getDirInvestments = await DirectorInvestment.findAll({
              where: {
                form_id: this_form_id,
                is_active: true,
              },
              include: [
                {
                  model: Company,
                  as: "dir_company_data",
                  attributes: ["uuid", "name"],
                },
                {
                  model: FormMetadata,
                  as: "form_data",
                },
                {
                  model: UserAttribute,
                  as: "user_data",
                  attributes: ["address"],
                },
              ],
            });

            reply.send({
              success: true,
              data: getDirInvestments,
            });
          } else {
            const investment_data = await FormInvestmentData.findAll({
              where: {
                form_id: form.id,
                is_active: true,
              },
              attributes: { exclude: ["id"] },
              include: [
                {
                  model: Relative,
                  as: "coc_relative",
                  attributes: ["name", "uuid"],
                  include: [
                    {
                      model: RelationshipType,
                      as: "coc_relationship",
                      attributes: ["name", "uuid"],
                    },
                  ],
                },
                {
                  model: SecurityType,
                  as: "securities_acquired_id_as",
                  attributes: ["name", "uuid"],
                },
                {
                  model: SecurityType,
                  as: "securities_disposed_id_as",
                  attributes: ["name", "uuid"],
                },
                {
                  model: SecurityType,
                  as: "securities_held_id_as",
                  attributes: ["name", "uuid"],
                },
                {
                  model: SecurityType,
                  as: "securities_held_fny_end_id_as",
                  attributes: ["name", "uuid"],
                },
                {
                  model: SecurityType,
                  as: "securities_held_fny_start_id_as",
                  attributes: ["name", "uuid"],
                },

                {
                  model: SecurityType,
                  as: "securities_to_be_dealt_id_as",
                  attributes: ["name", "uuid"],
                },
                {
                  model: SecurityType,
                  as: "securities_to_be_disposed_id_as",
                  attributes: ["name", "uuid"],
                },
                {
                  model: Company,
                  as: "company_id_as",
                  attributes: ["name", "uuid"],
                },
              ],
            });
            form.form_id = form.id;
            reply.send({
              success: true,
              investment_data: investment_data,
              form_metadata: form,
            });
          }
        } catch (error) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    /*Upload Signature*/
    fastify.post(
      "/code_of_conduct/assign_documents",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "CodeOfConductDocument.Edit");

          const formMeta_data = await FormMetadata.findOne({
            where: {
              uuid: request.body["form_uuid"].value,
              is_active: true,
            },
          });

          const formWitness_data = await FormWitnesses.findOne({
            where: {
              form_id: formMeta_data.id,
              is_active: true,
            },
          });
          if (!formMeta_data) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: "NO COC FORM DATA FOUND",
            });
            return;
          }

          const formType = await FormType.findOne({
            where: {
              id: formMeta_data.form_type_id,
              is_active: true,
            },
          });

          let coc_user_form_document;
          let coc_witness_form_document;

          if (request.body["user_signature"]) {
            const user_buffer = await request.body["user_signature"].toBuffer();
            const user_document_path = await UPLOAD_TO_AZURE_STORAGE(
              user_buffer,
              {
                path: request.body.user_signature.filename,
              }
            );
            coc_user_form_document = await formMeta_data.update({
              signature: user_document_path,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: request.user.id,
            });
          }

          if (
            formType.form_number == "1" &&
            request.body["witness_signature"]
          ) {
            const witness_buffer = await request.body[
              "witness_signature"
            ].toBuffer();
            const witness_document_path = await UPLOAD_TO_AZURE_STORAGE(
              witness_buffer,
              {
                path: request.body.witness_signature.filename,
              }
            );
            coc_witness_form_document = await formWitness_data.update({
              signature: witness_document_path,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: request.user.id,
            });
          }

          await LOG_TO_DB(request, {
            activity: "ASSIGN_COC_FORM_DOCUMENT",
            params: {
              data: request.query,
            },
          });

          reply.send({
            success: true,
            coc_user_form_document,
            coc_witness_form_document,
          });
        } catch (error) {
          let error_log = {
            api: "v1/code_of_conduct/assign_documents",
            activity: "ASSIGN_COC_FORM_DOCUMENT",
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

    /*Code of conduct RELATIVE APIs*/
    fastify.post("/submit_form/relative/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "COCRelative.Create");
        const { params } = request.body;

        const relative_bulk_data = params.map((param) => {
          param.uuid = uuidv4();
          param.created_at = Date.now();
          param.updated_at = Date.now();
          param.created_by = request.user.id;
          param.updated_by = request.user.id;
          param.is_active = true;
          return param;
        });

        const relative_data = Relative.bulkCreate(relative_bulk_data);

        await LOG_TO_DB(request, {
          activity: "CREATE_INVESTMENT_DATA",
          params: {
            data: params,
          },
        });
        reply.send({
          success: true,
          data: relative_data,
        });
      } catch (error) {
        let error_log = {
          api: "v1/submit_form/relative/create",
          activity: "CREATE_RELATIVE_DATA",
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
    });

    fastify.post(
      "/code_of_conduct/submit_form/relative",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "COCRelatives.List");
          const { params } = request.body;
          const relatives = await Relative.findAll({
            where: {
              created_by: request.user.id,
              is_active: true,
            },
            include: [
              {
                model: RelationshipType,
                as: "coc_relationship",
                attributes: ["uuid", "name"],
              },
            ],
          });

          await LOG_TO_DB(request, {
            activity: "RELATIVE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            relatives: relatives,
          });
        } catch (error) {
          let error_log = {
            api: "v1/submit_form/relative",
            activity: "RELATIVE",
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
      "/submit_form/relative/view",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "COCRelative.View");

          const relative = await Relative.findOne({
            where: {
              uuid: request.body.params.uuid,
              is_active: true,
            },
          });

          await LOG_TO_DB(request, {
            activity: "RELATIVE",
            params: {
              data: request.body.params,
            },
          });

          reply.send({
            success: true,
            relative: relative,
          });
        } catch (error) {
          let error_log = {
            api: "v1/submit_form/relative/view",
            activity: "FORM_TYPE",
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

    fastify.post("/submit_form/relative/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "COCRelative.Edit");
        const { params } = request.body;

        const relative = await Relative.update(
          APPEND_USER_DATA(request, {
            name: params["name"],
            relationship: params["relationship"],
            is_active: params["is_active"],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );
        await LOG_TO_DB(request, {
          activity: "RELATIVE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          relative_update_done: Boolean(relative[0] === 1),
        });
      } catch (error) {
        let error_log = {
          api: "v1/submit_form/relative/edit",
          activity: "EDIT_FORM_TYPE",
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
    done();
  });
}

module.exports = {
  code_of_conduct_form_routes,
};
