const { v4: uuidv4 } = require("uuid");
const { error_logger } = require("../../../loki-push-agent");
const { LOG_TO_DB } = require("../../../logger");
const { RatingStatus } = require("../../../models/modules/code_of_conduct");
const { CHECK_PERMISSIONS, APPEND_USER_DATA } = require("../../../helpers");
const {
  RatingStatusListSchema,
  RatingStatusCreateSchema,
  RatingStatusViewSchema,
  RatingStatusEditSchema,
} = require("../../../schemas/CodeOfConduct/ratingStatus");

async function rating_status(fastify) {
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

    /* To list all the rating status*/
    fastify.post(
      "/rating_status",
      { schema: RatingStatusListSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.RatingStatusList");
          const { params } = request.body;

          let whereClause = Object.keys(params).length === 0 ? {} : params;
          const rating_status = await RatingStatus.findAll({
            where: whereClause,
          });

          await LOG_TO_DB(request, {
            activity: "RATING_STATUS_LIST",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_status,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_status",
            activity: "RATING_STATUS",
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

    /*To create rating status type*/
    fastify.post(
      "/rating_status/create",
      { schema: RatingStatusCreateSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.RatingStatusCreate");
          const { params } = request.body;

          const rating_status = await RatingStatus.create({
            uuid: uuidv4(),
            name: params["name"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "RATING_STATUS_CREATE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_status: rating_status.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_status/create",
            activity: "RATING_STATUS_CREATE",
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

    /*To view a single rating status type*/
    fastify.post(
      "/rating_status/view",
      { schema: RatingStatusViewSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.RatingStatusView");

          const rating_status = await RatingStatus.findOne({
            where: {
              uuid: request.body.params.uuid,
            },
            attributes: { exclude: ["id"] },
          });

          await LOG_TO_DB(request, {
            activity: "RATING_STATUS_VIEW",
            params: {
              data: request.body.params,
            },
          });

          reply.send({
            success: true,
            rating_status,
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_status/view",
            activity: "RATING_STATUS_VIEW",
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

    /*To edit a single rating status type*/
    fastify.post(
      "/rating_status/edit",
      { schema: RatingStatusEditSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "Compliance.RatingStatusEdit");
          const { params } = request.body;

          const rating_status = await RatingStatus.update(
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
            activity: "RATING_STATUS_EDIT",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            rating_status_update_done: Boolean(rating_status[0] === 1),
          });
        } catch (error) {
          let error_log = {
            api: "v1/rating_status/edit",
            activity: "RATING_STATUS_EDIT",
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
  rating_status,
};
