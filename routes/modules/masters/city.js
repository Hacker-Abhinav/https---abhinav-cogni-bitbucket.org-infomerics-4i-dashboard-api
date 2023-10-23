const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { State, City, Country } = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function cities_routes(fastify) {
  fastify.post("/cities", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List')
      const { params } = request.body;
      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const cities = await City.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: {
          model: State,
          as: 'state',
          attributes: { exclude: ["id"] },
        }
      });

      reply.send({
        success: true,
        cities: cities,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/cities/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create')
      const { params } = request.body;

      const state = await State.findOne({
        where: {
          uuid: params["state_uuid"],
        },
        raw: true,
      });

      const city = await City.create({
        uuid: uuidv4(),
        name: params["name"],
        description: params["description"],
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        is_active: true,
        state_id: state.id,
      });

      reply.send({
        success: true,
        City_uuid: city.uuid,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });
  fastify.post("/cities/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const city = await City.findOne({
        where: {
          uuid: params["uuid"]
        }
      })

      const state = await State.findOne({
        where: {
          uuid: params["state_uuid"]
        }
      })

      const city_update_result = await City.update(
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

      await city.setState(state)

      reply.send({
        success: true,
        cityEdited: Boolean(city_update_result[0] === 1),
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });
  fastify.post("/states/cities/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const state = await State.findOne({
        where: {
          uuid: request.body.params.state_uuid,
          is_active: true
        },
        raw: true,
      });

      if (!state) {
        reply.status_code = 403;
        return reply.send({
          success: false,
          error: L["NO_COUNTRY"],
        });
      }

      const cities = await City.findAll({
        where: {
          state_id: state.id,
        },
        order: [["name", "ASC"]],
        attributes: ["uuid", "name", "is_active"],
      });

      // cities.push({"state": {
      //   "uuid": state.uuid,
      //   "name": state.name
      // }});

      reply.send({
        success: true,
        cities: cities,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/cities/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;
      const city = await City.findOne({
        where: {
          uuid: params.uuid,
        },
        attributes: ["uuid", "name", "state_id","is_active"],
      });

      const state = await State.findOne({
        where: { id: city.state_id },
        attributes: ["uuid", "name", "country_id"],
      });
      const country = await Country.findOne({
        where: { id: state.country_id },
        attributes: ["uuid", "name"],
      });

      reply.send({
        success: true,
        city: { uuid: city.uuid, name: city.name, is_active: city.is_active },
        state: { uuid: state.uuid, name: state.name },
        country: { uuid: country.uuid, name: country.name },
      });
    } catch (error) {
      console.log("error:", error)
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });
}

module.exports = {
  cities_routes,
};
