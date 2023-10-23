const { QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { Company } = require("../models/modules/onboarding");

// GET_ANNEXURE_DATA
async function GET_ANNEXURE_DATA(query) {
  return new Promise(async (resolve, reject) => {
    const company = await Company.findOne({
      where: query,
      raw: true,
    });

    if (!company) {
      reject({
        success: false,
        error: "NO_COMPANY",
      });
    }

    const annexure_data = {};

    const fund_based_lt_cash_credit_wcdl = await DB_CLIENT.query(
      `
      select DISTINCT c.name as lender_name, bl.rated_amount, 
      FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.remark as remarks from banker_lenders bl
      inner join companies c on c.id = bl.bank_id and c.id = :company_id
      inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
      where rcmr.is_long_term = 1 and rcmr.sub_category_text like 'Fund Based LT' and (rcmr.instrument_text = 'Cash Credit' or rcmr.instrument_text = 'WCDL')
      `,
      {
        replacements: {
          company_id: company.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    annexure_data.fund_based_lt_cash_credit_wcdl = fund_based_lt_cash_credit_wcdl
    
    const fund_based_lt_term_loans = await DB_CLIENT.query(
      `
      select DISTINCT c.name as lender_name, bl.rated_amount, 
      FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.remark as remarks from banker_lenders bl
      inner join companies c on c.id = bl.bank_id and c.id = :company_id
      inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
      where rcmr.is_long_term = 1 and rcmr.sub_category_text like 'Fund Based LT' and (rcmr.instrument_text = 'Term Loans' or rcmr.instrument_text = 'GECL')
      `,
      {
        replacements: {
            company_id: company.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    annexure_data.fund_based_lt_term_loans = fund_based_lt_term_loans

    const fund_based_lt_ncd = await DB_CLIENT.query(
      `
      select DISTINCT bl.isin, bl.rated_amount, 
      FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.coupon_rate as coupon_rate, ti.issuance_date from banker_lenders bl
      inner join companies c on c.id = bl.bank_id and c.id = :company_id
      inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
      inner join instrument_details id on bl.instrument_detail_id = id.id
      inner join transaction_instruments ti on ti.id = id.transaction_instrument_id
      where rcmr.is_long_term = 1 and rcmr.sub_category_text LIKE 'Fund Based LT' and (rcmr.instrument_text = 'Non Convertible Debenture')
    `,
      {
        replacements: {
            company_id: company.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    annexure_data.fund_based_lt_ncd = fund_based_lt_ncd

    const fund_based_lt_overdraft_bill_discounting = await DB_CLIENT.query(
      `
      select DISTINCT c.name as lender_name, bl.rated_amount, 
      FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.remark as remarks from banker_lenders bl
      inner join companies c on c.id = bl.bank_id and c.id = :company_id
      inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
      where rcmr.is_short_term = 1 and rcmr.sub_category_text LIKE 'Fund Based LT' and (rcmr.instrument_text = 'Overdraft' or rcmr.instrument_text = 'Bill Discounting')
    `,
      {
        replacements: {
            company_id: company.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    annexure_data.fund_based_lt_overdraft_bill_discounting = fund_based_lt_overdraft_bill_discounting

    const fund_based_st_overdraft_bill_discounting = await DB_CLIENT.query(
        `
        select DISTINCT c.name as lender_name, bl.rated_amount, 
        FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.remark as remarks from banker_lenders bl
        inner join companies c on c.id = bl.bank_id and c.id = :company_id
        inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
        where rcmr.is_short_term = 1 and rcmr.sub_category_text LIKE 'Fund Based ST' and (rcmr.instrument_text = 'Overdraft' or rcmr.instrument_text = 'Bill Discounting')
      `,
        {
          replacements: {
              company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

    annexure_data.fund_based_st_overdraft_bill_discounting = fund_based_st_overdraft_bill_discounting

    const fund_based_st_commercial_papers = await DB_CLIENT.query(
      `
      select DISTINCT bl.isin, bl.rated_amount, 
      FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.coupon_rate as coupon_rate, ti.issuance_date from banker_lenders bl
      inner join companies c on c.id = bl.bank_id and c.id = :company_id
      inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
      inner join instrument_details id on bl.instrument_detail_id = id.id
      inner join transaction_instruments ti on ti.id = id.transaction_instrument_id
      where rcmr.is_short_term = 1 and rcmr.sub_category_text LIKE 'Fund Based ST' and (rcmr.instrument_text = 'Commercial Papers')
    `,
      {
        replacements: {
            company_id: company.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    annexure_data.fund_based_st_commercial_papers = fund_based_st_commercial_papers

    const non_fund_based_st_letter_of_credit_bank_guarantee = await DB_CLIENT.query(
      `
      select DISTINCT c.name as lender_name, bl.rated_amount, 
      FORMAT(bl.maturity_date, 'MMMM yyyy') as maturity_date, bl.remark as remarks from banker_lenders bl
      inner join companies c on c.id = bl.bank_id and c.id = :company_id
      inner join rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
      where rcmr.is_short_term = 1 and rcmr.sub_category_text LIKE 'Non Fund Based ST' and (rcmr.instrument_text = 'Letter of Credit' or rcmr.instrument_text = 'Bank Guarrantee')
    `,
      {
        replacements: {
            company_id: company.id,
        },
        type: QueryTypes.SELECT,
      }
    );

    annexure_data.non_fund_based_st_letter_of_credit_bank_guarantee = non_fund_based_st_letter_of_credit_bank_guarantee

    const sum_in_rl_annexure_1 = await DB_CLIENT.query(`
        SELECT SUM(bl.rated_amount) AS total FROM banker_lenders bl
        INNER JOIN companies c ON c.id = bl.bank_id AND c.id = :company_id
        INNER JOIN rating_committee_meeting_registers rcmr on rcmr.instrument_detail_id = bl.instrument_detail_id
        WHERE rcmr.is_long_term = 1 AND rcmr.sub_category_text LIKE 'Fund Based LT' AND (rcmr.instrument_text = 'Cash Credit' OR rcmr.instrument_text = 'WCDL') 
        OR rcmr.is_long_term = 1 AND rcmr.sub_category_text LIKE 'Fund Based LT' 
        AND (rcmr.instrument_text = 'Term Loans' OR rcmr.instrument_text = 'GECL')
        OR rcmr.is_long_term = 1 AND rcmr.sub_category_text LIKE 'Fund Based LT' 
        AND (rcmr.instrument_text = 'Non Convertible Debenture')
        OR rcmr.is_short_term = 1 AND rcmr.sub_category_text LIKE 'Fund Based LT' 
        AND (rcmr.instrument_text = 'Overdraft' OR rcmr.instrument_text = 'Bill Discounting')
        OR rcmr.is_short_term = 1 AND rcmr.sub_category_text LIKE 'Fund Based ST' 
        AND (rcmr.instrument_text = 'Commercial Papers')
        OR rcmr.is_short_term = 1 AND rcmr.sub_category_text LIKE 'Non Fund Based ST' 
        AND (rcmr.instrument_text = 'Letter of Credit' OR rcmr.instrument_text = 'Bank Guarrantee')
    `, {
        replacements: {
            company_id: company.id
        },
        type: QueryTypes.SELECT
    })

    annexure_data.sum_in_rl_annexure_1 = sum_in_rl_annexure_1

    if (annexure_data !== {}) resolve(annexure_data);
    else {
      reject({
        success: false,
        error: "ANNEXURE_DATA_NOT_FOUND",
      });
    }
  });
}

module.exports = {
    GET_ANNEXURE_DATA,
};
