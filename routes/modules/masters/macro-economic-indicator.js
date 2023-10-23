const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  MacroEconomicIndicator
} = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function macro_economic_indicator_routes(fastify) {
  fastify.post("/macro_economic_indicators", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const macro_economic_indicators = await MacroEconomicIndicator.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
      });
      reply.send({
        success: true,
        macro_economic_indicators: macro_economic_indicators,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/macro_economic_indicators/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      const macro_economic_indicator = await MacroEconomicIndicator.create({
        uuid: uuidv4(),
        name: params["name"],
        description: params["description"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });


      reply.send({
        success: true,
        macro_economic_indicator_uuid: macro_economic_indicator.uuid,
      });


    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/macro_economic_indicators/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.View');

      const macro_economic_indicator = await MacroEconomicIndicator.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: ["uuid", "name", "description","is_active"],
      });
      reply.send({
        success: true,
        macro_economic_indicator: macro_economic_indicator,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/macro_economic_indicators/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;
      
      const macro_economic_indicator = await MacroEconomicIndicator.update(
        APPEND_USER_DATA(request, {
          uuid: params["uuid"],
          name: params["name"],
          description: params["description"],
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
        macro_economic_indicator_update_done: Boolean(
          macro_economic_indicator[0] === 1
        ),
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });
}

module.exports = {
  macro_economic_indicator_routes,
};
