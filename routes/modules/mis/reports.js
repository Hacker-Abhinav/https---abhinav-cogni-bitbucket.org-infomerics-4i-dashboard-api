const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../../db");
const { GET_MIS_REPORT, GET_MIS_REPORTS, GET_MIS_REPORT_DATA } = require("../../../repositories/MISReportRepository");
const { GetConfigSchema } = require("../../../schemas/MIS/GetConfigSchema");
const { complianceReportSchema } = require("../../../schemas/MIS/complianceReprtSchema");

function buildConditions(params) {
  var conditions = [];
  var values = [];
  var conditionsStr;

  if (params.meeting_date) {
    conditions.push("meeting_date = ?");
    values.push(meeting_date);
  }
  if (params.press_release_date) {
    conditions.push("press_release_date = ?");
    values.push(parseInt(params.press_release_date));
  }

  return {
    where: conditions.length ?
             conditions.join(' AND ') : '1',
    values: values
  };
}


async function mis_reports_routes(fastify) {
  fastify.register((instance, opts, done) => {
    fastify.addHook("onRequest", async () => {
    });

    fastify.post("/mis/compliance/reports", {schema: complianceReportSchema}, async (request, reply) => {
      try {
        // await CHECK_PERMISSIONS(request, 'Interactions.List');
        let reports = [];
        const where_query = buildConditions(request.body.params);
        if(request.query && request.query.report_type === 'PR_MIS' ){
         reports = await DB_CLIENT.query(
          `SELECT  uuid, instrument_text, instrument_size_number,category_text , sub_category_text,
          company_name, voting_status, agenda_type, long_term_rating_recommendation,
          short_term_rating_recommendation, short_term_outlook_recommendation,
          long_term_outlook_recommendation,current_outlook, current_rating,previous_rating,
           previous_outlook, committee_type,
           category, mandate_id, complexity_level, company_uuid, meeting_type, meeting_date, press_release_date,rating_acceptance_date,rating_acceptance_status,
           rating_letter_date from mis_reports`
           ,
          {
            type: QueryTypes.SELECT,
          }
        );
        }
        else if(request.query && request.query.report_type === 'RATING_MIS')
        {
          reports = await DB_CLIENT.query(
            `SELECT  uuid, 
            company_name, long_term_rating_recommendation,
            short_term_rating_recommendation, short_term_outlook_recommendation,
            long_term_outlook_recommendation,  current_outlook,  current_rating,previous_rating, previous_outlook, committee_type, meeting_id,  meeting_date,category,mandate_id,complexity_level, company_uuid,meeting_type,press_release_date,rating_acceptance_date,
            rating_acceptance_status,rating_letter_date,macro_economic_indicator,sector,industry,sub_industry
            from mis_reports ORDER BY mandate_id DESC
          `,
            {
              type: QueryTypes.SELECT,
            }
          );
        }

        return reply.send({
          success: true,
          reports: reports,
        });
      }
      
      catch (error) {
        reply.statusCode = 422;
        return reply.send(error);
      }
    });

    fastify.post("/mis/report_by_type", { schema: GetConfigSchema }, async (request, reply) => {
      try {
        // await CHECK_PERMISSIONS(request, 'Interactions.List');
        const { type } = request.body['params'];
        const report = await GET_MIS_REPORT({ type });
        const data = await GET_MIS_REPORT_DATA(report);

        return reply.send({
          success: true,
          report: report,
          data: data,
        });
      }
      
      catch (error) {
        reply.statusCode = 422;
        return reply.send(error);
      }
    });

    done();
  });
}

module.exports = {
  mis_reports_routes,
};
