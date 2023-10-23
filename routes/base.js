const { LOG_TO_DB } = require("../logger");
const { warning_logger } = require("../loki-push-agent");

async function base_routes (fastify, options) {
  fastify.get('/', async (request, reply) => {
    return reply.send({
      "api": "v1.01.uat-branch-test",
      "health": "ok",
    });
  });

  fastify.post('/', async (request, reply) => {
    await LOG_TO_DB(request, {
      'activity': 'PING',
      'params': null,
    });

    let warning_log = {
      'api': 'v1:ping',
      'activity': 'PING',
      'params': {
        'ip_location': request.ip,
      },
    };
    warning_logger.info(JSON.stringify(warning_log));

    return reply.send({
      "api": "v1",
      "name": "4i-concept-dashboard-api",
      "developed_for": "informerics",
      "developed_by": "cognitensor",
    });
  });
}

module.exports = {
  base_routes
};