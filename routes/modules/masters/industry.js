const { v4: uuidv4 } = require("uuid");
const { Sector, Industry } = require("../../../models/modules/onboarding");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function industries_routes(fastify) {
  fastify.post("/industries", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const industries = await Industry.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: {
          model: Sector,
          as: "industry_sector",
          attributes: { exclude: ["id"] },
        },
      });

      reply.send({
        success: true,
        industries: industries,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/industries/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      const sector = await Sector.findOne({
        where: {
          uuid: params["sector_uuid"],
        },
      });
      if (sector) {
        const industry = await Industry.create({
          uuid: uuidv4(),
          name: params["name"],
          description: params["description"],
          is_active: true,
          created_at: new Date(),
          created_by: request.user.id,
        });

        await industry.setIndustry_sector(sector);

        reply.send({
          success: true,
          industry_uuid: industry.uuid,
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
        error: error["errors"],
      });
    }
  });

  fastify.post("/industries/view", async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const industries = await Industry.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: { exclude: ["id"] },
        include: {
          model: Sector,
          as: "industry_sector",
          attributes: { exclude: ["id"] },
        },
      });

      reply.send({
        success: true,
        industries: industries,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/sector/industries/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List')
      const { params } = request.body;

      const sector = await Sector.findOne({
        where: {
          uuid: params.sector_uuid,
        },
        raw: true
      });

      if (!sector) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO SECTOR FOUND",
        });
        return;
      }

      const industry = await Industry.findAll({
        where: {
          sector_id: sector.id,
          is_active: true
        },
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
        include: {
          model: Sector,
          as: "industry_sector",
          attributes: { exclude: ["id"] },
        },
      });

      reply.send({
        success: true,
        industry: industry,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/industries/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const sector = await Sector.findOne({
        where: {
          uuid: params["sector_uuid"],
        },
      });

      const industry_object = await Industry.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      const industry = await Industry.update(
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
      if (sector) {
        await industry_object.setIndustry_sector(sector);
      }

      reply.send({
        success: true,
        industry_update_done: Boolean(industry[0] === 1),
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
  industries_routes,
};
