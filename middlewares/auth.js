const jwt = require('jsonwebtoken');
const { User } = require('../models/modules/onboarding');
const { DB_CLIENT } = require('../db');
const { QueryTypes } = require('sequelize');

async function is_valid_user (request, reply) {
  return new Promise((resolve, reject) => {
    try {
      var { authorization } = request.headers;
      if (!authorization) {
        reply.statusCode = 422;
          reply.send({
            'success': false,
            'error': `Authorization header not set.`,
          });
      }

      var jwt_token = authorization.split(" ")[1];
      jwt.verify(jwt_token, process.env['JWT_SECRET_KEY'], async function(err, data) {
        if (err) {
          reply.statusCode = 422;
          reply.send({
            'success': false,
            'error': String(err),
          });
        };
  
        if (data) {
          try {
            request.user = await User.findByPk(data.user_id).then(async (user) => await user.apiInstance());
            // request.user_permissions = (request.user && data.permissions) ? data.permissions : [];
            request.active_role_name = data['role_name'];
            request.active_role_id = data['role_id'];

            const permissions = await DB_CLIENT.query(
              `SELECT p.name FROM role_has_permissions rhp 
              INNER JOIN permissions p ON p.id = rhp.permission_id AND rhp.role_id = :role_id`,
              {
                replacements: {
                  role_id: data.role_id,
                },
                type: QueryTypes.SELECT,
              }
            );
            request.user_permissions = permissions;
            resolve(request);
          } catch (error) {
            reject(error);
          }
        }
  
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        'success': false,
        'error': String(error),
      });
    }
  })
}

module.exports = {
  is_valid_user,
};