const { v4: uuidv4 } = require("uuid");
const { LANG_DATA } = require("../../lang");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../helpers");
const {
  TransactionInstrument,
  OtherRatingAgency,
  InstrumentDetail,
  RatingSymbolMaster,
  InstrumentCategory,
  InstrumentSubCategory,
  Instrument,
} = require("../../models/modules/rating-model");
const { MasterCommon, Company } = require("../../models/modules/onboarding");
const {
  CorporateGuarantee,
} = require("../../models/modules/corporate-guarantee");
const L = LANG_DATA();

async function corporate_guarantee_routes(fastify) {
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

    fastify.post("/corporate_guarantee/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "CorporateGuarantee.Create");

        const { params } = request.body;
        const where_query = params ? params : {};

        var short_term_rating = ''
        var long_term_rating = ''
        var instrument_category = ''
        var instrument_sub_category = ''
        var instrument = ''

        if (Object.keys(params).includes("short_term_rating_uuid")) {
          short_term_rating = await RatingSymbolMaster.findOne({
            where: {
              uuid: params["short_term_rating_uuid"]
            }
          })
        } 
        
        if (Object.keys(params).includes("long_term_rating_uuid")) {
          long_term_rating = await RatingSymbolMaster.findOne({
            where: {
              uuid: params["long_term_rating_uuid"]
            }
          })
        }

        if (Object.keys(params).includes("instrument_category_uuid")) {
          instrument_category = await InstrumentCategory.findOne({
            where: {
              uuid: params["instrument_category_uuid"]
            }
          })
        }

        if (Object.keys(params).includes("instrument_uuid")) {
          instrument = await Instrument.findOne({
            where: {
              uuid: params["instrument_uuid"]
            }
          })
        }

        if (Object.keys(params).includes("sub_category_uuid")) {
          instrument_sub_category = await InstrumentSubCategory.findOne({
            where: {
              uuid: params["sub_category_uuid"]
            }
          })
        }

        const guarantor = await Company.findOne({
          where: {
            uuid: params["guarantor_uuid"],
          },
        });

        const mandate_type = await MasterCommon.findOne({
          where: {
            name: params["mandate_type"],
          },
        });

        const transaction_instruments = await TransactionInstrument.findAll({
          where: {
            uuid: params["transaction_instrument_uuid"],
          },
        });

        const corporate_guarantee = await CorporateGuarantee.create({
          uuid: uuidv4(),
          rated_amount: params["rated_amount"],
          rating: params["rating"],
          outlook: params["outlook"],
          press_release_date: params["press_release_date"],
          guarantor: guarantor.name,
          company_id: guarantor.id,
          mandate_types_id: mandate_type.id,
          instrument_category_id: instrument_category ? instrument_category.id : null,
          instrument_sub_category_id: instrument_sub_category ? instrument_sub_category.id : null,
          instrument_id: instrument ? instrument.id : null,
          short_term_rating_id: short_term_rating ? short_term_rating.id : null,
          long_term_rating_id: long_term_rating ? long_term_rating.id : null,
          is_active: true,
          created_at: new Date(),
          created_by: request.user.id,
        });

        await corporate_guarantee.setTransaction_instruments(
          transaction_instruments
        );

        return reply.send({
          success: true,
          corporate_guarantee: corporate_guarantee,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/corporate_guarantee/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "CorporateGuarantee.Edit");

        const { params } = request.body;
        const where_query = params ? params : {};

        var short_term_rating = ''
        var long_term_rating = ''
        var instrument_category = ''
        var instrument_sub_category = ''
        var instrument = ''

        if (Object.keys(params).includes("short_term_rating_uuid")) {
          short_term_rating = await RatingSymbolMaster.findOne({
            where: {
              uuid: params["short_term_rating_uuid"]
            }
          })
        } 
        
        if (Object.keys(params).includes("long_term_rating_uuid")) {
          long_term_rating = await RatingSymbolMaster.findOne({
            where: {
              uuid: params["long_term_rating_uuid"]
            }
          })
        }

        if (Object.keys(params).includes("instrument_category_uuid")) {
          instrument_category = await InstrumentCategory.findOne({
            where: {
              uuid: params["instrument_category_uuid"]
            }
          })
        }

        if (Object.keys(params).includes("instrument_uuid")) {
          instrument = await Instrument.findOne({
            where: {
              uuid: params["instrument_uuid"]
            }
          })
        }

        if (Object.keys(params).includes("sub_category_uuid")) {
          instrument_sub_category = await InstrumentSubCategory.findOne({
            where: {
              uuid: params["sub_category_uuid"]
            }
          })
        }

        const guarantor = await Company.findOne({
          where: {
            uuid: params["guarantor_uuid"],
          },
        });

        const mandate_type = await MasterCommon.findOne({
          where: {
            name: params["mandate_type"],
          },
        });

        const transaction_instruments = await TransactionInstrument.findAll({
          where: {
            uuid: params["transaction_instrument_uuid"],
          },
        });

        const corporate_guarantee_updated = await CorporateGuarantee.update(
          APPEND_USER_DATA(request, {
            rated_amount: params["rated_amount"],
            rating: params["rating"],
            outlook: params["outlook"],
            press_release_date: params["press_release_date"],
            guarantor: guarantor.name,
            company_id: guarantor.id,
            mandate_types_id: mandate_type.id,
            instrument_category_id: instrument_category ? instrument_category.id : null,
            instrument_sub_category_id: instrument_sub_category ? instrument_sub_category.id : null,
            instrument_id: instrument ? instrument.id : null,
            short_term_rating_id: short_term_rating ? short_term_rating.id : null,
            long_term_rating_id: long_term_rating ? long_term_rating.id : null,
          }),
          {
            where: {
              uuid: params["uuid"],
              is_active: true,
            },
          }
        );

        const corporate_guarantee = await CorporateGuarantee.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        await corporate_guarantee.setTransaction_instruments(
          transaction_instruments
        );

        return reply.send({
          success: true,
          corporate_guarantee_updated: corporate_guarantee_updated,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/corporate_guarantee/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "CorporateGuarantee.View");

        const { params } = request.body;

        const corporate_guarantee = await CorporateGuarantee.findOne({
          where: {
            uuid: params["uuid"],
          },
          include: [
            { model: Company, as: "company" },
            { model: MasterCommon, as: "mandate_type" },
            { model: TransactionInstrument, as: "transaction_instruments" },
            { model: RatingSymbolMaster, as: "short_term_rating"},
            { model: RatingSymbolMaster, as: "long_term_rating"}
          ],
        });

        return reply.send({
          success: true,
          corporate_guarantee: corporate_guarantee,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/corporate_guarantee", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "CorporateGuarantee");

        const { params } = request.body;
        
        const instrument_detail = await InstrumentDetail.findOne({
          where: {
            uuid: params["instrument_detail_id"],
            is_active: true
          }
        })

        const corporate_guarantee = await CorporateGuarantee.findAll({
          where: {
            instrument_detail_id: instrument_detail.id,
            is_active: true
          },
          include: [
            { model: Company, as: "company" },
            { model: MasterCommon, as: "mandate_type" },
            { model: TransactionInstrument, as: "transaction_instruments" },
            { model: RatingSymbolMaster, as: "short_term_rating"},
            { model: RatingSymbolMaster, as: "long_term_rating"}
          ],
        });

        return reply.send({
          success: true,
          corporate_guarantee: corporate_guarantee,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    done();
  });
}

module.exports = {
  corporate_guarantee_routes,
};
