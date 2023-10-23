const { QueryTypes, Op } = require("sequelize");
const moment = require("moment");
const { DB_CLIENT } = require("../db");
const { UPLOAD_DOCUMENT } = require("../helpers");
const {
  WorkflowInstanceLog,
  WorkflowDocument,
  WorkflowConfig,
  WorkflowInstance,
} = require("../models/modules/workflow");
const { v4: uuidv4 } = require("uuid");
const {
  RatingProcess,
  FinancialYear,
  RatingSymbolMapping,
  RatingSymbolMaster,
} = require("../models/modules/rating-model");
const api = require("../routes/api");
const {
  Role,
  MandateAllocationHistory,
} = require("../models/modules/onboarding");

async function getPreviousRating(dBClient, detailId) {
  console.log("detailId: ", detailId);
  const [previousRating] = await dBClient.query(
    `SELECT previous_rating FROM rating_committee_meeting_registers
    WHERE instrument_detail_id = :detail_id`,
    {
      replacements: {
        detail_id: detailId,
      },
      type: QueryTypes.SELECT,
    }
  );

  console.log("getPreviousRating: previousRating ",previousRating);

  return previousRating;
}

async function calculateRatingAction(
  previousRating,
  finalRating,
  dBClient
) {

  console.log("calculateRatingAction finalRating: ", finalRating);
  console.log("calculateRatingAction previousRating: ", previousRating)

  let ratingAction = "Assigned";

  if (previousRating.previous_rating !== null) {
    let oldRating = previousRating.previous_rating.split("/")[0];

    const oldRatingSuffixes = await RatingSymbolMapping.findOne({
      where: {
        final_rating: oldRating,
        is_active: true,
      },
      attributes: ["prefix", "suffix"],
      raw: true,
    });

    console.log("oldRatingSuffixes: ", oldRatingSuffixes);

    if (oldRatingSuffixes && oldRatingSuffixes.suffix) {
      oldRating = oldRating.split(oldRatingSuffixes.suffix)[0];
    }

    if (oldRatingSuffixes && oldRatingSuffixes.prefix) {
      oldRating = oldRating.split(oldRatingSuffixes.prefix)[0];
    }

    const oldRatingWeightage = await RatingSymbolMaster.findOne({
      where: {
        rating_symbol: oldRating,
        is_active: true,
      },
      attributes: ["rating_grade_number"],
      raw: true,
    });

    let currentRating =
       finalRating.split("/")[0];
        
        let flag = 1;

        if(currentRating === 'Withdrawn'){
          ratingAction = "Withdrawn";
          flag = 0;
        }
        
        console.log("currentRating: ", currentRating)


    const currentRatingSuffixes = await RatingSymbolMapping.findOne({
      where: {
        final_rating: currentRating,
        is_active: true,
      },
      attributes: ["prefix", "suffix"],
      raw: true,
    });

    if (currentRatingSuffixes && currentRatingSuffixes.suffix) {
      currentRating = currentRating.split(currentRatingSuffixes.suffix)[0];
    }

    if (currentRatingSuffixes && currentRatingSuffixes.prefix) {
      currentRating = currentRating.split(currentRatingSuffixes.prefix)[0];
    }

    const currentRatingWeightage = await RatingSymbolMaster.findOne({
      where: {
        rating_symbol: currentRating,
        is_active: true,
      },
      attributes: ["rating_grade_number"],
      raw: true,
    });

    if (flag && oldRatingWeightage?.rating_grade_number > currentRatingWeightage.rating_grade_number) {
      ratingAction = "Downgraded";
    } else if (
      flag && oldRatingWeightage?.rating_grade_number < currentRatingWeightage.rating_grade_number
    ) {
      ratingAction = "Upgraded";
    } else if (
      flag && oldRatingWeightage?.rating_grade_number === currentRatingWeightage.rating_grade_number
    ) {
      ratingAction = "Reaffirmed";
    } 
  }

  return ratingAction;
}

async function updateLongTermRatingAndOutlook(
  dBClient,
  detailId,
  ratingAction,
  finalRating,
  finalOutlook,
  ratingProcess,
  instrument_size
) {
  console.log("*************>>>>>>>> create vote finalRating: ", finalRating);
  let longTermRatingAssignedText = finalRating;

  let longTermOutlook = finalOutlook;
  const flag = longTermOutlook ? 1 : 0;
  const parts = longTermRatingAssignedText.split("/");
  const insert_option =
    parts.length >= 2
      ? `/${longTermOutlook}&`
      : flag
      ? `/${longTermOutlook}`
      : "";
  parts.splice(1, 0, insert_option);
  console.log("parts: ", parts);
  const updatedString = parts.join("");
  console.log("updatedString: ", updatedString);

  if (ratingProcess === 12) {
    longTermRatingAssignedText = updatedString + " ;ISSUER NOT COOPERATING";
  } else if (
    ratingProcess.id === 13 &&
    instrument_size !== 0
  ) {
    longTermRatingAssignedText =
      updatedString + " (Reaffirmed and Withdrawn)";
  } else if (
    ratingProcess.id === 13 &&
    instrument_size === 0
  ) {
    longTermRatingAssignedText = "Withdrawn";
    longTermOutlook = "Nil";
  }
  else{
    longTermRatingAssignedText =
      updatedString;
  }

  console.log("longTermRatingAssignedText: ",longTermRatingAssignedText)


  await dBClient.query(
    `UPDATE rating_committee_meeting_registers
    SET long_term_rating_assgined_text = :long_term_rating_assigned_text,
    rating_action = :rating_action,
    long_term_outlook = :long_term_outlook
    WHERE instrument_detail_id = :detail_id`,
    {
      replacements: {
        long_term_rating_assigned_text: longTermRatingAssignedText,
        long_term_outlook: longTermOutlook,
        detail_id: detailId,
        rating_action: ratingAction,
      },
      type: QueryTypes.UPDATE,
    }
  );
}

async function GET_CURRENT_FINANCIAL_YEAR() {
  return await FinancialYear.findOne({
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
}

async function start_workflow(params) {
  try {
    if (params.instance) {
      await DB_CLIENT.query(
        `UPDATE workflow_instances_log 
     SET is_active = 0, updated_at = :updated_at, updated_by = :updated_by 
     WHERE workflow_instance_id = :instance_id`,
        {
          replacements: {
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_by: params.request.user.id,
            instance_id: params.instance.id,
          },
          type: QueryTypes.UPDATE,
        }
      );
    }

    await DB_CLIENT.query(
      `UPDATE mandates SET mandate_status= 'ASSIGNED' where id= :mandate_id`,
      {
        replacements: {
          mandate_id: params.mandate_id,
        },
        type: QueryTypes.UPDATE,
      }
    );

    const ra_id = await DB_CLIENT.query(
      `SELECT ra_id FROM mandates WHERE id = :id`,
      {
        replacements: {
          id: params.mandate_id,
        },
        type: QueryTypes.SELECT,
      }
    );

    const workflow_doc = await DB_CLIENT.query(
      `SELECT TOP 1 * FROM workflow_documents wd WHERE company_id = :company_id AND rating_process_id =:rating_process_id
        ORDER BY updated_at DESC`,
      {
        replacements: {
          company_id: params.company_id,
          rating_process_id: params.rating_process,
        },
        type: QueryTypes.SELECT,
      }
    );

    let rating_process_name = "",
      rating_process = { id: params.rating_process };
    if (params.flag) {
      rating_process_name =
        rating_process.id === 2
          ? "Representation(Initial)"
          : rating_process.id === 5
          ? "Representation(Surveillance)"
          : null;

      rating_process = await RatingProcess.findOne({
        where: {
          name: rating_process_name,
          is_active: true,
        },
        raw: true,
      });

      const workflow_doc_remark_update = await DB_CLIENT.query(
        `INSERT INTO  workflow_documents (uuid,rating_note,created_at,updated_at,created_by,updated_by,provisional_communication,
          rating_letter,press_release,rating_sheet,rating_process_id,financial_year_id,
          role_id,company_id,financial,other_document) VALUES(:uuid,:rating_note,:created_at,:updated_at,
          :created_by,:updated_by,:provisional_communication,:rating_letter,:press_release,:rating_sheet,
          :rating_process_id,:financial_year_id,:role_id,:company_id,:financial,:other_document)`,
        {
          replacements: {
            rating_process_id: rating_process.id,
            uuid: uuidv4(),
            rating_note: workflow_doc[0].rating_note,
            created_at: workflow_doc[0].created_at,
            updated_at: workflow_doc[0].updated_at,
            created_by: params.request.user.id,
            updated_by: params.request.user.id,
            provisional_communication:
              workflow_doc[0].provisional_communication,
            rating_letter: workflow_doc[0].rating_letter,
            press_release: workflow_doc[0].press_release,
            rating_sheet: workflow_doc[0].rating_sheet,
            financial_year_id: workflow_doc[0].financial_year_id,
            role_id: workflow_doc[0].role_id,
            company_id: workflow_doc[0].company_id,
            financial: workflow_doc[0].financial,
            other_document: workflow_doc[0].other_document,
          },
          type: QueryTypes.UPDATE,
        }
      );
    }

    const financial_year = await GET_CURRENT_FINANCIAL_YEAR();

    const transaction_instruments = await DB_CLIENT.query(
      `SELECT * FROM transaction_instruments WHERE mandate_id = :mandate_id AND is_active= 1`,
      {
        replacements: {
          mandate_id: params.mandate_id,
        },
        type: QueryTypes.SELECT,
      }
    );

    await DB_CLIENT.query(
      `UPDATE instrument_details set is_workflow_done = 1 WHERE transaction_instrument_id IN (SELECT id from transaction_instruments WHERE mandate_id = :mandate_id) AND is_workflow_done = 0`,
      {
        replacements: {
          mandate_id: params.mandate_id,
        },
        type: QueryTypes.UPDATE,
      }
    );

    const child_mandate = await DB_CLIENT.query(
      `SELECT TOP 1 id FROM mandates WHERE parent_mandate_id = :parent_mandate_id ORDER BY id DESC `,
      {
        replacements: {
          parent_mandate_id: params.mandate_id,
        },
        type: QueryTypes.SELECT,
      }
    );

    transaction_instruments.map(async (el) => {
      await DB_CLIENT.query(
        `INSERT INTO instrument_details (uuid,rating_process_id,financial_year_id,transaction_instrument_id,instrument_size,is_active,child_mandate_id,agenda_type_id) VALUES (:uuid,:rating_process_id,:financial_year_id,:transaction_instrument_id,:instrument_size,1,:child_mandate_id,:agenda_type_id) `,
        {
          replacements: {
            rating_process_id: rating_process.id,
            transaction_instrument_id: el.id,
            financial_year_id: financial_year.id,
            instrument_size: el.instrument_size,
            uuid: uuidv4(),
            child_mandate_id:
              child_mandate.length > 0 ? child_mandate[0].id : null,
            agenda_type_id: rating_process.id,
          },
          type: QueryTypes.INSERT,
        }
      );
    });

    configs = await DB_CLIENT.query(
      `SELECT wc.id FROM workflow_configs wc WHERE wc.current_activity_id IN (SELECT id FROM activities a WHERE a.code = '10250' OR a.code = '10160') AND wc.rating_process_id = :rating_process_id               
`,
      {
        replacements: {
          rating_process_id: rating_process.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    console.log("configs: ", configs);

    const res = await WorkflowInstance.create({
      uuid: uuidv4(),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      assigned_at: new Date(),
      performed_at: new Date(),
      company_id: params.company_id,
      mandate_id: params.mandate_id,
      financial_year_id: financial_year.id,
      rating_process_id: rating_process.id,
    });

    const instance_log = await WorkflowInstanceLog.create({
      uuid: uuidv4(),
      log: "ASSIGNED TO RA",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      assigned_at: new Date(),
      performed_at: new Date(),
      created_by: params.request.user.id,
      updated_by: params.request.user.id,
      assigned_by: params.request.user.id,
      performed_by: ra_id[0].ra_id,
      workflow_config_id: configs[0].id,
      workflow_instance_id: res.id,
    });

    if (configs?.length > 2) {
      await WorkflowInstanceLog.create({
        uuid: uuidv4(),
        log: "ASSIGNED TO RA",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        assigned_at: new Date(),
        performed_at: new Date(),
        created_by: params.request.user.id,
        updated_by: params.request.user.id,
        assigned_by: params.request.user.id,
        performed_by: ra_id[0].ra_id,
        workflow_config_id: configs[2]?.id,
        workflow_instance_id: res.id,
      });
    }
  } catch (error) {
    console.log("error: ", error);
  }
}

const workflow_progress_track = async (params) => {
  try {
    const { id: updated_by } = params.request.user;
    const { performing_user, instance } = params;

    console.log("workflow_progress_track instance: ", instance);

    await DB_CLIENT.transaction(async (transaction) => {
      // Update the workflow_instances_log record
      const test = await DB_CLIENT.query(
        `UPDATE workflow_instances_log 
        SET is_active = 0, updated_at = :updated_at, updated_by = :updated_by, status ='Completed' 
        WHERE workflow_instance_id = :instance_id AND is_active = 1 AND workflow_config_id IN (SELECT wc.id FROM workflow_instances_log wil 
        INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id AND wil.workflow_instance_id = :instance_id 
        INNER JOIN activities a ON a.id = wc.current_activity_id AND a.code = :code AND wil.is_active = 1 AND wc.is_active = 1)`,
        {
          replacements: {
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_by,
            instance_id: instance.id,
            code: params.activity_code,
            sub_workflow: instance.sub_workflow,
          },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );

      console.log("test: ", test);

      await DB_CLIENT.query(
        `UPDATE workflow_instances_log 
        SET is_active = 0, updated_at = :updated_at, updated_by = :updated_by, status ='Skipped' 
        WHERE workflow_instance_id = :instance_id AND is_active = 1 AND workflow_config_id IN (SELECT wc.id FROM workflow_instances_log wil 
        INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id AND wil.workflow_instance_id = :instance_id AND wc.sub_workflow = :sub_workflow
        INNER JOIN activities a ON a.id = wc.current_activity_id AND a.code != :code AND wil.is_active =1 AND wc.is_active = 1)`,
        {
          replacements: {
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_by,
            instance_id: instance.id,
            code: params.activity_code,
            sub_workflow: instance.sub_workflow,
          },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );

      // Get the IDs of workflow_configs based on activity code and rating process
      const configs = await DB_CLIENT.query(
        `SELECT DISTINCT(id) 
         FROM workflow_configs 
         WHERE current_activity_id IN (
           SELECT next_activity_id 
           FROM workflow_configs wc
           INNER JOIN activities a ON a.id = wc.current_activity_id 
           WHERE a.code = :code AND wc.rating_process_id = :rating_process_id AND wc.is_last_activity = 0
         ) AND rating_process_id = :rating_process_id AND is_active = 1`,
        {
          replacements: {
            code: params.activity_code,
            rating_process_id: params.rating_process,
          },
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      // Insert new records in WorkflowInstanceLog
      const insertOperations = configs
        ? configs.map(async (el) => {
            return WorkflowInstanceLog.create(
              {
                uuid: uuidv4(),
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: updated_by,
                assigned_by: updated_by,
                performed_by: performing_user,
                workflow_instance_id: instance.id,
                workflow_config_id: el.id,
              },
              { transaction }
            );
          })
        : null;

      const insertedLogs = await Promise.all(insertOperations);
      console.log("workflow_progress_track: insertedLogs: ", insertedLogs);

      // Resolve with the inserted logs
      return insertedLogs;
    });
  } catch (error) {
    // Reject with the error details
    throw {
      error: "workflow_progress_track_failed",
      message: error.message, // Optionally include the error message
    };
  }
};

async function manage_allocation_history(params) {
  const mandate_history = await MandateAllocationHistory.create({
    uuid: uuidv4(),
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
    from_role_id: params.from_role_id,
    from_user_id: params.from_user_id,
    to_user_id: params.to_user_id,
    to_role_id: params.to_role_id,
    mandate_id: params.mandate_id,
    company_id: params.company_id,
    created_by: params.created_by,
  });
}

const ACTIVITY_LOGICS = async (params) => {
  const allocation_params = {};
  let role_name = "";
  const get_roles = await Role.findOne({
    where: {
      name: { [Op.like]: `%${role_name}%` },
      is_active: true,
    },
    attributes: ["id"],
    raw: true,
  });
  console.log(get_roles, "================>");
  try {
    let up_res = "";
    let flag = 1;
    let result = "";
    switch (params.activity_code) {
      case "10100":
        role_name = "Group Head";
        Object.assign(allocation_params, {
          mandate_id: params.mandate_id,
          company_id: params.company_id,
          from_role_id: params.request.active_role_id,
          from_user_id: params.request.user.id,
          to_user_id: params.user,
          to_role_id: get_roles.id,
          created_by: params.request.user.id,
        });
        manage_allocation_history(allocation_params);

        const mandate_update_result = await DB_CLIENT.query(
          `UPDATE mandates set gh_id= :id where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10150":
        role_name = "Rating Analyst";

        Object.assign(allocation_params, {
          mandate_id: params.mandate_id,
          company_id: params.company_id,
          from_role_id: params.request.active_role_id,
          from_user_id: params.request.user.id,
          to_user_id: params.user,
          to_role_id: get_roles.id,
          created_by: params.request.user.id,
        });
        manage_allocation_history(allocation_params);

        await DB_CLIENT.query(
          `UPDATE mandates set ra_id= :id where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10200":
        console.log("10200: ", params.request.body.params);
        await DB_CLIENT.query(
          `UPDATE instrument_details set annual_result = :annual_result, quarterly_result = :quarterly_result, annual_result_date = :annual_result_date WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
        mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) AND rating_process_id = :rating_process_id`,
          {
            replacements: {
              mandate_id: params.mandate_id,
              annual_result: params.request.body.params.annual_result,
              quarterly_result: params.request.body.params.quarterly_result,
              annual_result_date: params.request.body.params.annual_result_date,
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10300":
        role_name = "QCT";

        Object.assign(allocation_params, {
          mandate_id: params.mandate_id,
          company_id: params.company_id,
          from_role_id: params.request.active_role_id,
          from_user_id: params.request.user.id,
          to_user_id: params.user,
          to_role_id: get_roles.id,
          created_by: params.request.user.id,
        });
        manage_allocation_history(allocation_params);

        result = await workflow_progress_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,

          performing_user: params.user,
        });

        break;
      case "10250":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'ASSIGNED',gh_id= :id where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10350":
        role_name = "QCT";

        Object.assign(allocation_params, {
          mandate_id: params.mandate_id,
          company_id: params.company_id,
          from_role_id: params.request.active_role_id,
          from_user_id: params.request.user.id,
          to_user_id: params.user,
          to_role_id: get_roles.id,
          created_by: params.request.user.id,
        });
        manage_allocation_history(allocation_params);

        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'ASSIGNED' where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10400":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'ASSIGNED', ra_id = :ra_id where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
              ra_id: params.user,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10425":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'ASSIGNED', gh_id = :gh_id where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
              gh_id: params.user,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10450":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'SENT TO COMMITTEE' where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10500":
        // code to capture company's share price on date of review

        const share_prices = await DB_CLIENT.query(
          ` select TOP(2) lscp.share_price_today,ld.exchange from latest_share_close_price lscp inner join 
  listing_details ld on ld.id=lscp.listing_detail_id and lscp.scrip_code =ld.scrip_code
  where ld.company_id =:company_id and ld.exchange IN ('NSE','BSE') order by lscp.created_at DESC`,
          {
            replacements: {
              company_id: params.company_id,
            },
            type: QueryTypes.SELECT,
          }
        );
        for (item of share_prices) {
          share_prices[item.exchange] = item.share_price_today;
        }
        result = await DB_CLIENT.query(
          `UPDATE rating_committee_meeting_registers set voting_status = 'Completed',bse_close_price=:bse_price,
          nse_close_price=:nse_price WHERE mandate_id = :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
              nse_price: share_prices["NSE"] || null,
              bse_price: share_prices["BSE"] || null,
            },
            type: QueryTypes.UPDATE,
          }
        );

        const instruments = await DB_CLIENT.query(
          `SELECT id.id AS instrument_detail_id,id.instrument_size, ti.id AS transaction_instrument_id,rcvm.rating AS final_rating, rcvm.outlook AS final_outlook FROM companies c 
          INNER JOIN mandates m ON m.company_id = c.id AND m.id = :mandate_id
          INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id 
          INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id AND id.is_workflow_done = 0
          INNER JOIN rating_committee_voting_metadata rcvm ON rcvm.instrument_detail_id = id.id`,
          {
            replacements: {
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log("instruments: ", instruments);

       for (let el of instruments) {
        const previousRating = await getPreviousRating(
          DB_CLIENT,
          el.instrument_detail_id
        );

        const ratingAction = await calculateRatingAction(
          previousRating,
          el.final_rating,
          DB_CLIENT
        );

        await updateLongTermRatingAndOutlook(
          DB_CLIENT,
          el.instrument_detail_id,
          ratingAction,
          el.final_rating,
          el.final_outlook,
          params.rating_process,
          el.instrument_size
        );
        }

        break;

      case "10550":
        await DB_CLIENT.query(
          `UPDATE mandates SET mandate_status = 'Assigned' WHERE id = :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        await DB_CLIENT.query(
          `DELETE FROM rating_committee_votings  
          WHERE instrument_detail_id IN (SELECT id.id FROM transaction_instruments ti INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id
          WHERE ti.mandate_id = :mandate_id AND is_workflow_done = 0)`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        await DB_CLIENT.query(
          `UPDATE rating_committee_meeting_registers set voting_status = 'Deferred', is_deferred = 1, long_term_rating_assgined_text = 'Deferred' WHERE mandate_id = :mandate_id AND is_fresh = 1`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;
      case "10600":
        await DB_CLIENT.query(
          `UPDATE rating_committee_meeting_registers set overall_status = 'Rating Verified' WHERE mandate_id = :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;
      case "10650":
        up_res = await DB_CLIENT.query(
          `UPDATE instrument_details set provisional_communication_date = :provisional_communication_date WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
      mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id ) AND rating_process_id = :rating_process_id`,
          {
            replacements: {
              mandate_id: params.mandate_id,
              provisional_communication_date: params.request.body
                .provisional_communication_date
                ? params.request.body.provisional_communication_date.value
                : moment().format("YYYY-MM-DD HH:mm:ss"),
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;

      case "10700":
        up_res = await DB_CLIENT.query(
          `UPDATE instrument_details set rating_acceptance_date = :acceptance_date, rating_acceptance_status = :acceptance_status WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
        mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) AND rating_process_id = :rating_process_id`,
          {
            replacements: {
              mandate_id: params.mandate_id,
              acceptance_date: params.request.body.acceptance_date
                ? params.request.body.acceptance_date.value
                : moment().format("YYYY-MM-DD HH:mm:ss"),
              acceptance_status: params.request.body.acceptance_status
                ? params.request.body.acceptance_status.value
                : null,
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        if (
          params.request.body.acceptance_status &&
          params.request.body.acceptance_status.value === "Representation"
        ) {
          const start_workflow_params = {
            rating_process: params.rating_process,
            mandate_id: params.mandate_id,
            company_id: params.company_id,
            request: params.request,
            instance: params.instance,
            flag: 1,
          };
          flag = 0;
          await start_workflow(start_workflow_params);
        }

        break;

      case "10750":
      case "10800":
        up_res = await DB_CLIENT.query(
          `UPDATE instrument_details set rating_letter_date = :rating_letter_date WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
        mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) AND rating_process_id =:rating_process_id `,
          {
            replacements: {
              mandate_id: params.mandate_id,
              rating_letter_date: params.request.body.rating_letter_date
                ? params.request.body.rating_letter_date.value
                : moment().format("YYYY-MM-DD HH:mm:ss"),
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;
      case "10850":
      case "10900":
      case "10950":
        break;
      case "11000":
        if (
          params.request.body.acceptance_status &&
          params.request.body.acceptance_status.value === "Representation"
        ) {
          const start_workflow_params = {
            rating_process: params.rating_process,
            mandate_id: params.mandate_id,
            company_id: params.company_id,
            request: params.request,
            instance: params.instance,
            flag: 1,
          };
          flag = 0;
          await start_workflow(start_workflow_params);
        }
        break;
      case "11050":
        up_res = await DB_CLIENT.query(
          `UPDATE instrument_details set press_release_date = :press_release_date WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
        mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) AND rating_process_id =:rating_process_id `,
          {
            replacements: {
              mandate_id: params.mandate_id,
              press_release_date: params.request.body.press_release_date
                ? params.request.body.press_release_date.value
                : moment().format("YYYY-MM-DD HH:mm:ss"),
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;
      case "11100":
        up_res = await DB_CLIENT.query(
          `UPDATE instrument_details set is_workflow_done = 1 WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
        mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) AND rating_process_id =:rating_process_id `,
          {
            replacements: {
              mandate_id: params.mandate_id,
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        await DB_CLIENT.query(
          `UPDATE workflow_documents set is_active = 0 WHERE company_id =:company_id AND rating_process_id =:rating_process_id`,
          {
            replacements: {
              company_id: params.company_id,
              rating_process_id: params.rating_process,
            },
            type: QueryTypes.UPDATE,
          }
        );

        await DB_CLIENT.query(
          `UPDATE workflow_instances set is_active = 0 WHERE id= :id`,
          {
            replacements: {
              id: params.instance.id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        break;
        case "11500":
          console.log("called 11500");
          await DB_CLIENT.query(
            `UPDATE mandates SET mandate_status = 'Assigned' WHERE id = :mandate_id`,
            {
              replacements: {
                id: params.user,
                mandate_id: params.mandate_id,
              },
              type: QueryTypes.UPDATE,
            }
          );
  
          await DB_CLIENT.query(
            `DELETE FROM rating_committee_votings  
            WHERE instrument_detail_id IN (SELECT id.id FROM transaction_instruments ti INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id
            WHERE ti.mandate_id = :mandate_id AND is_workflow_done = 0)`,
            {
              replacements: {
                id: params.user,
                mandate_id: params.mandate_id,
              },
              type: QueryTypes.UPDATE,
            }
          );
  
          await DB_CLIENT.query(
            `UPDATE rating_committee_meeting_registers set voting_status = 'Noted',  long_term_rating_assgined_text = 'Noted' WHERE mandate_id = :mandate_id AND is_fresh = 1`,
            {
              replacements: {
                id: params.user,
                mandate_id: params.mandate_id,
              },
              type: QueryTypes.UPDATE,
            }
          );
  
          up_res = await DB_CLIENT.query(
            `UPDATE instrument_details set is_workflow_done = 1 WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN 
          mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) AND rating_process_id =:rating_process_id `,
            {
              replacements: {
                mandate_id: params.mandate_id,
                rating_process_id: params.rating_process,
              },
              type: QueryTypes.UPDATE,
            }
          );
  
        await DB_CLIENT.query(
            `UPDATE workflow_documents set is_active = 0 WHERE company_id =:company_id AND rating_process_id =:rating_process_id`,
            {
              replacements: {
                company_id: params.company_id,
                rating_process_id: params.rating_process,
              },
              type: QueryTypes.UPDATE,
            }
          );
  
          await DB_CLIENT.query(
            `UPDATE workflow_instances_log 
            SET is_active = 0, updated_at = :updated_at, updated_by = :updated_by, status ='Completed' 
            WHERE workflow_instance_id = :instance_id AND is_active = 1`,
            {
              replacements: {
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                updated_by: params.request.user.id,
                instance_id: params.instance.id,
                
              },
              type: QueryTypes.UPDATE,
            }
          );

          await DB_CLIENT.query(
            `UPDATE workflow_instances set is_active = 0 WHERE id= :id`,
            {
              replacements: {
                id: params.instance.id,
              },
              type: QueryTypes.UPDATE,
            }
          );
          console.log(" 11500 update done");

          flag = 0;
  
          break;  

      default:
        break;
    }

    if (flag) {
      result = await workflow_progress_track({
        activity_code: params.activity_code,
        request: params.request,
        instance: params.instance,
        rating_process: params.rating_process,
        performing_user: params.user,
      });
    }

    // console.log("ACTIVITY_LOGICS: result: ", result);

    return result;
  } catch (error) {
    throw {
      error: "Activity logic failed",
      message: error.message || String(error), // Optionally include the error message
    };
  }
};

const workflow_rollback_track = async (params) => {
  try {
    // console.log("workflow_rollback_track: ", params.instance);

    await DB_CLIENT.query(
      `UPDATE workflow_instances_log set status= :rollback, is_active = 0, updated_at= :updated_at, updated_by= :updated_by WHERE workflow_config_id IN (SELECT id FROM workflow_configs WHERE current_activity_id IN ( SELECT wc3.next_activity_id FROM workflow_configs wc3 WHERE wc3.current_activity_id IN
        (SELECT wc.current_activity_id FROM workflow_configs wc WHERE wc.next_activity_id IN (SELECT a.id from activities a WHERE a.code = :code) AND
        wc.rating_process_id =:rating_process_id AND wc.sub_workflow = :sub_workflow) AND wc3.rating_process_id = :rating_process_id AND wc3.sub_workflow = :sub_workflow)) AND workflow_instance_id =:instance_id `,
      {
        replacements: { 
          updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          updated_by: params.request.user.id,
          code: params.activity_code,
          rating_process_id: params.rating_process,
          instance_id: params.instance.id,
          rollback: "rollback",
          sub_workflow: params.instance.sub_workflow,
        },
        type: QueryTypes.UPDATE,
      }
    );

    await DB_CLIENT.query(
      `UPDATE workflow_instances_log set is_active = 1 WHERE workflow_config_id IN 
      (SELECT wc.id FROM workflow_configs wc WHERE wc.next_activity_id IN (SELECT a.id from activities 
        a WHERE a.code = :code) AND wc.rating_process_id =:rating_process_id AND wc.sub_workflow = :sub_workflow)
         AND workflow_instance_id =:instance_id`,
      {
        replacements: {
          code: params.activity_code,
          rating_process_id: params.rating_process,
          instance_id: params.instance.id,
          sub_workflow: params.instance.sub_workflow,
        },
        type: QueryTypes.UPDATE,
      }
    );
  } catch (error) {
    throw error;
  }
};

const ACTIVITY_ROLLBACK_LOGICS = async (params) => {
  var result = {};
  try {
    switch (params.activity_code) {
      case "10150":
        await DB_CLIENT.query(
          `UPDATE mandates set gh_id = null where id= :mandate_id`,
          {
            replacements: {
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10200":
        await DB_CLIENT.query(
          `UPDATE mandates set ra_id = null where id= :mandate_id`,
          {
            replacements: {
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;
      case "13000":
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });
        break;

      case "10300":
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });
        break;

      case "10250":
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });
        break;

      case "10350":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'UNASSIGNED' where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });
        break;

      case "10400":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= null where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
              gh_id: params.user,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10450":
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'ASSIGNED' where id= :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10500":
        await DB_CLIENT.query(
          `UPDATE rating_committee_meeting_registers set voting_status = 'Completed'
          WHERE mandate_id = :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10550":
      case "10600":
        await DB_CLIENT.query(
          `UPDATE rating_committee_meeting_registers set voting_status = 'Upcoming', overall_status = 'Voting Ongoing' WHERE mandate_id = :mandate_id`,
          {
            replacements: {
              id: params.user,
              mandate_id: params.mandate_id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;
      case "10650":
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10700":
        // await DB_CLIENT.query(
        //   `UPDATE instrument_details set acceptance_date = :acceptance_date, acceptance_status = :acceptance_status WHERE id IN (Select id.id from instrument_details id INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id INNER JOIN
        // mandates m ON m.id = ti.mandate_id Where m.id = :mandate_id) `,
        //   {
        //     replacements: {
        //       mandate_id: params.mandate_id,
        //       acceptance_date: params.request.body.params.acceptance_date,
        //       acceptance_status: params.request.body.params.acceptance_status,
        //     },
        //     type: QueryTypes.UPDATE,
        //   }
        // );

        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10750":
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      case "10800":
      case "10850":
      case "10900":
      case "10950":
      case "11000":
      case "11050":
      case "11100":
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });

        break;

      default:
        workflow_rollback_track({
          activity_code: params.activity_code,
          // next_activity_code: params.next_activity_code,
          request: params.request,
          instance: params.instance,
          rating_process: params.rating_process,
        });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  ACTIVITY_LOGICS,
  ACTIVITY_ROLLBACK_LOGICS,
  start_workflow,
  manage_allocation_history,
};
