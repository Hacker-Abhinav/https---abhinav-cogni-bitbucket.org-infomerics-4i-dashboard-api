const { Op, CHAR } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  InstrumentCategory
} = require("../../../models/modules/rating-model");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");
const { MasterCommon } = require("../../../models/modules/onboarding");

async function categories_routes(fastify) {
  fastify.post("/categories", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const instrument_categories = await InstrumentCategory.findAll({
        where: whereClause,
        order: [
          ['category_name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: [
          {
            model: MasterCommon,
            attributes: ["uuid", "group", "name", "value"],
            as: "mandate_types"
          }
        ]
      });

      reply.send({
        success: true,
        instrument_categories: instrument_categories,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/categories/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      const mandate_types = await MasterCommon.findAll({
        where: {
          name: params["mandate_type"]
        },
        attributes: ["id"]
      })
      
      const instrument_category = await InstrumentCategory.create({
        uuid: uuidv4(),
        category_name: params["category_name"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      if (instrument_category) {
        await instrument_category.setMandate_types(mandate_types)
      }

      reply.send({
        success: true,
        instrument_category: instrument_category.uuid,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/categories/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      
      const instrument_category = await InstrumentCategory.findOne({
        where: {
          uuid: request.body.params.uuid
        },
        include: [
          {
            model: MasterCommon,
            attributes: ["uuid", "group", "name", "value"],
            as: "mandate_types"
          }
        ],
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        instrument_category: instrument_category,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/categories/edit", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');

      const mandate_types = await MasterCommon.findAll({
        where: {
          name: params["mandate_type"]
        }, 
        attributes: ["id"],
      })
    
      const instrument_category = await InstrumentCategory.update(
        APPEND_USER_DATA(request, {
        category_name: params["category_name"],
        is_active: params["is_active"],
        updated_at: new Date(),

        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      const instrument_category_for_mandate_type = await InstrumentCategory.findOne({
        where: {
          uuid: params["uuid"]
        }
      })

      if (mandate_types && instrument_category_for_mandate_type) {
        await instrument_category_for_mandate_type.setMandate_types(mandate_types)
      }

      reply.send({
        success: true,
        instrument_category_update_done: Boolean(
          instrument_category[0] === 1
        ),
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/mandate_type/view_categories", async (request, reply) => {
    try {

      const { params } = request.body;

      await CHECK_PERMISSIONS(request, 'MasterManagement.List')

      const mandate_type = await MasterCommon.findOne({
        where: {
          name: params["mandate_type"],
          is_active: true
        }
      })

      const where_query = {
        id: mandate_type.id
      }
      
      if (Object.keys(params).includes("is_active")) {
        where_query["is_active"] = params["is_active"]
      }

      const instrument_categories = await InstrumentCategory.findAll({
        order: [
          ['category_name', 'ASC']
        ],
        include: [
          {
            model: MasterCommon,
            as: "mandate_types",
            where: where_query
          }
        ]
      })

      // const instrument_categories = await DB_CLIENT.query(`
      // select ic.uuid, ic.category_name, ic.is_active from instrument_categories ic
      //   inner join instrument_category_has_mandate_types icmt on icmt.instrument_category_id = ic.id
      //   inner join master_commons mc on mc.id = icmt.master_common_id 
      //   where mc.name = :mandate_type_name
      // `, {
      //   replacements: {
      //     mandate_type_name: params["mandate_type"]
      //   },
      //   type: QueryTypes.SELECT
      // })

      reply.send({
        success: true,
        instrument_categories: instrument_categories
      });

    } catch(error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  })

  fastify.post("/mandate_type/instrument_categories/active_mandates", async (request, reply) => {
    try {

      const { params } = request.body;

      await CHECK_PERMISSIONS(request, 'MasterManagement.List')

      const mandate_type = await MasterCommon.findOne({
        where: {
          name: params["mandate_type"]
        }
      })

      const instrument_categories = await InstrumentCategory.findOne({
        where: {
          mandate_type_id: mandate_type.id
        },
        order: [
          ['category_name', 'ASC']
        ],
        raw: true
      })

      const active_mandates = await DB_CLIENT.query(`
      SELECT TOP(1) m.is_active FROM mandates m
      INNER JOIN master_commons mc ON mc.name = m.mandate_type 
      INNER JOIN instrument_categories ic ON ic.mandate_type_id = mc.id
      WHERE mc.name = :mandate_type AND ic.uuid = :instrument_category_id
      `, {
        replacements: {
          mandate_type: mandate_type.name,
          instrument_category_id: instrument_categories.uuid
        },
        type: QueryTypes.SELECT
      })

      reply.send({
        success: true,
        active_mandate_status: active_mandates[0].is_active == 1 ? true : false
      });

    } catch(error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  })

}
  


module.exports = {
  categories_routes,
};