const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { Country, State } = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");
const { LANG_DATA } = require("../../../lang");
const L = LANG_DATA();

async function states_routes(fastify) {
  fastify.post("/states", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const states = await State.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: {
          model: Country,
          as: "country",
          attributes: { exclude: ["id"] },
        },
      });

      reply.send({
        success: true,
        states: states,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/states/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      const country = await Country.findOne({
        where: {
          uuid: params["country_uuid"],
        },
        raw: true,
      });

      const state = await State.create({
        uuid: uuidv4(),
        name: params["name"],
        description: params["description"],
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        country_id: country.id,
        is_active:true
      });

      reply.send({
        success: true,
        state_uuid: state.uuid,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/states/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const state = await State.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          description: params["description"],
          is_active:params["is_active"]
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      reply.send({
        success: true,
        stateEdited: Boolean(state[0] === 1),
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/countries/states/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List')

      const country = await Country.findOne({
        where: {
          uuid: request.body.params.country_uuid,
          is_active: true
        },
        raw: true,
      });

      if (!country) {
        reply.status_code = 403;
        return reply.send({
          success: false,
          error: L["NO_STATE"],
        });
      }

      const states = await State.findAll({
        where: {
          country_id: country.id,
        },
        attributes: ["uuid", "name","is_active"],
      });

      reply.send({
        success: true,
        states: states,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/states/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const state = await State.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: ["uuid", "name", "country_id", "is_active"],
        // raw: true,
      });

      const Countries = await Country.findOne({
        where: {
          id: state.country_id,
        },
        attributes: ["uuid", "name"],
      });

      reply.send({
        success: true,
        state: state,
        country: Countries,
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
  states_routes,
};
