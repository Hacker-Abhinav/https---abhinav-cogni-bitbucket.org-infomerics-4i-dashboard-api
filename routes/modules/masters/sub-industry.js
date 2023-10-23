const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  Industry,SubIndustry
} = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");
const { IndustryScore } = require("../../../models/modules/rating-model");
async function sub_industries_routes(fastify) {
  fastify.post("/sub_industries", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const { params } = request.body
      var sub_industries_response = ''

      if (params["industry_uuid"]) {

        const sub_industries = await DB_CLIENT.query(`
        SELECT isc.uuid AS industry_score_uuid, isc.score AS score, si.uuid AS sub_industry_uuid, si.name AS sub_industry_name, si.description AS sub_industry_description, si.is_active, i.uuid AS industry_uuid, i.name AS industry_name, 
        i.description AS industry_description
        FROM sub_industries si
        INNER JOIN industries i ON i.id = si.industry_id 
        LEFT JOIN industry_scores isc ON isc.sub_industry_id = si.id
        WHERE i.uuid = :industry_uuid
        `, {
          replacements: {
            industry_uuid: params["industry_uuid"]
          },
          type: QueryTypes.SELECT
        })

        sub_industries_response = sub_industries

      } else {
        const sub_industries = await DB_CLIENT.query(`SELECT isc.uuid AS industry_score_uuid, isc.score AS score, si.uuid AS sub_industry_uuid, si.name AS sub_industry_name, si.description AS sub_industry_description,
        si.is_active, i.uuid AS industry_uuid, i.name AS industry_name, 
                i.description AS industry_description
                FROM industries i
                LEFT JOIN sub_industries si ON si.industry_id = i.id
                LEFT JOIN industry_scores isc ON isc.sub_industry_id = si.id WHERE si.uuid IS NOT NULL AND i.is_active = 1        
        `)

        sub_industries_response = sub_industries[0]
      }


      reply.send({
        success: true,
        sub_industries: sub_industries_response,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/sub_industries/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;
      
      const industry = await Industry.findOne({
        where: {
          uuid: params["industry_id"],
        },
      });

      const industry_score =  await IndustryScore.findOne({
        where: {
          uuid: params["industry_score_uuid"]
        }
      })

      const sub_industry = await DB_CLIENT.query(`
      INSERT INTO sub_industries (name, description, uuid, is_active, created_at, created_by, industry_score_id, industry_id) VALUES (
        :name,
        :description,
        :uuid,
        :is_active,
        :created_at,
        :created_by,
        :industry_score_id,
        :industry_id
      );
      `, {
        replacements: {
          name: params["name"],
          description: params["description"],
          uuid: uuidv4(),
          is_active: true,
          created_at: new Date(),
          created_by: request.user.id,
          industry_score_id: industry_score.id,
          industry_id: industry.id
        },
        type: QueryTypes.INSERT
      })

      reply.send({
        success: true,
        sub_industry: sub_industry,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/sub_industries/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.View');

      const { params } = request.body

      const sub_industry = await DB_CLIENT.query(`
      SELECT isc.uuid AS industry_score_uuid, isc.score AS score, si.uuid AS sub_industry_uuid, si.name AS sub_industry_name, si.description AS sub_industry_description, si.is_active, i.uuid AS industry_uuid, i.name AS industry_name, 
      i.description AS industry_description
      FROM industry_scores isc
      FULL JOIN sub_industries si ON si.id = isc.sub_industry_id
      FULL JOIN industries i ON i.id = si.industry_id
      WHERE si.uuid = :uuid
      `, {
        replacements: {
          uuid: params["uuid"]
        },
        type: QueryTypes.SELECT
      })

      reply.send({
        success: true,
        sub_industry: sub_industry[0],
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/industry/sub_industries/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.View')
      const { params } = request.body;

      const industry = await Industry.findOne({
        where: {
          uuid: params.industry_uuid,
        },
        raw: true
      });

      if (!industry) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO INDUSTRY FOUND",
        });
        return;
      }

      const sub_industry = await SubIndustry.findAll({
        where: {
          industry_id: industry.id,
          is_active: true
        },
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        sub_industry: sub_industry,
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/sub_industries/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const industry = await Industry.findOne({
        where: {
          uuid: params["industry_id"],
        },
      });

      const sub_industry_object = await SubIndustry.findOne({
        where: {
          uuid: params["uuid"],
        },
        raw: true
      });

      if (!sub_industry_object || !industry) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "No industry or sub industry",
        });
        return;
      }

      const sub_industry_update = await SubIndustry.update(APPEND_USER_DATA(request, {
        name: params["name"],
        description: params["description"],
        is_active: params["is_active"]
      }), {
        where: {
          uuid: params["uuid"]
        }
      })

      const check_industry_score = await DB_CLIENT.query(`
      SELECT isco.id, isco.uuid FROM industry_scores isco WHERE isco.sub_industry_id = :sub_industry_id
      `, {
        replacements: {
          sub_industry_id: sub_industry_object.id
        },
        type: QueryTypes.SELECT
      });

      const industry_score = await IndustryScore.upsert(APPEND_USER_DATA(request, {
        uuid: check_industry_score.length > 0 ? check_industry_score[0].uuid : uuidv4(),
        score: params["score"],
        sub_industry_id: sub_industry_object.id
      }))

      reply.send({
        success: true,
        industry_score: industry_score[0],
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
  sub_industries_routes,
};