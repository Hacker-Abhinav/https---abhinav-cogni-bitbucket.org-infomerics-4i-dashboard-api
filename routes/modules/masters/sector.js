const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  MacroEconomicIndicator,
  Sector,
  Industry,
  SubIndustry,
} = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function sectors_routes(fastify) {
  fastify.post("/sectors", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const sectors = await Sector.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: [{
          model: MacroEconomicIndicator,
          as: "macro_economic_indicator",
          attributes: { exclude: ["id"] },
        },
        {
          model: Industry,
          as: "industry",
          attributes: { exclude: ["id"] },
          include: {
          model: SubIndustry,
          as: "sub_industry",
          attributes: { exclude: ["id"] },
          }
        },
      ]
      });

      reply.send({
        success: true,
        sectors: sectors,
      });
    } catch (error) {
      console.log('error ', error);
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/sectors/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create')
      const { params } = request.body;

      const macro_economic_indicator = await MacroEconomicIndicator.findOne({
        where: {
          uuid: params["macro_economic_indicator_uuid"],
        },
      });

      const sector = await Sector.create({
        uuid: uuidv4(),
        name: params["name"],
        description: params["description"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      if (macro_economic_indicator) {
        await sector.setMacro_economic_indicator(macro_economic_indicator);
      }

      reply.send({
        success: true,
        sector_uuid: sector.uuid,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post(
    "/macro_economic_indicator/sectors/view",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, 'MasterManagement.List')
        
        const macro_economic_indicator = await MacroEconomicIndicator.findOne({
          where: {
            uuid: request.body.params.macro_economic_indicator_uuid,
            is_active: true
          },
          raw: true,
        });

        if(!macro_economic_indicator){
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: "macro_economic_indicator not found !!",
          });
        }
        
          const sectors = await Sector.findAll({
            where: {
              macro_economic_indicator_id: macro_economic_indicator.id,
              is_active: true
            },
            attributes: { exclude: ["id"] },
          });

          reply.send({
            success: true,
            sectors: sectors,
            macro_economic_indicator,
          });
        
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error,
        });
      }
    }
  );

  fastify.post("/sectors/view", async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'MasterManagement.View');

      const sector = await Sector.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: { exclude: ["id","macro_economic_indicator_id"] },
        include: {
          model: MacroEconomicIndicator,
          as: "macro_economic_indicator",
          attributes: { exclude: ["id"] },
        },
      });

      if (sector) {
        reply.send({
          success: true,
          sectors: sector,
        });
      } else {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "sector_uuid not found !!",
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

  fastify.post("/sectors/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;
      
      const macro_economic_indicator = await MacroEconomicIndicator.findOne({
        where: {
          uuid: params.macro_economic_indicator_uuid,
        },
      });

      if (macro_economic_indicator) {
        const sector = await Sector.update(
          APPEND_USER_DATA(request, {
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
        const sector_object = await Sector.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        await sector_object.setMacro_economic_indicator(
          macro_economic_indicator
        );

        reply.send({
          success: true,
          sector_update_done: Boolean(sector_object[0] === 1),
        });
      } else {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "macro_economic_indicator_uuid not found !!",
        });
      }
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
  sectors_routes,
};
