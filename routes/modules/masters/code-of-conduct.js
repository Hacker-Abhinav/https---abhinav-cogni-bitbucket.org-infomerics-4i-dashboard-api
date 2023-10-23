const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { error_logger } = require("../../../loki-push-agent");
const { LOG_TO_DB } = require("../../../logger");
const { FormType } = require("../../../models/modules/code_of_conduct");
const { DB_CLIENT } = require("../../../db");
const {
  FormTypeListSchema,
  FormTypeCreateSchema,
  FormTypeViewSchema,
  FormTypeEditSchema,
} = require("../../../schemas/CodeOfConduct/formType");
const { CHECK_PERMISSIONS, APPEND_USER_DATA } = require("../../../helpers");

async function code_of_conduct_routes(fastify) {
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
      "/form_types",
      { schema: FormTypeListSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "FormTypes.List");
          const { params } = request.body;

          let whereClause = Object.keys(params).length === 0 ? {} : params;
          const form_type = await FormType.findAll({
            where: whereClause,
          });

          await LOG_TO_DB(request, {
            activity: "FORM_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            form_type: form_type,
          });
        } catch (error) {
          let error_log = {
            api: "v1/form_types",
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

    /*To create form type*/
    fastify.post(
      "/form_type/create",
      { schema: FormTypeCreateSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "FormType.Create");
          const { params } = request.body;

          const form_type = await FormType.create({
            uuid: uuidv4(),
            name: params["name"],
            form_number:params["form_number"],
            category:params["category"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          await LOG_TO_DB(request, {
            activity: "FORM_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            form_type: form_type.uuid,
          });
        } catch (error) {
          let error_log = {
            api: "v1/form_type/create",
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

    /*To view a single form type*/
    fastify.post(
      "/form_type/view",
      { schema: FormTypeViewSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "FormType.View");

          const form_type = await FormType.findOne({
            where: {
              uuid: request.body.params.uuid,
            },
            attributes: { exclude: ["id"] },
          });

          await LOG_TO_DB(request, {
            activity: "FORM_TYPE",
            params: {
              data: request.body.params,
            },
          });

          reply.send({
            success: true,
            form_type: form_type,
          });
        } catch (error) {
          let error_log = {
            api: "v1/form_type/view",
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

    /*To edit a single form type*/
    fastify.post(
      "/form_type/edit",
      { schema: FormTypeEditSchema },
      async (request, reply) => {
        try {
          await CHECK_PERMISSIONS(request, "FormType.Edit");
          const { params } = request.body;

          const form_type = await FormType.update(
            APPEND_USER_DATA(request, {
              name: params["name"],
              form_number: params["form_number"],
              category: params["category"],
              is_active: params["is_active"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );
          await LOG_TO_DB(request, {
            activity: "FORM_TYPE",
            params: {
              data: params,
            },
          });

          reply.send({
            success: true,
            form_type_update_done: Boolean(form_type[0] === 1),
          });
        } catch (error) {
          let error_log = {
            api: "v1/form_type/edit",
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
      }
    );
    done();
  });
}

module.exports = {
  code_of_conduct_routes,
};
