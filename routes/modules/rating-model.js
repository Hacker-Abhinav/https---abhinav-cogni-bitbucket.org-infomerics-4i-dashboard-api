const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Op, QueryTypes, where, Sequelize } = require("sequelize");
const {
  RATING_DB_INSTANCE,
  RatingModel,
  RiskType,
  RatingModelHasRiskType,
  Factor,
  FactorParameter,
  FinancialYear,
  RatingMatrix,
  IndustryScore,
  RatingMetadata,
  RatingSheet,
  NotchingModel,
  InstrumentDetail,
  RatingSymbolMaster,
  RatingSymbolCategory,
  RatingSymbolMapping,
  RatingType,
  CompanyRatingModel,
  IndustryModelMapping,
  RatingScale,
  RatingModelHasNotching,
  RiskTypeRatingSheet,
  RatingModelVersion,
} = require("../../models/modules/rating-model.js");
const {
  Company,
  Industry,
  SubIndustry,
  Mandate,
  User,
} = require("../../models/modules/onboarding");
const { error_logger } = require("../../loki-push-agent");
const { LOG_TO_DB } = require("../../logger");
const { APPEND_USER_DATA, CHECK_PERMISSIONS, UPLOAD_TO_AZURE_STORAGE } = require("../../helpers");
const { log } = require("winston");
const { DB_CLIENT } = require("../../db.js");
const { LANG_DATA } = require("../../lang");
const { default: puppeteer } = require("puppeteer");
const { readFileSync } = require("fs");
const L = LANG_DATA();

async function rating_model_routes(fastify) {
  fastify.register((instance, opts, done) => {
    fastify.addHook("onRequest", async (request, reply) => {
      if (false && !request.user.is_super_account) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_ACCESS_TO_MODULE"],
        });
      }
    });

    fastify.post("/industry_score", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'IndustryScore.List')
        let where_query = request.body.params ? request.body.params : {};

        const industry_scores = await IndustryScore.findAll({
          where: where_query,
          include: {
            model: SubIndustry,
            as: 'sub_industry'
          }
        });
        return reply.send({
          success: true,
          industry_scores: industry_scores,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_score/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'IndustryScore.Create')
        const { params } = request.body;

        const sub_industry = await SubIndustry.findOne({
          where: {
            uuid: params["sub_industry_uuid"],
            is_active: true
          }
        });

        if (!sub_industry) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: "NO_SUB_INDUSTRY_FOUND",
          });
          return;
        }

        const industry_score = await IndustryScore.create({
          uuid: uuidv4(),
          score: params["score"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id
        })

        await industry_score.setSub_industry(sub_industry)

        return reply.send({
          success: true,
          industry_score: industry_score,
        });
      } catch (error) {
        console.log(error)
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_score/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'IndustryScore.Create')
        const { params } = request.body;

        const sub_industry = await SubIndustry.findOne({
          where: {
            uuid: params["sub_industry_uuid"],
            is_active: true
          }
        });

        if (!sub_industry) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: "NO_SUB_INDUSTRY_FOUND",
          });
          return;
        }

        const industry_score_updated = await IndustryScore.update(APPEND_USER_DATA(request, {
          score: params["score"]
        }), {
          where: {
            sub_industry_id: sub_industry.id
          }
        })

        const industry_score = await IndustryScore.findOne({
          where: {
            sub_industry_id: sub_industry.id
          }
        })

        await industry_score.setSub_industry(sub_industry)

        return reply.send({
          success: true,
          industry_score_updated: industry_score_updated,
        });
      } catch (error) {
        console.log(error)
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_score/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'IndustryScore.View')
        const { params } = request.body

        const sub_industry = await SubIndustry.findOne({
          where: {
            uuid: params["sub_industry_uuid"],
            is_active: true
          },
          raw: true,
        });

        if (!sub_industry) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_SUB_INDUSTRY_FOUND",
          });
          return;
        }

        const industry_score = await IndustryScore.findOne({
          where: {
            sub_industry_id: sub_industry.id
          },
          attributes:{exclude: ['id']},
          include: {
            model: SubIndustry,
            as: 'sub_industry'
          }
        })

        return reply.send({
          success: true,
          industry_score: industry_score,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/company_rating_model/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'CompanyRatingModel.Create')
        const { params } = request.body;

        const model_type = await RatingModel.findOne({
          where: {
            uuid: params["model_type_uuid"],
            is_active: true,
          },
        });

        if (!model_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
          },
          raw: true
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        const company_rating_model = await CompanyRatingModel.create({
          uuid: uuidv4(),
          turnover: params["turnover"],
          status: params["status"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          industry_id: company.industry_id,
          company_id: company.id
        });

        await LOG_TO_DB(request, {
          activity: "COMPANY RATING MODEL CREATION",
          params: {
            data: params,
          },
        });

        await company_rating_model.setModel_type(model_type);

        reply.send({
          success: true,
          company_rating_model: company_rating_model,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/company_rating_model", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'CompanyRatingModel.List')
        let where_query = {};

        if (Object.keys(request.body.params).includes("company_uuid")) {
          const company = await Company.findOne({
            where: {
              uuid: request.body.params["company_uuid"]
            }
          })
          where_query["company_id"] = company.id
        }

        const company_rating_models = await CompanyRatingModel.findAll({
          where: where_query,

          include: [
            {
              model: Company,
              as: "company",
              include: {
                model: SubIndustry,
                as: "company_sub_industry",
              },
            },
            {
              model: RatingModel,
              as: "model_type",
            },
            {
              model: Industry,
              as: "industry",
            },
          ],
        });

        reply.send({
          success: true,
          company_rating_models: company_rating_models,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/company_rating_model/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'CompanyRatingModel.View')
        const { params } = request.body

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
          },
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        const model_type = await RatingModel.findOne({
          where: {
            uuid: params["model_type_uuid"],
          },
        });

        if (!model_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const company_rating_model = await CompanyRatingModel.findOne({
          where: {
            company_id: company.id,
            rating_model_id: model_type.id,
          },
          include: [
            {
              model: Company,
              as: "company",
              include: {
                model: Industry,
                as: "company_industry",
              },
              include: {
                model: SubIndustry,
                as: "company_sub_industry",
              },
            },
            {
              model: RatingModel,
              as: "model_type",
            },
          ],
        });

        reply.send({
          success: true,
          company_rating_model: company_rating_model,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RatingModel.List");

        let where_query = request.body.params ? request.body.params : {};

        const rating_models = await RatingModel.findAll({
          where: where_query,
        });
        reply.send({
          success: true,
          rating_models: rating_models,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RatingModel.View");
        const params = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["uuid"],
          },
        });
        reply.send({
          success: true,
          rating_model: rating_model,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const rating_model = await RatingModel.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await LOG_TO_DB(request, {
          activity: "CREATE_RATING_MODEL",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          rating_model_uuid: rating_model.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/rating_models/create",
          activity: "CREATE_RATING_MODEL",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;

        
        if(params['is_active']===false)
        {
           await RatingModel.update(
              APPEND_USER_DATA(request, {
                is_active: false,
              }),
              {
                where: {
                  uuid: params["uuid"],
                },
              }
            );
            reply.statusCode = 422;
            reply.send({
              success: true,
              error: "Data successfully updated",
            });
        }
        // checking incoming name is exit in database or not
        const rating_model_object_check1 = await RatingModel.findOne({
          where: {
            name: params["name"],
          },
        });
        if(rating_model_object_check1)
        {
            reply.statusCode = 422;
            reply.send({
              success: true,
              error: "Name already exist",
            });
        }

        const rating_model_object = await RatingModel.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        const rating_model_update_result = await RatingModel.update(
          APPEND_USER_DATA(request, {
            is_active: false,
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        if (rating_model_update_result[0] === 0) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: "Updation failed!",
          });
        }

        const rating_model = await RatingModel.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await rating_model.setParent_rating_model(rating_model_object);

        await LOG_TO_DB(request, {
          activity: "UPDATE_RATING_MODEL",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          rating_model_update_result: Boolean(
            rating_model_update_result[0] === 1
          ),
          rating_model_uuid: rating_model.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/rating_models/create",
          activity: "UPDATE_RATING_MODEL",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models/view_risk_types", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')
        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
        }

        let risk_types_ids = await RatingModelHasRiskType.findAll({
          where: {
            rating_model_id: rating_model.id,
            is_active: true,
          },
          attributes: ["risk_type_id"],
          raw: true,
        });

        console.log("risk_types_ids: ", risk_types_ids);

        risk_types_ids = risk_types_ids.map((el) => el.risk_type_id);

        // let notching_ids = await RatingModelHasNotching.findAll({
        //   where: {
        //     rating_model_id: rating_model.id,
        //     is_active: true,
        //   },
        //   attributes: ["notching_model_id"],
        //   raw: true,
        // });



        // notching_ids = notching_ids.map((el) => el.notching_model_id);

        let risk_types = await DB_CLIENT.query(
          `SELECT rt.name, rt.uuid,rt.is_active,rmhrt.weightage,rt.sequence_number FROM rating_models rm 
          INNER JOIN rating_model_has_risk_types rmhrt ON rmhrt.rating_model_id = rm.id AND rm.id = :rating_model_id AND rmhrt.is_active= 1 AND rm.is_active = 1
          INNER JOIN risk_types rt ON rt.id = rmhrt.risk_type_id AND rt.is_active = 1 ORDER BY rt.sequence_number`,
          {
            replacements: {
              rating_model_id: rating_model.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        // const notchings = await NotchingModel.findAll({
        //   where: {
        //     id: notching_ids,
        //     is_active: true,
        //   },
        //   attributes: { exclude: ['id']}
        // });

        reply.send({
          success: true,
          risk_types: risk_types,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_models", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, 'NotchingModel.List')
        let where_query = request.body.params ? request.body.params : {};

        const notching_models = await NotchingModel.findAll({
          where: where_query,
          order: [['sequence_number', 'ASC']]
        });
        reply.send({
          success: true,
          notching_models: notching_models,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_models/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'NotchingModel.View')
        const params = request.body;

        const notching_model = await NotchingModel.findOne({
          where: {
            uuid: params["uuid"],
          },
        });
        reply.send({
          success: true,
          notching_model: notching_model,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_models/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'NotchingModel.Create')
        const { params } = request.body;

        const notching_model = await NotchingModel.create({
          uuid: uuidv4(),
          name: params["name"],
          sequence_number: params["sequence_number"], 
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await LOG_TO_DB(request, {
          activity: "CREATE_NOTCHING_MODEL",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          notching_model_uuid: notching_model.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/notching_models/create",
          activity: "CREATE_NOTCHING_MODEL",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_models/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'NotchingModel.Edit')
        const { params } = request.body;

        const notching_model_object = await NotchingModel.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        const notching_model_update_result = await NotchingModel.update(
          APPEND_USER_DATA(request, {
            is_active: false,
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        if (notching_model_update_result[0] === 0) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: "Updation failed!",
          });
        }

        const notching_model = await NotchingModel.create({
          uuid: uuidv4(),
          name: params["name"],
          sequence_number: params["sequence_number"], 
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await notching_model.setParent_notching_model(notching_model_object);

        await LOG_TO_DB(request, {
          activity: "UPDATE_NOTCHING_MODEL",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          notching_model_update_result: Boolean(
            notching_model_update_result[0] === 1
          ),
          notching_model_uuid: notching_model.uuid,
        });
      } catch (error) {
        let error_log = {
          api: "v1/notching_models/create",
          activity: "UPDATE_NOTCHING_MODEL",
          params: {
            error: String(error),
          },
        };
        error_logger.info(JSON.stringify(error_log));
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/risk_types", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RiskType.List");
        let where_query = request.body.params ? request.body.params : {};

        const risk_types = await RiskType.findAll({
          where: where_query,
          order: [['sequence_number', 'ASC']]
        });
        reply.send({
          success: true,
          risk_types: risk_types,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/risk_types/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, 'RiskType.Create');
        const { params } = request.body;

        const risk_type = await RiskType.create({
          uuid: uuidv4(),
          name: params["name"],
          weightage: params["weightage"], 
          is_active: true,
          sequence_number: params["sequence_number"], 
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        reply.send({
          success: true,
          risk_type_uuid: risk_type.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/risk_types/edit", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "RiskType.Edit");

        const risk_type_object = await RiskType.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        const risk_type_update_result = await RiskType.update(
          APPEND_USER_DATA(request, {
            is_active: false,
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        if (risk_type_update_result[0] === 0) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: "Updation failed!",
          });
        }

        const risk_type = await RiskType.create({
          uuid: uuidv4(),
          name: params["name"],
          weightage: params["weightage"],
          sequence_number: params["sequence_number"],  
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await risk_type.setParent_risk_type(risk_type_object);

        await LOG_TO_DB(request, {
          activity: "UPDATE_RISK_TYPE",
          params: {
            data: params,
          },
        });

        reply.send({
          success: true,
          risk_type_update_result: Boolean(risk_type_update_result[0] === 1),
          risk_type_uuid: risk_type.uuid,
        });
      } catch (error) {
        console.log("error: ",error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/risk_types/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "RiskType.View");
        const { params } = request.body;

        const risk_type = await RiskType.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        reply.send({
          success: true,
          risk_type: risk_type,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models/assign_notching", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, 'RatingModel.List')

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const notching = await RiskType.findOne({
          where: {
            uuid: params["notching_uuid"],
            is_active: true,
          },
        });

        if (!notching) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_NOTCHING",
          });
          return;
        }

        const rating_model_notching = await RatingModelHasNotching.create({
          uuid: uuidv4(),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await rating_model_notching.setNotching_model([notching.id]);
        await rating_model_notching.setRating_model([rating_model.id]);

        reply.send({
          success: true,
          rating_model_notching_uuid: rating_model_notching.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_model/notching/view", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, 'RatingModel.View')

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const risk_type = await RiskType.findOne({
          where: {
            name: 'Notching',
            is_active: true,
          },
          raw: true,
        });

        let rating_model_has_notchings = await RatingModelHasRiskType.findOne({
          where: {
            rating_model_id: rating_model.id,
            risk_type_id: risk_type.id,
            is_active: true,
          },
        });


        // const notching_ids =  rating_model_notchings.map(el=>el.notching_model_id);
        // console.log("notching_ids: ", notching_ids);

        const rating_model_notchings = rating_model_has_notchings ? await NotchingModel.findAll({
          where:{
            // id: notching_ids,
            is_active: true
          }
        }) : null;

        reply.send({
          success: true,
          rating_model_notchings: rating_model_notchings,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_models/assign_risk_types", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const risk_type = await RiskType.findOne({
          where: {
            uuid: params["risk_type_uuid"],
            is_active: true,
          },
        });

        if (!risk_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RISK_TYPE"],
          });
          return;
        }

        let version_name = rating_model.name.split(' ').map((word) => word.charAt(0))
        .join("") + '-1';

        const version_check = await DB_CLIENT.query(
          `SELECT version FROM rating_model_has_risk_types WHERE rating_model_id = :rating_model_id AND is_active = 1`,
          {
            replacements: {
              rating_model_id: rating_model.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        if(version_check.length > 0){
          version_name = version_check[0].version;
        }

        console.log("risk_type: ", risk_type);

        if (risk_type.name === 'Notching') {

          const notchings = await DB_CLIENT.query(
            `SELECT id FROM notching_models WHERE is_active = 1
          `,
            {
              type: QueryTypes.SELECT,
            }
          );

          const bulk_data = [];

          notchings.map(el =>{
            const obj = {
            uuid: uuidv4(),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            rating_model_id: rating_model.id,
            notching_model_id: el.id,
          };
          bulk_data.push(obj);
        })

        console.log("bulk_data: ",bulk_data);
        const notching_model = await RatingModelHasNotching.bulkCreate(bulk_data);
        }
        
          const rating_model_risk_type = await RatingModelHasRiskType.create({
          uuid: uuidv4(),
          is_active: true,
          version: version_name,
          weightage: params["weightage"],
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id
         });

        await rating_model_risk_type.setRisk_type([risk_type.id]);
        await rating_model_risk_type.setRating_model([rating_model.id]);

        reply.send({
          success: true,
          rating_model_risk_type_uuid: rating_model_risk_type.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    // for ratint model edit
    fastify.post("/rating_model_risk_type/edit", async (request, reply) => 
    {
      try{
        let {weightage}=request?.body
        const {uuid} =request?.body?.params
        // checking id is exit or not
       const checkData = await RatingModelHasRiskType.findOne({uuid:uuid});
        if(!checkData)
        {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: 'Model Risk Type Not Found',
          });
          return;
        }
        const updatedData = await RatingModelHasRiskType.update(
           { weightage: weightage,updated_at: new Date()},
            {
            where: {
              uuid: uuid,
            },
          });

          reply.send({
            success: true,
            message:'Model Risk Type Successfully updated'
          });
        }
        catch(error)
        {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });

        } 

    });


    fastify.post("/rating_model_risk_type/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')
        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const risk_type = await RiskType.findOne({
          where: {
            uuid: params["risk_type_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!risk_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RISK_TYPE_FOUND"],
          });
          return;
        }

        const rating_model_risk_type = await RatingModelHasRiskType.findOne({
          where: {
            risk_type_id: risk_type.id,
            rating_model_id: rating_model.id,
            is_active: true,
          },
        });

        reply.send({
          success: true,
          rating_model_risk_type: rating_model_risk_type,
          model_name:rating_model.name,
          risk_name:risk_type.name,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_model/create_factors", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'NotchingModel.Create')
        const { params } = request.body;

        const notching_model = await NotchingModel.findOne({
          where: {
            uuid: params["notching_model_uuid"],
            is_active: true,
          },
        });

        if (!notching_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_NOTCHING_MODEL"],
          });
          return;
        }

        const notching_model_factor = await Factor.create({
          uuid: uuidv4(),
          question: params["question"],
          max_score: params["max_score"],
          coefficient: params["coefficient"],
          sequence_number: params["sequence_number"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await notching_model_factor.setNotching_model(notching_model);

        reply.send({
          success: true,
          notching_model_factor_uuid: notching_model_factor.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_model/view_factors", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'NotchingModel.View')
        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL"],
          });
          return;
        }

        const notching_model = await NotchingModel.findOne({
          where: {
            uuid: params["notching_model_uuid"],
            is_active: true,
          },
        });

        if (!notching_model) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: L["NO_NOTCHING_MODEL"],
          });
          return;
        }

        const rating_model_notching = await RatingModelHasNotching.findOne({
          where: {
            notching_model_id: notching_model.id,
            rating_model_id: rating_model.id,
            is_active: true,
          },
        });

        if (!rating_model_notching) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "Rating model has not been assigned any notchings"
          });
          return;
        }

        const factors = await Factor.findAll({
          where: {
            rating_model_notching_id: rating_model_notching.id,
            is_active: true,
          },
          include: {
            model: FactorParameter,
            as: "factor_parameters",
            where:{
              is_active: true
            },
            attributes: { exclude: ["id", "factor_id"] },
          },
          order: [['sequence_number','ASC']]
        });

        reply.send({
          success: true,
          factors: factors,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/notching_model/edit_factors", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'NotchingModel.Edit')
        const { params } = request.body;

        const notching_model = await NotchingModel.findOne({
          where: {
            uuid: params["notching_model_uuid"],
            is_active: true,
          },
        });

        if (!notching_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_NOTCHING_MODEL"],
          });
          return;
        }

        const factor_object = await Factor.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        if (!factor_object) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_FACTOR_FOUND"],
          });
          return;
        }

        const notching_model_factor_update = await Factor.update(
          APPEND_USER_DATA(request, {
            is_active: false,
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        const notching_model_factor = await Factor.create({
          uuid: uuidv4(),
          question: params["question"],
          max_score: params["max_score"],
          coefficient: params["coefficient"],
          sequence_number: params["sequence_number"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await notching_model_factor.setNotching_model(notching_model);

        reply.send({
          success: true,
          notching_model_factor_update_result: Boolean(
            notching_model_factor_update[0] == 1
          ),
          notching_model_factor: notching_model_factor.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post(
      "/rating_models/create_risk_type_factors",
      async (request, reply) => {
        try {

          await CHECK_PERMISSIONS(request, 'RatingModel.Create')
          const { params } = request.body;

          const rating_model =
            await RatingModel.findOne({
              where: {
                uuid: params["rating_model_uuid"],
                is_active: true,
              },
            });

            const notching_model =
            await NotchingModel.findOne({
              where: {
                uuid: params["notching_model_uuid"],
                is_active: true,
              },
            });

            const risk_type =
            await RiskType.findOne({
              where: {
                uuid: params["risk_type_uuid"],
                is_active: true,
              },
            });

            console.log("risk_type: ", risk_type);

            const rating_model_risk_type =
            await RatingModelHasRiskType.findOne({
              where: {
                risk_type_id: risk_type? risk_type.id : null,
                rating_model_id: rating_model.id,
                is_active: true,
              },
            });

            const rating_model_notching =
            await RatingModelHasNotching.findOne({
              where: {
                notching_model_id: notching_model? notching_model.id : null,
                rating_model_id: rating_model.id,
                is_active: true,
              },
            });

            console.log("rating_model_risk_type: ", rating_model_risk_type);

          const rating_model_risk_type_factor = await Factor.create({
            uuid: uuidv4(),
            question: params["question"],
            max_score: params["max_score"],
            coefficient: params["coefficient"],
            sequence_number: params["sequence_number"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
            rating_model_notching_id: rating_model_notching? rating_model_notching.id : null,
            rating_model_risk_type_id: rating_model_risk_type? rating_model_risk_type.id : null
          });

          reply.send({
            success: true,
            rating_model_risk_type_factor: rating_model_risk_type_factor.uuid,
          });
        } catch (error) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });
        }
      }
    );

    fastify.post(
      "/rating_models/edit_risk_type_factors",
      async (request, reply) => {
        try {

          await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
          const { params } = request.body;

          const factor_object = await Factor.findOne({
            where: {
              uuid: params["uuid"],
              is_active: true,
            },
          });

          if (!factor_object) {
            reply.status_code = 403;
            reply.send({
              success: false,
              error: L["NO_FACTOR_FOUND"],
            });
            return;
          }

          const rating_model =
            await RatingModel.findOne({
              where: {
                uuid: params["rating_model_uuid"],
                is_active: true,
              },
            });

            const notching_model =
            await NotchingModel.findOne({
              where: {
                uuid: params["notching_model_uuid"],
                is_active: true,
              },
            });

            const risk_type =
            await RiskType.findOne({
              where: {
                uuid: params["risk_type_uuid"],
                is_active: true,
              },
            });

          const rating_model_risk_type =
            await RatingModelHasRiskType.findOne({
              where: {
                risk_type_id: risk_type ? risk_type.id : null,
                rating_model_id: rating_model.id,
                is_active: true,
              },
            });

            const rating_model_notching =
            await RatingModelHasNotching.findOne({
              where: {
                notching_model_id: notching_model ? notching_model.id : null,
                rating_model_id: rating_model.id,
                is_active: true,
              },
            });


          // const rating_model_risk_type_factor_update = await Factor.update(
          //   APPEND_USER_DATA(request, {
          //     is_active: false,
          //   }),
          //   {
          //     where: {
          //       uuid: params["uuid"],
          //     },
          //   }
          // );

          // if (rating_model_risk_type_factor_update[0] === 0) {
          //   reply.status_code = 403;
          //   return reply.send({
          //     success: false,
          //     error: "Updation failed!",
          //   });
          // }

          const rating_model_risk_type_factor = await Factor.update({
            question: params["question"],
            max_score: params["max_score"],
            coefficient: params["coefficient"],
            sequence_number: params["sequence_number"],
            is_active: params['is_active'],
            updated_at: new Date(),
            updated_by: request.user.id,
            rating_model_notching_id: rating_model_notching?.id,
            rating_model_risk_type_id: rating_model_risk_type?.id
          },{
            where:{
              uuid: params["uuid"],
            }
          }
          );

          reply.send({
            success: true,
            rating_model_risk_type_factor_update_result: Boolean(
              rating_model_risk_type_factor[0] == 1
            ),
          });
        } catch (error) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: String(error),
          });
        }
      }
    );

    fastify.post("/rating_models/view_factors", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')
        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL"],
          });
          return;
        }

        const risk_type = await RiskType.findOne({
          where: {
            uuid: params["risk_type_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!risk_type) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RISK_TYPE"],
          });
          return;
        }

        const rating_model_risk_type = await RatingModelHasRiskType.findOne({
          where: {
            risk_type_id: risk_type.id,
            rating_model_id: rating_model.id,
            is_active: true,
          },
        });

        const factors = await Factor.findAll({
          where: {
            rating_model_risk_type_id: rating_model_risk_type.id,
            is_active: true,
          },
          attributes: { exclude: ["id", "rating_model_risk_type_id"] },
          include: [
            {
              model: FactorParameter,
              where:{is_active: true},
              as: "factor_parameters",
              attributes: { exclude: ["id", "factor_id"] },
              order:[['score', 'DESC']]
            }
          ],
          order:[['sequence_number', 'ASC']]
        });

        reply.send({
          success: true,
          factors: factors,
        });
      } catch (error) {
        reply.statusCode = 422;
        console.log("error: ", error);
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/factors/delete", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Factors.Edit')
        const { params } = request.body;

        const rating_model_risk_type_factor_update = await Factor.update(
          APPEND_USER_DATA(request, {
            is_active: false,
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          factor_delete_result: Boolean(
            rating_model_risk_type_factor_update[0] === 1
          ),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/factors/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Factors.View')
        const { params } = request.body;

        const factor = await Factor.findOne({
          where: {
            uuid: params["uuid"],
          },
          attributes: {
            exclude: [
              "id",
              "rating_model_risk_type_id",
              "notching_model_id",
              "parent_factor_id",
            ],
          },
          include: [
            {
              model: RatingModelHasRiskType,
              as: "factor_rating_model_risk_type",
              attributes: ["uuid"],
              include: [
                {
                  model: RatingModel,
                  as: "rating_model",
                  attributes: ["uuid", "name", "is_active"],
                },
                {
                  model: RiskType,
                  as: "risk_type",
                  attributes: ["uuid", "name", "is_active"],
                },
              ],
            },
            {
              model: FactorParameter,
              where:{is_active:1},
              as: "factor_parameters",
              attributes: { exclude: ["id", "factor_id"] },
              order: [['score','ASC']]
            },
          ],
        });

        reply.send({
          success: true,
          factor: factor,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/factor_parameters/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Factors.Create')
        const { params } = request.body;

        const factor = await Factor.findOne({
          where: {
            uuid: params["factor_uuid"],
            is_active: true,
          },
        });

        if (!factor) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_FACTOR_SELECTED"],
          });
          return;
        }

        const factor_parameter = await FactorParameter.create({
          uuid: uuidv4(),
          name: params["name"],
          score: params["score"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await factor_parameter.setFactor(factor);

        reply.send({
          success: true,
          factor_parameter: factor_parameter.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/factor_parameters/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'Factors.Edit')
        const { params } = request.body;

        const factor = await Factor.findOne({
          where: {
            uuid: params["factor_uuid"],
            is_active: true,
          },
        });

        if (!factor) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_FACTOR_SELECTED"],
          });
          return;
        }

        const factor_parameter_object = await FactorParameter.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        if (!factor_parameter_object){
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_FACTOR_PARAMETER_FOUND",
          });
          return;
        }

        const factor_parameter = await FactorParameter.update(
          APPEND_USER_DATA(request, {
            name: params["name"],
            score: params["score"],
            is_active: params["is_active"],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );
        await factor_parameter_object.setFactor(factor);
        reply.send({
          success: true,
          factor_parameter_update_result: Boolean(factor_parameter[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_metadata/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const company = await Company.findOne({
          where: {
            uuid: request.body.company_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_FOUND",
          });
          return;
        }

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: request.body.rating_model_uuid,
            is_active: true,
          },
          raw: true,
        });

        let risk_type = null;
        if(request.body.risk_type_uuid){
          risk_type= await RiskType.findOne({
          where: {
            uuid: request.body.risk_type_uuid,
            is_active: true,
          },
          raw: true,
        });
      }

        let notching = null;

        if(request.body.notching_uuid){
        notching = await NotchingModel.findOne({
          where: {
            uuid: request.body.notching_uuid,
            is_active: true,
          },
          raw: true,
        });
      }

        const data = [];
 
        params.forEach((element) => {
          (element.uuid = uuidv4()),
            (element.notching_id = notching
              ? notching.id
              : null),
            (element.risk_type_id = risk_type ? risk_type.id : null),
            (element.company_id = company ? company.id : null),
            (element.rating_model_id = rating_model ? rating_model.id : null),
            (element.notching_model_id = notching ? notching.id : null),
            element.created_at = new Date(),
            element.updated_at = new Date(),
            element.created_by = request.user.id,
            element.updated_by = request.user.id,
            element.is_required = request.body.is_required,
            data.push(element);
        });

        const rating_metadata = await RatingMetadata.bulkCreate(data);

        const risk_type_rating_sheet = await RiskTypeRatingSheet.create({
          uuid: uuidv4(),
          weighted_score: request.body.total_assigned_weight,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          rating_model_id: rating_model?.id,
          risk_type_id: risk_type?.id,
          notching_model_id: notching?.id,
          is_required: request.body.is_required,
          company_id: company.id,
        });

        reply.send({
          success: true,
          rating_metadata: rating_metadata,
          risk_type_rating_sheet_uuid: risk_type_rating_sheet.uuid,
        });
      } catch (error) {
        console.log("error:", error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_metadata/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;

        const company = await Company.findOne({
          where: {
            uuid: request.body.company_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_FOUND",
          });
          return;
        }

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: request.body.rating_model_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        let where_query = {
          company_id: company.id,
          is_active: true
        };

        const risk_type = request.body.risk_type_uuid ? await RiskType.findOne({
          where: {
            uuid: request.body.risk_type_uuid,
            is_active: true,
          },
          raw: true,
        }) : null;

        if(risk_type){
          where_query["risk_type_id"] = risk_type.id;
        }

        const notching = request.body.notching_uuid ? await NotchingModel.findOne({
          where: {
            uuid: request.body.notching_uuid,
            is_active: true,
          },
          raw: true,
        }): null;

        if(notching){
          where_query["notching_model_id"] = notching.id;
        }

        console.log("where_query: ", where_query);

        const data = [];
        let rating_metadata = {};
 
        params.forEach(async(element) => {
            (element.notching_id = notching
              ? notching.id
              : null),
            (element.risk_type_id = risk_type ? risk_type.id : null),
            (element.company_id = company ? company.id : null),
            (element.rating_model_id = rating_model ? rating_model.id : null),
            (element.notching_model_id = notching ? notching.id : null),
            (element.is_required = request.body.is_required === undefined ? null : request.body.is_required)

            console.log("element: ", element);

            try{
           rating_metadata = await RatingMetadata.update({
            factor: element.factor,
            factor_parameter: element.factor_parameter,
            assigned_score: element.assigned_score,
            assigned_weight: element.assigned_weight,
            is_required: element.is_required,
            is_draft: element.is_draft,
            updated_by: request.user.id,
            updated_at: element.updated_at,
            notching_id: element.notching_id,
            risk_type_id: element.risk_type_id,
            company_id: element.company_id,
            rating_model_id: element.rating_model_id
           },{
            where:{
              uuid: element.uuid
            }
           });
           console.log("rating_metadata: ", rating_metadata);
          }catch(err){
            console.log("errrrr: ", err);
          }
        });

        const risk_type_rating_sheet = await RiskTypeRatingSheet.update({
          weighted_score: request.body.total_assigned_weight,
          is_required : request.body.is_required,
          is_active: true,
          updated_at: new Date(),
        },
          {
            where: where_query
          }
        );

        reply.send({
          success: true,
          rating_metadata: rating_metadata,
          risk_type_rating_sheet_update_result: Boolean(risk_type_rating_sheet[0]===1),
        });
      } catch (error) {
        console.log("error:", error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_metadata/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;

        const company = await Company.findOne({
          where: {
            uuid: params.company_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_FOUND",
          });
          return;
        }

        
        const rating_metadata = await RatingMetadata.findAll({
          where: {
            company_id: company.id,
            is_active: true
          },
          attributes: ['uuid','factor_uuid','factor','factor_parameter','assigned_score','assigned_weight','is_draft','is_required','updated_at'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['uuid','name'],
            },
            {
              model: RatingModel,
              as: 'rating_model',
              attributes: ['uuid','name'],
            },
            {
              model: RiskType,
              as: 'risk_type',
              attributes: ['uuid','name'],
            },
            {
              model: NotchingModel,
              as: 'notching',
              attributes: ['uuid','name'],
            },
            {
              model: User,
              as: 'updated_by_user',
              attributes: ['full_name','employee_code','email'],
            }
          ]
        });


        reply.send({
          success: true,
          rating_metadata: rating_metadata,
        });
      } catch (error) {
        console.log("error:", error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_metadata/risk_type/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;

        const company = await Company.findOne({
          where: {
            uuid: params.company_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_FOUND",
          });
          return;
        }

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params.rating_model_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        let where_query = {
          company_id: company.id,
          rating_model_id: rating_model.id,
          is_active: true
        };

        const risk_type = params.risk_type_uuid ? await RiskType.findOne({
          where: {
            uuid: params.risk_type_uuid,
            is_active: true,
          },
          raw: true,
        }) : null;

        if(risk_type){
          where_query["risk_type_id"] = risk_type.id;
        }       

        const notching = params.notching_uuid ? await NotchingModel.findOne({
          where: {
            uuid: params.notching_uuid,
            is_active: true,
          },
          raw: true,
        }) : null;

        if(notching){
          where_query["notching_id"] = notching.id;
        }

        const rating_metadata = await RatingMetadata.findAll({
          where: where_query,
          attributes: ['uuid','factor_uuid','factor','factor_parameter','assigned_score','assigned_weight','is_draft','is_required','updated_at'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['uuid','name'],
            },
            {
              model: RatingModel,
              as: 'rating_model',
              attributes: ['uuid','name'],
            },
            {
              model: RiskType,
              as: 'risk_type',
              attributes: ['uuid','name'],
            },
            {
              model: NotchingModel,
              as: 'notching',
              attributes: ['uuid','name'],
            },
            {
              model: User,
              as: 'updated_by_user',
              attributes: ['full_name','employee_code','email'],
            }
          ]
        });


        reply.send({
          success: true,
          rating_metadata: rating_metadata,
        });
      } catch (error) {
        console.log("error:", error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_sheet_metadata/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const mandate = await Mandate.findOne({
          where: {
            uuid: request.body.mandate_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!mandate) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_MANDATE_FOUND",
          });
          return;
        }

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: request.body.rating_model_uuid,
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
          return;
        }

        const risk_type = await RiskType.findOne({
          where: {
            uuid: request.body.risk_type_uuid,
            is_active: true,
          },
          raw: true,
        });

        const notching = await NotchingModel.findOne({
          where: {
            uuid: request.body.notching_uuid,
            is_active: true,
          },
          raw: true,
        });

        const data = [];
 
        params.forEach((element) => {
          (element.uuid = uuidv4()),
            (element.notching_id = notching
              ? notching.id
              : null),
            (element.risk_type_id = risk_type ? risk_type.id : null),
            (element.mandate_id = mandate ? mandate.id : null),
            (element.rating_model_id = rating_model ? rating_model.id : null),
            (element.notching_model_id = notching ? notching.id : null)
            data.push(element);
        });

        const rating_metadata = await RatingMetadata.bulkCreate(data);

        const risk_type_rating_sheet = await RiskTypeRatingSheet.create({
          uuid: uuidv4(),
          weighted_score: request.body.total_assigned_weight,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          rating_model_id: rating_model.id,
          risk_type_id: risk_type?.id,
          notching_id: notching?.id,
          mandate_id: mandate.id,
        });

        reply.send({
          success: true,
          rating_metadata: rating_metadata,
          risk_type_rating_sheet_uuid: risk_type_rating_sheet.uuid,
        });
      } catch (error) {
        console.log("error:", error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/risk_type/weighted_scores", async (request, reply) => {
      try {

        const { params } = request.body;

        await CHECK_PERMISSIONS(request, 'RiskType.List')

        const company = await Company.findOne({
          where: {
            uuid: params['company_uuid'],
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_SELECTED"
          });
          return;
        }

        const risk_type_rating_sheet = await RiskTypeRatingSheet.findAll({
          where: {
            company_id: company.id,
            is_active: true,
          },
          include: [
             {
              model: RiskType,
              as: "risk_type",
              // attributes: ['uuid', 'name', 'path', 'description']
            },
            {
              model: NotchingModel,
              as: "notching_model"
            },
          ]
        });

        reply.send({
          success: true,
          rating_sheet: risk_type_rating_sheet,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_sheet/create", async (request, reply) => {
      try {

        const { params } = request.body;

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')

        const company = await Company.findOne({
          where: {
            uuid: params['company_uuid'],
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_SELECTED"
          });
          return;
        }

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params['rating_model_uuid'],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_RATING_MODEL_SELECTED"
          });
          return;
        }

        const rating_sheet = await RatingSheet.create({
          uuid: uuidv4(),
          management_risk: params["management_risk"],
          business_risk: params["business_risk"],
          financial_risk: params["financial_risk"],
          industry_risk: params["industry_risk"],
          intercept: params["intercept"],
          total_risk_score: params["total_risk_score"],
          total_score: params["total_score"],
          model_based_long_term_rating: params["model_based_long_term_rating"],
          model_based_short_term_rating: params["model_based_short_term_rating"],
          model_based_rating_grade_number: params["model_based_rating_grade_number"],
          general_notching: params["general_notching"],
          project_notching: params["project_notching"],
          total_notch_down: params["total_notch_down"],
          standalone_rating_grade_post_notch_down: params["standalone_rating_grade_post_notch_down"],
          notching_based_rating_grade_number: params["notching_based_rating_grade_number"],
          parent_notching: params["parent_notching"],
          rating_grade_post_parent_notching: params["rating_grade_post_parent_notching"],
          long_term_rating_post_notching: params["long_term_rating_post_notching"],
          inc_notch_down: params["inc_notch_down"],
          rating_grade_post_inc_notch_down: params["rating_grade_post_inc_notch_down"],
          rating_post_inc_notch_down: params["rating_post_inc_notch_down"],
          parent_rating_grade_number: params["parent_rating_grade_number"],
          proposed_long_term_rating: params["proposed_long_term_rating"],
          proposed_short_term_rating: params["proposed_short_term_rating"],
          proposed_outlook: params["proposed_outlook"],
          final_rating_grade_number: params["final_rating_grade_number"],
          is_draft: params["is_draft"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
          rating_model_id: rating_model.id
        });

        
        const instrument_details = await DB_CLIENT.query(`
        SELECT DISTINCT id.id,i.is_long_term, i.is_short_term  FROM instrument_details id
        INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id
        INNER JOIN instrument_sub_categories isc ON isc.id = ti.instrument_sub_category_id 
        INNER JOIN instruments i ON i.instrument_sub_category_id  = isc.id
        INNER JOIN mandates m ON m.id = ti.mandate_id
        INNER JOIN companies c On c.id = m.company_id
        where c.id = :company_id AND id.is_workflow_done = 0;
        `,
        {
          replacements: {
          company_id: company.id
          },
          type: QueryTypes.SELECT,
        });


        if(instrument_details.length > 0){
        for (const iterator of instrument_details) {
        await DB_CLIENT.query(`
          UPDATE
          instrument_details 
          SET proposed_long_term_rating = :proposed_long_term_rating, proposed_short_term_rating = :proposed_short_term_rating, proposed_outlook =:proposed_outlook,model_based_long_term_rating=:model_based_long_term_rating,
          model_based_short_term_rating=:model_based_short_term_rating
          WHERE id = :id;
        `,
        {
          replacements: {
          id: iterator.id,
          proposed_long_term_rating: iterator.is_long_term ? params["proposed_long_term_rating"] : null,
          proposed_short_term_rating: iterator.is_short_term ? params["proposed_short_term_rating"] : null,
          proposed_outlook: iterator.is_long_term ? params["proposed_outlook"] : null,
          model_based_long_term_rating: iterator.is_long_term ? params["model_based_long_term_rating"] : null,
          model_based_short_term_rating: iterator.is_short_term ? params["model_based_short_term_rating"] : null
          },
          type: QueryTypes.UPDATE,
        });
      }
 

        reply.send({
          success: true,
          rating_sheet_uuid: rating_sheet.uuid,
        });
     }
    } catch (error) {
        console.log("error: ",error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
  });

    fastify.post("/rating_sheet/edit", async (request, reply) => {
      try {

        const { params } = request.body;

        await CHECK_PERMISSIONS(request, 'RatingModel.Create');

        const rating_sheet = await RatingSheet.findOne({
          where: {
            uuid: params['uuid'],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_sheet) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_RATING_SHEET_FOUND"
          });
          return;
        }

        const company = await Company.findOne({
          where: {
            uuid: params['company_uuid'],
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_COMPANY_SELECTED"
          });
          return;
        }

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params['rating_model_uuid'],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_RATING_MODEL_SELECTED"
          });
          return;
        }

        const rating_sheet_update = await RatingSheet.update({
          management_risk: params["management_risk"],
          business_risk: params["business_risk"],
          financial_risk: params["financial_risk"],
          industry_risk: params["industry_risk"],
          intercept: params["intercept"],
          total_risk_score: params["total_risk_score"],
          total_score: params["total_score"],
          model_based_rating: params["model_based_rating"],
          model_based_long_term_rating: params["model_based_long_term_rating"],
          model_based_short_term_rating: params["model_based_short_term_rating"],
          general_notching: params["general_notching"],
          project_notching: params["project_notching"],
          total_notch_down: params["total_notch_down"],
          standalone_rating_grade_post_notch_down: params["standalone_rating_grade_post_notch_down"],
          notching_based_rating_grade_number: params["notching_based_rating_grade_number"],
          parent_notching: params["parent_notching"],
          rating_grade_post_parent_notching: params["rating_grade_post_parent_notching"],
          long_term_rating_post_notching: params["long_term_rating_post_notching"],
          inc_notch_down: params["inc_notch_down"],
          rating_grade_post_inc_notch_down: params["rating_grade_post_inc_notch_down"],
          rating_post_inc_notch_down: params["rating_post_inc_notch_down"],
          parent_rating_grade_number: params["parent_rating_grade_number"],
          proposed_long_term_rating: params["proposed_long_term_rating"],
          proposed_short_term_rating: params["proposed_short_term_rating"],
          proposed_outlook: params["proposed_outlook"],
          final_rating_grade_number: params["final_rating_grade_number"],
          is_draft: params["is_draft"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
          rating_model_id: rating_model.id
        },
        {
          where: {
            uuid: params["uuid"]
          }
        }
        );

        const instrument_details = await DB_CLIENT.query(`
        SELECT DISTINCT id.id,i.is_long_term, i.is_short_term  FROM instrument_details id
        INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id
        INNER JOIN instrument_sub_categories isc ON isc.id = ti.instrument_sub_category_id 
        INNER JOIN instruments i ON i.instrument_sub_category_id  = isc.id
        INNER JOIN mandates m ON m.id = ti.mandate_id
        INNER JOIN companies c On c.id = m.company_id
        where c.id = :company_id AND id.is_workflow_done = 0;
        `,
        {
          replacements: {
          company_id: company.id
          },
          type: QueryTypes.SELECT,
        });


        if(instrument_details.length > 0){
        for (const iterator of instrument_details) {
        await DB_CLIENT.query(`
          UPDATE
          instrument_details 
          SET proposed_long_term_rating = :proposed_long_term_rating, proposed_short_term_rating = :proposed_short_term_rating, proposed_outlook =:proposed_outlook,model_based_long_term_rating=:model_based_long_term_rating,
          model_based_short_term_rating=:model_based_short_term_rating
          WHERE id = :id;
        `,
        {
          replacements: {
          id: iterator.id,
          proposed_long_term_rating: iterator.is_long_term ? params["proposed_long_term_rating"] : null,
          proposed_short_term_rating: iterator.is_short_term ? params["proposed_short_term_rating"] : null,
          proposed_outlook: iterator.is_long_term ? params["proposed_outlook"] : null,
          model_based_long_term_rating: iterator.is_long_term ? params["model_based_long_term_rating"] : null,
          model_based_short_term_rating: iterator.is_short_term ? params["model_based_short_term_rating"] : null
          },
          type: QueryTypes.UPDATE,
        });
      }
    }

        reply.send({
          success: true,
          rating_sheet_update_result: Boolean(rating_sheet_update[0]===1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/financial_year/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'FinancialYear.Create')
        const { params } = request.body;

        const financial_year = await FinancialYear.create({
          uuid: uuidv4(),
          reference_date: params["reference_date"],
          start_date: params['start_date'],
          end_date: params['end_date'],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        reply.send({
          success: true,
          financial_year: financial_year,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/financial_year/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'FinancialYear.View')
        const { params } = request.body;

        const financial_year = await FinancialYear.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        reply.send({
          success: true,
          financial_year: financial_year,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/financial_year", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'FinancialYear.List')
        const where_query = request.body.params ? request.body.params : {};

        const financial_year = await FinancialYear.findAll({
          where: where_query,
        });

        reply.send({
          success: true,
          financial_year: financial_year,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/financial_year/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'FinancialYear.Edit')
        const { params } = request.body;

        const financial_year = FinancialYear.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        if (!financial_year) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_FINANCIAL_YEAR_SELECTED"],
          });
          return;
        }

        const updated_financial_year = await FinancialYear.update(
          APPEND_USER_DATA(request, {
            reference_date: params["reference_date"],
            is_active: params["is_active"],
            start_date: params['start_date'],
            end_date: params['end_date'],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          financial_year: updated_financial_year,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_matrix/create", async (request, reply) => {
      try {
        const { params } = request.body;

        const last_rating_matrix = await DB_CLIENT.query(
          `SELECT upper_weightage FROM rating_matrix ORDER BY id DESC LIMIT 1`,
          {
            type: QueryTypes.SELECT,
          }
        );

        if(params["lower_weightage"] <= last_rating_matrix[0].upper_weightage ){
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: "This weightage range is overlapping with previous one",
        });
          }

        const rating_matrix = await RatingMatrix.create({
            lower_weightage: params["lower_weightage"],
            higher_weightage: params["higher_weightage"],
            rating_symbol: rating_symbol,
            is_active: true
        });

        return reply.send({
          success: true,
          rating_matrix: rating_matrix
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_matrix/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')
        const { params } = request.body;

        const rating_matrix = await RatingMatrix.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        reply.send({
          success: true,
          rating_matrix: rating_matrix,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_matrix", async (request, reply) => {
      try {
        
        await CHECK_PERMISSIONS(request, 'RatingModel.List')
        const where_query = request.body.params ? request.body.params : {};

        const rating_matrix = await RatingMatrix.findAll({
          where: where_query,
        });

        reply.send({
          success: true,
          rating_matrix: rating_matrix,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_matrix/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;

        const rating_matrix = await RatingMatrix.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        if (!rating_matrix) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MATRIX_SELECTED"],
          });
          return;
        }

        const rating_matrix_update_result = await RatingMatrix.update(
          APPEND_USER_DATA(request, {
            lower_weightage: params["lower_weightage"],
            higher_weightage: params["higher_weightage"],
            rating_symbol: params["rating_symbol"],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          rating_matrix_update_result: rating_matrix_update_result,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_master/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const rating_scale = await RatingScale.findOne({
          where: {
            uuid: params["rating_scale_uuid"],
            is_active: true,
          },
        });

        if (!rating_scale) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "Rating scale not found !!",
          });
        }

        const rating_symbol_master = await RatingSymbolMaster.create({
          uuid: uuidv4(),
          rating_symbol: params["rating_symbol"],
          description: params["description"],
          grade: params["grade"],
          weightage: params["weightage"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        await rating_symbol_master.setRating_scale(rating_scale);

        reply.send({
          success: true,
          rating_symbol_master_uuid: rating_symbol_master.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_master/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')
        const { params } = request.body;

        const rating_symbol_master = await RatingSymbolMaster.findOne({
          where: {
            uuid: params["uuid"],
          },
          include: 
            {
              model: RatingScale,
              as: 'rating_scale'
            }
          
        });

        reply.send({
          success: true,
          rating_symbol_master: rating_symbol_master,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_master", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List');
        const { params } = request.body;

        const where_query = {};

        const rating_scale = await RatingScale.findOne({
          where: {
            uuid: params.rating_scale_uuid ? params.rating_scale_uuid : null,
            is_active: true,
          },
          raw: true
        });


        if (rating_scale) {
          where_query['rating_scale_id'] = rating_scale.id;
        }

        if(Object.keys(params).includes('is_active')){
          where_query['is_active'] = params['is_active']
        }

        const rating_symbol_master = await RatingSymbolMaster.findAll({
          where: where_query,
          attributes: ['uuid','rating_symbol','description','grade',['rating_grade_number', 'weightage'],'is_active'],
          order: [['rating_symbol','ASC']],
          include: 
            {
              model: RatingScale,
              as: 'rating_scale'
            }
        });

        reply.send({
          success: true,
          rating_symbol_master: rating_symbol_master,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_master/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;
        
        const rating_symbol_master = await RatingSymbolMaster.findOne({
          where: {
            uuid: params["uuid"],
          },
        });
        
        if (!rating_symbol_master) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MATRIX_SELECTED"],
          });
          return;
        }

        const rating_scale = await RatingScale.findOne({
          where: {
            uuid: params["rating_scale_uuid"],
            is_active: true,
          },
        });

        if (!rating_scale) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_RATING_SCALE_SELECTED",
          });
          return;
        }

        const rating_symbol_master_update_result =
          await RatingSymbolMaster.update(
            APPEND_USER_DATA(request, {
              rating_symbol: params["rating_symbol"],
              description: params["description"],
              grade: params["grade"],
              weightage: params["weightage"],
              is_active: params['is_active'],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

          await rating_symbol_master.setRating_scale(rating_scale);

        reply.send({
          success: true,
          rating_symbol_master_update_result:
            rating_symbol_master_update_result,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_category/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const rating_symbol_category = await RatingSymbolCategory.create({
          uuid: uuidv4(),
          symbol_type_category: params["symbol_type_category"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        reply.send({
          success: true,
          rating_symbol_category: rating_symbol_category,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_category/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')
        const { params } = request.body;

        const rating_symbol_category = await RatingSymbolCategory.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        reply.send({
          success: true,
          rating_symbol_category: rating_symbol_category,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_category", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List')
        const { params } = request.body;

        const where_query = request.body.params ? request.body.params : {};

        const rating_symbol_category = await RatingSymbolCategory.findAll({
          where: where_query,
          order: ['symbol_type_category']
        });

        reply.send({
          success: true,
          rating_symbol_category: rating_symbol_category,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_category/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')
        const { params } = request.body;

        const rating_symbol_category = await RatingSymbolCategory.findOne({
          where: {
            uuid: params["uuid"]
          },
        });

        if (!rating_symbol_category) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MATRIX_SELECTED"],
          });
          return;
        }

        const rating_symbol_category_update_result =
          await RatingSymbolCategory.update(
            APPEND_USER_DATA(request, {
              symbol_type_category: params["symbol_type_category"],
              is_active: true,
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

        reply.send({
          success: true,
          rating_symbol_category_update_result:
            rating_symbol_category_update_result,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_mapping/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')
        const { params } = request.body;

        const rating_symbol_category = await RatingSymbolCategory.findOne({
          where: {
            uuid: params["rating_symbol_category_uuid"],
            is_active: true,
          },
        });

        if (!rating_symbol_category) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "Rating Symbol category not found !!",
          });
        }

        const rating_symbol_master = await RatingSymbolMaster.findOne({
          where: {
            uuid: params["rating_symbol_master_uuid"],
            is_active: true,
          },
          raw: true
        });

        if (!rating_symbol_master) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "Rating Symbol master not found !!",
          });
        }

        const final_rating = params["prefix"] + rating_symbol_master.rating_symbol + params["suffix"];

        const rating_symbol_mapping = await RatingSymbolMapping.create({
          uuid: uuidv4(),
          prefix: params["prefix"],
          suffix: params["suffix"],
          final_rating: final_rating,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          rating_symbol_master_id: rating_symbol_master.id
        });

        await rating_symbol_mapping.setRating_symbol_category(
          rating_symbol_category
        );

        reply.send({
          success: true,
          rating_symbol_mapping: rating_symbol_mapping,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_mapping/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')     
        const { params } = request.body;

        const rating_symbol_mapping = await RatingSymbolMapping.findOne({
          where: {
            uuid: params["uuid"]
          },
          include: [
            {
              model: RatingSymbolCategory,
              as: 'rating_symbol_category'
            },
            {
              model: RatingSymbolMaster,
              as: 'rating_symbol_master'
            }
          ]
        });

        reply.send({
          success: true,
          rating_symbol_mapping: rating_symbol_mapping,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_mapping", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List')
        const { params } = request.body;
        const where_query = {};

        const rating_symbol_category = await RatingSymbolCategory.findOne({
          where: {
            uuid: params.rating_symbol_category_uuid ? params.rating_symbol_category_uuid : null,
            is_active: true,
          },
          raw: true
        });

        if (rating_symbol_category) {
          where_query['rating_symbol_category_id'] = rating_symbol_category.id;
        }

        if(Object.keys(params).includes('is_active')){
          where_query['is_active'] = params['is_active']
        }

        const rating_symbol_mapping = await RatingSymbolMapping.findAll({
          where: where_query,
          include: [
            {
              model: RatingSymbolCategory,
              as: 'rating_symbol_category'
            },
            {
              model: RatingSymbolMaster,
              as: 'rating_symbol_master'
            }
          ]
        });

        return reply.send({
          success: true,
          rating_symbol_mapping: rating_symbol_mapping,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_mapping/final_ratings", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List')
        const { params } = request.body;

        const rating_symbol_category = await RatingSymbolCategory.findOne({
          where: {
            uuid: params.rating_symbol_category_uuid ? params.rating_symbol_category_uuid : null,
            is_active: true,
          },
          raw: true
        });

        var final_ratings = {};
        if(params['long_term']){
        final_ratings = await DB_CLIENT.query(
          `SELECT rsm.final_rating,rsm2.uuid AS rating_symbol_master_uuid, rsm.uuid, rsm.id, rsc.symbol_type_category , rsm2.rating_symbol, rs.name  from rating_symbol_mappings rsm INNER JOIN rating_symbol_categories rsc ON rsc.id = rsm.rating_symbol_category_id 
          INNER JOIN rating_symbol_masters rsm2 ON rsm2.id = rsm.rating_symbol_master_id INNER JOIN rating_scales rs ON rs.id = rsm2.rating_scale_id WHERE rsc.id = :rsc AND rsm.is_active = 1 AND rs.name != 'Short term'`,
          {
            replacements: {
              rsc: rating_symbol_category.id,
            },
            type: QueryTypes.SELECT,
          }
        );
        }
        else{
          final_ratings = await DB_CLIENT.query(
            `SELECT rsm.final_rating,rsm2.uuid AS rating_symbol_master_uuid, rsm.uuid, rsm.id, rsc.symbol_type_category , rsm2.rating_symbol, rs.name  from rating_symbol_mappings rsm INNER JOIN rating_symbol_categories rsc ON rsc.id = rsm.rating_symbol_category_id 
            INNER JOIN rating_symbol_masters rsm2 ON rsm2.id = rsm.rating_symbol_master_id INNER JOIN rating_scales rs ON rs.id = rsm2.rating_scale_id WHERE rsc.id = :rsc AND rsm.is_active = 1 AND rs.name = 'Short term'`,
            {
              replacements: {
                rsc: rating_symbol_category.id,
              },
              type: QueryTypes.SELECT,
            }
          );
        }

        return reply.send({
          success: true,
          final_ratings: final_ratings,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol_mapping/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')

        const { params } = request.body;

        const rating_symbol_mapping = await RatingSymbolMapping.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        const rating_symbol_category = await RatingSymbolCategory.findOne({
          where: {
            uuid: params["rating_symbol_category_uuid"],
            is_active: true,
          },
        });

        if (!rating_symbol_category) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "Rating Symbol category not found !!",
          });
        }

        const rating_symbol_master = await RatingSymbolMaster.findOne({
          where: {
            uuid: params["rating_symbol_master_uuid"],
            is_active: true,
          },
          raw: true
        });

        if (!rating_symbol_master) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "Rating Symbol master not found !!",
          });
        }

        const final_rating = params["prefix"] + rating_symbol_master.rating_symbol + params["suffix"];


        if (!rating_symbol_mapping) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_RATING_MATRIX_SELECTED"],
          });
        }

        const rating_symbol_mapping_update_result =
          await RatingSymbolMapping.update(
            APPEND_USER_DATA(request, {
              prefix: params["prefix"],
              suffix: params["suffix"],
              final_rating: final_rating,
              is_active: params['is_active'],
              rating_symbol_master_id: rating_symbol_master.id
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

          await rating_symbol_mapping.setRating_symbol_category(
            rating_symbol_category
          );

        return reply.send({
          success: true,
          rating_symbol_mapping_update_result:
            rating_symbol_mapping_update_result,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_scale/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Create')

        const { params } = request.body;

        const rating_scale = await RatingScale.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        return reply.send({
          success: true,
          rating_scale: rating_scale,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_scale/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')

        const { params } = request.body;

        const rating_scale = await RatingScale.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        return reply.send({
          success: true,
          rating_scale: rating_scale,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_scale", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List')

        const where_query = request.body.params ? request.body.params : {};

        const rating_scale = await RatingScale.findAll({
          where: where_query,
        });

        return reply.send({
          success: true,
          rating_scale: rating_scale,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_scale/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.Edit')

        const { params } = request.body;

        const rating_scale = await RatingScale.findOne({
          where: {
            uuid: params["uuid"],
            is_active: true,
          },
        });

        if (!rating_scale) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_RATING_MATRIX_SELECTED"],
          });
          return;
        }

        const rating_scale_update_result = await RatingScale.update(
          APPEND_USER_DATA(request, {
            name: params["name"],
            is_active: params["is_active"],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        return reply.send({
          success: true,
          rating_scale_update_result: Boolean(
            rating_scale_update_result[0] === 1
          ),
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_model_mapping/view", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.View')

        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_RATING_MODEL_SELECTED"],
          });
        }

        const industry_model_mapping = await DB_CLIENT.query(`
          SELECT  
            rm.name as rating_model_name,  
            rm.uuid as rating_model_uuid,
            si.uuid as sub_industry_uuid,  
            si.name as sub_industry_name 
          FROM industry_models_mapping imm 
          INNER JOIN rating_models rm  ON rm.id  = imm.rating_model_id 
          INNER  JOIN sub_industries si ON si.id  = imm.sub_industry_id 
          WHERE si.is_active=1 AND imm.is_active=1 AND rm.id = ${rating_model.id};
        `);

        return reply.send({
          success: true,
          industry_model_mapping: industry_model_mapping[0],
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_model_mapping", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'ModelMapping.List')

        const where_query = request.body.params ? request.body.params : {};
        var mappings = [];
        var mapping_keys = [];

        const industry_model_mappings = await DB_CLIENT.query(`
          SELECT  
            rm.uuid as rating_model_uuid,  
            rm.name as rating_model_name, 
            si.uuid as sub_industry_uuid,  
            si.name as sub_industry_name 
          FROM industry_models_mapping imm 
          INNER JOIN rating_models rm  ON rm.id  = imm.rating_model_id 
          INNER  JOIN sub_industries si ON si.id  = imm.sub_industry_id 
          WHERE rm.is_active=1 AND si.is_active=1 AND imm.is_active=1;
        `);

        industry_model_mappings[0].forEach((mapping) => {
          if (!mapping_keys.includes(mapping["rating_model_uuid"])) {
            mapping_keys.push(mapping["rating_model_uuid"]);
            mappings.push({
              rating_model_name: mapping["rating_model_name"],
              rating_model_uuid: mapping["rating_model_uuid"],
              sub_industries: [],
            });
          }
          mappings.forEach((inner_map) => {
            if (
              inner_map["rating_model_uuid"] === mapping["rating_model_uuid"]
            ) {
              inner_map["sub_industries"].push({
                sub_industry_uuid: mapping["sub_industry_uuid"],
                sub_industry_name: mapping["sub_industry_name"],
              });
              return;
            }
          });
        });

        return reply.send({
          success: true,
          mappings: mappings,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_model_mapping/create", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'ModelMapping.Create')

        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
          },
          raw: true,
        });

        if (!rating_model) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_RATING_MODEL"],
          });
        }

        let sub_industry = await SubIndustry.findAll({
          where: {
            uuid: params["sub_industry_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!sub_industry) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_SUB_INDUSTRY_FOUND"],
          });
        }

        if (sub_industry) {
          reply.send({
            success: false,
            error: L["SUB_INDUSTRY_ALREADY_EXISTS"],
          });
        }

        const bulk_data = [];
        sub_industry.map((el) => {
          const obj = {};
          obj.version = params["version"];
          obj.uuid = uuidv4();
          obj.sub_industry_id = el.id;
          obj.rating_model_id = rating_model.id;
          obj.is_active = true;
          obj.created_at = new Date();
          obj.updated_at = new Date();
          obj.created_by = request.user.id;
          bulk_data.push(obj);
        });

        const industry_model_mapping = await IndustryModelMapping.bulkCreate(
          bulk_data
        );

        return reply.send({
          success: true,
          industry_model_mapping: industry_model_mapping,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/industry_model_mapping/edit", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'ModelMapping.Edit')

        const { params } = request.body;

        const rating_model = await RatingModel.findOne({
          where: {
            uuid: params["rating_model_uuid"],
          },
        });

        if (!rating_model) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_RATING_MODEL"],
          });
        }

        const sub_industry = await SubIndustry.findOne({
          where: {
            uuid: params["sub_industry_uuid"],
          },
        });

        if (!sub_industry) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_SUB_INDUSTRY_FOUND"],
          });
        }

        const industry_model_mapping = await IndustryModelMapping.findOne({
          where: {
            sub_industry_id: sub_industry.id,
          },
          raw: true,
        });

        if (!industry_model_mapping) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_INDUSTRY_MODEL_MAPPING_FOUND"],
          });
        }

        const industry_model_mapping_updated_result =
          await IndustryModelMapping.update(
            APPEND_USER_DATA(request, {
              is_active: false,
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

        return reply.send({
          success: true,
          industry_model_mapping_updated_result:
            industry_model_mapping_updated_result,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_model_list", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List')

        const where_query = request.body.params ? request.body.params : {};
        var mappings = [];
        var mapping_keys = [];

        const industry_model_mappings = await DB_CLIENT.query(`
          SELECT  
            rm.uuid as rating_model_uuid,  
            rm.name as rating_model_name, 
            si.uuid as sub_industry_uuid,  
            si.name as sub_industry_name 
          FROM industry_models_mapping imm 
          INNER JOIN rating_models rm  ON rm.id  = imm.rating_model_id 
          INNER  JOIN sub_industries si ON si.id  = imm.sub_industry_id 
          WHERE rm.is_active=1 AND si.is_active=1 AND imm.is_active=1;
        `);

        industry_model_mappings[0].forEach((mapping) => {
          if (!mapping_keys.includes(mapping["rating_model_uuid"])) {
            mapping_keys.push(mapping["rating_model_uuid"]);
            mappings.push({
              rating_model_name: mapping["rating_model_name"],
              rating_model_uuid: mapping["rating_model_uuid"],
              sub_industries: [],
            });
          }
          mappings.forEach((inner_map) => {
            if (
              inner_map["rating_model_uuid"] === mapping["rating_model_uuid"]
            ) {
              inner_map["sub_industries"].push({
                sub_industry_uuid: mapping["sub_industry_uuid"],
                sub_industry_name: mapping["sub_industry_name"],
              });
              return;
            }
          });
        });

        return reply.send({
          success: true,
          mappings: mappings,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_model/based_on_industries", async (request, reply) => {
      try {

        await CHECK_PERMISSIONS(request, 'RatingModel.List')

        const { params } = request.body;
        const sub_industry = await SubIndustry.findOne({
          where: {
            uuid: params["sub_industry_uuid"],
          },
        });

        if (!sub_industry) {
          reply.status_code = 403;
          return reply.send({
            success: false,
            error: L["NO_SUB_INDUSTRY_FOUND"],
          });
        }

        const rating_models = await DB_CLIENT.query(`
        SELECT DISTINCT rm.name,rm.uuid FROM industry_models_mapping imm 
        INNER JOIN  rating_models rm ON rm.id = imm.rating_model_id AND imm.sub_industry_id = ${sub_industry.id}
        `);

        return reply.send({
          success: true,
          rating_models: rating_models,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_symbol/based_on_weightage", async (request, reply) => {
      try {
        const { params } = request.body;

        where_query = {is_active: true,
          rating_scale_id: 2};

        if(params.weightage){
          where_query.higher_weightage = { [Op.gte]: params["weightage"]
          };
          where_query.lower_weightage = { [Op.lte]: params["weightage"]
          };
        }

        if(Object.keys(params).includes('rating_grade_number')){
          where_query.rating_grade_number = params.rating_grade_number;
        }

        let rating_symbol = await RatingSymbolMaster.findAll({
          where: where_query,
          attributes: [
            'id',
            'uuid',
            'rating_symbol',
            'rating_grade_number',
            'description',
            'is_active'
          ],
          raw: true
        });

        const result = [];
        for (const iterator of rating_symbol) {
          const short_term_rating = await DB_CLIENT.query(
            `SELECT rsm2.rating_symbol FROM long_term_short_term_mappings ltstm 
            INNER JOIN rating_symbol_masters rsm ON rsm.id = ltstm.long_term_rating_id AND rsm.id = :id
            INNER JOIN rating_symbol_masters rsm2 ON rsm2.id = ltstm.short_term_rating_id`,
            {
              replacements:{
                id: iterator.id
              },
              type: QueryTypes.SELECT,
            }
          );
          console.log("short_term_rating: ", short_term_rating);
          iterator.st_rating_symbol = short_term_rating.length > 0 ? short_term_rating[0].rating_symbol : null;
          result.push(iterator);
        }

        console.log("result: ", result);

        return reply.send({
          success: true,
          rating_symbol: result.length > 1 ? result : result[0]
        });
      } catch (error) {
        reply.statusCode = 422;
        console.log("err: ",  error);
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_model/view_versions", async (request, reply) => {
      try {
        const { params } = request.body;

        where_query = {is_active: true};

        const rating_model_versions = await DB_CLIENT.query(
          `SELECT DISTINCT rm.name,rm.uuid,rmhrt.version,rmhrt.is_active  FROM rating_models rm 
          INNER JOIN rating_model_has_risk_types rmhrt ON rmhrt.rating_model_id = rm.id ORDER BY rm.name`,
          {
            type: QueryTypes.SELECT,
          }
        );

        console.log("rating_model_versions: ", rating_model_versions);

        return reply.send({
          success: true,
          rating_model_versions: rating_model_versions
        });
      } catch (error) {
        reply.statusCode = 422;
        console.log("err: ",  error);
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/rating_model/copy_configurators", async (request, reply) => {
      const { version } = request.body.params;
      const latest_version = await DB_CLIENT.query(
        `SELECT version,rating_model_id FROM rating_model_has_risk_types WHERE is_active = 1 AND rating_model_id = (SELECT DISTINCT rating_model_id FROM rating_model_has_risk_types WHERE version = :version)`,
        {
          replacements: {
            version: version,
          },
          type: QueryTypes.SELECT,
        }
      );

      console.log("latest_version: ", latest_version);
      const version_name = latest_version[0].version.split('-')[0] + '-' + (parseInt(latest_version[0].version.split('-')[1]) + 1); 
try {
  const rating_model_ids = await DB_CLIENT.query(
    `SELECT id FROM rating_model_has_risk_types WHERE version = :version`,
    {
      replacements: {
        version: version,
      },
      type: QueryTypes.SELECT,
    }
  );

  await DB_CLIENT.query(
    `UPDATE rating_model_has_risk_types SET is_active = 0 WHERE is_active = 1 AND rating_model_id =:rating_model_id `,
    {
      replacements: {
        version: version,
        rating_model_id: latest_version[0].rating_model_id
        },
      type: QueryTypes.UPDATE, 
    }
  );

  for (const el of rating_model_ids) {

     await DB_CLIENT.query(
      `INSERT INTO rating_model_has_risk_types (uuid,is_active,created_at,updated_at,risk_type_id,rating_model_id,version) 
       SELECT :uuid, 1, :created_at, :updated_at, risk_type_id, rating_model_id, :version 
       FROM rating_model_has_risk_types WHERE id = :id
      `,
      {
        replacements: {
          id: el.id,
          uuid: uuidv4(),
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          version: version_name,
        },
        type: QueryTypes.INSERT,
      }
    );

    const cur_id = await DB_CLIENT.query(
      `SELECT TOP 1 id FROM rating_model_has_risk_types ORDER BY id DESC`,
      {
        replacements: {
          rating_model_has_risk_type_id: el.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    console.log("cur_id: ", cur_id);

    const factor_ids = await DB_CLIENT.query(
      `SELECT id FROM factors WHERE rating_model_risk_type_id = :rating_model_has_risk_type_id`,
      {
        replacements: {
          rating_model_has_risk_type_id: el.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    for (const factor of factor_ids) {
     await DB_CLIENT.query(
        `INSERT INTO factors (uuid,question,max_score,coefficient,is_active,created_at,updated_at,created_by,updated_by,rating_model_risk_type_id,sequence_number) 
         SELECT :uuid,question,max_score,coefficient,1,:created_at,:updated_at,:created_by,:updated_by,:rating_model_risk_type_id,sequence_number 
         FROM factors WHERE id = :id
        `,
        {
          replacements: {
            id: factor.id,
            uuid: uuidv4(),
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            created_by: request.user.id,
            updated_by: request.user.id,
            rating_model_risk_type_id: cur_id[0].id,
          },
          type: QueryTypes.INSERT,
        }
      );

      const cur_factor_id = await DB_CLIENT.query(
        `SELECT TOP 1 id FROM factors ORDER BY id DESC`,
        {
          type: QueryTypes.SELECT,
        }
      );

      const factor_parameter_ids = await DB_CLIENT.query(
        `SELECT id FROM factor_parameters WHERE factor_id = :factor_id`,
        {
          replacements: {
            factor_id: factor.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      for (const parameter of factor_parameter_ids) {
        await DB_CLIENT.query(
          `INSERT INTO factor_parameters (uuid,name,score,is_active,created_at,updated_at,created_by,updated_by,factor_id) 
           SELECT :uuid, name, score, 1, :created_at, :updated_at, :created_by, :updated_by, :factor_id 
           FROM factor_parameters WHERE id = :id
          `,
          {
            replacements: {
              id: parameter.id,
              uuid: uuidv4(),
              created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
              updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
              created_by: request.user.id,
              updated_by: request.user.id,
              factor_id: cur_factor_id[0].id,
            },
            type: QueryTypes.INSERT,
          }
        );
      }
    }
  }

  const rating_model_notching_ids = await DB_CLIENT.query(
    `SELECT id FROM rating_model_has_notchings WHERE version = :version `,
    {
      replacements: {
        version: version,
      },
      type: QueryTypes.SELECT,
    }
  );

  await DB_CLIENT.query(
    `UPDATE rating_model_has_notchings SET is_active = 0 WHERE is_active = 1 AND rating_model_id = :rating_model_id`,
    {
      replacements: {
        version: version,
        rating_model_id: latest_version[0].rating_model_id
        },
      type: QueryTypes.UPDATE, 
    }
  );

  for (const el of rating_model_notching_ids) {

    await DB_CLIENT.query(
     `INSERT INTO rating_model_has_notchings (uuid,is_active,created_at,updated_at,notching_model_id,rating_model_id,version) 
      SELECT :uuid, 1, :created_at, :updated_at, notching_model_id, rating_model_id, :version 
      FROM rating_model_has_notchings WHERE id = :id
     `,
     {
       replacements: {
         id: el.id,
         uuid: uuidv4(),
         created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
         updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
         version: version_name,
       },
       type: QueryTypes.INSERT,
     }
   );

   const cur_id = await DB_CLIENT.query(
     `SELECT TOP 1 id FROM rating_model_has_notchings ORDER BY id DESC`,
     {
       type: QueryTypes.SELECT,
     }
   );

   console.log("cur_id: ", cur_id);

   const factor_ids = await DB_CLIENT.query(
     `SELECT id FROM factors WHERE rating_model_notching_id = :rating_model_notching_id`,
     {
       replacements: {
         rating_model_notching_id: el.id,
       },
       type: QueryTypes.SELECT,
     }
   );

   for (const factor of factor_ids) {
    await DB_CLIENT.query(
       `INSERT INTO factors (uuid,question,max_score,coefficient,is_active,created_at,updated_at,created_by,updated_by,rating_model_notching_id,sequence_number) 
        SELECT :uuid,question,max_score,coefficient,1,:created_at,:updated_at,:created_by,:updated_by,:rating_model_notching_id,sequence_number 
        FROM factors WHERE id = :id
       `,
       {
         replacements: {
           id: factor.id,
           uuid: uuidv4(),
           created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
           updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
           created_by: request.user.id,
           updated_by: request.user.id,
           rating_model_notching_id: cur_id[0].id,
         },
         type: QueryTypes.INSERT,
       }
     );

     const cur_factor_id = await DB_CLIENT.query(
       `SELECT TOP 1 id FROM factors ORDER BY id DESC`,
       {
         type: QueryTypes.SELECT,
       }
     );

     const factor_parameter_ids = await DB_CLIENT.query(
       `SELECT id FROM factor_parameters WHERE factor_id = :factor_id`,
       {
         replacements: {
           factor_id: factor.id,
         },
         type: QueryTypes.SELECT,
       }
     );

     for (const parameter of factor_parameter_ids) {
       await DB_CLIENT.query(
         `INSERT INTO factor_parameters (uuid,name,score,is_active,created_at,updated_at,created_by,updated_by,factor_id) 
          SELECT :uuid, name, score, 1, :created_at, :updated_at, :created_by, :updated_by, :factor_id 
          FROM factor_parameters WHERE id = :id
         `,
         { 
           replacements: {
             id: parameter.id,
             uuid: uuidv4(),
             created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
             updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
             created_by: request.user.id,
             updated_by: request.user.id,
             factor_id: cur_factor_id[0].id,
           },
           type: QueryTypes.INSERT,
         }
       );
     }
   }
 }

  return reply.send({
    success: true,
    rating_model_ids: rating_model_ids
  });

} catch (error) {
  reply.statusCode = 422;
  console.log("err: ",  error);
  return reply.send({
    success: false,
    error: String(error),
  });
}
});

fastify.post("/parent_company/model_rating/view", async (request, reply) => {
  try {

    await CHECK_PERMISSIONS(request, 'RatingModel.List');

    const { params } = request.body;

    const company = await Company.findOne({
      where: {
        uuid: params["company_uuid"],
        is_active: true,
      },
    });

    if (!company) {
      reply.statusCode = 422;
      return reply.send({
        success: false,
        error: "Company not found !!",
      });
    }

    const model_rating = await DB_CLIENT.query(`
    SELECT rs.proposed_long_term_rating AS final_rating,rs.final_rating_grade_number,c2.name AS parent_company_name, c2.uuid AS parent_company_uuid FROM subsidiaries s 
    INNER JOIN companies c ON c.id = s.subsidiary_company_id AND c.id = :company_id
    INNER JOIN companies c2 ON c2.id = s.company_id 
    INNER JOIN rating_sheets rs ON rs.company_id = c2.id
    `,
    {
    replacements:{
      company_id: company.id,
    },
    type: QueryTypes.SELECT 
  }
  );

    return reply.send({
      success: true,
      model_rating: model_rating,
    });
  } catch (error) {
    reply.statusCode = 422;
    return reply.send({
      success: false,
      error: String(error),
    });
  }
});

fastify.post('/generate_model_rating_sheet', async (request, reply) => {
try{
  const { params } = request.body;

  const company = await Company.findOne({
    where:{ 
      uuid: params.uuid
    }
  })

  
const model_rating = await DB_CLIENT.query(`
WITH RankedRows AS (
  SELECT 
      CAST(c.name AS VARCHAR(MAX)) AS company_name, 
      CAST(rm2.name AS VARCHAR(MAX)) AS rating_model, 
      CAST(rt.name AS VARCHAR(MAX)) AS risk_type, 
      CAST(f.question AS VARCHAR(MAX)) AS factor, 
      (rmhrt.weightage) AS weightage,
      (
          SELECT '[' + STRING_AGG(
              '{' + QUOTENAME('factor_parameter', '"') + ':' + QUOTENAME(CAST(fp.name AS VARCHAR(MAX)), '"') + ',' + QUOTENAME('score', '"') + ':'
               + QUOTENAME(CAST(fp.score AS VARCHAR(MAX)), '""') + '}',
              ','
          ) + ']'
          FROM factors f2
          INNER JOIN factor_parameters fp ON fp.factor_id = f2.id
          WHERE f2.id = f.id
      ) AS factor_parameters_json,
      (
          SELECT SUM(rtrs.weighted_score)
          FROM risk_type_rating_sheets rtrs
          WHERE rtrs.risk_type_id = rmhrt.risk_type_id
      ) AS weighted_score,
      rm.assigned_score,
      crm.turnover,
      i.name AS industry_name, 
      (m.mandate_type) AS instrument_type, 
      rs.financial_risk,
      rs.management_risk,
      rs.business_risk,
      rs.industry_risk, 
      rs1.total_risk_score,
      rs1.proposed_long_term_rating,
      rs1.proposed_short_term_rating,
      rs1.proposed_outlook, 
      rs1.model_based_long_term_rating,
      rs1.model_based_short_term_rating,
      ROW_NUMBER() OVER (
          PARTITION BY CAST(c.name AS VARCHAR(MAX)), 
          CAST(rm2.name AS VARCHAR(MAX)), 
          CAST(rt.name AS VARCHAR(MAX)), 
          CAST(f.question AS VARCHAR(MAX)), 
          fp.score
          ORDER BY (SELECT NULL)
      ) AS RowNum
  FROM companies c
  INNER JOIN rating_metadata rm ON rm.company_id = c.id 
  INNER JOIN rating_sheets rs1 ON rs1.company_id = c.id
  INNER JOIN mandates m ON m.company_id = c.id
  INNER JOIN rating_models rm2 ON rm2.id = rm.rating_model_id 
  INNER JOIN risk_types rt ON rt.id = rm.risk_type_id 
  INNER JOIN rating_model_has_risk_types rmhrt ON rmhrt.rating_model_id = rm2.id AND rmhrt.risk_type_id = rt.id
  INNER JOIN factors f ON f.rating_model_risk_type_id = rmhrt.id 
  INNER JOIN factor_parameters fp ON fp.factor_id = f.id
  INNER JOIN company_rating_models crm ON crm.company_id = c.id
  INNER JOIN industries i ON i.id = crm.industry_id 
  INNER JOIN rating_sheets rs ON rs.company_id = c.id
  WHERE c.id = :company_id
)
SELECT company_name, rating_model, risk_type, factor, 
     MAX(factor_parameters_json) AS factor_parameters_json,
     MAX(assigned_score) AS assigned_score,
     MAX(weighted_score) AS weighted_score,
     MAX(weightage) AS max_weightage, -- Use MAX or other appropriate aggregation
     MAX(turnover) AS turnover, 
     MAX(industry_name) AS industry_name, 
     MAX(instrument_type) AS instrument_type, 
     MAX(financial_risk) AS financial_risk, 
     MAX(management_risk) AS management_risk, 
     MAX(business_risk) AS business_risk, 
     MAX(industry_risk) AS industry_risk,
     MAX(proposed_long_term_rating) AS proposed_long_term_rating,
     MAX(proposed_short_term_rating) AS proposed_short_term_rating,
     MAX(proposed_outlook) AS proposed_outlook,
     MAX(model_based_long_term_rating) AS model_based_long_term_rating,
     MAX(model_based_short_term_rating) AS model_based_short_term_rating
FROM RankedRows
WHERE RowNum = 1
GROUP BY company_name, rating_model, risk_type, factor
ORDER BY risk_type;
  `,
  {
  replacements:{
    company_id: company.id,
  },
  type: QueryTypes.SELECT
}
);

console.log("model_rating: ", model_rating);

let result = {
  rating_model_name: model_rating[0].rating_model,
  company_name: model_rating[0].company_name,
  instrument_type: model_rating[0].instrument_type,
  company_industry: model_rating[0].industry_name,
  turnover: model_rating[0].turnover,
  risk_details: [], 
  rating_sheet: [],
  rating_model: {
    total_weights: 100,
    weighted_score: model_rating[0].weighted_score,
    model_based_long_term_rating: model_rating[0].model_based_long_term_rating,
    model_based_short_term_rating: model_rating[0].model_based_short_term_rating,
    proposed_long_term_rating: model_rating[0].proposed_long_term_rating,
    proposed_short_term_rating: model_rating[0].proposed_short_term_rating,
    proposed_outlook: model_rating[0].proposed_outlook
  }
};

for (let i = 0; i < model_rating.length; i++) {
  console.log("model_rating :", model_rating[i])
let j = i;
const obj = {
  weighted_score: model_rating[i].weighted_score,
  parameter_name: model_rating[i].risk_type,
  factors_details: [],
};

const sheet_object = {
  risk_type: model_rating[i].risk_type,
  weightage: model_rating[i].max_weightage,
  score: model_rating[i].weighted_score,
};
result.rating_sheet.push(sheet_object);

while (i + 1 < model_rating.length && model_rating[i].risk_type === model_rating[i + 1].risk_type) {
  let sequence_no = 0;
  let factors = [];
  let k = 0;
  while (k < 5 && j < model_rating.length && model_rating[j].risk_type === model_rating[i].risk_type) {
    sequence_no++;
    const temp1 = {
      sequence_no: sequence_no,
      question: model_rating[j].factor,
      parameters: JSON.parse(model_rating[j].factor_parameters_json),
    };
    factors.push(temp1);
    j++;
    k++;
  }

  obj.factors_details.push({ factors });
  
  // Exit the loop if there are no more factors or we've collected all available factors for this risk_type.
  if (k < 5 || j >= model_rating.length || model_rating[j].risk_type !== model_rating[i].risk_type) {
    break;
  }
}

i = j - 1; // Update the outer loop iterator to the last processed index
result.risk_details.push(obj);
}

console.log("result: ", result);

let path = `generated/output_rating_sheet.pdf`

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const html = await fastify.view("templates/pdf/outputRatingSheet.pug", { data: result, require: require });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.emulateMediaType('screen');
  await page.pdf({
    path: path,
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A4',
  });
  await browser.close();

      const pdf = readFileSync(path)

      const document_url = await UPLOAD_TO_AZURE_STORAGE(pdf, {
        path: path
      })

  var response = {};
  response['document_url'] = document_url;
  reply.send(result);
}catch(error){
console.log("error: ",error);
}
});

    done();
  });
}

module.exports = {
  rating_model_routes,
};
