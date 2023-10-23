const { v4: uuidv4 } = require("uuid");
const { Op, QueryTypes } = require("sequelize");
const {
  due_diligence,
  due_diligence_add,
} = require("../../constants/due_dilligence");
const { error_logger } = require("../../loki-push-agent");
const { LOG_TO_DB } = require("../../logger");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../helpers");
const { LANG_DATA } = require("../../lang");
const L = LANG_DATA();

function createDataWithUniqueId(array) {
  const newArray = array.map((item) => {
    let temp = item;
    temp.id = uuidv4();
    return temp;
  });
  return newArray;
}

async function due_diligence_json(fastify) {
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

    fastify.post("/due_diligence", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.List");

        reply.send({
          success: true,
          due_diligence: due_diligence,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/due_diligence/add", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "DueDiligence.Create");

        const due__diligence = createDataWithUniqueId(due_diligence_add);
        reply.send({
          success: true,
          due_diligence: due__diligence,
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

module.exports = {
  due_diligence_json,
};
