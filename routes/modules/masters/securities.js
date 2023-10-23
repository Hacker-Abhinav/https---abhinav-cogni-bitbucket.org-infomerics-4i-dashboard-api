const { v4: uuidv4 } = require("uuid");
const { error_logger } = require("../../../loki-push-agent");
const { LOG_TO_DB } = require("../../../logger");
const { SecurityType } = require("../../../models/modules/code_of_conduct");
const { CHECK_PERMISSIONS, APPEND_USER_DATA } = require("../../../helpers");
const {
  SecurityTypeListSchema,
  SecurityTypeEditSchema,
  SecurityTypeViewSchema,
  SecurityTypeCreateSchema,
} = require("../../../schemas/CodeOfConduct/securityType");

async function securities_routes(fastify) {
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

    /* To list all the securities types*/
    fastify.post(
      "/security_types",
      { schema: SecurityTypeListSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "SecurityTypes.List");
          const { params } = request.body;

          let whereClause = Object.keys(params).length === 0 ? {} : params;
          const security_type = await SecurityType.findAll({
            where: whereClause,
          });

          await LOG_TO_DB(request, {
            activity: "SECURITY_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            security_type: security_type,
          });
        } catch (error) {
          let error_log = {
            api: "v1/security_types",
            activity: "SECURITY_TYPES",
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

    /*To create securities type*/
    fastify.post(
      "/security_type/create",
      { schema: SecurityTypeCreateSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "SecurityType.Create");
          const { params } = request.body;

          const security_type = await SecurityType.create({
            uuid: uuidv4(),
            name: params["name"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "SECURITY_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            form_type: security_type.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/security_type/create",
            activity: "SECURITY_TYPE",
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

    /*To view a single securities type*/
    fastify.post(
      "/security_type/view",
      { schema: SecurityTypeViewSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "SecurityType.View");

          const security_type = await SecurityType.findOne({
            where: {
              uuid: request.body.params.uuid,
            },
            attributes: { exclude: ["id"] },
          });

          await LOG_TO_DB(request, {
            activity: "SECURITY_TYPE",
            params: {
              data: request.body.params,
            },
          });

          reply.send({
            success: true,
            security_type,
          });
        } catch (error) {
          let error_log = {
            api: "v1/security_type/view",
            activity: "SECURITY_TYPE",
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

    /*To edit a single securities type*/
    fastify.post(
      "/security_type/edit",
      { schema: SecurityTypeEditSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "SecurityType.Edit");
          const { params } = request.body;

          const security_type = await SecurityType.update(
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
            activity: "SECURITY_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            security_type_update_done: Boolean(security_type[0] === 1),
          });
        } catch (error) {
          let error_log = {
            api: "v1/security_type/edit",
            activity: "EDIT_SECURITY_TYPE",
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
  securities_routes,
};
