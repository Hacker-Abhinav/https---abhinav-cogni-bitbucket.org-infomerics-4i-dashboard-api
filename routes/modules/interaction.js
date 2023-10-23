const { v4: uuidv4 } = require("uuid");
const { Op, QueryTypes, Sequelize } = require("sequelize");
const {
  InteractionQuestion,
  InteractionType,
  DueDiligence,
  DiligenceData,
  DueDiligenceDocument,
} = require("../../models/modules/interaction");

const { LANG_DATA } = require("../../lang");
const L = LANG_DATA();
const { error_logger } = require("../../loki-push-agent");
const { LOG_TO_DB } = require("../../logger");
const {
  APPEND_USER_DATA,
  CHECK_PERMISSIONS,
  UPLOAD_DOCUMENT,
  UPLOAD_TO_AZURE_STORAGE,
} = require("../../helpers");
const moment = require("moment");
const {
  Company,
  Stakeholder,
  User,
  ContactDetail,
} = require("../../models/modules/onboarding");
const { DB_CLIENT } = require("../../db");
const { SEND_GENERAL_EMAIL } = require("../../services/send-email");
const { EMAIL_TEMPLATE } = require("../../constants/constant");

async function interaction_routes(fastify) {
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

    fastify.post("/interaction_type", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.List");
        const { params } = request.body;

        let whereClause = Object.keys(params).length === 0 ? {} : params;
        const interaction_type = await InteractionType.findAll({
          where: whereClause,
          attributes: { exclude: ["id"] },
        });

        await LOG_TO_DB(request, {
          activity: "LIST_INTERACTION_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_type: interaction_type,
        });
      } catch (error) {
        let error_log = {
          api: "v1/interaction_type",
          activity: "LIST_INTERACTION_TYPE",
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

    fastify.post("/interaction_type/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.Create");
        const { params } = request.body;

        const interaction_type = await InteractionType.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await LOG_TO_DB(request, {
          activity: "CREATE_INTERACTION_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_type: interaction_type.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/interaction_type/create",
          activity: "CREATE_INTERACTION_TYPE",
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

    fastify.post("/interaction_type/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.View");
        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: request.body.params.uuid,
          },
          attributes: { exclude: ["id"] },
        });

        await LOG_TO_DB(request, {
          activity: "VIEW_INTERACTION_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_type: interaction_type,
        });
      } catch (error) {
        let error_log = {
          api: "v1/interaction_type/view",
          activity: "VIEW_INTERACTION_TYPE",
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

    fastify.post("/interaction_type/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.Edit");
        const { params } = request.body;

        const interaction_type = await InteractionType.update(
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
          activity: "EDIT_INTERACTION_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_type_update_done: Boolean(interaction_type[0] === 1),
        });
      } catch (error) {
        let error_log = {
          api: "v1/interaction_type/edit",
          activity: "EDIT_INTERACTION_TYPE",
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

    fastify.post("/interactions/create_question", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.Create");
        const { params } = request.body;

        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: params["interaction_type_uuid"],
            is_active: true,
          },
        });

        if (!interaction_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO INTERACTION TYPE",
          });
          return;
        }

        const interaction_question = await InteractionQuestion.create({
          uuid: uuidv4(),
          name: JSON.stringify(params["name"]),
          question_order: params["question_order"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await interaction_question.setInteraction_type(interaction_type);

        await LOG_TO_DB(request, {
          activity: "CREATE_INTERACTION_QUESTION",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_question_uuid: interaction_question.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/interactions/create_question",
          activity: "CREATE_INTERACTION_QUESTION",
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

    fastify.post("/interactions/edit_question", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.Edit");
        const { params } = request.body;

        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: params["interaction_type_uuid"],
            is_active: true,
          },
        });

        if (!interaction_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO INTERACTION TYPE",
          });
          return;
        }

        const interaction_question_object = await InteractionQuestion.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        const interaction_question = await InteractionQuestion.update(
          APPEND_USER_DATA(request, {
            name: JSON.stringify(params["name"]),
            question_order: params["question_order"],
            is_active: params["is_active"],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        await interaction_question_object.setInteraction_type(interaction_type);

        await LOG_TO_DB(request, {
          activity: "UPDATE_INTERACTION_QUESTION",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_question_update_result: Boolean(
            interaction_question[0] === 1
          ),
        });
      } catch (error) {
        let error_log = {
          api: "v1/interactions/edit_question",
          activity: "UPDATE_INTERACTION_QUESTION",
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

    fastify.post("/interactions/view_questions", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.View");
        const { params } = request.body;

        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: params["interaction_type_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!interaction_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO INTERACTION TYPE",
          });
          return;
        }

        const where_query = {
          interaction_type_id: interaction_type.id,
        };

        if (Object.keys(params).includes("is_active")) {
          where_query["is_active"] = true;
        }

        let interaction_questions = await InteractionQuestion.findAll({
          where: where_query,
          attributes: { exclude: ["id"] },
          order: [["question_order", "ASC"]],
        });

        interaction_questions = interaction_questions.map((question) => {
          question.name = JSON.parse(question.name);
          return {
            question,
          };
        });

        await LOG_TO_DB(request, {
          activity: "GET_INTERACTION_QUESTION",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_questions: interaction_questions,
        });
      } catch (error) {
        let error_log = {
          api: "v1/interactions/view_questions",
          activity: "GET_INTERACTION_QUESTION",
          params: {
            error,
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

    fastify.post("/interactions/question/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Interactions.View");
        const { params } = request.body;

        let interaction_question = await InteractionQuestion.findOne({
          where: {
            uuid: params["uuid"],
          },
          include: {
            model: InteractionType,
            as: "interaction_type",
          },
          raw: true,
          nest: true,
        });

        if (interaction_question) {
          interaction_question.name = JSON.parse(interaction_question.name);
        }

        await LOG_TO_DB(request, {
          activity: "VIEW_QUESTION",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          interaction_question: interaction_question,
        });
      } catch (error) {
        let error_log = {
          api: "v1/interactions/question/view",
          activity: "VIEW_QUESTION",
          params: {
            error,
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error,
        });
      }
    });

    fastify.post("/due_diligences/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.Create");
        const { params } = request.body;

        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: request.body.interaction_type_uuid,
            is_active: true,
          },
        });

        if (!interaction_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO INTERACTION TYPE",
          });
          return;
        }

        const company = await Company.findOne({
          where: {
            uuid: request.body.company_uuid,
            is_active: true,
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

        const stakeholder = await Stakeholder.findOne({
          where: {
            uuid: request.body.stakeholder_uuid,
            is_active: true,
          },
        });

        const diligence_data = await DiligenceData.create({
          uuid: uuidv4(),
          meeting_type: request.body["meeting_type"],
          phone_number: request.body["phone_number"],
          place_of_visit: request.body["place_of_visit"],
          contact_person: JSON.stringify(request.body["contact_person"]),
          remarks: request.body.remarks,
          time_of_interaction: request.body["time_of_interaction"],
          branch: request.body["branch"],
          status: request.body["status"],
          contact_email: JSON.stringify(request.body["contact_email"]),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        if (stakeholder) {
          await diligence_data.setStakeholder(stakeholder);
        }

        await diligence_data.setInteraction_type(interaction_type);
        await diligence_data.setCompany(company);

        let due_diligence;

        if (params) {
          const diligence_bulk_data = params.map((diligence) => {
            diligence.uuid = uuidv4();
            diligence.diligence_data_id = diligence_data.id;
            diligence.question = JSON.stringify(diligence.question);
            diligence.response = JSON.stringify(diligence.response);
            diligence.is_master =
              diligence.is_master === false ? diligence.is_master : true;
            diligence.created_at = new Date();
            diligence.updated_at = new Date();
            diligence.created_by = request.user.id;
            diligence.is_active = true;
            return diligence;
          });

          due_diligence = await DueDiligence.bulkCreate(diligence_bulk_data);
        }

        await LOG_TO_DB(request, {
          activity: "CREATE_DUE_DILIGENCE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          diligence_data_uuid: diligence_data.uuid,
          due_diligence: due_diligence,
        });
      } catch (error) {
        let error_log = {
          api: "v1/due_diligences/create",
          activity: "CREATE_DUE_DILIGENCE",
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

    fastify.post("/due_diligences/assign_documents", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.Edit");

        let document_url = "";
        let document_urls = [];

        const diligence_data = await DiligenceData.findOne({
          where: {
            uuid: request.body["diligence_data_uuid"].value,
            is_active: true,
          },
        });

        if (!diligence_data) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO DUE DILIGENCE FOUND",
          });
          return;
        }

        const due_diligences_doc = await DueDiligenceDocument.findOne({
          where: {
            diligence_data_id: diligence_data.id,
            is_active: true
          }
        })

        if (due_diligences_doc) {
          document_urls.push(...JSON.parse(due_diligences_doc.document))
        }

        console.log('document_urls==============>', document_urls);
        
        if (Array.isArray(request.body.document)) {
          for (let file of request.body.document) {
            const document_buffer = await file.toBuffer();
            document_url = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
              path: file.filename
            })
            document_urls.push(document_url)
          }
        } else {
          const documetn_buffer = await request.body.document.toBuffer();
          document_url = await UPLOAD_TO_AZURE_STORAGE(documetn_buffer,  {
            path: request.body.document.filename
          })
          document_urls.push(document_url)
        }

        const due_diligence_docs = await DueDiligenceDocument.findAll({
          where: {
            diligence_data_id: diligence_data.id,
            is_active: true
          }
        })

        if (due_diligence_docs) {
          due_diligence_docs.forEach(async d => {
            await DB_CLIENT.query(`
            UPDATE due_diligence_documents SET is_active = 0 WHERE diligence_data_id = :diligence_data_id
          `, {
            replacements: {
              diligence_data_id: d.diligence_data_id
            },
            type: QueryTypes.UPDATE
          })
          })
        }

        const diligence_document = await DueDiligenceDocument.create({
          uuid: request.body.uuid ? request.body.uuid.value : uuidv4(),
          document: JSON.stringify(document_urls),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          diligence_data_id: diligence_data.id,
        });

        await LOG_TO_DB(request, {
          activity: "ASSIGN_DILIGENCE_DOCUMENT",
          params: {
            data: request.query,
          },
        });

        reply.send({
          success: true,
          diligence_document: diligence_document,
          document_urls: document_urls,
        });
      } catch (error) {
        let error_log = {
          api: "v1/diligence/assign_documents",
          activity: "ASSIGN_DILIGENCE_DOCUMENT",
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

    fastify.post("/due_diligence/delete_documents", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.Edit");
        const { params } = request.body;

        const diligence_data = await DiligenceData.findOne({
          where: {
            uuid: params["due_diligence_uuid"],
            is_active: true,
          },
        });

        if (!diligence_data) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: "NO DUE DILIGENCE FOUND",
          });
        }

        const diligence_document_update = await DueDiligenceDocument.update(
          APPEND_USER_DATA(request, {
            document: JSON.stringify(params["doc_urls"]),
          }),
          {
            where: {
              diligence_data_id: diligence_data.id,
            },
          }
        );

        await LOG_TO_DB(request, {
          activity: "DELETE_DILIGENCE_DOCUMENT",
          params: {
            data: request.query,
          },
        });

        reply.send({
          success: true,
          diligence_document_update: diligence_document_update,
        });
      } catch (error) {
        let error_log = {
          api: "v1/diligence/delete_documents",
          activity: "DELETE_DILIGENCE_DOCUMENT",
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

    fastify.post("/due_diligences/view_documents", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.View");
        const { params } = request.body;

        const diligence_data = await DiligenceData.findOne({
          where: {
            uuid: params["diligence_data_uuid"],
            is_active: true,
          },
        });

        if (!diligence_data) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO DUE DILIGENCE FOUND",
          });
          return;
        }

        const diligence_document = await DueDiligenceDocument.findOne({
          where: {
            diligence_data_id: diligence_data.id,
            is_active: true,
          },
        });

        if (!diligence_document) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "No Due Diligence Document Found",
          });
        }

        diligence_document.document = JSON.parse(diligence_document.document);

        await LOG_TO_DB(request, {
          activity: "VIEW_DILIGENCE_DOCUMENT",
          params: {
            data: request.query,
          },
        });

        reply.send({
          success: true,
          diligence_document: diligence_document,
        });
      } catch (error) {
        let error_log = {
          api: "v1/diligence/view_documents",
          activity: "VIEW_DILIGENCE_DOCUMENT",
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

    fastify.post("/due_diligences/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.View");
        const { params } = request.body;

        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: params["interaction_type_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!interaction_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO INTERACTION TYPE",
          });
          return;
        }

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
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

        const due_diligence = await DiligenceData.findAll({
          where: {
            interaction_type_id: interaction_type.id,
            company_id: company.id,
          },
          attributes: { exclude: ["id"] },
          include: [
            {
              model: Company,
              as: "company",
              attributes: ["uuid", "name"],
            },
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["uuid", "name"],
            },
            {
              model: InteractionType,
              as: "interaction_type",
              attributes: ["uuid", "name"],
            },
          ],
        });

        await LOG_TO_DB(request, {
          activity: "GET_DUE_DILIGENCE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          due_diligence: due_diligence,
        });
      } catch (error) {
        let error_log = {
          api: "v1/due_diligences/view",
          activity: "GET_DUE_DILIGENCE",
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

    fastify.post("/company/interaction_types", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Company.List");
        const { params } = request.body;

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
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

        const company_interactions = await DB_CLIENT.query(
          `SELECT DISTINCT(name) AS interaction_types, it.uuid  FROM diligence_data dd INNER JOIN interaction_types it ON it.id = dd.interaction_type_id where dd.company_id =:company_id`,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        await LOG_TO_DB(request, {
          activity: "GET_DUE_DILIGENCE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          company_interactions: company_interactions,
        });
      } catch (error) {
        let error_log = {
          api: "v1/due_diligences/view",
          activity: "GET_DUE_DILIGENCE",
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

    fastify.post("/due_diligences/responses", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.List");
        const { params } = request.body;

        const diligence_data = await DiligenceData.findOne({
          where: {
            uuid: params["diligence_data_uuid"],
            is_active: true,
          },
          include: [
            {
              model: InteractionType,
              as: "interaction_type",
            },
            {
              model: Company,
              as: "company",
              attributes: ["uuid", "name"],
            },
            {
              model: Stakeholder,
              as: "stakeholder",
              attributes: ["uuid", "name"],
            },
          ],
          raw: true,
          nest: true,
        });

        if (!diligence_data) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO DILIGENCE RESPONSE",
          });
          return;
        }

        diligence_data.contact_person = JSON.parse(
          diligence_data.contact_person
        );
        diligence_data.contact_email = JSON.parse(diligence_data.contact_email);

        let due_diligence_responses = await DueDiligence.findAll({
          where: {
            diligence_data_id: diligence_data.id,
            is_active: true,
          },
          attributes: { exclude: ["id"] },
          raw: true,
        });
        console.log(
          diligence_data.id,
          due_diligence_responses,
          "response response"
        );

        const diligence_data_responses = due_diligence_responses.map((data) => {
          data.question = JSON.parse(data.question);
          data.response = JSON.parse(data.response);
          return data;
        });

        diligence_data["due_diligence_responses"] = diligence_data_responses;

        await LOG_TO_DB(request, {
          activity: "GET_DUE_DILIGENCE_RESPONSES",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          diligence_data: diligence_data,
        });
      } catch (error) {
        let error_log = {
          api: "v1/due_diligences/responses",
          activity: "GET_DUE_DILIGENCE_RESPONSES",
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

    fastify.post("/due_diligence/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.Edit");
        const { params } = request.body;

        const interaction_type = await InteractionType.findOne({
          where: {
            uuid: request.body.interaction_type_uuid,
            is_active: true,
          },
        });

        if (!interaction_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO INTERACTION TYPE",
          });
          return;
        }

        const company = await Company.findOne({
          where: {
            uuid: request.body.company_uuid,
            is_active: true,
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

        const diligence_data_object = await DiligenceData.findOne({
          where: {
            uuid: request.body.uuid,
            is_active: true,
          },
        });

        if (!diligence_data_object) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_DILIGENCE_DATA_FOUND",
          });
          return;
        }

        const stakeholder = await Stakeholder.findOne({
          where: {
            uuid: request.body.stakeholder_uuid,
            is_active: true,
          },
        });

        const diligence_data = await DiligenceData.update(
          APPEND_USER_DATA(request, {
            meeting_type: request.body["meeting_type"],
            place_of_visit: request.body["place_of_visit"],
            contact_person: JSON.stringify(request.body["contact_person"]),
            phone_number: request.body["phone_number"],
            time_of_interaction: request.body["time_of_interaction"],
            branch: request.body["branch"],
            remarks: request.body["remarks"],
            status: request.body["status"],
            contact_email: JSON.stringify(request.body["contact_email"]),
            is_active: request.body["is_active"],
          }),
          {
            where: {
              uuid: request.body["uuid"],
            },
          }
        );

        if (stakeholder) {
          await diligence_data_object.setStakeholder(stakeholder);
        }

        await diligence_data_object.setInteraction_type(interaction_type);
        await diligence_data_object.setCompany(company);

        const transformedData = params.map((item) => {
          return {
            uuid: item.question.uuid || item.uuid, // If uuid is not present, provide a default value
            question: Array.isArray(item.question.name)
              ? item.question.name.flat(Infinity).join(" ")
              : item.question.name || item.question, // If question.name is not present, provide a default value
            response: item.question.response || item.response, // If response is not present, provide a default value
            is_master:
              item.question.is_master === false || item.is_master === false
                ? false
                : true,
            is_active:
              item.question.is_active === false || item.is_active === false
                ? false
                : true,
            created_at: item.question.created_at || item.created_at,
            updated_at: item.question.updated_at || item.updated_at,
            created_by: item.question.created_by || item.created_by,
            updated_by: item.question.updated_by || item.updated_by,
            diligence_data_id:
              item.question.diligence_data_id || item.diligence_data_id,
          };
        });

        const diligence_bulk_data = transformedData.map((diligence) => {
          diligence.question = JSON.stringify(diligence.question);
          diligence.response = JSON.stringify(diligence.response);
          diligence.is_master = diligence.is_master;
          diligence.is_active = diligence.is_active;
          diligence.uuid = diligence.uuid ? diligence.uuid : uuidv4();
          diligence.diligence_data_id = diligence_data_object.id;
          return diligence;
        });

        diligence_bulk_data.forEach(
          async (el) => await DueDiligence.upsert(el)
        );

        await LOG_TO_DB(request, {
          activity: "EDIT_DUE_DILIGENCE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          diligence_data: diligence_data.id,
          diligence_bulk_data: diligence_bulk_data,
        });
      } catch (error) {
        console.log("error: ", error);

        let error_log = {
          api: "v1/due_diligences/create",
          activity: "CREATE_DUE_DILIGENCE",
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

    fastify.post("/due_diligence/send_mom", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.MOM");
        const { params } = request.body;

        // const interaction_type =
        // await InteractionType.findOne({
        //   where: {
        //     uuid: request.body.interaction_type_uuid,
        //     is_active: true,
        //   },
        // });

        //   if (!interaction_type) {
        //     reply.status_code = 403;
        //     reply.send({
        //       success: false,
        //       error: "NO INTERACTION TYPE",
        //     });
        //     return;
        //   }

        //     const company =
        //     await Company.findOne({
        //       where: {
        //         uuid: request.body.company_uuid,
        //         is_active: true,
        //       },
        //     });

        //   if (!company) {
        //     reply.status_code = 403;
        //     reply.send({
        //       success: false,
        //       error: L["NO_COMPANY"],
        //     });
        //     return;
        //   }

        //   const diligence_data_object =
        //   await DiligenceData.findOne({
        //     where: {
        //       uuid: request.body.uuid,
        //       is_active: true,
        //     },
        //   });

        // if (!diligence_data_object) {
        //   reply.status_code = 403;
        //   reply.send({
        //     success: false,
        //     error: "NO_DILIGENCE_DATA_FOUND",
        //   });
        //   return;
        // }

        //   const stakeholder =
        //     await Stakeholder.findOne({
        //       where: {
        //         uuid: request.body.stakeholder_uuid,
        //         is_active: true,
        //       },
        //     });

        ///

        // const response = await SEND_GENERAL_EMAIL();

        await LOG_TO_DB(request, {
          activity: "SEND_DUE_DILIGENCE_EMAIL",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          result: response,
        });
      } catch (error) {
        console.log("error: ", error);

        let error_log = {
          api: "v1/due_diligences/send_mom",
          activity: "CREATE_DUE_DILIGENCE",
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

    fastify.post("/due_diligence_mom/preview", async (request, reply) => {
      try {
        CHECK_PERMISSIONS(request, "DUE_DILIGENCE_MOM_PREVIEW");
        const { uuid, emails, names, date } = request.body.params;
        const due_dilligence = await DiligenceData.findOne({
          where: {
            uuid,
          },
          include: [
            {
              model: InteractionType,
              as: "interaction_type",
              attributes: ["name"],
            },
            {
              model: User,
              as: "created_by_user",
              attributes: ["full_name"],
            },
            {
              model: Stakeholder,
              as: "stakeholder",
              // attributes: ["name"],
            },
            {
              model: Company,
              as: "company",
              attributes: ["name"],
            },
          ],
        });

        // const extractedNames = names
        //   .map((item) => {
        //     const labelWithoutBrackets = item.label.replace(/\s*\([^)]*\)/, ""); // Remove everything inside parentheses
        //     const labelWithoutParentheses = labelWithoutBrackets.replace(
        //       /\s*\([^)]*\)/,
        //       ""
        //     ); // Remove the remaining parentheses
        //     return labelWithoutParentheses.trim(); // Trim any leading or trailing spaces
        //   })
        //   .join(" / ");

        let data = await DB_CLIENT.query(
          `SELECT dd.question, dd.response FROM due_diligences dd 
           INNER JOIN diligence_data dd2 ON dd.diligence_data_id = dd2.id 
           WHERE dd2.id = :diligence_id`,
          {
            replacements: {
              diligence_id: due_dilligence.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        const getRAGHEmails = await DB_CLIENT.query(
          `SELECT DISTINCT u.email as email FROM mandates m inner JOIN users u ON m.id!='' where  (m.ra_id = u.id OR m.gh_id  = u.id) AND m.company_id = :company_id
`,
          {
            replacements: {
              company_id: due_dilligence.company_id,
            },
            type: QueryTypes.SELECT,
          }
        );

        let response = request.body.params.response ?? data;
        response = response[0]?.is_active
          ? response.filter((res) => res.is_active)
          : response;

        // Extract email addresses
        const emailAddresses = emails.map((item) => item.label);
        const ccEmails = getRAGHEmails.map((item) => item.email);

        const table = generateTableS(response);

        const params = {
          to_user_email: emailAddresses,
          // to_user_name: extractedNames,
          rating_process: null,
          company: due_dilligence.company.name,
          template_type: EMAIL_TEMPLATE.DUE_DILIGENCE_MOM,
          cc: ccEmails,
          table,
          interaction_type: due_dilligence.interaction_type.name,
          user: due_dilligence.stakeholder
            ? due_dilligence.stakeholder.name
            : "",
        };

        if (
          due_dilligence?.interaction_type?.name === "Audit Committee" ||
          due_dilligence?.interaction_type?.name === "Management"
        ) {
          Object.assign(params, {
            attendees: names,
            date,
          });
        }

        const emailHtml = await due_dilligence_mom(params);

        reply.send({
          success: true,
          html: emailHtml,
          subject:
            "MoM of Interaction with " +
            " " +
            params.interaction_type +
            " - " +
            params.user +
            " of " +
            params.company,
          ccEmails,
          to_user_email: emailAddresses,
        });
      } catch (error) {
        console.log(error);
      }
    });

    fastify.post("/due_diligence_mom", async (request, reply) => {
      try {
        CHECK_PERMISSIONS(request, "DUE_DILIGENCE_MOM");
        const { uuid, emails, names, date } = request.body.params;
        const due_dilligence = await DiligenceData.findOne({
          where: {
            uuid,
          },
          include: [
            {
              model: InteractionType,
              as: "interaction_type",
              attributes: ["name"],
            },
            {
              model: User,
              as: "created_by_user",
              attributes: ["full_name"],
            },
            {
              model: Stakeholder,
              as: "stakeholder",
              // attributes: ["name"],
            },
            {
              model: Company,
              as: "company",
              attributes: ["name"],
            },
          ],
        });

        // const contact_person = JSON.parse(due_dilligence.contact_person);
        const parseFn = (data) => {
          return JSON.parse(data);
        };

        // Extract and join first names with space and /
        // const firstNamesWithSpaceAndSlash = parseFn(names)
        // const extractedNames = names
        //   .map((item) => {
        //     const labelWithoutBrackets = item.label.replace(/\s*\([^)]*\)/, ""); // Remove everything inside parentheses
        //     const labelWithoutParentheses = labelWithoutBrackets.replace(
        //       /\s*\([^)]*\)/,
        //       ""
        //     ); // Remove the remaining parentheses
        //     return labelWithoutParentheses.trim(); // Trim any leading or trailing spaces
        //   })
        //   .join(" / ");
        let data = await DB_CLIENT.query(
          `SELECT dd.question, dd.response FROM due_diligences dd 
           INNER JOIN diligence_data dd2 ON dd.diligence_data_id = dd2.id 
           WHERE dd2.id = :diligence_id`,
          {
            replacements: {
              diligence_id: due_dilligence.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        const getRAGHEmails = await DB_CLIENT.query(
          `SELECT DISTINCT u.email as email FROM mandates m inner JOIN users u ON m.id!='' where  (m.ra_id = u.id OR m.gh_id  = u.id) AND m.company_id = :company_id
`,
          {
            replacements: {
              company_id: due_dilligence.company_id,
            },
            type: QueryTypes.SELECT,
          }
        );

        let response = request.body.params.response ?? data;
        response = response[0]?.is_active
          ? response.filter((res) => res.is_active)
          : response;

        // Extract email addresses
        const emailAddresses = emails.map((item) => item.label);
        const ccEmails = getRAGHEmails.map((item) => item.email);

        const table = generateTableS(response);

        const params = {
          to_user_email: emailAddresses,
          // to_user_name: extractedNames,
          rating_process: null,
          company: due_dilligence.company.name,
          template_type: EMAIL_TEMPLATE.DUE_DILIGENCE_MOM,
          cc: ccEmails,
          table,
          interaction_type: due_dilligence.interaction_type.name,
          user: due_dilligence.stakeholder
            ? due_dilligence.stakeholder.name
            : "",
        };
        if (
          due_dilligence?.interaction_type?.name === "Audit Committee" ||
          due_dilligence?.interaction_type?.name === "Management"
        ) {
          Object.assign(params, {
            attendees: names,
            date,
          });
        }

        await SEND_GENERAL_EMAIL(params);

        reply.send({
          success: true,
        });
      } catch (error) {
        console.log(error);
      }
    });

    fastify.post("/companies/view_contact_persons", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Company.View");

        const company = await Company.findOne({
          where: {
            uuid: request.body.company_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        const contact_details = await DB_CLIENT.query(
          `
          SELECT cd.name, cd.email, cd.uuid, cd.designation FROM contact_details cd
          INNER JOIN companies c ON c.id = cd.company_id 
          WHERE c.id = :company_id
        `,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        const bod = await DB_CLIENT.query(
          `
          SELECT bod.name, bod.uuid, bod.position AS designation FROM board_of_directors bod
          INNER JOIN companies c ON c.id = bod.company_id
          WHERE c.id = :company_id
        `,
          {
            replacements: {
              company_id: company.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        const company_contacts = [...contact_details, ...bod];

        reply.send({
          success: true,
          contact_details: company_contacts,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    done();
  });
}

const due_dilligence_mom = async (params, URL) => {
  let { table, to_user_name } = params;
  let content = "<html><head></head><body>";
  content += "Dear Sir/Ma'am ,<br><br>";
  if (params.hasOwnProperty("date")) {
    content += `Please find below the summary of our discussion held on ${moment(
      params.date
    ).format("DD/MM/YYYY")}<br><br>`;
  }

  if (params.hasOwnProperty("attendees")) {
    content += "List of Attendees:<br>";
    content += "<ul>";
    params?.attendees?.map((user) => {
      content += `<li style="margin-left: 2rem;">${user?.name} (${user?.designation})</li>`;
    });
    content += "</ul><br>";
  }

  content += "Greetings from the Infomerics Team!!<br><br>";
  content +=
    "We would like to thank you for your time and cooperation to carry out our due diligence process.We are pleased to share the summary of our interactions with you.</b><br><br>";
  content += table + "<br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
};

function generateTableS(data) {
  let tableHTML = `
    <table style="border-collapse: collapse; width: 100%; border: 1px solid black;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid black; padding: 8px; text-align: left;">Question</th>
          <th style="border: 1px solid black; padding: 8px; text-align: left;">Response</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((item) => {
    const [question, response] = extractQuestionAndResponse(item);
    tableHTML += `<tr><td style="border: 1px solid black; padding: 8px; text-align: left;">${question}</td><td style="border: 1px solid black; padding: 8px; text-align: left;">${response}</td></tr>`;
  });

  tableHTML += "</tbody></table>";
  return tableHTML;
}

function flattenDeep(arr) {
  if (!Array.isArray(arr)) {
    return [arr];
  }

  return arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      return acc.concat(flattenDeep(val));
    }
    return acc.concat(val);
  }, []);
}

function extractQuestionAndResponse(item) {
  const flatQuestionArray = flattenDeep(item.question);
  const question = flatQuestionArray.join(" ");
  return [question, item.response];
}

module.exports = {
  interaction_routes,
};
