const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
 User,Department
} = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function departments_routes(fastify) {
  fastify.post("/departments", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;
      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const departments = await Department.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id", "head_of_department_id"] },
        include: [
          {
            model: User,
            as: "head_of_department",
            attributes: ["uuid", "full_name", "email"],
          },
          {
            model: User,
            as: "created_by_user",
            attributes: ["uuid", "full_name", "email"],
          },
          {
            model: User,
            as: "updated_by_user",
            attributes: ["uuid", "full_name", "email"],
          },
        ],
      });

      reply.send({
        success: true,
        departments: departments,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/departments/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      const head_of_department = await User.findOne({
        where: {
          uuid: params?.head_of_department_id,
          is_active: true,
        },
        raw: true,
      });

      const hod_history_json = [
        {
          name: head_of_department?.full_name,
          uuid: head_of_department?.uuid,
          created_at: new Date(),
        },
      ];

      const department = await Department.create({
        uuid: uuidv4(),
        name: params["name"],
        description: params["description"],
        head_of_department_id: head_of_department
          ? head_of_department.id
          : null,
        head_of_department_history: JSON.stringify(hod_history_json),
        is_active: true,
        created_at: new Date(),
        created_by: request.user.id,
      });

      reply.send({
        success: true,
        department: department,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/departments/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const department = await Department.findOne({
        where: { uuid: request.body.uuid },
        attributes: { exclude: ["id", "head_of_department_id"] },
        include: [
          {
            model: User,
            as: "head_of_department",
            attributes: ["uuid", "full_name", "email"],
          },
          {
            model: User,
            as: "created_by_user",
            attributes: ["uuid", "full_name", "email"],
          },
          {
            model: User,
            as: "updated_by_user",
            attributes: ["uuid", "full_name", "email"],
          },
        ],
      });

      reply.send({
        success: true,
        department: department,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/departments/edit", async (request, reply) => {
    try {
      const { params } = request.body;
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      let head_of_department = {};
      if (params["head_of_department_id"]) {
        head_of_department = await User.findOne({
          where: {
            uuid: params["head_of_department_id"],
            is_active: true,
          },
          raw: true,
        });
      }

      const historyObj = [];

      historyObj.push({
        name: head_of_department?.full_name,
        uuid: head_of_department?.uuid,
        updated_at: new Date(),
      });

      const department = await Department.update(
        {
          name: params["name"],
          description: params["description"],
          head_of_department_id: head_of_department
            ? head_of_department.id
            : null,
          head_of_department_history: JSON.stringify(historyObj),
          is_active: params["is_active"],
          updated_at: new Date(),
          updated_by: request.user.id,
        },
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      reply.send({
        success: true,
        department_update_done: Boolean(department[0] === 1),
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
  departments_routes,
};
