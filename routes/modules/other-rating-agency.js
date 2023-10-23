const { Outlook } = require("../../models/modules/rating-committee");
const { v4: uuidv4 } = require("uuid");
const { LANG_DATA } = require("../../lang");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../helpers");
const { TransactionInstrument, OtherRatingAgency, InstrumentDetail, InstrumentCategory, Instrument, InstrumentSubCategory, RatingSymbolMaster } = require("../../models/modules/rating-model");
const { MasterCommon } = require("../../models/modules/onboarding");
const L = LANG_DATA();

async function other_rating_agency_routes(fastify) {
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

    fastify.post("/other_rating_agency/create", async (request, reply) => {
        try {
  
          await CHECK_PERMISSIONS(request, 'OtherRatingAgency.Create')
  
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

            const transaction_instrument = await TransactionInstrument.findOne({
                where: {
                    uuid: params["transaction_instrument_uuid"]
                }
            })

            const instrument_detail = await InstrumentDetail.findOne({
              where: {
                transaction_instrument_id: transaction_instrument.id
              }
            })

            const credit_rating_agency = await MasterCommon.findOne({
                where: {
                    name: params["rating_agency"]
                }
            })

            const mandate_type = await MasterCommon.findOne({
                where: {
                    name: params["mandate_type"]
                }
            })

            const other_rating_agency = await OtherRatingAgency.create({
                uuid: uuidv4(),
                credit_rating_agency_id: credit_rating_agency.id,
                amount: params["amount"],
                short_term_rating_id: short_term_rating ? short_term_rating.id : null,
                long_term_rating_id: long_term_rating ? long_term_rating.id : null,
                last_rating_action: params["last_rating_action"],
                financial_base_last_rating_action: params["financial_base_last_rating_action"],
                last_press_release_date: params["last_press_release_date"],
                outlook: params["outlook"],
                mandate_type_id: mandate_type.id,
                instrument_category_id: instrument_category ? instrument_category.id : null,
                is_active: true,
                instrument_id: instrument ? instrument.id : null,
                instrument_detail_id: instrument_detail.id,
                instrument_sub_category_id: instrument_sub_category ? instrument_sub_category.id : null,
                created_at: new Date(),
                created_by: request.user.id
            })

            
  
          return reply.send({
            success: true,
            other_rating_agency: other_rating_agency,
          });
  
        } catch (error) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: String(error),
          });
        }
      });

      fastify.post("/other_rating_agency/edit", async (request, reply) => {
        try {
  
          await CHECK_PERMISSIONS(request, 'OtherRatingAgency.Edit')
  
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

            const transaction_instrument = await TransactionInstrument.findOne({
                where: {
                  uuid: params["transaction_instrument_uuid"]
                }
            })

            const instrument_detail = await InstrumentDetail.findOne({
                where: {
                  transaction_instrument_id: transaction_instrument.id
                }
            })

            const credit_rating_agency = await MasterCommon.findOne({
                where: {
                  name: params["rating_agency"]
                }
            })

            const mandate_type = await MasterCommon.findOne({
                where: {
                  name: params["mandate_type"]
                }
            })

            const other_rating_agency = await OtherRatingAgency.update(APPEND_USER_DATA(request, {
                credit_rating_agency_id: credit_rating_agency.id,
                amount: params["amount"],
                short_term_rating_id: short_term_rating ? short_term_rating.id : null,
                long_term_rating_id: long_term_rating ? long_term_rating.id : null,
                last_rating_action: params["last_rating_action"],
                financial_base_last_rating_action: params["financial_base_last_rating_action"],
                last_press_release_date: params["last_press_release_date"],
                outlook: params["outlook"],
                mandate_type_id: mandate_type.id,
                instrument_category_id: instrument_category ? instrument_category.id : null,
                instrument_sub_category_id: instrument_sub_category ? instrument_sub_category.id : null
            }), {
                where: {
                    instrument_id: instrument.id
                }
            })
  
          return reply.send({
            success: true,
            other_rating_agency: other_rating_agency,
          });
  
        } catch (error) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: String(error),
          });
        }
      });

      fastify.post("/other_rating_agency/view", async (request, reply) => {
        try {
  
          await CHECK_PERMISSIONS(request, 'OtherRatingAgency.View')
  
          const { params } = request.body;

            const transaction_instrument = await TransactionInstrument.findOne({
                where: {
                    uuid: params["transaction_instrument_uuid"]
                }
            })

            const instrument_detail = await InstrumentDetail.findOne({
                where: {
                    transaction_instrument_id: transaction_instrument.id
                }
            })

            const other_rating_agency = await OtherRatingAgency.findOne({
                where: {
                   instrument_detail_id: instrument_detail.id
                },
                include: [
                  {
                    model: MasterCommon,
                    as: "credit_rating_agency",
                    attributes: ["id", "group", "name", "value"]
                  },
                  {
                    model: MasterCommon,
                    as: "mandate_type",
                    attributes: ["id", "group", "name", "value"]
                  },
                  {
                    model: InstrumentCategory,
                    as: "instrument_category",
                    attributes: ["id", "uuid", "category_name", ]
                  },
                  {
                    model: Instrument,
                    as: "instrument",
                    attributes: ["id", "uuid", "name", "short_name"]
                  },
                  {
                    model: InstrumentSubCategory,
                    as: "instrument_sub_category'",
                    attributes: ["id", "uuid", "category_name"]
                  },
                  {
                    model: RatingSymbolMaster,
                    as: "short_term_rating",
                    attributes: ["id", "uuid", "rating_symbol", "description", "grade", "weightage"]
                  },
                  {
                    model: RatingSymbolMaster,
                    as: "long_term_rating",
                    attributes: ["id", "uuid", "rating_symbol", "description", "grade", "weightage"]
                  }
                ]
            })
  
          return reply.send({
            success: true,
            other_rating_agency: other_rating_agency,
          });
  
        } catch (error) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: String(error),
          });
        }
      });

      fastify.post("/other_rating_agency", async (request, reply) => {
        try {
  
          await CHECK_PERMISSIONS(request, 'OtherRatingAgency.Create')
  
          const { params } = request.body;

          const transaction_instrument = await TransactionInstrument.findOne({
            where: {
                uuid: params["transaction_instrument_uuid"]
            }
          })

          const instrument_detail = await InstrumentDetail.findOne({
            where: {
                transaction_instrument_id: transaction_instrument.id
            }
          })

            const other_rating_agency = await OtherRatingAgency.findAll({
                where: {
                    instrument_detail_id: instrument_detail.id
                },
                include: [
                  {
                    model: MasterCommon,
                    as: "credit_rating_agency",
                    attributes: ["id", "group", "name", "value"]
                  },
                  {
                    model: MasterCommon,
                    as: "mandate_type",
                    attributes: ["id", "group", "name", "value"]
                  },
                  {
                    model: InstrumentCategory,
                    as: "instrument_category",
                    attributes: ["id", "uuid", "category_name", ]
                  },
                  {
                    model: Instrument,
                    as: "instrument",
                    attributes: ["id", "uuid", "name", "short_name"]
                  },
                  {
                    model: InstrumentSubCategory,
                    as: "instrument_sub_category",
                    attributes: ["id", "uuid", "category_name"]
                  },
                  {
                    model: RatingSymbolMaster,
                    as: "short_term_rating",
                    attributes: ["id", "uuid", "rating_symbol", "description", "grade", "weightage"]
                  },
                  {
                    model: RatingSymbolMaster,
                    as: "long_term_rating",
                    attributes: ["id", "uuid", "rating_symbol", "description", "grade", "weightage"]
                  }
                ]
            })
  
          return reply.send({
            success: true,
            other_rating_agency: other_rating_agency,
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
    other_rating_agency_routes,
};
