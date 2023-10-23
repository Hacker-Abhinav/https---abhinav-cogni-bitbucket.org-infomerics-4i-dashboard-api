const { Outlook } = require("../../models/modules/rating-committee");
const { v4: uuidv4 } = require("uuid");
const { LANG_DATA } = require("../../lang");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../helpers");
const L = LANG_DATA();

async function outlook_routes(fastify) {
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

    fastify.post("/outlooks", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Outlook.List')

        const {params} = request.body;
        const where_query = params ? params : {};

        const outlooks = await Outlook.findAll({
          where: where_query
        });

        return reply.send({
          success: true,
          outlooks: outlooks,
        });

      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/outlooks/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Outlook.Create')

        const { params } = request.body;

        const outlook = await Outlook.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        return reply.send({
          success: true,
          outlook_uuid: outlook.uuid,
        });

      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/outlooks/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Outlook.Edit')

        const { params } = request.body;
        const outlook = await Outlook.update(APPEND_USER_DATA(request,{
          name: params["name"],
          is_active: params["is_active"]
        }),{
          where: {
            uuid: params["uuid"]
          }
        }
        );

        return reply.send({
          success: true,
          outlook_update_result: Boolean(outlook[0]===1),
        });

      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });
    
    done();
  });
}

module.exports = {
  outlook_routes,
};
