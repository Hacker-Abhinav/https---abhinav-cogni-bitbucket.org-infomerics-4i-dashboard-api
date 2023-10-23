const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { error_logger } = require("../../../loki-push-agent");
const { LOG_TO_DB } = require("../../../logger");
const { NdsQuestions} = require("../../../models/modules/compliance");


const { DB_CLIENT } = require("../../../db");

const { CHECK_PERMISSIONS, APPEND_USER_DATA } = require("../../../helpers");

async function nds_question_routes(fastify) {
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

    /* To list all the nds questions*/
    fastify.post(
      "/nds_questions",
    
      async (request, reply) => {
        try {
          const { params } = request.body;
          const nds_questions = await NdsQuestions.findAll({
            where: params
          });

          await LOG_TO_DB(request, {
            activity: "NDS_QUESTIONS",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            nds_questions: nds_questions,
          });
        } catch (error) {
          let error_log = {
            api: "v1/nds_questions",
            activity: "NDS_QUESTIONS",
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

    /*To create nds question*/
    fastify.post(
      "/nds_questions/create",
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "NdsQuestions.Create");
          const { params } = request.body;

          const nds_questions = await NdsQuestions.create({
            uuid: uuidv4(),
            ques_num: params["ques_num"],
            ques_content: params["ques_content"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "NDS_QUESTIONS",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            nds_questions: nds_questions.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/nds_questions/create",
            activity: "NDS_QUESTIONS",
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

    /*To view a single nds question*/
    fastify.post(
      "/nds_questions/view",

      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "NdsQuestions.View");

          const nds_questions = await NdsQuestions.findOne({
            where: {
              uuid: request.body.params.uuid,
            },
            attributes: { exclude: ["id"] },
          });

          await LOG_TO_DB(request, {
            activity: "NDS_QUESTIONS",
            params: {
              data: request.body.params,
            },
          });

          reply.send({
            success: true,
            nds_questions: nds_questions,
          });
        } catch (error) {
          let error_log = {
            api: "v1/nds_questions/view",
            activity: "NDS_QUESTIONS",
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

    /*To edit a single nds question*/
    fastify.post(
      "/nds_questions/edit",
  
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "NdsQuestions.Edit");
          const { params } = request.body;

          const nds_questions = await NdsQuestions.update(
            APPEND_USER_DATA(request, {
              name: params["name"],
              ques_num: params["ques_num"],
              ques_content: params["ques_content"],
              is_active: params["is_active"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );
          await LOG_TO_DB(request, {
            activity: "NDS_QUESTIONS",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            nds_questions_update_done: Boolean(nds_questions[0] === 1),
          });
        } catch (error) {
          let error_log = {
            api: "v1/nds_questions/edit",
            activity: "EDIT_NDS_QUESTIONS",
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
    done();
  });
}

module.exports = {
  nds_question_routes,
};
