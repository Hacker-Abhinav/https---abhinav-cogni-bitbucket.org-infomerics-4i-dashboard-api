const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  BranchOffice
} = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function branch_office_routes(fastify) {
  fastify.post("/branch_offices", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List')
      const { params } = request.body;
      const where_query = params ? params : {};

      const branch_offices = await BranchOffice.findAll({
        where: where_query,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        branch_offices: branch_offices,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/branch_offices/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request,' MasterManagement.Create')
      const { params } = request.body;

      const branch_office = await BranchOffice.create({
        uuid: uuidv4(),
        name: params["name"],
        is_active: true,
        created_at: new Date(),
        created_by: request.user.id,
      });

      reply.send({
        success: true,
        branch_office_update_result: branch_office.uuid,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/branch_offices/view", async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'MasterManagement.List')
      const branch_office = await BranchOffice.findOne({
        where: {
            uuid: request.body.uuid
        },
        attributes: { exclude: ['id']}
      });

      reply.send({
        success: true,
        branch_office: branch_office,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/branch_offices/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const branch_office_update = await BranchOffice.update(APPEND_USER_DATA(request,{
        name: params["name"],
        is_active: params['is_active'],
      }),{
        where: {
            uuid: params['uuid']
        }
      }
      );

      reply.send({
        success: true,
        branch_office_update_result: Boolean(branch_office_update[0]===1),
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
  branch_office_routes,
};
