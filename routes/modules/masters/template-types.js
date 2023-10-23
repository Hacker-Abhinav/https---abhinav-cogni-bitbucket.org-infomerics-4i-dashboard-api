const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");
const { TemplateType } = require("../../../models/modules/template-list");

async function template_type_routes(fastify) {
  fastify.post("/template_types", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');
      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const template_types = await TemplateType.findAll({
        where: whereClause,
        order: [["name", "ASC"]],
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        template_types: template_types,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_types/create", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_type = await TemplateType.create({
        uuid: uuidv4(),
        name: params["name"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      reply.send({
        success: true,
        template_type: template_type,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_types/edit", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_type_updated = await TemplateType.update(
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

      reply.send({
        success: true,
        template_type_updated: template_type_updated,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_types/view", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_type = await TemplateType.findOne({
        where: {
          uuid: params["uuid"],
        },
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        template_type: template_type,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });
}
module.exports = {
  template_type_routes,
};
