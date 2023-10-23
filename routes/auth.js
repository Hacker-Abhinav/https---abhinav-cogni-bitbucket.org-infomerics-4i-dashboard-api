const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require("../models/modules/onboarding");
const { LoginByUserCode, CheckUserCode, LoginByAzureToken } = require("../schemas/Auth");
const { GET_LOGIN_URL, GET_USER, GET_LOGIN_RESPONSE_URL } = require('../services/azure');

const { LANG_DATA } = require("../lang");
const L = LANG_DATA();
const { LOG_TO_DB } = require('../logger');
const { warning_logger } = require('../loki-push-agent');

async function auth_routes (fastify) {

  fastify.post("/check_user_code", { schema: CheckUserCode }, async (request, reply) => {
    const { user_code } = request.body;

    await LOG_TO_DB(request, {
      'activity': 'CHECK_USER_CODE',
      'params': {
        'user_code': user_code
      },
    });

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: user_code },
        ],
      },
      attributes: ['uuid', 'login_type', 'employee_code', 'created_at'],
    });

    var login_url = null;
    if (user && user['login_type'] === 'AZURE') {
      login_url = GET_LOGIN_URL();
    }

    if (!user) {
      let warning_log = {
        'api': 'v1:auth:check_user_code',
        'activity': 'CHECK_USER_CODE',
        'params': {
          'user_code': user_code
        },
      };
      warning_logger.info(JSON.stringify(warning_log));
    }

    reply.statusCode = user ? 200 : 403; 
    reply.send({
      "success": true,
      "user": user,
      "login_url": login_url,
    });
  });

  fastify.post("/login", { schema: LoginByUserCode }, async (request, reply) => {
    const { uuid, password } = request.body;

    await LOG_TO_DB(request, {
      'activity': 'LOGIN',
      'params': {
        'uuid': uuid
      },
    });

    const user = await User.findOne({
      where: {
        uuid: uuid,
        is_active: true,
        login_type: "PASSWORD",
      },
    });

    if (user) {
      const result = await bcrypt.compare(password, user['password']);

      if (!result) {
        reply.statusCode = 403;
        reply.send({
          "success": false,
          "error": L['BAD_CREDENTIALS'],
        });
      }

      reply.send({
        "user": await user.apiInstance()
      });
    }

    reply.send({
      "success": true,
      "user": user,
    });
  });
  
  fastify.get("/response_azure", {}, async (request, reply) => {
    const code = request.query.code;
    const user = await GET_USER(code);
    const email = user['mail'] ?? user['userPrincipalName'];

    const user_db = await User.findOne({
      where: {
        email: email,
        is_active: true,
        login_type: "AZURE",
      },
    });

    if (!user_db) {
      reply.statusCode = 403;
      reply.send({
        "success": false,
        "error": L['BAD_CREDENTIALS'],
      });
    }

    const login_response_url = await GET_LOGIN_RESPONSE_URL(user_db.uuid);
    reply.redirect(login_response_url);

    reply.send({
      "success": true,
      "code": code,
      "user": user,
      "login_response_url": login_response_url,
    });
  });

  fastify.post("/login_azure_token", { schema: LoginByAzureToken }, async (request, reply) => {
    const { token } = request.body;
    const data = jwt.verify(token, process.env['JWT_SECRET_KEY']);
    const user = await User.findOne({
      where: {
        uuid: data['uuid'],
        is_active: true,
      },
    });
    
    if (!user) {
      reply.statusCode = 403;
      reply.send({
        "success": false,
        "error": L['BAD_CREDENTIALS'],
      });
    }
    
    reply.send({
      "success": true,
      "user": await user.apiInstance(),
    });
  });
  
}

module.exports = {
  auth_routes
};