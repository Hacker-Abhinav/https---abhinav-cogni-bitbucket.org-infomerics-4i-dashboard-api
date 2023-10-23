const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  InstrumentSubCategory,
  Instrument,
  RatingSymbolCategory,
  InstrumentCategory,
} = require("../../../models/modules/rating-model");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function instrument_routes(fastify) {
  fastify.post("/instruments", async (request, reply) => {
    try {
      const { params } = request.body;
      await CHECK_PERMISSIONS(request, 'Instruments');
      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const instruments = await Instrument.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: [
        {
          model: InstrumentCategory,
          as: "instrument_category",
          attributes: { exclude: ["id"] },
        },
        {
          model: InstrumentSubCategory,
          as: "instrument_sub_category",
          attributes: { exclude: ["id"] },
        },
        {
          model: RatingSymbolCategory,
          as: "rating_symbol_category",
          attributes: { exclude: ["id"] },
        }],
      });

      reply.send({
        success: true,
        instruments: instruments,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/instruments/create", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, 'Instruments.Create');

      const instrument_category = await InstrumentCategory.findOne({
        where: {
          uuid: params["instrument_category_uuid"],
          is_active: true
        }
      })

      const instrument_sub_category = await InstrumentSubCategory.findOne({
        where: {
          uuid: params["instrument_sub_category_uuid"],
          is_active: true,
        },
      });

      if (!instrument_sub_category) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: "Instrument_sub_category not found !!",
        });
      }

      const rating_symbol_category = await RatingSymbolCategory.findOne({
        where: {
          uuid: params["rating_symbol_category_uuid"],
          is_active: true
        }
      })
      
      const instrument = await Instrument.create({
        uuid: uuidv4(),
        name: params["name"],
        is_long_term: params["is_long_term"],
        is_short_term: params["is_short_term"],
        short_name: params["short_name"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      await instrument.setInstrument_category(instrument_category)
      await instrument.setInstrument_sub_category(instrument_sub_category);
      await instrument.setRating_symbol_category(rating_symbol_category);

      reply.send({
        success: true,
        instrument: instrument.uuid,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/instruments/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'Instruments.View');
      const instrument = await Instrument.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: { exclude: ["id"] },
        include: [
        {
          model: InstrumentCategory,
          as: "instrument_category",
          attributes: { exclude: ["id"] },
        },
        {
          model: InstrumentSubCategory,
          as: "instrument_sub_category",
          attributes: { exclude: ["id"] },
        },
        {
          model: RatingSymbolCategory,
          as: "rating_symbol_category",
          attributes: { exclude: ["id"] },
        }],
      });
      // const sub_category=InstrumentSubCategory.findOne({
      //     uuid:
      // })

      reply.send({
        success: true,
        instrument: instrument,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/instruments/by_subcategory/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'Instruments.View');
      const sub_category = await InstrumentSubCategory.findOne({
        where: {
          uuid: request.body.sub_category_uuid,
          is_active: true
        },
        raw: true
      });
      if (sub_category) {
        const instruments = await Instrument.findAll({
          where: {
            instrument_sub_category_id: sub_category.id,
          },
          order: [
            ['name', 'ASC']
          ],
          attributes: { exclude: ["id"] },
        });

        reply.send({
          success: true,
          instruments: instruments,
        });
      } else {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "This Sub Category is Undefined!!",
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

  fastify.post("/instruments/edit", async (request, reply) => {
    try {
      const { params } = request.body;
      await CHECK_PERMISSIONS(request, 'Instruments.Edit');
      const find_instrument = await Instrument.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      if (!find_instrument) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: "Instrument not found !!",
        });
      }

      const instrument_category = await InstrumentCategory.findOne({
        where: {
          uuid: params["instrument_category_uuid"]
        }
      })

      const instrument_sub_category = await InstrumentSubCategory.findOne({
        where: {
          uuid: params["instrument_sub_category_uuid"],
        },
      });
      if (!instrument_sub_category) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: " instrument_sub_category not found !!",
        });
      }

      const rating_symbol_category = await RatingSymbolCategory.findOne({
        where: {
          uuid: params["rating_symbol_category_uuid"]
        }
      })

      if (!rating_symbol_category) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: "Rating Symbol Category Not Found!",
        });
      }

      const instrument_update = await Instrument.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          short_name: params["short_name"],
          is_active: params["is_active"],
          is_long_term: params["is_long_term"],
          is_short_term: params["is_short_term"]
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      await find_instrument.setInstrument_category(instrument_category);
      await find_instrument.setInstrument_sub_category(instrument_sub_category);
      await find_instrument.setRating_symbol_category(rating_symbol_category)

      reply.send({
        success: true,
        instrument_update_result: Boolean(instrument_update[0] === 1),
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/instruments/based_on_category", async (request, reply) => {
    try {
      const { params } = request.body;
      await CHECK_PERMISSIONS(request, 'Instruments');

      const category = await InstrumentCategory.findOne({
        where:{
          uuid: params['instrument_category_uuid'],
          is_active: true
        },
        raw: true
      });

      const instruments = await DB_CLIENT.query(
        `SELECT i.uuid, i.name,i.short_name,i.is_active,ic.category_name,isc.category_name AS instrument_sub_category FROM instrument_categories ic 
        INNER JOIN instrument_sub_categories isc ON isc.instrument_category_id = ic.id 
        INNER JOIN instruments i ON i.instrument_sub_category_id = isc.id WHERE ic.id = :id
        ${Object.keys(params).includes('is_active') ? `AND i.is_active = ${params.is_active ? 1 : 0}` : ''}`,
        {
          replacements: {
            id: category.id,
            is_active: params.is_active
          },
          type: QueryTypes.SELECT,
        }
      );
      
      reply.send({
        success: true,
        instruments: instruments,
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
  instrument_routes,
};
