const { QueryTypes, Sequelize, Op } = require("sequelize");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
// const nodemailer = require("nodemailer");
// const handlebars = require("handlebars");
// const fs = require("fs").promises;
const fs = require("fs");
const { DB_CLIENT } = require("../../db");
const {
  WorkflowInstance,
  WorkflowConfig,
  Activity,
  WorkflowInstanceLog,
  WorkflowDocument,
  WorkflowRollbackLog,
  WorkflowDocumentRemark,
} = require("../../models/modules/workflow");
const {
  ACTIVITY_LOGICS,
  ACTIVITY_ROLLBACK_LOGICS,
} = require("../../services/workflow-activities-bl");
const {
  User,
  Mandate,
  Company,
  ListingDetail,
  Role,
  DocumentType,
} = require("../../models/modules/onboarding");
const {
  CHECK_PERMISSIONS,
  UPLOAD_DOCUMENT,
  UPLOAD_TO_AZURE_STORAGE,
  CONVERT_TO_ARRAY,
  DOWNLOAD_FILE,
} = require("../../helpers");
const {
  RatingProcess,
  RatingSymbolMaster,
  RatingSymbolMapping,
  FinancialYear,
} = require("../../models/modules/rating-model");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const { SEND_GENERAL_EMAIL, client_pc_data } = require("../../services/send-email");
const { EMAIL_TEMPLATE } = require("../../constants/constant");

const {
  get_output_rating_sheet_pdf,
} = require("./meeting-docs/output-rating-sheet");
const { log } = require("winston");
const { req } = require("pino-std-serializers");
const { default: axios } = require("axios");
const fastify = require("fastify");
const { default: puppeteer } = require("puppeteer");

async function upload_to_workflow_documents(params) {
  console.log("upload_to_workflow_documents: params: ",params )

  const {company, rating_process, request, fastify} = params;

  const workflow_doc = await DB_CLIENT.query(
    `SELECT * FROM workflow_documents wd WHERE company_id = :company_id 
    AND rating_process_id =:rating_process_id AND is_active = 1 ORDER BY id DESC`,
    {
      replacements: {
        company_id: company.id,
        rating_process_id: rating_process.id,
      },
      type: QueryTypes.SELECT,
    }
  );

  const workflow_doc_update = await DB_CLIENT.query(
    `UPDATE workflow_documents set is_active = 0 WHERE id =:workflow_document_id`,
    {
      replacements: {
        workflow_document_id:
          workflow_doc.length > 0 ? workflow_doc[0].id : null,
      },
      type: QueryTypes.UPDATE,
    }
  );

    // const document_buffer = await request.body["model_rating_sheet"].toBuffer();
    // document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
    //   path: request.body.model_rating_sheet.filename,
    // });

    const document_data = await generate_model_rating_sheet(company,fastify);
    console.log("upload_to_workflow_documents: document_data:", document_data);
    // const document_buffer = document_data.pdf.toBuffer();
    const blob = new Blob(document_data.pdf);
    const upload_params = {
      company_name: company.name,
      fileName: 'model_rating_sheet.pdf',
      file: blob,
      document_type: "model_rating_sheet",
      request: request,
      rating_process: rating_process.name,
    };

    // await upload_file_to_dms(upload_params);

    console.log("file added to dms");


    const workflow_document = await WorkflowDocument.create({
      uuid: uuidv4(),
      model_rating_sheet: document_data.document_url,
      provisional_communication: workflow_doc.length
        ? workflow_doc[0].provisional_communication
        : null,
      rating_letter: workflow_doc.length
        ? workflow_doc[0].rating_letter
        : null,
      press_release: workflow_doc.length
        ? workflow_doc[0].press_release
        : null,
      rating_sheet: workflow_doc.length
        ? workflow_doc[0].rating_sheet
        : null,
      remark: request.body["remark"]
        ? request.body["remark"].value
        : null,
      status: request.body["status"]
        ? request.body["status"].value
        : null,
      financial: workflow_doc.length
        > 0 ? workflow_doc[0].financial
        : null, 
      other_document: workflow_doc.length
        > 0 ? workflow_doc[0].other_document
        : null,  
      rating_note: workflow_doc.length
        > 0 ? workflow_doc[0].rating_note
        : null,       
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: request.user.id,
      company_id: company.id,
      role_id: request.active_role_id,
      rating_process_id: rating_process.id,
    });

    console.log("workflow_document: ", workflow_document);
}

async function generate_model_rating_sheet(company, fastify) {
  try
  {
    const model_rating = await DB_CLIENT.query(`
    WITH RankedRows AS (
      SELECT 
          CAST(c.name AS VARCHAR(MAX)) AS company_name, 
          CAST(rm2.name AS VARCHAR(MAX)) AS rating_model, 
          CAST(rt.name AS VARCHAR(MAX)) AS risk_type, 
          CAST(f.question AS VARCHAR(MAX)) AS factor, 
          (rmhrt.weightage) AS weightage,
          (
              SELECT '[' + STRING_AGG(
                  '{' + QUOTENAME('factor_parameter', '"') + ':' + QUOTENAME(CAST(fp.name AS VARCHAR(MAX)), '"') + ',' + QUOTENAME('score', '"') + ':'
                   + QUOTENAME(CAST(fp.score AS VARCHAR(MAX)), '""') + '}',
                  ','
              ) + ']'
              FROM factors f2
              INNER JOIN factor_parameters fp ON fp.factor_id = f2.id
              WHERE f2.id = f.id
          ) AS factor_parameters_json,
          (
              SELECT SUM(rtrs.weighted_score)
              FROM risk_type_rating_sheets rtrs
              WHERE rtrs.risk_type_id = rmhrt.risk_type_id
          ) AS weighted_score,
          rm.assigned_score,
          crm.turnover,
          i.name AS industry_name, 
          (m.mandate_type) AS instrument_type, 
          rs.financial_risk,
          rs.management_risk,
          rs.business_risk,
          rs.industry_risk, 
          rs1.total_risk_score,
          rs1.proposed_long_term_rating,
          rs1.proposed_short_term_rating,
          rs1.proposed_outlook, 
          rs1.model_based_long_term_rating,
          rs1.model_based_short_term_rating,
          ROW_NUMBER() OVER (
              PARTITION BY CAST(c.name AS VARCHAR(MAX)), 
              CAST(rm2.name AS VARCHAR(MAX)), 
              CAST(rt.name AS VARCHAR(MAX)), 
              CAST(f.question AS VARCHAR(MAX)), 
              fp.score
              ORDER BY (SELECT NULL)
          ) AS RowNum
      FROM companies c
      INNER JOIN rating_metadata rm ON rm.company_id = c.id 
      INNER JOIN rating_sheets rs1 ON rs1.company_id = c.id
      INNER JOIN mandates m ON m.company_id = c.id
      INNER JOIN rating_models rm2 ON rm2.id = rm.rating_model_id 
      INNER JOIN risk_types rt ON rt.id = rm.risk_type_id 
      INNER JOIN rating_model_has_risk_types rmhrt ON rmhrt.rating_model_id = rm2.id AND rmhrt.risk_type_id = rt.id
      INNER JOIN factors f ON f.rating_model_risk_type_id = rmhrt.id 
      INNER JOIN factor_parameters fp ON fp.factor_id = f.id
      INNER JOIN company_rating_models crm ON crm.company_id = c.id
      INNER JOIN industries i ON i.id = crm.industry_id 
      INNER JOIN rating_sheets rs ON rs.company_id = c.id
      WHERE c.id = :company_id
    )
    SELECT company_name, rating_model, risk_type, factor, 
         MAX(factor_parameters_json) AS factor_parameters_json,
         MAX(assigned_score) AS assigned_score,
         MAX(weighted_score) AS weighted_score,
         MAX(weightage) AS max_weightage, -- Use MAX or other appropriate aggregation
         MAX(turnover) AS turnover, 
         MAX(industry_name) AS industry_name, 
         MAX(instrument_type) AS instrument_type, 
         MAX(financial_risk) AS financial_risk, 
         MAX(management_risk) AS management_risk, 
         MAX(business_risk) AS business_risk, 
         MAX(industry_risk) AS industry_risk,
         MAX(proposed_long_term_rating) AS proposed_long_term_rating,
         MAX(proposed_short_term_rating) AS proposed_short_term_rating,
         MAX(proposed_outlook) AS proposed_outlook,
         MAX(model_based_long_term_rating) AS model_based_long_term_rating,
         MAX(model_based_short_term_rating) AS model_based_short_term_rating
    FROM RankedRows
    WHERE RowNum = 1
    GROUP BY company_name, rating_model, risk_type, factor
    ORDER BY risk_type;
      `,
      {
      replacements:{
        company_id: company.id,
      },
      type: QueryTypes.SELECT
    }
    );
    
    console.log("model_rating: ", model_rating);
    
    let result = {
      rating_model_name: model_rating[0].rating_model,
      company_name: model_rating[0].company_name,
      instrument_type: model_rating[0].instrument_type,
      company_industry: model_rating[0].industry_name,
      turnover: model_rating[0].turnover,
      risk_details: [], 
      rating_sheet: [],
      rating_model: {
        total_weights: 100,
        weighted_score: model_rating[0].weighted_score,
        model_based_long_term_rating: model_rating[0].model_based_long_term_rating,
        model_based_short_term_rating: model_rating[0].model_based_short_term_rating,
        proposed_long_term_rating: model_rating[0].proposed_long_term_rating,
        proposed_short_term_rating: model_rating[0].proposed_short_term_rating,
        proposed_outlook: model_rating[0].proposed_outlook
      }
    };
    
    for (let i = 0; i < model_rating.length; i++) {
      console.log("model_rating :", model_rating[i])
    let j = i;
    const obj = {
      weighted_score: model_rating[i].weighted_score,
      parameter_name: model_rating[i].risk_type,
      factors_details: [],
    };
    
    const sheet_object = {
      risk_type: model_rating[i].risk_type,
      weightage: model_rating[i].max_weightage,
      score: model_rating[i].weighted_score,
    };
    result.rating_sheet.push(sheet_object);
    
    while (i + 1 < model_rating.length && model_rating[i].risk_type === model_rating[i + 1].risk_type) {
      let sequence_no = 0;
      let factors = [];
      let k = 0;
      while (k < 5 && j < model_rating.length && model_rating[j].risk_type === model_rating[i].risk_type) {
        sequence_no++;
        const temp1 = {
          sequence_no: sequence_no,
          question: model_rating[j].factor,
          parameters: JSON.parse(model_rating[j].factor_parameters_json),
        };
        factors.push(temp1);
        j++;
        k++;
      }
    
      obj.factors_details.push({ factors });
      
      // Exit the loop if there are no more factors or we've collected all available factors for this risk_type.
      if (k < 5 || j >= model_rating.length || model_rating[j].risk_type !== model_rating[i].risk_type) {
        break;
      }
    }
    
    i = j - 1; // Update the outer loop iterator to the last processed index
    result.risk_details.push(obj);
    }
    
    console.log("result: ", result);
    
    let path = `generated/output_rating_sheet.pdf`
    
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      const html = await fastify.view("templates/pdf/outputRatingSheet.pug", { data: result, require: require });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('screen');
      await page.pdf({
        path: path,
        margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
        printBackground: true,
        format: 'A4',
      });
      await browser.close();
    
          const pdf = fs.readFileSync(path);
    
          const document_url = await UPLOAD_TO_AZURE_STORAGE(pdf, {
            path: path
          })
    
     return {document_url,pdf};
    }catch(error){
    console.log("error: ",error);
    }
}

async function get_provisional_email_params(company_id, flag) {
  try{
  let provisional_document = await DB_CLIENT.query(
    `SELECT DISTINCT c.name, rcmd.[path], cd.email, cd.name AS contact_name   
    FROM companies c
    INNER JOIN contact_details cd ON cd.company_id = c.id
    INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id AND rcmr.is_fresh = 1
    INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id 
    INNER JOIN rating_committee_meeting_documents rcmd ON rcmd.company_id = c.id AND rcmd.rating_committee_meeting_id = rcm.id
    INNER JOIN document_types dt ON dt.id = rcmd.document_type_id 
    WHERE dt.name = 'provisional_communication' AND cd.send_provisional_communication_letter = 1 AND c.id = :company_id;    
    `,
    {
      type: QueryTypes.SELECT,
      replacements:{
        company_id: company_id
      }
    }
  );

  console.log("get_provisional_email_params provisional_document: ", provisional_document);

    const email_params = {
      template_type: EMAIL_TEMPLATE.WORKFLOW_PROVISIONAL_COMMUNICATION_TO_CLIENT,
      meeting_id: null,
      meeting_date: null, 
      rating: null,
      rating_process: null,
      to_user_name: provisional_document[0]?.contact_name,
      from_user_name: null,
      to_user_email: [provisional_document[0]?.email],
      company: provisional_document[0]?.name,
      mandate_type: null,
      total_size: null,
      attachment: [{
        filename: 'provisional_letter.pdf',
        path: provisional_document[0]?.path,
      }]
    };
    const preview_data = await client_pc_data(email_params);
    console.log("preview_data: ", preview_data);
    if(flag){
    SEND_GENERAL_EMAIL(email_params);
    }
    const result = {
      email_params,
      preview_data,
      subject: "Request for acceptance of the rating assigned - " + provisional_document[0]?.name
    }
    return result;
  }catch(error){
    console.log("error: ", error);
    return error
  }
}

async function get_rating_letter_email_params(company_id, user_id) {
    let rating_letter_document = await DB_CLIENT.query(
      `SELECT DISTINCT c.name, rcmd.[path], cd.email, cd.name AS contact_name   
      FROM companies c
      INNER JOIN contact_details cd ON cd.company_id = c.id
      INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id AND rcmr.is_fresh = 1
      INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id 
      INNER JOIN rating_committee_meeting_documents rcmd ON rcmd.company_id = c.id AND rcmd.rating_committee_meeting_id = rcm.id
      INNER JOIN document_types dt ON dt.id = rcmd.document_type_id 
      WHERE dt.name = 'rating_letter' AND cd.send_rating_letter = 1 AND c.id = :company_id;    
      `,
      {
        type: QueryTypes.SELECT,
        replacements:{
          company_id: company_id
        }
      }
    );
  
    console.log("get_email_params provisional_document: ", provisional_document);
  
      const email_params = {
        template_type: null,
        meeting_id: null,
        meeting_date: null, 
        rating: null,
        rating_process: null,
        to_user_name: provisional_document[0]?.contact_name,
        from_user_name: null,
        to_user_email: [provisional_document[0]?.email],
        company: provisional_document[0]?.name,
        mandate_type: null,
        total_size: null,
        attachment: [{
          filename: 'rating_letter.pdf',
          path: provisional_document[0]?.path,
        }]
      };
      const preview_data = await client_pc_data(email_params);

      if(flag){
      SEND_GENERAL_EMAIL(email_params);
      }
      const result = {
        email_params,
        preview_data,
        subject: "Rating letter - " + provisional_document[0]?.name
      }
      return result;
    }

async function get_press_release_email_params(company_id, user_id) {
      let provisional_document = await DB_CLIENT.query(
        `SELECT DISTINCT c.name, rcmd.[path], cd.email, cd.name AS contact_name   
        FROM companies c
        INNER JOIN contact_details cd ON cd.company_id = c.id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id AND rcmr.is_fresh = 1
        INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id 
        INNER JOIN rating_committee_meeting_documents rcmd ON rcmd.company_id = c.id AND rcmd.rating_committee_meeting_id = rcm.id
        INNER JOIN document_types dt ON dt.id = rcmd.document_type_id 
        WHERE dt.name = 'press_release' AND cd.send_press_release = 1 AND c.id = :company_id;    
        `,
        {
          type: QueryTypes.SELECT,
          replacements:{
            company_id: company_id
          }
        }
      );
    
      console.log("get_email_params provisional_document: ", provisional_document);
    
        const email_params = {
          template_type: null,
          meeting_id: null,
          meeting_date: null, 
          rating: null,
          rating_process: null,
          to_user_name: provisional_document[0]?.contact_name,
          from_user_name: null,
          to_user_email: [provisional_document[0]?.email],
          company: provisional_document[0]?.name,
          mandate_type: null,
          total_size: null,
          attachment: [{
            filename: 'press_release.pdf',
            path: provisional_document[0]?.path,
          }]
        };

        const preview_data = await client_pc_data(email_params);

        if(flag){
        SEND_GENERAL_EMAIL(email_params);
        }

        const result = {
          email_params,
          preview_data,
          subject: "Press release - " + provisional_document[0]?.name
        }
        return result;
      }

const FIND_CUR_FIN_YEAR = () => {
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
async function STAKE_CHECK_FUNC(company_id, user_id) {
  const financial_year = await FIND_CUR_FIN_YEAR();
  const stake_check = await DB_CLIENT.query(
    `SELECT st.name as security_name,c.name as company_name,it.face_value,
          it.closing_stock as num_securities_held_fny_end,it.opening_stock as num_securities_held_fny_start,
          it.num_aggregate_disposed as num_securities_disposed ,it.relative_id,
          it.aggregate_cons_received as consideration_received ,it.num_aggregate_acquired as num_securities_acquired,it.financial_year_id,
          it.aggregate_cons_paid as consideration_paid,it.updated_at
          FROM companies c inner join
          investments_transactions it on c.id=it.company_id
          INNER JOIN (
          SELECT security_type_id ,face_value, company_id, financial_year_id ,created_by,relative_id, MAX(updated_at) AS latest_date
            FROM investments_transactions
            GROUP BY security_type_id ,face_value, company_id,financial_year_id, created_by,relative_id) sq
            on it.security_type_id=sq.security_type_id and it.face_value =sq.face_value and it.company_id =sq.company_id and it.created_by=sq.created_by
            and it.updated_at =sq.latest_date and it.financial_year_id=sq.financial_year_id
            inner join security_types st on st.id=sq.security_type_id
            where it.created_by =:created_by and c.id =:company_id and it.closing_stock >0 and it.financial_year_id =:financial_year_id `,
    {
      replacements: {
        created_by: user_id,
        company_id: company_id,
        financial_year_id: financial_year.id,
      },
      type: QueryTypes.SELECT,
    }
  );

  return stake_check;
}

async function upload_file_to_dms(params) {
  const financial_year = await FinancialYear.findOne({
    where: {
      is_current_fy: true,
    },
  });

  const document_type = await DocumentType.findOne({
    where: {
      name: params.document_type,
    },
  });

  if (!document_type) {
    await DocumentType.create({ name: params.document_type });
  }

  const file_extension = params.fileName.split(".").pop();
  const d = new Date();
  let this_company_name = params.company_name.trim();
  var formData = new FormData();
  formData.append("parent", "Rating Operations");
  formData.append("subParent1", `${this_company_name}`);
  formData.append("subParent2", `${financial_year.reference_date}`);
  formData.append("subParent3", "general");
  const subParent4_value = params.rating_process ? params.rating_process : "";
  formData.append("subParent4", subParent4_value);
  formData.append(
    "fileName",
    `${params.company_name}_${params.document_type}_d_${d
      .toJSON()
      .substring(
        0,
        10
      )}_${d.getHours()}hrs${d.getMinutes()}mins${d.getSeconds()}sec_d__u_${
      params.request.user.full_name
    }_u__r_${params.request.active_role_name}_r_.${file_extension}`
  );

  formData.append("file", params.file);

  const options = {
    url: `${process.env["API_DOMAIN"]}/v1/upload-company-document-at-sharepoint`,
    method: "POST",
    data: formData,
    headers: {
      Authorization:
        "Bearer " + params.request.headers.authorization.split(" ")[1],
      "Content-Type":
        "multipart/form-data; boundary=---011000010111000001101001",
    },
  };

  // console.log("options: ", options);

  axios
    .request(options)
    .then(function (response) {
      // console.log("response : ", response);
    })
    .catch((error) => {
      console.log("error : ", error);
    });
}

const check_stake_in_company = async (params) => {
  const stake_check = await DB_CLIENT.query(
    `SELECT st.name as security_name,c.name as company_name,it.face_value,
    it.closing_stock as num_securities_held_fny_end,it.opening_stock as num_securities_held_fny_start,
    it.num_aggregate_disposed as num_securities_disposed ,it.relative_id,
    it.aggregate_cons_received as consideration_received ,it.num_aggregate_acquired as num_securities_acquired,it.financial_year_id,
    it.aggregate_cons_paid as consideration_paid,it.updated_at
    FROM companies c inner join
    investments_transactions it on c.id=it.company_id
    INNER JOIN (
    SELECT security_type_id ,face_value, company_id, financial_year_id ,created_by,relative_id, MAX(updated_at) AS latest_date
      FROM investments_transactions
      GROUP BY security_type_id ,face_value, company_id,financial_year_id, created_by,relative_id) sq
      on it.security_type_id=sq.security_type_id and it.face_value =sq.face_value and it.company_id =sq.company_id and it.created_by=sq.created_by
      and it.updated_at =sq.latest_date and it.financial_year_id=sq.financial_year_id
      inner join security_types st on st.id=sq.security_type_id
      where it.created_by =:created_by and c.id =:company_id and it.closing_stock >0 and it.financial_year_id =:financial_year_id `,
    {
      replacements: {
        created_by: params.user_id,
        company_id: params.company_id,
        financial_year_id: params.financial_year_id,
      },
      type: QueryTypes.SELECT,
    }
  );

  console.log("************>>>>>>>>>>>>>>>>> 331");

  if (stake_check.length > 0) {
    params.reply.statusCode = 422;
    params.reply.send({
      success: false,
      error: "User has stake in this company",
      stake_check: "fail",
      stake_check_fail_for: params.stake_check_for,
    });
    return;
  }
};

const get_args = async (params) => {
  try {
    // const workflow_obj = await WorkflowInstance.findOne({
    //   where: {
    //     mandate_id: params.mandate_id,
    //     is_active: true,
    //   },
    //   raw: true,
    // });

    const workflow_instance = await DB_CLIENT.query(
      `SELECT wi.id, wi.financial_year_id FROM mandates m 
    INNER JOIN workflow_instances wi ON wi.mandate_id = m.id 
    INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id = wi.id 
    INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
    INNER JOIN rating_processes rp ON rp.id = wc.rating_process_id 
    WHERE rp.id= :process_id AND wil.is_active =1 AND m.id = :mandate_id
    AND m.is_active = 1
    `,
      {
        replacements: {
          mandate_id: params.mandate_id,
          process_id: params.rating_process.id,
        },
        type: QueryTypes.SELECT,
        transaction: params.transaction,
      }
    );

    let given_user = await User.findOne({
      where: {
        uuid: params["user_uuid"],
        is_active: true,
      },
      raw: true,
    });

    // console.log("workflow_obj: ", workflow_obj);
    // console.log("given_user: ", given_user);

    if (!workflow_instance.length || !given_user) {
      params.reply.statusCode = 422;
      return params.reply.send({
        success: false,
        error: "Workflow not found",
      });
    }

    const check_parallel_workflow = await DB_CLIENT.query(
      `SELECT wil.id FROM workflow_instances_log wil 
      INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id AND wil.is_active = 1 AND wc.is_parallel = 1 AND wil.workflow_instance_id = :workflow_instance_id
    `,
      {
        replacements: {
          workflow_instance_id: workflow_instance[0].id,
        },
        type: QueryTypes.SELECT,
      }
    );

    if (!check_parallel_workflow.length > 0) {
      params.reply.statusCode = 422;
      return params.reply.send({
        success: false,
        error: "Parallel Workflow is Active!!",
      });
    }

    const args = {
      instance: workflow_instance[0],
      user: given_user.id,
      mandate_id: params.mandate_id,
      company_id: params.company_id,
      activity_code: params["code"],
      // next_activity_code: nex_activity[0].code,
      request: params.request,
      rating_process: params.rating_process.id,
    };

    console.log("args: ", args);

    const result = await ACTIVITY_LOGICS(args);
  } catch (error) {
    throw new Error(error);
  }
};
// bd,ra,gh,rh,

async function inbox_routes(fastify) {
  fastify.post("/inbox/execution/assign_to_user", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Inbox.List");
      const { params } = request.body;

      const mandates = await Mandate.findAll({
        where: {
          mandate_id: params["mandate_id"],
          is_active: true,
        },
        raw: true,
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!mandates || !rating_process) {
        (reply.statusCode = 422),
          reply.send({
            success: false,
            error: "No Workflow Found",
          });
        return;
      }

      const company = await Company.findOne({
        where: {
          id: mandates[0].company_id,
          is_active: true,
        },
        raw: true,
      });

      if(params['code'] === '10190' || params['code'] === 10190)
      {
      await upload_to_workflow_documents({
        company,
        rating_process,
        request,
        fastify
      });
    }

      const result_promises = mandates.map(async (el) => {
        const workflow_instance = await DB_CLIENT.query(
          `SELECT wi.id,wc.sub_workflow FROM mandates m 
          INNER JOIN workflow_instances wi ON wi.mandate_id = m.id 
          INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id = wi.id 
          INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
          INNER JOIN activities a ON a.id = wc.current_activity_id AND a.code = :code
          INNER JOIN rating_processes rp ON rp.id = wc.rating_process_id 
          WHERE rp.id= :process_id AND wil.is_active = 1 AND m.id = :mandate_id AND m.is_active = 1
          `,
          {
            replacements: {
              mandate_id: el.id,
              process_id: rating_process.id,
              code: params["code"],
            },
            type: QueryTypes.SELECT,
          }
        );

        if (!workflow_instance.length > 0) {
          (reply.statusCode = 422),
            reply.send({
              success: false,
              error: "No Workflow Found",
            });
          return;
        }

        // console.log("workflow_instance: ", workflow_instance);

        let given_user = await User.findOne({
          where: {
            uuid: params["user_uuid"],
            is_active: true,
          },
          raw: true,
        });

        console.log('params["code"]', params["code"]);

        if (
          params["code"] === "10500" ||
          params["code"] === 10190 ||
          params["code"] === "10190"
        ) {
          given_user = await User.findOne({
            where: {
              id: el.gh_id,
              is_active: true,
            },
            raw: true,
          });

          // get_output_rating_sheet_pdf({
          //   company_name: company.name,
          //   company_id: company.id,
          //   fastify: fastify,
          //   rating_process_id: rating_process.id,
          //   request: request
          // });

          // let listing_capture_arr = await ListingDetail.findAll({
          //   where: {
          //     company_id: company.id,
          //     listed_status: "equity",
          //     is_active: true,
          //   },
          //   raw: true,
          // });

          // for (item of listing_capture_arr) {
          //   await ListingDetail.update(
          //     {
          //       close_price_last_review: item.close_price_today,
          //     },
          //     {
          //       where: {
          //         uuid: item.uuid,
          //       },
          //     }
          //   );
          // }
        }
        if (params["code"] === "10550" || params["code"] === "10600") {
          given_user = await User.findOne({
            where: {
              id: el.ra_id,
              is_active: true,
            },
            raw: true,
          });
        }

        let stake_check = await STAKE_CHECK_FUNC(
          company.id,
          given_user ? given_user.id : request.user.id
        );

        if (stake_check.length > 0) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: "User has stake in this company",
            stake_check: "fail",
          });
          return;
        }

        console.log("************>>>>>>>>>>>>>>>>> 343");

        const args = {
          instance: workflow_instance[0],
          user: given_user ? given_user.id : request.user.id,
          mandate_id: el.id,
          activity_code: params.noted ? '11500' : params["code"],
          // next_activity_code: nex_activity[0].code,
          request: request,
          reply: reply,
          rating_process: rating_process.id,
          company_id: company.id,
        };

        console.log("************>>>>>>>>>>>>>>>>> args 358", args);

        var email_params = {};
        var rating = {};
        switch (params["code"]) {
          case "10100":
            email_params = {
              activity_code: 10100,
              activity_name: "Assign Mandate to Group Head",
              template_type: EMAIL_TEMPLATE.WORKFLOW_ASSIGNMENT,
              rating_process: rating_process.name,
              to_user_name: given_user.full_name,
              from_user_name: request.user.full_name,
              to_user_email: given_user.email,
              company: company.name,
              mandate_type: el.mandate_type,
              total_size: el.total_size,
            };
            SEND_GENERAL_EMAIL(email_params);
            break;
          case "10150":
            email_params = {
              activity_code: 10150,
              activity_name: "Assign Mandate to Rating Analyst",
              template_type: EMAIL_TEMPLATE.WORKFLOW_ASSIGNMENT,
              rating_process: rating_process.name,
              to_user_name: given_user.full_name,
              from_user_name: request.user.full_name,
              to_user_email: given_user.email,
              company: company.name,
              mandate_type: el.mandate_type,
              total_size: el.total_size,
              cc: request.user.email,
            };
            SEND_GENERAL_EMAIL(email_params);
            break;
          case "10200":
            email_params = {
              activity_code: 10200,
              activity_name: "Please do due diligence",
              template_type: EMAIL_TEMPLATE.DUE_DILLIGENCE,
              rating_process: rating_process.name,
              to_user_name: request.user.full_name,
              from_user_name: request.user.full_name,
              to_user_email: request.user.email,
              company: company.name,
              mandate_type: el.mandate_type,
              total_size: el.total_size,
            };
            SEND_GENERAL_EMAIL(email_params);
            break;
          case "10250":
            email_params = {
              activity_code: 10250,
              activity_name: "Please complete rating",
              template_type: EMAIL_TEMPLATE.COMPLETE_RATING_MODEL,
              rating_process: rating_process.name,
              to_user_name: request.user.full_name,
              from_user_name: request.user.full_name,
              to_user_email: request.user.email,
              company: company.name,
              mandate_type: el.mandate_type,
              total_size: el.total_size,
            };
            SEND_GENERAL_EMAIL(email_params);
            break;
        }

        const res = await ACTIVITY_LOGICS(args);
        return res;
      });
      const result = await Promise.all(result_promises);

      return reply.send({
        success: true,
        result: result,
      });
    } catch (error) {
      console.log("error: ", error);
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: error.message || String(error),
      });
    }
  });

  fastify.post("/inbox/execution/upload_doc", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Inbox.List");

      const mandate_id = CONVERT_TO_ARRAY(request.body["mandate_id[]"]).map(
        (row) => row["value"]
      );

      console.log("body: ", request.body);

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: request.body["rating_process_uuid"].value,
          is_active: true,
        },
        raw: true,
      });

      if (!rating_process) {
        (reply.statusCode = 422),
          reply.send({
            success: false,
            error: "No Rating Process Found",
          });
        return;
      }

      console.log("rating_process: ", rating_process);

      const mandates = await Mandate.findAll({
        where: {
          mandate_id: mandate_id,
          is_active: true,
        },
        raw: true,
      });

      console.log("mandates: ", mandates);

      if (!mandates) {
        (reply.statusCode = 422),
          reply.send({
            success: false,
            error: "No Mandate Found",
          });
        return;
      }

      var document_path = {};

      const company = await Company.findOne({
        where: {
          id: mandates[0].company_id,
          is_active: true,
        },
        raw: true,
      });

      const workflow_instance = await DB_CLIENT.query(
        `SELECT wi.id,wc.sub_workflow, wi.financial_year_id FROM mandates m 
        INNER JOIN workflow_instances wi ON wi.mandate_id = m.id 
        INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id = wi.id 
        INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
        INNER JOIN rating_processes rp ON rp.id = wc.rating_process_id 
        WHERE rp.id= :process_id AND wil.is_active =1 AND m.id = :mandate_id
        AND m.is_active = 1
        `,
        {
          replacements: {
            mandate_id: mandates[0].id,
            process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      if (!company || workflow_instance.length === 0) {
        (reply.statusCode = 422),
          reply.send({
            success: false,
            error: "No Workflow Found",
          });
        return;
      }

      const workflow_doc = await DB_CLIENT.query(
        `SELECT * FROM workflow_documents wd WHERE company_id = :company_id 
        AND rating_process_id =:rating_process_id AND is_active = 1 ORDER BY id DESC`,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      // const workflow_doc_remark_update = await DB_CLIENT.query(
      //   `UPDATE workflow_document_remarks set is_active = 0 WHERE workflow_document_id =:workflow_document_id`,
      //   {
      //     replacements: {
      //       workflow_document_id:
      //         workflow_doc.length > 0 ? workflow_doc[0].id : null,
      //     },
      //     type: QueryTypes.UPDATE,
      //   }
      // );

      console.log("workflow_doc: ", workflow_doc);

      const workflow_doc_update = await DB_CLIENT.query(
        `UPDATE workflow_documents set is_active = 0 WHERE id =:workflow_document_id`,
        {
          replacements: {
            workflow_document_id:
              workflow_doc.length > 0 ? workflow_doc[0].id : null,
          },
          type: QueryTypes.UPDATE,
        }
      );

      let flag = 1;

      if (request.body["code"].value === "10650") {
        const workflow_document = await WorkflowDocument.create({
          uuid: uuidv4(),
          rating_note:
            workflow_doc.length > 0 ? workflow_doc[0].rating_note : null,
          provisional_communication:
            request.body.provisional_communication.value,
          rating_letter: workflow_doc.length
            > 0 ? workflow_doc[0].rating_letter
            : null,
          press_release: workflow_doc.length
            > 0 ? workflow_doc[0].press_release
            : null,
          rating_sheet: workflow_doc.length
            > 0 ? workflow_doc[0].rating_sheet
            : null,
          financial: workflow_doc.length
            > 0 ? workflow_doc[0].financial
            : null, 
          other_document: workflow_doc.length
            > 0 ? workflow_doc[0].other_document
            : null,
          model_rating_sheet: workflow_doc.length
            > 0 ? workflow_doc[0].model_rating_sheet
            : null,       
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
          role_id: request.active_role_id,
          financial_year_id: workflow_instance[0].financial_year_id,
          rating_process_id: rating_process.id,
        });
        flag = 0;

        // for again downloading document from url and upload to DMS
        try {
          let url_split_arr =
            request.body.provisional_communication.value.split("/");
          let file_name = url_split_arr[url_split_arr?.length - 1];
          await DOWNLOAD_FILE(
            request.body.provisional_communication.value,
            `generated/${file_name}`
          );
          const document_buffer = fs.readFileSync(`generated/${file_name}`);
          const blob = new Blob([document_buffer]);
          const upload_params = {
            company_name: company.name,
            fileName: file_name,
            file: blob,
            document_type: "provisional_communication",
            request: request,
            rating_process: rating_process.name,
            request: request,
          };

          const result = await upload_file_to_dms(upload_params);
        } catch (e) {
          console.log(e);
        }
      }
      if (request.body["code"].value === "10750") {
        const workflow_document = await WorkflowDocument.create({
          uuid: uuidv4(),
          rating_note:
            workflow_doc.length > 0 ? workflow_doc[0].rating_note : null,
          provisional_communication:
            workflow_doc.length > 0
              ? workflow_doc[0].provisional_communication
              : null,
          rating_letter: request.body.rating_letter.value,
          press_release: workflow_doc.length
            > 0 ? workflow_doc[0].press_release
            : null,
          rating_sheet: workflow_doc.length
            > 0 ? workflow_doc[0].rating_sheet
            : null,
          financial: workflow_doc.length
            > 0 ? workflow_doc[0].financial
            : null, 
          other_document: workflow_doc.length
            > 0 ? workflow_doc[0].other_document
            : null,  
          model_rating_sheet: workflow_doc.length
            > 0 ? workflow_doc[0].model_rating_sheet
            : null,     
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
          role_id: request.active_role_id,
          financial_year_id: workflow_instance[0].financial_year_id,
          rating_process_id: rating_process.id,
        });

        // for again downloading document from url and upload to DMS
        let url_split_arr = request.body.rating_letter.value.split("/");
        let file_name = url_split_arr[url_split_arr?.length - 1];
        await DOWNLOAD_FILE(
          request.body.rating_letter.value,
          `generated/${file_name}`
        );
        const document_buffer = fs.readFileSync(`generated/${file_name}`);
        const blob = new Blob([document_buffer]);
        const upload_params = {
          company_name: company.name,
          fileName: file_name,
          file: blob,
          document_type: "rating_letter",
          request: request,
          rating_process: rating_process.name,
        };
        const result = await upload_file_to_dms(upload_params);

        flag = 0;
      }
      if (request.body["code"].value === "10850") {
        const workflow_document = await WorkflowDocument.create({
          uuid: uuidv4(),
          rating_note:
            workflow_doc.length > 0 ? workflow_doc[0].rating_note : null,
          provisional_communication:
            workflow_doc.length > 0
              ? workflow_doc[0].provisional_communication
              : null,
          rating_letter:
            workflow_doc.length > 0 ? workflow_doc[0].rating_letter : null,
          press_release: request.body.press_release.value,
          rating_sheet: workflow_doc.length
            > 0 ? workflow_doc[0].rating_sheet
            : null,
          financial: workflow_doc.length
            > 0 ? workflow_doc[0].financial
            : null, 
          other_document: workflow_doc.length
            > 0 ? workflow_doc[0].other_document
            : null,   
          model_rating_sheet: workflow_doc.length
            > 0 ? workflow_doc[0].model_rating_sheet
            : null,     
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
          role_id: request.active_role_id,
          financial_year_id: workflow_instance[0].financial_year_id,
          rating_process_id: rating_process.id,
        });

        // for again downloading document from url and upload to DMS
        let url_split_arr = request.body.press_release.value.split("/");
        let file_name = url_split_arr[url_split_arr?.length - 1];
        await DOWNLOAD_FILE(
          request.body.press_release.value,
          `generated/${file_name}`
        );
        const document_buffer = fs.readFileSync(`generated/${file_name}`);
        const blob = new Blob([document_buffer]);
        const upload_params = {
          company_name: company.name,
          fileName: file_name,
          file: blob,
          document_type: "press_release",
          request: request,
          rating_process: rating_process.name,
        };
        const result = await upload_file_to_dms(upload_params);
        flag = 0;
      }

      if (flag) {
        let workflow_document_remark = {};
        // if (request.body.remark && request.body.status) {
        //   workflow_document_remark = await WorkflowDocumentRemark.create({
        //     uuid: uuidv4(),
        //     remark: request.body["remark"].value,
        //     status: request.body["status"].value,
        //     created_at: new Date(),
        //     updated_at: new Date(),
        //     created_by: request.user.id,
        //   });
        // }

        // console.log("workflow_document_remark: ", workflow_document_remark);

        if (request.body["rating_note"]) {
          const document_buffer = await request.body["rating_note"].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.rating_note.filename,
          });
          const blob = new Blob([document_buffer]);
          const upload_params = {
            company_name: company.name,
            fileName: request.body.rating_note.filename,
            file: blob,
            document_type: "rating_note",
            request: request,
            rating_process: rating_process.name,
          };

          await upload_file_to_dms(upload_params);

          const workflow_document = await WorkflowDocument.create({
            uuid: uuidv4(),
            rating_note: document_path,
            provisional_communication: workflow_doc.length
              ? workflow_doc[0].provisional_communication
              : null,
            rating_letter: workflow_doc.length
              ? workflow_doc[0].rating_letter
              : null,
            press_release: workflow_doc.length
              ? workflow_doc[0].press_release
              : null,
            rating_sheet: workflow_doc.length
              ? workflow_doc[0].rating_sheet
              : null,
            remark: request.body["remark"]
              ? request.body["remark"].value
              : null,
            status: request.body["status"]
              ? request.body["status"].value
              : null,
            financial: workflow_doc.length
              > 0 ? workflow_doc[0].financial
              : null, 
            other_document: workflow_doc.length
              > 0 ? workflow_doc[0].other_document
              : null,  
            model_rating_sheet: workflow_doc.length
              > 0 ? workflow_doc[0].model_rating_sheet
              : null,       
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            company_id: company.id,
            role_id: request.active_role_id,
            financial_year_id: workflow_instance[0].financial_year_id,
            rating_process_id: rating_process.id,
          });
        } else if (request.body["provisional_communication"]) {
          const document_buffer = await request.body[
            "provisional_communication"
          ].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.provisional_communication.filename,
          });
          const blob = new Blob([document_buffer]);
          const upload_params = {
            company_name: company.name,
            fileName: request.body.provisional_communication.filename,
            file: blob,
            document_type: "provisional_communication",
            request: request,
            rating_process: rating_process.name,
          };

          await upload_file_to_dms(upload_params);

          const workflow_document = await WorkflowDocument.create({
            uuid: uuidv4(),
            rating_note: workflow_doc.length
              ? workflow_doc[0].rating_note
              : null,
            provisional_communication: document_path,
            rating_letter: workflow_doc.length
              ? workflow_doc[0].rating_letter
              : null,
            press_release: workflow_doc.length
              ? workflow_doc[0].press_release
              : null,
            rating_sheet: workflow_doc.length
              ? workflow_doc[0].rating_sheet
              : null,
            remark: request.body["remark"]
              ? request.body["remark"].value
              : null,
            status: request.body["status"]
              ? request.body["status"].value
              : null,
            financial: workflow_doc.length
              > 0 ? workflow_doc[0].financial
              : null, 
            other_document: workflow_doc.length
              > 0 ? workflow_doc[0].other_document
              : null,  
            model_rating_sheet: workflow_doc.length
              > 0 ? workflow_doc[0].model_rating_sheet
              : null,               
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            company_id: company.id,
            role_id: request.active_role_id,
            financial_year_id: workflow_instance[0].financial_year_id,
            rating_process_id: rating_process.id,
          });
        } else if (request.body["rating_letter"]) {
          const document_buffer = await request.body[
            "rating_letter"
          ].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.rating_letter.filename,
          });
          const blob = new Blob([document_buffer]);
          const upload_params = {
            company_name: company.name,
            fileName: request.body.rating_letter.filename,
            file: blob,
            document_type: "rating_letter",
            request: request,
            rating_process: rating_process.name,
          };

          await upload_file_to_dms(upload_params);

          const workflow_document = await WorkflowDocument.create({
            uuid: uuidv4(),
            rating_letter: document_path,
            rating_note: workflow_doc.length
              ? workflow_doc[0].rating_note
              : null,
            provisional_communication: workflow_doc.length
              ? workflow_doc[0].provisional_communication
              : null,
            press_release: workflow_doc.length
              ? workflow_doc[0].press_release
              : null,
            rating_sheet: workflow_doc.length
              ? workflow_doc[0].rating_sheet
              : null,
            financial: workflow_doc.length ? workflow_doc[0].financial : null,
            other_document: workflow_doc.length
              ? workflow_doc[0].other_document
              : null,
            is_active: true,
            remark: request.body["remark"]
              ? request.body["remark"].value
              : null,
            status: request.body["status"]
              ? request.body["status"].value
              : null,
            financial: workflow_doc.length
              > 0 ? workflow_doc[0].financial
              : null, 
            other_document: workflow_doc.length
              > 0 ? workflow_doc[0].other_document
              : null,
            model_rating_sheet: workflow_doc.length
              > 0 ? workflow_doc[0].model_rating_sheet
              : null,           
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            company_id: company.id,
            role_id: request.active_role_id,
            financial_year_id: workflow_instance[0].financial_year_id,
            rating_process_id: rating_process.id,
          });
        } else if (request.body["press_release"]) {
          const document_buffer = await request.body[
            "press_release"
          ].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.press_release.filename,
          });
          const blob = new Blob([document_buffer]);
          const upload_params = {
            company_name: company.name,
            fileName: request.body.press_release.filename,
            file: blob,
            document_type: "press_release",
            request: request,
            rating_process: rating_process.name,
          };

          await upload_file_to_dms(upload_params);

          const workflow_document = await WorkflowDocument.create({
            uuid: uuidv4(),
            press_release: document_path,
            rating_letter: workflow_doc.length
              ? workflow_doc[0].rating_letter
              : null,
            rating_note: workflow_doc.length
              ? workflow_doc[0].rating_note
              : null,
            provisional_communication: workflow_doc.length
              ? workflow_doc[0].provisional_communication
              : null,
            rating_sheet: workflow_doc.length
              ? workflow_doc[0].rating_sheet
              : null,
            financial: workflow_doc.length ? workflow_doc[0].financial : null,
            other_document: workflow_doc.length
              ? workflow_doc[0].other_document
              : null,
            is_active: true,
            remark: request.body["remark"]
              ? request.body["remark"].value
              : null,
            status: request.body["status"]
              ? request.body["status"].value
              : null,
            financial: workflow_doc.length
              > 0 ? workflow_doc[0].financial
              : null, 
            other_document: workflow_doc.length
              > 0 ? workflow_doc[0].other_document
              : null,  
            model_rating_sheet: workflow_doc.length
              > 0 ? workflow_doc[0].model_rating_sheet
              : null, 
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            company_id: company.id,
            role_id: request.active_role_id,
            financial_year_id: workflow_instance[0].financial_year_id,
            rating_process_id: rating_process.id,
          });
        } else if (request.body["rating_sheet"]) {
          const document_buffer = await request.body["rating_sheet"].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.rating_sheet.filename,
          });
          const blob = new Blob([document_buffer]);

          const upload_params = {
            company_name: company.name,
            fileName: request.body.rating_sheet.filename,
            file: blob,
            document_type: "rating_sheet",
            request: request,
            rating_process: rating_process.name,
          };

          await upload_file_to_dms(upload_params);

          const workflow_document = await WorkflowDocument.create({
            uuid: uuidv4(),
            rating_sheet: document_path,
            press_release: workflow_doc.length
              ? workflow_doc[0].press_release
              : null,
            rating_letter: workflow_doc.length
              ? workflow_doc[0].rating_letter
              : null,
            rating_note: workflow_doc.length
              ? workflow_doc[0].rating_note
              : null,
            provisional_communication: workflow_doc.length
              ? workflow_doc[0].provisional_communication
              : null,
            financial: workflow_doc.length ? workflow_doc[0].financial : null,
            other_document: workflow_doc.length
              ? workflow_doc[0].other_document
              : null,
            is_active: true,
            remark: request.body["remark"]
              ? request.body["remark"].value
              : null,
            status: request.body["status"]
              ? request.body["status"].value
              : null,
            financial: workflow_doc.length
              > 0 ? workflow_doc[0].financial
              : null, 
            other_document: workflow_doc.length 
              > 0 ? workflow_doc[0].other_document
              : null,  
            model_rating_sheet: workflow_doc.length
              > 0 ? workflow_doc[0].model_rating_sheet
              : null,   
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            company_id: company.id,
            role_id: request.active_role_id,
            financial_year_id: workflow_instance[0].financial_year_id,
            rating_process_id: rating_process.id,
          });
          if (Object.keys(workflow_document_remark).length > 0) {
            workflow_document_remark.setWorkflow_document(workflow_document);
          }
        }
      }

      const result = mandates.map(async (el) => {
        const workflow_instance = await DB_CLIENT.query(
          `SELECT wi.id,wc.sub_workflow,wi.financial_year_id FROM mandates m 
          INNER JOIN workflow_instances wi ON wi.mandate_id = m.id 
          INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id = wi.id 
          INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
          INNER JOIN activities a ON a.id = wc.current_activity_id AND a.code = :code
          INNER JOIN rating_processes rp ON rp.id = wc.rating_process_id 
          WHERE rp.id= :process_id AND wil.is_active =1 AND m.id = :mandate_id
          `,
          {
            replacements: {
              mandate_id: el.id,
              process_id: rating_process.id,
              code: request.body["code"].value,
            },
            type: QueryTypes.SELECT,
          }
        );

        let given_user = await User.findOne({
          where: {
            uuid: request.body.user_uuid.value
              ? request.body.user_uuid.value
              : null,
            is_active: true,
          },
          raw: true,
        });

        if (
          request.body["code"].value === "10650" ||
          request.body["code"].value === "10750" ||
          request.body["code"].value === "10850"
        ) {
          given_user = await User.findOne({
            where: {
              id: el.gh_id,
              is_active: true,
            },
            raw: true,
          });
        }
        if (request.body["code"].value === "10650") {
          given_user = await User.findOne({
            where: {
              id: el.ra_id,
              is_active: true,
            },
            raw: true,
          });
        }

        console.log("workflow_doc: ", workflow_doc);

        var workflow_document = {};

        const args = {
          instance: workflow_instance[0],
          user: given_user ? given_user.id : request.user.id,
          mandate_id: el.id,
          activity_code: request.body["code"].value,
          // next_activity_code: nex_activity[0].code,
          request: request,
          rating_process: rating_process.id,
          company_id: company.id,
        };

        const return_result = await ACTIVITY_LOGICS(args);
        if (request.body["code"] && request.body["code"].value === "10700") {
          rating = await DB_CLIENT.query(
            `SELECT DISTINCT long_term_rating_assgined_text AS rating, rcm.meeting_at AS meeting_date FROM rating_committee_meeting_registers rcmr
              INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id 
              WHERE long_term_rating_assgined_text IS NOT NULL`,
            {
              replacements: {
                mandate_id: el.id,
              },
              type: QueryTypes.SELECT,
            }
          );
          email_params = {
            activity_code: 10700,
            activity_name: "Mark Rating Acceptance Status",
            template_type: EMAIL_TEMPLATE.WORKFLOW_RATING_LETTER,
            rating_process: rating_process.name,
            to_user_name: given_user.full_name,
            from_user_name: request.user.full_name,
            to_user_email: given_user.email,
            company: company.name,
            mandate_type: el.mandate_type,
            total_size: el.total_size,
            rating: rating,
            meeting_date: rating[0].meeting_date,
            cc: request.user.email,
          };
          SEND_GENERAL_EMAIL(email_params);
        }
        return return_result;
      });

      return reply.send({
        success: true,
        result: result,
      });
    } catch (error) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/inbox/execution/download_doc", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Inbox.List");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const workflow_doc = await DB_CLIENT.query(
        `SELECT TOP 1 wd.*, wdr.remark  FROM workflow_documents wd 
        LEFT JOIN workflow_document_remarks wdr ON wdr.workflow_document_id = wd.id AND wd.is_active = 1
        WHERE wd.company_id =:company_id AND rating_process_id=:rating_process_id ORDER BY wd.id DESC
        `,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      return reply.send({
        success: true,
        workflow_doc: workflow_doc,
      });
    } catch (error) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/inbox/view_executables", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Inbox.View");
      const { params } = request.body;

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      console.log("code: ", params["code"]);

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const companies = await DB_CLIENT.query(
        `SELECT DISTINCT (company_name),
        company_uuid,mandate_uuid,category_name,role_name,role_uuid, mandate_id, total_size, rating_process_name,gh_employee_code, ra_employee_code, rating_process_uuid , gh_name, gh_uuid, ra_uuid, ra_name,
        is_last_activity,
        activity_code FROM (SELECT c.name AS company_name, u1.full_name AS ra_name, u1.uuid AS ra_uuid, u1.employee_code AS ra_employee_code, u.full_name AS gh_name, u.uuid AS gh_uuid,
        u.employee_code AS gh_employee_code,wc.tat, wc.is_last_activity,r.name AS role_name, r.uuid AS role_uuid,
        c.uuid AS company_uuid,m.uuid AS mandate_uuid, m.mandate_id, SUM(ti.instrument_size) AS total_size, rp.name AS rating_process_name, rp.uuid AS rating_process_uuid ,
        a.code AS activity_code, a.name AS activity_to_be_performed,ic.category_name  from companies c
        INNER JOIN mandates m ON m.company_id = c.id
        INNER JOIN workflow_instances wi ON wi.mandate_id = m.id
        INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id
        INNER JOIN instrument_categories ic ON ic.id = ti.instrument_category_id 
        INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id
        INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
        INNER JOIN roles r ON r.id = wc.performer_role_id
        INNER JOIN rating_processes rp ON rp.id = wc.rating_process_id
        INNER JOIN activities a ON a.id = wc.current_activity_id 
        LEFT JOIN users u ON u.id = m.gh_id 
        LEFT JOIN users u1 ON u1.id = m.ra_id 
        where a.code = :code AND wil.is_active =1 AND wc.is_active =1 AND rp.id= :rating_process_id AND c.id = :company_id AND wil.performed_by = :performed_by AND m.is_active = 1 
        GROUP BY c.name,u.employee_code, u.full_name, u.uuid, u1.uuid, u1.full_name,u1.employee_code, wc.tat, wc.is_last_activity,r.name, r.uuid,wc.id,
        c.uuid,m.uuid, m.mandate_id, rp.name, rp.uuid ,
        a.code , a.name ,ic.category_name ) AS my_query
        ORDER BY mandate_id DESC`,
        {
          replacements: {
            company_id: company.id,
            code: params["code"],
            rating_process_id: rating_process.id,
            performer_role_id: request.active_role_id,
            gh: request.user.id,
            performed_by: request.user.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      // console.log("companies: ", companies);

      let extra_fields = await DB_CLIENT.query(
        `SELECT ac.uuid,ac.field_type,ac.field_name,ac.in_table,ac.is_required,ac.is_active FROM activity_configurators ac
        INNER JOIN rating_processes rp ON rp.id = ac.rating_process_id 
        INNER JOIN activities a ON a.id = ac.activity_code_id WHERE a.code = :code AND
        rp.id= :rating_process_id AND ac.is_active = 1 AND ac.redirection IS NULL`,
        {
          replacements: {
            code: params["code"],
            rating_process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      redirection = await DB_CLIENT.query(
        `SELECT ac.redirection_url FROM activity_configurators ac
        INNER JOIN rating_processes rp ON rp.id = ac.rating_process_id 
        INNER JOIN activities a ON a.id = ac.activity_code_id WHERE a.code = :code AND
        rp.id= :rating_process_id AND ac.is_active = 1 AND ac.redirection = 1`,
        {
          replacements: {
            code: params["code"],
            rating_process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      let user_selection = await DB_CLIENT.query(
        `SELECT ac.user_selection FROM activity_configurators ac
        INNER JOIN rating_processes rp ON rp.id = ac.rating_process_id 
        INNER JOIN activities a ON a.id = ac.activity_code_id WHERE a.code = :code AND
        rp.id= :rating_process_id AND ac.is_active = 1`,
        {
          replacements: {
            code: params["code"],
            rating_process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      let last_activity_record = [];

      if (companies.length > 0 && companies[0].is_last_activity) {
        last_activity_record = await DB_CLIENT.query(
          `SELECT DISTINCT id.id AS instrument_detail_id, m.mandate_id,rcmr.previous_rating, rcmr.rating_action,CONCAT(rcmr.sub_category_text, '/',
          rcmr.category_text, '/', rcmr.instrument_text  ) AS instrument,
          id.press_release_date ,id.provisional_communication_date ,id.rating_acceptance_date ,id.rating_acceptance_status, 
          rcmr.long_term_rating_assgined_text AS rating, rcmr.long_term_outlook AS outlook 
          FROM companies c 
                    INNER JOIN mandates m ON m.company_id  = c.id
                    INNER JOIN transaction_instruments ti ON ti.mandate_id  = m.id
                    INNER JOIN instrument_details id ON id.transaction_instrument_id  = ti.id
                    INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id = id.id AND rcmr.is_deferred = 0
                    WHERE c.id = :company_id AND id.is_active = 1 AND id.rating_process_id = :rating_process_id
          `,
          {
            replacements: {
              company_id: company.id,
              performed_by: request.user.id,
              code: params["code"],
              rating_process_id: rating_process.id,
              gh: request.user.id,
              performed_by: request.user.id,
            },
            type: QueryTypes.SELECT,
          }
        );
      }

      reply.send({
        success: true,
        companies: companies,
        last_activity_record: last_activity_record,
        extra_fields: extra_fields,
        redirection_url:
          redirection.length > 0 ? redirection[0].redirection_url : null,
        user_selection: user_selection.includes(0) ? false : true,
      });
    } catch (error) {
      reply.statusCode = 422;
      console.log("error: ", error);
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/inbox", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Inbox.List");

      let companies = await DB_CLIENT.query(
        `                     
        SELECT COUNT(distinct m.id) AS mandate_count,  c.uuid AS company_uuid, c.name  AS company_name , rp.name AS rating_process_name, a.code, 
        a.name AS activity_to_be_performed,wc.tat,
        u.full_name as from_user, u.employee_code as from_user_code,wil.created_by, wd.status,rp.uuid AS rating_process_uuid,
        isnull(wd.remark,'') remark,DATEDIFF(day,wil.created_at, GETDATE()) AS pending_days
        FROM companies c 
        INNER JOIN mandates m ON m.company_id = c.id AND m.is_active =1 
        INNER JOIN workflow_instances wi ON wi.mandate_id =m.id AND wi.is_active =1
        INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id  = wi.id AND wil.is_active =1 AND wil.performed_by =:performed_by
        INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
        INNER JOIN activities a ON a.id = wc.current_activity_id
        INNER JOIN rating_processes rp ON rp.id =wi.rating_process_id 
        INNER JOIN users u ON u.id = wil.assigned_by 
        LEFT JOIN workflow_documents wd ON wd.company_id =c.id AND wd.rating_process_id =rp.id AND wd.is_active =1
        GROUP BY c.uuid , c.name  , rp.name , a.code, a.name ,wc.tat, u.full_name , u.employee_code ,wil.created_by,wd.status,isnull(wd.remark,'') , 
        DATEDIFF(day,wil.created_at, GETDATE()),rp.uuid
        ORDER BY pending_days asc        
      `,
        {
          replacements: {
            id: request.user.id,
            performer_role_id: request.active_role_id,
            performed_by: request.user.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      return reply.send({
        success: true,
        companies: companies,
      });
    } catch (error) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/inbox/execution/rollback", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Inbox.List");
      const { params } = request.body;

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const workflow_instance = await DB_CLIENT.query(
        `SELECT wi.id, wi.mandate_id, wc.sub_workflow FROM companies c  
          INNER JOIN workflow_instances wi ON wi.company_id = c.id 
          INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id = wi.id 
          INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
          INNER JOIN rating_processes rp ON rp.id = wc.rating_process_id 
          INNER JOIN activities a ON a.id = wc.current_activity_id 
          WHERE rp.id= :process_id AND wil.is_active =1 AND a.code = :code AND c.id = :company_id
          AND wil.performed_by = :performed_by
          `,
        {
          replacements: {
            company_id: company.id,
            process_id: rating_process.id,
            code: params["code"],
            performed_by: request.user.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      if (!workflow_instance.length) {
        (reply.statusCode = 422),
          reply.send({
            success: false,
            error: "No Workflow Found",
          });
        return;
      }

      workflow_instance.map(async (el) => {
        const workflow_rollback_log = await WorkflowRollbackLog.create({
          uuid: uuidv4(),
          remark: params["remark"],
          activity_code: params["code"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          workflow_instance_id: el.id,
          rating_process_id: rating_process.id,
        });

        const args = {
          instance: el,
          activity_code: params["code"],
          mandate_id: el.mandate_id,
          // next_activity_code: nex_activity[0].code,
          request: request,
          rating_process: rating_process.id,
        };

        ACTIVITY_ROLLBACK_LOGICS(args);
      });

      return reply.send({
        success: true,
        args: workflow_instance,
      });
    } catch (error) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/send_client_email", async (request, reply) => {
    try {
      const { params } = request.body;

      const company = await Company.findOne({
        where:{
          uuid: params.company_uuid,
          is_active: true
        },
        raw: true
      })

      switch(params.email_type){
        case 'provisional_communication':
          await get_provisional_email_params(company?.id,flag=1);
          break;
        case 'rating_letter':
          await get_rating_letter_email_params(company?.id,flag=1);
          break;
        case 'press_release':
          await get_press_release_email_params(company?.id,flag=1);
            break;        
      }

      return reply.send({
        success: true,
        result: 'email sent',
      });
    } catch (error) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/send_client_email/preview", async (request, reply) => {
    try {
      const { params } = request.body;

      let result = null;

      const company = await Company.findOne({
        where:{
          uuid: params.company_uuid,
          is_active: true
        },
        raw: true
      })

      switch(params.email_type){
        case 'provisional_communication':
          result = await get_provisional_email_params(company?.id,flag=0);
          break;
        case 'rating_letter':
          result = await get_rating_letter_email_params(company?.id,flag=0);
          break;
        case 'press_release':
          result = await get_press_release_email_params(company?.id,flag=0);
            break;        
      }

      return reply.send({
        success: true,
        result: result,
      });
    } catch (error) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: String(error),
      });
    }
  });
}

module.exports = {
  inbox_routes,
  get_args,
  check_stake_in_company,
  upload_file_to_dms,
  STAKE_CHECK_FUNC,
  FIND_CUR_FIN_YEAR,
};
