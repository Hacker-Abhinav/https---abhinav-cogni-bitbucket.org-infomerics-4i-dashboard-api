const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../helpers");
const { LANG_DATA } = require("../../lang");
const { LOG_TO_DB } = require("../../logger");
const { error_logger } = require("../../loki-push-agent");
const {
  Role,
  Company,
  Mandate,
  User,
} = require("../../models/modules/onboarding");
const {
  Activity,
  WorkflowConfig,
  WorkflowInstanceLog,
  WorkflowInstance,
  ActivityConfigurator,
} = require("../../models/modules/workflow");
const {
  RatingProcessSchema,
  ActivitySchema,
  WorkflowConfigSchema,
  WorkflowInstanceSchema,
  WorkflowInstanceLogSchema,
} = require("../../schemas/Workflow");
const { GET_ACTIVITY } = require("../../repositories/ActivityRepository");
const { GET_ROLE } = require("../../repositories/RoleRepository");
const {
  GET_RATING_PROCESS,
} = require("../../repositories/RatingProcessRepository");
const { DB_CLIENT } = require("../../db");
const { QueryTypes } = require("sequelize");
const {
  RatingProcess,
  TransactionInstrument,
  InstrumentDetail,
  FinancialYear,
} = require("../../models/modules/rating-model");
const {
  ListWorkflowConfigSchema,
  ViewWorkflowConfigSchema,
  CreateWorkflowConfigSchema,
  EditWorkflowConfigSchema,
} = require("../../schemas/Workflow/WorkflowConfig");
const {
  CreateWorkflowInstanceSchema,
  ListWorkflowInstanceSchema,
  ViewWorkflowInstanceSchema,
  EditWorkflowInstanceSchema,
} = require("../../schemas/Workflow/WorkflowInstance");
const {
  CreateWorkflowInstanceLogSchema,
  ListWorkflowInstanceLogSchema,
  ViewWorkflowInstanceLogSchema,
  EditWorkflowInstanceLogSchema,
} = require("../../schemas/Workflow/WorkflowInstanceLog");
const {
  manage_allocation_history,
} = require("../../services/workflow-activities-bl");
const { STAKE_CHECK_FUNC } = require("./inbox");
const L = LANG_DATA();

function convertToRoleId(inputString) {
  // Convert the input string to lowercase and split it by space
  const words = inputString.toLowerCase().split(" ");

  // Initialize an empty array to store the abbreviation
  let abbreviation = "";

  // Iterate through the words and create the abbreviation
  words.forEach((word, ind) => {
    if (word.length > 0 && ind < 2) {
      abbreviation = abbreviation + word[0]; // Take the first character of each word
    }
  });

  // Join the abbreviation array with underscores to form 'rh_id'
  const rhId = abbreviation + "_id";

  return rhId;
}

async function workflows_routes(fastify) {
  fastify.register((instance, opts, done) => {
    fastify.post("/workflows", async (request, reply) => {
      return reply.send({
        success: true,
        type: "workflows",
      });
    });

    fastify.post(
      "/rating_process/create",
      { schema: RatingProcessSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "RatingProcess.Create");
          const { params } = request.body;

          const rating_process = await RatingProcess.create({
            uuid: uuidv4(),
            name: params["name"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "CREATE_RATING_PROCESS_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_process: rating_process,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_process/create",
            activity: "CREATE_RATING_PROCESS_TYPE",
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
      "/rating_process/view",
      { schema: RatingProcessSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "RatingProcess.View");
          const { params } = request.body;

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          await LOG_TO_DB(request, {
            activity: "VIEW_RATING_PROCESS_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_process: rating_process,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_process/view",
            activity: "VIEW_RATING_PROCESS_TYPE",
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
      "/rating_process",
      { schema: RatingProcessSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "RatingProcess.List");
          const { params } = request.body;

          const where_query = request.body.params ? request.body.params : {};

          const rating_processes = await RatingProcess.findAll({
            where: where_query,
          });

          await LOG_TO_DB(request, {
            activity: "VIEW_ALL_RATING_PROCESS_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_processes: rating_processes,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_type",
            activity: "VIEW_ALL_RATING_PROCESS_TYPE",
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
      "/rating_process/edit",
      { schema: RatingProcessSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "RatingProcess.Edit");
          const { params } = request.body;

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          if (!rating_process) {
            reply.status_code = 403;
            return reply.send({
              success: false,
              error: "NO_RATING_PROCESS",
            });
          }

          const rating_process_update_result = await RatingProcess.update(
            APPEND_USER_DATA(request, {
              name: params["name"],
              is_active: params["is_active"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

          await LOG_TO_DB(request, {
            activity: "EDIT_RATING_PROCESS_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_process_update_result: rating_process_update_result,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_process/edit",
            activity: "EDIT_RATING_PROCESS_TYPE",
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
      "/activity/create",
      { schema: ActivitySchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Activities.Create");

          const { params } = request.body;

          const activity = await Activity.create({
            uuid: uuidv4(),
            code: params["code"],
            name: params["name"],
            completion_status: params["completion_status"],
            alert_message: params["alert_message"],
            remarks: params["remarks"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "CREATE_ACTIVITY",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            activity: activity,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity/create",
            activity: "CREATE_ACTIVITY",
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
      "/activity/view",
      { schema: ActivitySchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Activities.View");

          const { params } = request.body;

          const activity = await Activity.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          await LOG_TO_DB(request, {
            activity: "ACTIVITY_VIEW",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            activity: activity,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity/view",
            activity: "ACTIVITY_VIEW",
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
      "/activity",
      { schema: ActivitySchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Activites.List");
          const { params } = request.body;

          const where_query = request.body.params ? request.body.params : {};

          const activities = await Activity.findAll({
            where: where_query,
          });

          await LOG_TO_DB(request, {
            activity: "ALL_ACTIVITY",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            activities: activities,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity",
            activity: "ALL_ACTIVITY",
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
      "/activity/edit",
      { schema: ActivitySchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Activities.Edit");
          const { params } = request.body;

          const activity_update_result = await Activity.update(
            APPEND_USER_DATA(request, {
              code: params["code"],
              name: params["name"],
              completion_status: params["completion_status"],
              alert_message: params["alert_message"],
              remarks: params["remarks"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

          await LOG_TO_DB(request, {
            activity: "EDIT_ACTIVITY",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            activity_update_result: activity_update_result,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity/edit",
            activity: "EDIT_ACTIVITY",
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
      "/workflow_config/create",
      { schema: CreateWorkflowConfigSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Configurator.Create");
          const { params } = request.body;

          const current_activity = await GET_ACTIVITY({
            uuid: params["current_activity_uuid"],
            is_active: true,
          });

          const next_activity = await Activity.findOne({
            where: {
              uuid: params["next_activity_uuid"],
              is_active: true,
            },
          });

          const assigner_role = await GET_ROLE({
            uuid: params["assigner_role_uuid"],
            is_active: true,
          });

          const performer_role = await GET_ROLE({
            uuid: params["performer_role_uuid"],
            is_active: true,
          });

          const rating_process = await GET_RATING_PROCESS({
            uuid: params["rating_process_uuid"],
            is_active: true,
          });

          const workflow_config = await DB_CLIENT.query(
            `
            INSERT INTO workflow_configs
            (uuid, serial_number, is_last_activity, is_active, tat, created_at, updated_at, created_by, updated_by, current_activity_id,
               next_activity_id, assigner_role_id, performer_role_id, rating_process_id,is_parallel,sub_workflow)
            VALUES(
              :uuid,
              :serial_number,
              :is_last_activity,
              :is_active,
              :tat,
              :created_at,
              :updated_at,
              :created_by,
              :updated_by,
              :current_activity_id,
              :next_activity_id,
              :assigner_role_id,
              :performer_role_id,
              :rating_process_id,
              :is_parallel,
              :sub_workflow
            );
          `,
            {
              replacements: {
                uuid: uuidv4(),
                serial_number: params["serial_number"],
                is_last_activity: params["is_last_activity"],
                is_active: true,
                tat: Number.parseInt(params["tat"], 10),
                created_at: new Date(),
                updated_at: new Date(),
                created_by: request.user.id,
                updated_by: request.user.id,
                current_activity_id: current_activity.id,
                next_activity_id: next_activity ? next_activity.id : null,
                assigner_role_id: assigner_role.id,
                performer_role_id: performer_role.id,
                rating_process_id: rating_process.id,
                is_parallel: params["is_parallel"],
                sub_workflow: params["sub_workflow"],
              },
              type: QueryTypes.INSERT,
            }
          );

          await LOG_TO_DB(request, {
            activity: "CREATE_WORKFLOW_CONFIG",
            params: {
              data: params,
            },
          });

          return reply.send({
            success: true,
            workflow_config: workflow_config,
          });
        } catch (error) {
          console.log("error: ", error);

          const error_log = {
            api: "v1/workflow_config/create",
            activity: "CREATE_WORKFLOW_CONFIG",
            params: {
              error: error,
            },
          };
          error_logger.info(JSON.stringify(error_log));

          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: error,
          });
        }
      }
    );

    fastify.post(
      "/workflow_config",
      { schema: ListWorkflowConfigSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Configurator.List");
          const { params } = request.body;

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: params["rating_process_uuid"],
            },
          });

          const activities = await DB_CLIENT.query(
            `
          SELECT * 
          FROM view_workflow_config 
          WHERE rating_process_id=:rating_process_id
          ORDER BY current_activity_code ASC;
        `,
            {
              replacements: {
                rating_process_id: rating_process.id,
              },
              type: QueryTypes.SELECT,
            }
          );

          await LOG_TO_DB(request, {
            activity: "ALL_WORKFLOW_CONFIG",
            params: {
              data: params,
            },
          });

          return reply.send({
            success: true,
            activities: activities,
          });
        } catch (error) {
          console.log("error: ", error);
          const error_log = {
            api: "v1/workflow_config",
            activity: "ALL_WORKFLOW_CONFIG",
            params: {
              error: String(error),
            },
          };
          error_logger.info(JSON.stringify(error_log));

          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: error["errors"] ?? String(error),
          });
        }
      }
    );

    fastify.post(
      "/workflow_config/view",
      { schema: ViewWorkflowConfigSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowConfig.View");
          const { params } = request.body;

          const workflow_config = await WorkflowConfig.findOne({
            where: {
              uuid: params["uuid"],
            },
            include: [
              {
                model: Activity,
                as: "current_activity",
              },
              {
                model: Activity,
                as: "next_activity",
              },
              {
                model: Role,
                as: "assigner_role",
              },
              {
                model: Role,
                as: "performer_role",
              },
            ],
          });

          await LOG_TO_DB(request, {
            activity: "WORKFLOW_CONFIG_VIEW",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            workflow_config: workflow_config,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_config/view",
            activity: "WORKFLOW_CONFIG_VIEW",
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
      "/workflow_config/edit",
      { schema: EditWorkflowConfigSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowConfig.Edit");
          const { params } = request.body;

          const current_activity = await Activity.findOne({
            where: {
              uuid: params["current_activity_uuid"],
              is_active: true,
            },
          });

          if (!current_activity) {
            reply.status_code = 403;
            return reply.send({
              success: false,
              error: "CURRENT_ACTIVITY_NOT_FOUND",
            });
          }

          const next_activity = await Activity.findOne({
            where: {
              uuid: params["next_activity_uuid"],
              is_active: true,
            },
          });

          const assigner_role = await Role.findOne({
            where: {
              uuid: params["assigner_role_uuid"],
              is_active: true,
            },
          });

          if (!assigner_role) {
            reply.status_code = 403;
            return reply.send({
              success: false,
              error: "ASSIGNER_ROLE_NOT_FOUND",
            });
          }

          const performer_role = await Role.findOne({
            where: {
              uuid: params["performer_role_uuid"],
              is_active: true,
            },
          });

          if (!performer_role) {
            reply.status_code = 403;
            return reply.send({
              success: false,
              error: "PERFORMER_ROLE_NOT_FOUND",
            });
          }

          const workflow_config_object = await WorkflowConfig.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: params["rating_process_uuid"],
              is_active: true,
            },
          });

          if (!rating_process) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_RATING_PROCESS"],
            });
            return;
          }

          const workflow_config_update_result = await WorkflowConfig.update(
            APPEND_USER_DATA(request, {
              serial_number: params["serial_number"],
              tat: params["tat"],
              is_last_activity: params["is_last_activity"],
              is_active: params["is_active"],
              is_parallel: params["is_parallel"],
              sub_workflow: params["sub_workflow"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

          await workflow_config_object.setCurrent_activity(current_activity);
          if (next_activity) {
            await workflow_config_object.setNext_activity(next_activity);
          }
          await workflow_config_object.setAssigner_role(assigner_role);
          await workflow_config_object.setPerformer_role(performer_role);
          await workflow_config_object.setRating_process(rating_process);

          await LOG_TO_DB(request, {
            activity: "EDIT_WORKFLOW_CONFIG",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            workflow_config_update_result: Boolean(
              workflow_config_update_result[0] === 1
            ),
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_config/edit",
            activity: "EDIT_WORKFLOW_CONFIG",
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
      "/workflow_instance/create",
      { schema: CreateWorkflowInstanceSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.Create");

          const { params } = request.body;

          const company = await Company.findOne({
            where: {
              uuid: params["company_uuid"],
            },
          });

          if (!company) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_COMPANY"],
            });
            return;
          }

          const mandate = await Mandate.findOne({
            where: {
              uuid: params["mandate_uuid"],
            },
          });

          if (!mandate) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_MADATE_FOUND"],
            });
            return;
          }

          const workflow_instance = await WorkflowInstance.create({
            uuid: uuidv4(),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            assigned_at: params["assigned_at"],
            performed_at: params["performed_at"],
          });

          await LOG_TO_DB(request, {
            activity: "CREATE_WORKFLOW_INSTANCE",
            params: {
              data: params,
            },
          });

          await workflow_instance.setCompany(company);
          await workflow_instance.setMandate(mandate);

          reply.send({
            success: true,
            workflow_instance: workflow_instance,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_instance/create",
            activity: "CREATE_WORKFLOW_INSTANCE",
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
      "/workflow_instance/view",
      { schema: ViewWorkflowInstanceSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.View");

          const { params } = request.body;

          const workflow_instance = await WorkflowInstance.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          await LOG_TO_DB(request, {
            activity: "VIEW_WORKFLOW_INSTANCE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            workflow_instance: workflow_instance,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_instance/view",
            activity: "VIEW_WORKFLOW_INSTANCE",
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
      "/workflow_instance",
      { schema: ListWorkflowInstanceSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

          const { params } = request.body;

          const where_query = request.body.params ? request.body.params : {};

          const workflow_instance = await WorkflowInstance.findAll({
            where: where_query,
          });

          await LOG_TO_DB(request, {
            activity: "LIST_WORKFLOW_INSTANCE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            workflow_instance: workflow_instance,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_instance",
            activity: "LIST_WORKFLOW_INSTANCE",
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
      "/workflow_instance/edit",
      { schema: EditWorkflowInstanceSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.Edit");

          const { params } = request.body;

          const company = await Company.findOne({
            where: {
              uuid: params["company_uuid"],
            },
          });

          if (!company) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_COMPANY"],
            });
            return;
          }

          const mandate = await Mandate.findOne({
            where: {
              uuid: params["mandate_uuid"],
            },
          });

          if (!mandate) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_MADATE_FOUND"],
            });
            return;
          }

          const workflow_instance_object = await WorkflowInstance.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          const workflow_instance_update_result = await WorkflowInstance.update(
            APPEND_USER_DATA(request, {
              assigned_at: params["assigned_at"],
              performed_at: params["performed_at"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

          await LOG_TO_DB(request, {
            activity: "EDIT_WORKFLOW_INSTANCE",
            params: {
              data: params,
            },
          });

          await workflow_instance_object.setCompany(company);
          await workflow_instance_object.setMandate(mandate);

          reply.send({
            success: true,
            workflow_instance_update_result: Boolean(
              workflow_instance_update_result[0] === 1
            ),
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_instance/edit",
            activity: "EDIT_WORKFLOW_INSTANCE",
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
      "/workflow_instance_log/create",
      { schema: CreateWorkflowInstanceLogSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.Create");

          const { params } = request.body;

          const workflow_instance = await WorkflowInstance.findOne({
            where: {
              uuid: params["workflow_instance_uuid"],
            },
          });

          if (!workflow_instance) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_WORKFLOW_INSTANCE"],
            });
            return;
          }

          const workflow_instance_log = await WorkflowInstanceLog.create({
            uuid: uuidv4(),
            log: params["log"],
            ip_address: params["ip_address"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "CREATE_WORKFLOW_INSTANCE_LOG",
            params: {
              data: params,
            },
          });

          await workflow_instance_log.setWorkflow_instance(workflow_instance);

          reply.send({
            success: true,
            workflow_instance_log: workflow_instance_log,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_config/create",
            activity: "EDIT_WORKFLOW_CONFIG",
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
      "/workflow_instance_log",
      { schema: ListWorkflowInstanceLogSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

          const { params } = request.body;

          const where_query = request.body.params ? request.body.params : {};

          const workflow_instance_log = await WorkflowInstanceLog.findAll({
            where: where_query,
          });

          await LOG_TO_DB(request, {
            activity: "ALL_WORKFLOW_INSTANCE_LOG",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            workflow_instance_log: workflow_instance_log,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_config",
            activity: "ALL_WORKFLOW_INSTANCE_LOG",
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
      "/workflow_instance_log/view",
      { schema: ViewWorkflowInstanceLogSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.View");

          const { params } = request.body;

          const workflow_instance_log = await WorkflowInstanceLog.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

          await LOG_TO_DB(request, {
            activity: "VIEW_WORKFLOW_INSTANCE_LOG",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            workflow_instance_log: workflow_instance_log,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_config",
            activity: "ALL_WORKFLOW_INSTANCE_LOG",
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
      "/workflow_instance_log/edit",
      { schema: EditWorkflowInstanceLogSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "WorkflowInstance.Edit");

          const { params } = request.body;

          const workflow_instance = await WorkflowInstance.findOne({
            where: {
              uuid: params["workflow_instance_uuid"],
            },
          });

          if (!workflow_instance) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_WORKFLOW_INSTANCE"],
            });
            return;
          }

          const workflow_instance_log_update_result =
            await WorkflowInstanceLog.update(
              APPEND_USER_DATA(request, {
                log: params["log"],
                ip_address: params["ip_address"],
              }),
              {
                where: {
                  uuid: params["uuid"],
                },
              }
            );

          await LOG_TO_DB(request, {
            activity: "EDIT_WORKFLOW_INSTANCE_LOG",
            params: {
              data: params,
            },
          });

          await workflow_instance_log_update_result.setWorkflow_instance(
            workflow_instance
          );

          reply.send({
            success: true,
            workflow_instance_log_update_result:
              workflow_instance_log_update_result,
          });
        } catch (error) {
          let error_log = {
            api: "v1/workflow_instance_log/edit",
            activity: "EDIT_WORKFLOW_INSTANCE_LOG",
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

    fastify.post("/mandate_lifecycle", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        let mandates = await DB_CLIENT.query(
          `SELECT DISTINCT m.id FROM companies c 
          INNER JOIN mandates m ON m.company_id = c.id AND c.id = :company_id WHERE m.mandate_id IS NOT NULL AND m.parent_mandate_id IS NULL
        `,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log("mandates: ", mandates);

        const mandate_id_array = mandates
          ? mandates.map((el) => {
              return el.id;
            })
          : [];

        let workflow_instances = await Promise.all(
          mandates.map(async (el) => {
            const data = await DB_CLIENT.query(
              `SELECT TOP 1 id FROM workflow_instances WHERE mandate_id = :mandate_id ORDER BY id DESC`,
              {
                replacements: {
                  mandate_id: el.id,
                },
                type: QueryTypes.SELECT,
              }
            );
            return data ? data[0]?.id : null;
          })
        );

        console.log("workflow_instances: ", workflow_instances);

        // const workflow_instances = await WorkflowInstance.findAll({
        //   where:{
        //     mandate_id: mandate_id_array
        //   },
        //   raw: true,
        // })

        workflow_instances = workflow_instances.filter((el) => el);

        const company_mandates = await Promise.all(
          workflow_instances.map(async (el) => {
            const data = await DB_CLIENT.query(
              `exec GetMandateDetails @workflowInstanceID = :workflow_id`,
              {
                replacements: {
                  workflow_id: el,
                },
                type: QueryTypes.SELECT,
              }
            );
            console.log("data: ", data);
            return data[0];
          })
        );

        reply.send({
          success: true,
          company_mandates: company_mandates,
        });
      } catch (error) {
        let error_log = {
          api: "v1/mandate_lifecycle",
          activity: "MANDATE_LIFECYCLE",
          params: {
            error: String(error),
          },
        };
        console.log("error: ", error);
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/mandate_lifecycle/view", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.View");

        const mandate = await Mandate.findOne({
          where: {
            uuid: params["mandate_uuid"],
          },
          raw: true,
        });

        let mandate_status = await DB_CLIENT.query(
          `
          WITH DistinctWorkflowInstanceIDs AS (
            SELECT DISTINCT wi.id AS workflow_instance_id,rp2.name AS rating_process
            FROM workflow_instances_log wil 
            INNER JOIN workflow_instances wi ON wi.id = wil.workflow_instance_id
            INNER JOIN rating_processes rp2 ON rp2.id = wi.rating_process_id 
            INNER JOIN mandates m ON m.id = wi.mandate_id 
            WHERE m.id = :mandate_id
        )
        SELECT 
            DISTINCT workflow_instance_id,rating_process,
            (
                SELECT 
                    a.code, 
                    a.name AS activity_name, 
                    rp.name AS rating_process,
                    r.name AS performer_role, 
                    r1.name AS assigner_role, 
                    u.full_name AS performed_by_user, 
                    wc.sub_workflow,
                    wil.status, 
                    wil.created_at, 
                    wil.updated_at
                FROM workflow_instances_log wil 
                INNER JOIN workflow_instances wi ON wi.id = wil.workflow_instance_id
                INNER JOIN mandates m ON m.id = wi.mandate_id 
                INNER JOIN rating_processes rp ON rp.id = wi.rating_process_id 
                INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id 
                INNER JOIN roles r ON r.id = wc.performer_role_id
                INNER JOIN roles r1 ON r1.id = wc.assigner_role_id 
                INNER JOIN users u ON u.id = wil.performed_by 
                INNER JOIN activities a ON a.id = wc.current_activity_id 
                WHERE wi.id = DistinctWorkflowInstanceIDs.workflow_instance_id
                FOR JSON PATH
            ) AS workflow_instance_details_json
        FROM DistinctWorkflowInstanceIDs
        ORDER BY workflow_instance_id DESC;
        `,
          {
            replacements: {
              mandate_id: mandate.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          mandate_status: mandate_status,
        });
      } catch (error) {
        let error_log = {
          api: "v1/mandate_lifecycle/view",
          activity: "MANDATE_LIFECYCLE_VIEW",
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

    fastify.post("/transfer_cases", async (request, reply) => {
      try {
        const { params } = request.body;
        const { limit, offset } = params;
        let sortBy = "created_at";
        let sortOrder = "DESC";
        let llimit = limit;
        let ooffset = offset;
        if (limit === "all") {
          llimit = 10000;
        }
        console.log("Limit ", llimit, ooffset);

        await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

        const user_with_role = await User.findOne({
          where: {
            uuid: params["from_user_uuid"],
          },
          raw: true,
        });

        console.log(user_with_role);
        ("SET @Sql_Query=@Sql_Query + ' Order By '+@sortBy+'  '+@sortOrder+' OFFSET ' +convert(varchar(10),@offset)+ ' ROWS FETCH NEXT '+convert(varchar(10),@limit)+' ROWS ONLY'");
        const mandates = await DB_CLIENT.query(
          `
        SELECT COUNT(*) OVER() as count, c.name AS company_name, c.id AS company_id, m.mandate_id AS mandate_id,m.id AS m_id, m.uuid AS mandate_uuid, u.full_name AS rating_analyst, usr.full_name AS group_head, usrs.full_name AS rating_head
        from mandates m
        INNER JOIN companies c ON c.id = m.company_id
        LEFT JOIN users u ON u.id = m.gh_id
        LEFT JOIN users usr ON usr.id = m.ra_id
        LEFT JOIN users usrs ON usrs.id = m.rh_id
        LEFT JOIN users usrr ON usrr.id = m.bd_id
        WHERE m.ra_id = :user_id OR m.gh_id = :user_id OR m.rh_id = :user_id OR m.bd_id = :user_id  Order By company_name  ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `,
          {
            replacements: {
              user_id: user_with_role.id,
              limit: llimit,
              offset: ooffset,
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          mandates: mandates,
          count: mandates?.[0]?.count,
        });
      } catch (error) {
        let error_log = {
          api: "v1/transfer_cases",
          activity: "TRANSFER_CASES",
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

    fastify.post("/my_portfolio", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

        const role_id = convertToRoleId(request.active_role_name);

        console.log("role_id: ", role_id);

        if (role_id === "sa_id") {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "No Data Available",
          });
        }

        let companies = await DB_CLIENT.query(
          `SELECT DISTINCT c.name AS company_name, s.name AS sector,i.name AS industry, si.name AS sub_industry,
          CONVERT(datetime,DATEADD(year,1,rcm.meeting_at)) AS anniverysary, rcmr.instrument_size_number AS rated_amount,
          rcmr.long_term_rating_assgined_text AS rating, rcmr.is_short_term,rcmr.is_long_term,
           c.id AS company_id, c.uuid AS company_id FROM companies c 
          INNER JOIN sectors s ON s.id = c.sector_id 
          INNER JOIN industries i ON i.id = c.industry_id 
          INNER JOIN sub_industries si ON si.id = c.sub_industry_id  
          LEFT JOIN rating_committee_meeting_registers rcmr ON rcmr.company_id = c.id AND rcmr.is_fresh = 1
          LEFT JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id 
          WHERE c.id IN (SELECT c1.id FROM mandates m1
          INNER JOIN companies c1 ON c1.id = m1.company_id WHERE m1.${role_id} = :user_id)
        `,
          {
            replacements: {
              user_id: request.user.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        companies = companies.map((el) => {
          if (el.is_short_term && el.is_long_term && el.rating != null) {
            el.long_term_rating = el.rating.split("&")[0];
            el.short_term_rating = el.rating.split("&")[1];
          } else if (el.is_short_term) {
            el.long_term_rating = null;
            el.short_term_rating = el.rating;
          } else {
            el.long_term_rating = el.rating;
            el.short_term_rating = null;
          }
          return el;
        });

        reply.send({
          success: true,
          companies: companies,
        });
      } catch (error) {
        let error_log = {
          api: "v1/transfer_cases",
          activity: "TRANSFER_CASES",
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

    fastify.post("/view_surveillance/mandates", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY",
          });
          return;
        }

        const is_workflow_found = await DB_CLIENT.query(
          `
          SELECT id.id  FROM companies c 
          INNER JOIN mandates m ON m.company_id = c.id 
          INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id
          INNER JOIN  instrument_details id ON id.transaction_instrument_id = ti.id AND id.is_workflow_done = 0
          INNER JOIN rating_processes rp ON id.rating_process_id = rp.id AND rp.id != 13
          WHERE c.id = :company_id 
        `,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        if (is_workflow_found.length > 0) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error:
              "Either withdrawal is done or some other rating process is running!",
          });
          return;
        }

        const mandates = await DB_CLIENT.query(
          `
         SELECT DISTINCT ti.uuid AS transaction_instrument_uuid, m.mandate_id,m.uuid AS mandate_uuid,u.uuid AS rating_analyst_uuid,u.employee_code  AS rating_analyst_employee_code,
         u.full_name AS rating_analyst, ti.instrument_size, ic.category_name AS instrument_category_name, isc.category_name AS instrument_sub_category_name, i.name AS instrument
         FROM mandates m 
         INNER JOIN companies c ON c.id = m.company_id 
         INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id 
         INNER JOIN instrument_categories ic ON ic.id = ti.instrument_category_id 
         INNER JOIN instrument_sub_categories isc ON isc.id = ti.instrument_sub_category_id 
         INNER JOIN instruments i ON i.id = ti.instrument_id 
         INNER JOIN users u ON u.id = m.ra_id 
          WHERE c.id = :company_id AND ti.is_active = 1 AND m.is_active = 1
          ORDER BY m.mandate_id DESC
        `,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        await LOG_TO_DB(request, {
          activity: "GET_MANDATE_FOR_SURVEILLANCE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          mandates: mandates,
        });
      } catch (error) {
        let error_log = {
          api: "v1/view_surveillance/mandates",
          activity: "GET_MANDATE_FOR_SURVEILLANCE",
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

    fastify.post("/initiate/rating_cycle", async (request, reply) => {
      try {
        let { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.View");

        const rating_cycle = await RatingProcess.findOne({
          where: {
            uuid: request.body["rating_cycle_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_cycle) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_PROCESS_FOUND",
          });
          return;
        }

        const financial_year = await FinancialYear.findOne({
          where: {
            uuid: request.body["financial_year_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!financial_year) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "NO_FINANCIAL_YEAR_FOUND",
          });
          return;
        }

        const rating_analyst = await User.findOne({
          where: {
            uuid: request.body["rating_analyst_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_analyst) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "NO_RATING_ANALYST_FOUND",
          });
          return;
        }

        const company = await Company.findOne({
          where: {
            uuid: request.body.company_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_FOUND",
          });
          return;
        }

        let stake_check = await STAKE_CHECK_FUNC(company.id, rating_analyst.id);

        if (stake_check.length > 0) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: "User has stake in this company",
            stake_check: "fail",
          });
          return;
        }

        configs = await DB_CLIENT.query(
          `SELECT wc.id FROM workflow_configs wc WHERE wc.current_activity_id IN (SELECT id FROM activities a WHERE a.code = '10250' OR a.code = '10160') AND wc.rating_process_id = :rating_process_id               
          `,
          {
            replacements: {
              rating_process_id: rating_cycle.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        if (configs.length === 0) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "NO_WORKFLOW_FOUND",
          });
          return;
        }

        params = await Promise.all(
          params.map(async (el) => {
            const tra_res = await TransactionInstrument.findOne({
              where: {
                uuid: el.transaction_instrument_uuid,
                is_active: true,
              },
              raw: true,
            });

            const mandate_res = await Mandate.findOne({
              where: {
                uuid: el.mandate_uuid,
                is_active: true,
              },
              raw: true,
            });

            const agenda_type = await RatingProcess.findOne({
              where: {
                uuid: el.agenda_type_uuid,
                is_active: true,
              },
              raw: true,
            });

            el.transaction_instrument_id = tra_res.id;
            el.mandate_id = mandate_res.id;
            el.agenda_type_id = agenda_type.id;

            return el;
          })
        );

        console.log("params: ", params);

        params.map(async (el) => {
          const res = await TransactionInstrument.update(
            APPEND_USER_DATA(request, {
              instrument_size: el["instrument_size"],
            }),
            {
              where: {
                uuid: el.transaction_instrument_uuid,
              },
            }
          );
        });

        const my_set = new Set();

        const instrument_bulk_data = params.map((el) => {
          const obj = {
            uuid: uuidv4(),
            instrument_size: el.instrument_size,
            annual_result: request.body["financial_result"],
            annual_result_result: request.body["year_end_date"],
            quarterly_result: request.body["quarterly_result"],
            is_active: true,
            is_workflow_done: false,
            trigger_event: el.trigger_event,
            reduce_enhancement: el.reduce_enhancement,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            transaction_instrument_id: el.transaction_instrument_id,
            rating_process_id: rating_cycle.id,
            agenda_type_id: el.agenda_type_id,
            financial_year_id: financial_year.id,
          };
          my_set.add(el.mandate_id);
          return obj;
        });

        const instrument_detail_create = await InstrumentDetail.bulkCreate(
          instrument_bulk_data
        );

        for (const item of my_set) {
          const res = await WorkflowInstance.create({
            uuid: uuidv4(),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            assigned_at: new Date(),
            performed_at: new Date(),
            company_id: company.id,
            mandate_id: item,
            financial_year_id: financial_year.id,
            rating_process_id: rating_cycle.id,
          });

          const instance_log = await WorkflowInstanceLog.create({
            uuid: uuidv4(),
            log: "ASSIGNED TO RA",
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            assigned_at: new Date(),
            performed_at: new Date(),
            created_by: request.user.id,
            updated_by: request.user.id,
            assigned_by: request.user.id,
            performed_by: rating_analyst.id,
            workflow_config_id: configs[0].id,
            workflow_instance_id: res.id,
          });

          if (configs.length > 2) {
            await WorkflowInstanceLog.create({
              uuid: uuidv4(),
              log: "ASSIGNED TO RA",
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
              assigned_at: new Date(),
              performed_at: new Date(),
              created_by: request.user.id,
              updated_by: request.user.id,
              assigned_by: request.user.id,
              performed_by: rating_analyst.id,
              workflow_config_id: configs[2].id,
              workflow_instance_id: res.id,
            });
          }
        }

        await LOG_TO_DB(request, {
          activity: "INITIATE_RATING_CYCLE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          bulk_data: instrument_detail_create,
        });
      } catch (error) {
        let error_log = {
          api: "v1/initiate/rating_cycle",
          activity: "INITIATE_RATING_CYCLE",
          params: {
            error: String(error),
          },
        };
        console.log("error: ", error);
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/transfer_cases/edit", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.Edit");

        const to_user = await User.findOne({
          where: {
            uuid: params["to_user_uuid"],
          },
        });

        const from_user = await User.findOne({
          where: {
            uuid: params["from_user_uuid"],
          },
        });

        const role = await Role.findOne({
          where: {
            uuid: params["role_uuid"],
          },
        });

        const mandate_alloc_history = await DB_CLIENT.query(
          `SELECT c.id AS company_id, m.id AS mandate_uniq_id FROM
           companies c INNER JOIN mandates m ON m.company_id = c.id WHERE m.mandate_id in (:mandate_ids)`,
          {
            replacements: { mandate_ids: params["mandate_id"] },
            type: QueryTypes.SELECT,
          }
        );

        mandate_alloc_history.forEach((mandate) => {
          let allocation_params = {
            mandate_id: mandate.mandate_uniq_id,
            company_id: mandate.company_id,
            from_role_id: request.active_role_id,
            from_user_id: request.user.id,
            to_user_id: to_user.id,
            to_role_id: role.id,
            created_by: request.user.id,
          };
          manage_allocation_history(allocation_params);
        });
        let workflow_log_update_response = 0;
        try {
          const this_instrument_detail = await DB_CLIENT.query(
            `select top 1 m.id as mandate_id_int,id.financial_year_id,id.rating_process_id from companies c
             inner join mandates m on m.company_id=c.id
inner join transaction_instruments ti on ti.mandate_id = m.id 
inner join instrument_details id on id.transaction_instrument_id =ti.id 
where m.mandate_id in (:mandate_ids) and id.is_workflow_done =0 order by id.updated_at desc`,
            {
              replacements: { mandate_ids: params["mandate_id"] },
              type: QueryTypes.SELECT,
            }
          );

          console.log(this_instrument_detail);
          const workflow_instance = await WorkflowInstance.findOne({
            where: {
              rating_process_id: this_instrument_detail[0].rating_process_id,
              is_active: true,
              financial_year_id: this_instrument_detail[0].financial_year_id,
              mandate_id: this_instrument_detail[0].mandate_id_int,
            },
            raw: true,
          });
          console.log(workflow_instance);

          const workflow_instance_log = await WorkflowInstanceLog.findOne({
            where: {
              workflow_instance_id: workflow_instance.id,
              is_active: true,
              performed_by: from_user.id,
            },

            raw: true,
          });
          console.log(workflow_instance_log);

          workflow_log_update_response = await WorkflowInstanceLog.update(
            APPEND_USER_DATA(request, { performed_by: to_user.id }),
            {
              where: {
                workflow_instance_id: workflow_instance.id,
                is_active: true,
                performed_by: from_user.id,
              },
            }
          );
        } catch (e) {
          console.log(e);
        }

        var update_result = "";

        switch (role.name) {
          case "Rating Analyst":
            update_result = await Mandate.update(
              APPEND_USER_DATA(request, {
                ra_id: to_user.id,
              }),
              {
                where: {
                  ra_id: from_user.id,
                  mandate_id: params["mandate_id"],
                },
              }
            );

            break;
          case "Group Head":
            update_result = await Mandate.update(
              APPEND_USER_DATA(request, {
                gh_id: to_user.id,
              }),
              {
                where: {
                  gh_id: from_user.id,
                  mandate_id: params["mandate_id"],
                },
              }
            );
            break;
          case "Rating Head":
            update_result = await Mandate.update(
              APPEND_USER_DATA(request, {
                rh_id: to_user.id,
              }),
              {
                where: {
                  rh_id: from_user.id,
                  mandate_id: params["mandate_id"],
                },
              }
            );
            break;
          case "Business Development Admin":
          case "Business Development Coordinator":
            update_result = await Mandate.update(
              APPEND_USER_DATA(request, {
                bd_id: to_user.id,
              }),
              {
                where: {
                  bd_id: from_user.id,
                  mandate_id: params["mandate_id"],
                },
              }
            );
            break;
        }

        reply.send({
          success: true,
          mandate_update_result: update_result,
          workflow_log_update_response: workflow_log_update_response,
        });
      } catch (error) {
        let error_log = {
          api: "v1/transfer_cases/edit",
          activity: "EDIT_TRANSFER_CASES",
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

    fastify.post("/view_documents", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "WorkflowInstance.List");

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY",
          });
          return;
        }

        const rating_process = await RatingProcess.findOne({
          where: {
            uuid: params["rating_process_uuid"],
            is_active: true,
          },
          raw: true,
        });

        const financial_year = await FinancialYear.findOne({
          where: {
            uuid: params["financial_year_uuid"],
            is_active: true,
          },
          raw: true,
        });

        const mandates = await DB_CLIENT.query(
          `
        SELECT DISTINCT ti.uuid AS transaction_instrument_uuid,m.updated_at, m.mandate_id,m.uuid AS mandate_uuid,u.uuid AS rating_analyst_uuid,u.employee_code  AS rating_analyst_employee_code,
u.full_name AS rating_analyst, ti.instrument_size, ic.category_name AS instrument_category_name, isc.category_name AS instrument_sub_category_name, i.name AS instrument FROM mandates m 
INNER JOIN companies c ON c.id = m.company_id 
INNER JOIN workflow_instances wi ON wi.mandate_id = m.id 
INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id 
INNER JOIN instrument_categories ic ON ic.id = ti.instrument_category_id 
INNER JOIN instrument_sub_categories isc ON isc.id = ti.instrument_sub_category_id 
INNER JOIN instruments i ON i.id = ti.instrument_id 
INNER JOIN workflow_instances_log wil ON wil.workflow_instance_id = wi.id 
INNER JOIN workflow_configs wc ON wc.id = wil.workflow_config_id
INNER JOIN users u ON u.id = m.ra_id 
 WHERE c.id = :company_id AND wc.rating_process_id = 2 AND wc.is_last_activity = 1 AND wi.is_active = 1
 ORDER BY m.updated_at DESC
        `,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        await LOG_TO_DB(request, {
          activity: "GET_MANDATE_FOR_SURVEILLANCE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          mandates: mandates,
        });
      } catch (error) {
        let error_log = {
          api: "v1/view_surveillance/mandates",
          activity: "GET_MANDATE_FOR_SURVEILLANCE",
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

    fastify.post("/hierarchy/users", async (request, reply) => {
      try {
        const { params } = request.body;

        const role = await Role.findOne({
          where: {
            uuid: params["role_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!role) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: "NO_ROLE",
          });
          return;
        }

        let users = [];

        if (params["is_hierarchy"]) {
          users = await DB_CLIENT.query(
            `
        SELECT * FROM users u
        INNER JOIN user_has_roles uhr ON uhr.user_id = u.id
        WHERE u.id IN ( SELECT urt.user_id  FROM user_reports_to urt WHERE urt.report_to_user_id =:user_id)
        AND uhr.role_id =:role_id
        `,
            {
              replacements: {
                user_id: request.user.id,
                role_id: role.id,
              },
              type: QueryTypes.SELECT,
            }
          );
        } else {
          users = await DB_CLIENT.query(
            `
        SELECT * FROM users u
        INNER JOIN user_has_roles uhr ON uhr.user_id = u.id
        WHERE uhr.role_id =:role_id
        `,
            {
              replacements: {
                user_id: request.user.id,
                role_id: role.id,
              },
              type: QueryTypes.SELECT,
            }
          );
        }

        await LOG_TO_DB(request, {
          activity: "GET_USERS_HIERARCHY",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          users: users,
        });
      } catch (error) {
        let error_log = {
          api: "v1/hierarchy/users",
          activity: "GET_USERS_HIERARCHY",
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

    fastify.post("/workflow/master_keys", async (request, reply) => {
      try {
        const { params } = request.body;

        let master_keys = await DB_CLIENT.query(
          `
        SELECT DISTINCT [group] FROM master_commons mc WHERE description like 'work%'
        `,
          {
            type: QueryTypes.SELECT,
          }
        );

        master_keys = master_keys.map((el) => el.group);

        await LOG_TO_DB(request, {
          activity: "GET_WORKFLOW_MASTER_KEYS",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          master_keys: master_keys,
        });
      } catch (error) {
        let error_log = {
          api: "v1/workflow/master_keys",
          activity: "GET_WORKFLOW_MASTER_KEYS",
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
      "/activity_configurators",
      { schema: RatingProcessSchema },
      async (request, reply) => {
        try {
          // await CHECK_PERMISSIONS(request, "RatingProcess.List");
          const { params } = request.body;

          let where_query = {};

          where_query = Object.keys(params).includes("is_active")
            ? Object.assign(where_query, { is_active: params.is_active })
            : {};

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: params["rating_process_uuid"],
              is_active: true,
            },
            raw: true,
          });

          where_query = rating_process
            ? Object.assign(where_query, {
                rating_process_id: rating_process.id,
              })
            : where_query;

          const activity_code = await Activity.findOne({
            where: {
              code: params["activity_code"],
              is_active: true,
            },
            raw: true,
          });

          where_query = activity_code
            ? Object.assign(where_query, { activity_code_id: activity_code.id })
            : where_query;

          const activity_configurators = await ActivityConfigurator.findAll({
            where: where_query,
          });

          await LOG_TO_DB(request, {
            activity: "VIEW_ALL_ACTIVITY_CONFIGURATOR",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            activity_configurators: activity_configurators,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity_configurators",
            activity: "VIEW_ALL_ACTIVITY_CONFIGURATOR",
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
      "/activity_configurators/edit",
      { schema: ActivitySchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Activities.Create");

          const { params } = request.body;

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: request.body["rating_process_uuid"],
              is_active: true,
            },
            raw: true,
          });

          if (!rating_process) {
            reply.statusCode = 403;
            reply.send({
              success: false,
              error: "NO_RATING_PROCESS_FOUND",
            });
            return;
          }

          const activity_code = await Activity.findOne({
            where: {
              code: request.body["activity_code"],
              is_active: true,
            },
            raw: true,
          });

          if (!activity_code) {
            reply.statusCode = 403;
            reply.send({
              success: false,
              error: "NO_ACTIVITY_CODE_FOUND",
            });
            return;
          }

          const configurator_bulk_data = [];

          params.map((el) => {
            const obj = {
              uuid: el.uuid,
              user_selection: el?.user_selection,
              redirection: request.body.redirection,
              redirection_url: request.body.redirection_url,
              field_type: el["field_type"],
              field_name: el["field_name"],
              in_table: el["in_table"],
              is_required: el["is_required"],
              is_active: el["is_active"],
              updated_at: new Date(),
              updated_by: request.user.id,
              activity_code_id: activity_code.id,
              rating_process_id: rating_process.id,
            };
            configurator_bulk_data.push(obj);
          });

          const update_result = await Promise.all(
            configurator_bulk_data.map(async (el) => {
              await ActivityConfigurator.upsert(el);
            })
          );

          await LOG_TO_DB(request, {
            activity: "UPDATE_ACTIVITY_CONFIGURATOR",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            result: update_result,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_process/edit",
            activity: "EDIT_RATING_PROCESS_TYPE",
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
      "/activity_configurators/create",
      { schema: ActivitySchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Activities.Create");

          const { params } = request.body;

          const rating_process = await RatingProcess.findOne({
            where: {
              uuid: request.body["rating_process_uuid"],
              is_active: true,
            },
            raw: true,
          });

          if (!rating_process) {
            reply.statusCode = 403;
            reply.send({
              success: false,
              error: "NO_RATING_PROCESS_FOUND",
            });
            return;
          }

          const activity_code = await Activity.findOne({
            where: {
              code: request.body["activity_code"],
              is_active: true,
            },
            raw: true,
          });

          if (!activity_code) {
            reply.statusCode = 403;
            reply.send({
              success: false,
              error: "NO_ACTIVITY_CODE_FOUND",
            });
            return;
          }

          const configurator_bulk_data = [];

          params.map((el) => {
            const obj = {
              uuid: uuidv4(),
              user_selection: el?.user_selection,
              redirection: el?.redirection,
              redirection_url: el?.redirection_url,
              field_type: el?.field_type,
              field_name: el?.field_name,
              in_table: el?.in_table,
              is_required: el?.is_required,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: request.user.id,
              activity_code_id: activity_code.id,
              rating_process_id: rating_process.id,
            };
            configurator_bulk_data.push(obj);
          });

          const result = await ActivityConfigurator.bulkCreate(
            configurator_bulk_data
          );

          await LOG_TO_DB(request, {
            activity: "CREATE_ACTIVITY_CONFIGURATOR",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            result: result,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity/create",
            activity: "CREATE_ACTIVITY",
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
      "/activity_configurators/view",
      { schema: RatingProcessSchema },
      async (request, reply) => {
        try {
          // await CHECK_PERMISSIONS(request, "RatingProcess.List");
          const { params } = request.body;

          const activity_configurator = await ActivityConfigurator.findOne({
            where: {
              uuid: params["uuid"],
            },
            includes: [
              {
                model: Activity,
                as: "activity_code",
              },
              {
                model: RatingProcess,
                as: "rating_process",
              },
            ],
          });

          await LOG_TO_DB(request, {
            activity: "VIEW_ACTIVITY_CONFIGURATOR",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            activity_configurator: activity_configurator,
          });
        } catch (error) {
          let error_log = {
            api: "v1/activity_configurators/view",
            activity: "VIEW_ALL_ACTIVITY_CONFIGURATOR",
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

    fastify.post("/workflows/create_copy", async (request, reply) => {
      try {
        const { params } = request.body;

        const existing_rating_process = await RatingProcess.findOne({
          where: {
            uuid: params["existing_rating_process_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!existing_rating_process) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_WORKFLOW"],
          });
          return;
        }

        const new_rating_process = await RatingProcess.findOne({
          where: {
            uuid: params["new_rating_process_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!new_rating_process) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_WORKFLOW"],
          });
          return;
        }

        let workflow = await DB_CLIENT.query(
          `SELECT serial_number,is_last_activity,is_active,created_at,updated_at,created_by,updated_by,current_activity_id,
          next_activity_id,assigner_role_id,performer_role_id,rating_process_id,tat,is_parallel, sub_workflow FROM workflow_configs wc WHERE rating_process_id=:rating_process_id`,
          {
            replacements: {
              rating_process_id: existing_rating_process.id,
              created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
              updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
              created_by: request.user.id,
              updated_by: request.user.id,
              new_rating_process_id: new_rating_process.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log("workflow: ", workflow);
        const bulk_data = workflow.map((el) => {
          el.uuid = uuidv4();
          el.rating_process_id = new_rating_process.id;
          return el;
        });

        const new_workflow = await WorkflowConfig.bulkCreate(bulk_data);
        reply.send({
          success: true,
          result: new_workflow,
        });
      } catch (error) {
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
  workflows_routes,
};
