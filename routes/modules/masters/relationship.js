const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { error_logger } = require("../../../loki-push-agent");
const { LOG_TO_DB } = require("../../../logger");
const {
  Relative,
  RelationshipType,
} = require("../../../models/modules/code_of_conduct");
const { DB_CLIENT } = require("../../../db");
// const {
//   FormTypeListSchema,
//   FormTypeCreateSchema,
//   FormTypeViewSchema,
//   FormTypeEditSchema,
// } = require("../../../schemas/CodeOfConduct/formType");
const { CHECK_PERMISSIONS, APPEND_USER_DATA } = require("../../../helpers");

async function relative_routes(fastify) {
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

    /* To list all the form types*/
    fastify.post(
      "/relationship_types",
      // { schema: FormTypeListSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "RelationshipType.List");
          const { params } = request.body;

          let whereClause = Object.keys(params).length === 0 ? {} : params;
          const relationship = await RelationshipType.findAll({
            where: whereClause,
          });

          await LOG_TO_DB(request, {
            activity: "RELATIONSHIP_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            relatives: relationship,
          });
        } catch (error) {
          let error_log = {
            api: "v1/relationship_type",
            activity: "RELATIONSHIP_TYPE",
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

    /*To create form type*/
    fastify.post("/relationship_type/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RelationshipType.Create");
        const { params } = request.body;

        const relationship_type = await RelationshipType.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await LOG_TO_DB(request, {
          activity: "RELATIONSHIP_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          relationship_type: relationship_type.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/relationship_type/create",
          activity: "RELATIONSHIP_TYPE",
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

    /*To view a single form type*/
    fastify.post("/relationship_type/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RelationshipType.View");

        const relationship_type = await RelationshipType.findOne({
          where: {
            uuid: request.body.params.uuid,
          },
          attributes: { exclude: ["id"] },
        });

        await LOG_TO_DB(request, {
          activity: "RELATIONSHIP_TYPE",
          params: {
            data: request.body.params,
          },
        });

        reply.send({
          success: true,
          relationship_type: relationship_type,
        });
      } catch (error) {
        let error_log = {
          api: "v1/relationship_type/view",
          activity: "RELATIONSHIP_TYPE",
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

    /*To edit a single form type*/
    fastify.post("/relationship_type/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RelationshipType.Edit");
        const { params } = request.body;

        const relationship_type = await RelationshipType.update(
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
          activity: "RELATIONSHIP_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          relationship_type_update_done: Boolean(relationship_type[0] === 1),
        });
      } catch (error) {
        let error_log = {
          api: "v1/relationship_type/edit",
          activity: "RELATIONSHIP_TYPE",
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
  relative_routes,
};
