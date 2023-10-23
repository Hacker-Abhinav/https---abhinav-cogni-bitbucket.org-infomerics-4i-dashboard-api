const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  InstrumentCategory,
  InstrumentSubCategory,
} = require("../../../models/modules/rating-model");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function sub_categories_routes(fastify) {
  fastify.post("/sub_categories", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      const where_query = params ? params : {};
      const sub_instrument_categories = await InstrumentSubCategory.findAll({
        where: where_query,
        order: [
          ['category_name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: {
          model: InstrumentCategory,
          as: "instrument_category",
          attributes: { exclude: ["id"] },
        },
      });

      reply.send({
        success: true,
        sub_instrument_categories: sub_instrument_categories,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/sub_categories/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      const instrument_category = await InstrumentCategory.findOne({
        where: {
          uuid: params["instrument_category_uuid"],
          is_active: true,
        },
      });

      const sub_instrument_category = await InstrumentSubCategory.create({
        uuid: uuidv4(),
        category_name: params["category_name"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      sub_instrument_category.setInstrument_category(instrument_category);
      reply.send({
        success: true,
        sub_instrument_category: sub_instrument_category.uuid,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/sub_categories/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const instrument_category = await InstrumentCategory.findOne({
        where: {
          uuid: params["instrument_category_uuid"],
          is_active: true,
        },
      });

      const instrument_sub_category_object =
        await InstrumentSubCategory.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

      const sub_instrument_category_update = await InstrumentSubCategory.update(
        APPEND_USER_DATA(request, {
          category_name: params["category_name"],
          is_active: true,
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      instrument_sub_category_object.setInstrument_category(
        instrument_category
      );
      reply.send({
        success: true,
        sub_instrument_category_update_result: Boolean(
          sub_instrument_category_update[0] === 1
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

  fastify.post("/sub_categories/view", async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const sub_instrument_category = await InstrumentSubCategory.findOne({
        where: {
          uuid: request.body.uuid,
          is_active: true,
        },
        attributes: { exclude: ["id"] },
        include: {
          model: InstrumentCategory,
          as: "instrument_category",
          attributes: { exclude: ["id"] },
        },
      });

      reply.send({
        success: true,
        sub_instrument_category: sub_instrument_category,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/sub_categories/by_category/view", async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      let where_query =  {};
      if(Object.keys(request.body).includes('is_active'))
      {
        where_query['is_active'] = request.body.is_active;
      } 

      const instrument_category = await InstrumentCategory.findOne({
        where: {
          uuid: request.body.instrument_category_uuid,
          is_active: true,
        },
        raw: true
      });

      if (instrument_category) {
        where_query['instrument_category_id'] = instrument_category.id;
        const sub_instrument_category = await InstrumentSubCategory.findAll({
          where: where_query,
          order: [
            ['category_name', 'ASC']
          ],
          attributes: { exclude: ["id"] },
        });

        reply.send({
          success: true,
          sub_instrument_category: sub_instrument_category,
        });
      } else {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "This Category is Undefined!!",
        });
      }
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
  sub_categories_routes,
};
