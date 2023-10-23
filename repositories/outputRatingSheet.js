const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");

async function GET_OUTPUT_RATING_SHEET_DATA(params){

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
      company_id: params.company_id,
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

return result;

}

module.exports = { GET_OUTPUT_RATING_SHEET_DATA };