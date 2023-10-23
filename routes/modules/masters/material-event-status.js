const { v4: uuidv4 } = require("uuid");
const { error_logger } = require("../../../loki-push-agent");
const { LOG_TO_DB } = require("../../../logger");
const {
  SecurityType,
  MaterialEventReason,
  MaterialEventStatus,
} = require("../../../models/modules/code_of_conduct");
const { CHECK_PERMISSIONS, APPEND_USER_DATA } = require("../../../helpers");
const {
  SecurityTypeListSchema,
  SecurityTypeEditSchema,
  SecurityTypeViewSchema,
  SecurityTypeCreateSchema,
} = require("../../../schemas/CodeOfConduct/securityType");
const {
  MaterialEventReasonCreateSchema,
  MaterialEventReasonListSchema,
  MaterialEventReasonViewSchema,
  MaterialEventReasonEditSchema,
} = require("../../../schemas/CodeOfConduct/materialEventReason");

async function material_event_status(fastify) {
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
      "/material_event_status",
      // { schema: MaterialEventReasonListSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(
            request,
            "Compliance.MaterialEventReasonList"
          );
          const { params } = request.body;

          let whereClause = Object.keys(params).length === 0 ? {} : params;
          const material_event_status = await MaterialEventStatus.findAll({
            where: whereClause,
          });

          await LOG_TO_DB(request, {
            activity: "MATERIAL_EVENT_STATUS",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            material_event_status,
          });
        } catch (error) {
          let error_log = {
            api: "v1/material_event_status",
            activity: "MATERIAL_EVENT_STATUS",
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
      "/material_event_status/create",
      // { schema: MaterialEventReasonCreateSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "MaterialEventStatus.Create");
          const { params } = request.body;

          const material_event_status = await MaterialEventStatus.create({
            uuid: uuidv4(),
            name: params["name"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "MATERIAL_EVENT_STATUS_CREATE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            material_event_status_uuid: material_event_status.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/material_event_status/create",
            activity: "MATERIAL_EVENT_STATUS_CREATE",
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
      "/material_event_status/view",
      // { schema: MaterialEventReasonViewSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "MaterialEventStatus.View");

          const material_event_status = await MaterialEventStatus.findOne({
            where: {
              uuid: request.body.params.uuid,
            },
            attributes: { exclude: ["id"] },
          });

          await LOG_TO_DB(request, {
            activity: "MATERIAL_EVENT_STATUS_VIEW",
            params: {
              data: request.body.params,
            },
          });

          reply.send({
            success: true,
            material_event_status,
          });
        } catch (error) {
          let error_log = {
            api: "v1/material_event_status/view",
            activity: "MATERIAL_EVENT_STATUS_VIEW",
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
      "/material_event_status/edit",
      // { schema: MaterialEventReasonEditSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "MaterialEventStatus.Edit");
          const { params } = request.body;

          const material_event_status = await MaterialEventStatus.update(
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
            activity: "MATERIAL_EVENT_STATUS_EDIT",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            material_event_status_update_done: Boolean(
              material_event_status[0] === 1
            ),
          });
        } catch (error) {
          let error_log = {
            api: "v1/material_event_status/edit",
            activity: "MATERIAL_EVENT_STATUS_EDIT",
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
  material_event_status,
};
