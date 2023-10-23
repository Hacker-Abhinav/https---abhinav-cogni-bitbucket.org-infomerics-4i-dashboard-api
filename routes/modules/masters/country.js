const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  Country
} = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function countries_routes(fastify) {
  fastify.post("/countries", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const {params}=request.body
      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const countries = await Country.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        countries: countries,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/countries/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;
      
        const country = await Country.create({
          uuid: uuidv4(),
          name: params["name"],
          description: params["description"],
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          is_active:true
        });

        reply.send({
          success: true,
          country_uuid: country.uuid,
        });
     
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });
  fastify.post("/countries/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const country = await Country.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: ["uuid", "name", "description","is_active"],
      });
      reply.send({
        success: true,
        country: country,

      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });
  fastify.post("/countries/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const country = await Country.update(
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
        countryEdited: Boolean(
          country[0] === 1
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
  countries_routes,
};