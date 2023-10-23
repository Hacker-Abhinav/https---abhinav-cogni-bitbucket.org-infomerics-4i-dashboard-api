const { Op } = require("sequelize");
const { writeFileSync, readFileSync, writeFile } = require("fs");
const moment = require("moment");
const HTMLtoDOCX = require("html-to-docx");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const { DB_CLIENT } = require("../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const {
  APPEND_USER_DATA,
  CHECK_PERMISSIONS,
  INWORDS,
  UPLOAD_TO_AZURE_STORAGE,
} = require("../../helpers");
const {
  TemplateList,
  TemplateType,
  LetterList,
} = require("../../models/modules/template-list");
const {
  RatingProcess,
  Instrument,
  FinancialYear,
} = require("../../models/modules/rating-model");
const { Company, Mandate, DocumentType } = require("../../models/modules/onboarding");
const {
  RatingCommitteeMeetingDocument,
  RatingCommitteeMeeting,
} = require("../../models/modules/rating-committee");
const { ToWords } = require("to-words");
const htmlDocx = require("html-docx-js");
const { GET_ANNEXURE_DATA } = require("../../repositories/RLANNEXUREI");

const toWords = new ToWords();

function processTemplateSyntax(data, rl_data_constants) {
  try {
    for (let i = 0; i < rl_data_constants?.length; i++) {
      const str = rl_data_constants[i].regEx;
      const new_regex = new RegExp(str, "g");
      const count = data.match(new_regex)?.length;
      for (let index = 0; index < count; index++) {
        data = data.replace(
          rl_data_constants[i].regEx,
          rl_data_constants[i].value
        );
      }
    }
  } catch (e) {
    console.log(e);
  }

  return data;
}

function getInstrumentType(item) {
  if (item.is_long_term) {
    return "Long Term";
  } else if (item.is_short_term) {
    return "Short Term";
  } else {
    return "Long Term / Short Term";
  }
}

function generate_rl_annexure(rl_annexure_data, sum) {
  let html = "";
  for (let i = 0; i < rl_annexure_data.length; i++) {
    if (
      rl_annexure_data[i].instrument
        ?.toLocaleLowerCase()
        ?.includes("Non convertible Debenture".toLocaleLowerCase()) ||
      rl_annexure_data[i].instrument
        ?.toLocaleLowerCase()
        ?.includes("Commercial Paper".toLocaleLowerCase())
    ) {
      html += `
    <h5>${i + 1}. ${rl_annexure_data[i].instrument_display}
    <h5>${i + 1}.A.${
        rl_annexure_data[i].is_long_term === 1 &&
        rl_annexure_data[i].is_short_term === 0
          ? `Long Term ${rl_annexure_data[i].instrument_display}`
          : rl_annexure_data[i].is_short_term === 1 &&
            rl_annexure_data[i].is_long_term === 0
          ? `Short Term ${rl_annexure_data[i].instrument_display}`
          : rl_annexure_data[i].is_short_term === 1 &&
            rl_annexure_data[i].is_long_term === 1
          ? `Long Term ${rl_annexure_data[i].instrument_display}`
          : rl_annexure_data[i].instrument_display
      }</h5>
    <table style="border: 1px solid black;border-collapse: collapse; width: 100%; font-size: 11px">
      <thead style="border: 1px solid black;background-color: #BFBFBF;">
        <tr>
          <th style="border: 1px solid black;">Sr. No.</th>
          <th style="border: 1px solid black;">ISIN</th>
          <th style="border: 1px solid black;">Rated Amount (Rs. Crore)</th>
          <th style="border: 1px solid black;">Coupon Rate p.a.</th>
          <th style="border: 1px solid black;">Issue Date</th>
          <th style="border: 1px solid black;">Maturity Date</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border: 1px solid black;text-align: center;">
          <td style="border: 1px solid black;">1</td>
          <td style="border: 1px solid black;">${
            rl_annexure_data[i].isin === null ? "NA" : rl_annexure_data[i].isin
          }</td>
          <td style="border: 1px solid black;">${
            rl_annexure_data[i].rated_amount === null
              ? "NA"
              : rl_annexure_data[i].rated_amount
          }</td>
          <td style="border: 1px solid black;">${
            rl_annexure_data[i].coupon_rate === null
              ? "NA"
              : rl_annexure_data[i].coupon_rate
          }</td>
          <td style="border: 1px solid black;">${
            rl_annexure_data[i].issuance_date === null
              ? "NA"
              : rl_annexure_data[i].issuance_date
          }</td>
          <td style="border: 1px solid black;">${
            rl_annexure_data[i].maturity_date === null
              ? "NA"
              : rl_annexure_data[i].maturity_date
          }</td>
        </tr>
      </tbody>
    </table>
    `;
    } else {
      html += `
      <h5>${rl_annexure_data[i].instrument}</h5>
      <table style="border: 1px solid black;border-collapse: collapse; width: 100%; font-size: 11px">
        <thead style="border: 1px solid black;background-color: #BFBFBF;">
          <tr>
            <th style="border: 1px solid black;">S. No.</th>
            <th style="border: 1px solid black;">Lender Name</th>
            <th style="border: 1px solid black;">Rated Amount (Rs. Crore)</th>
            <th style="border: 1px solid black;">Remarks</th>
            <th style="border: 1px solid black;">Maturity</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border: 1px solid black;text-align: center;">
            <td style="border: 1px solid black;">1</td>
            <td style="border: 1px solid black;">${
              rl_annexure_data[i].lender_name === null
                ? "NA"
                : rl_annexure_data[i].lender_name
            }</td>
            <td style="border: 1px solid black;">${
              rl_annexure_data[i].rated_amount === null
                ? "NA"
                : rl_annexure_data[i].rated_amount
            }</td>
            <td style="border: 1px solid black;">${
              rl_annexure_data[i].remarks === null
                ? "NA"
                : rl_annexure_data[i].remarks
            }</td>
            <td style="border: 1px solid black;">${
              rl_annexure_data[i].maturity_date === null
                ? "NA"
                : rl_annexure_data[i].maturity_date
            }</td>
          </tr>
        </tbody>
      </table>
    `;
    }
  }
  html += `<p>Total Amount of Facilities rated is Rs. ${sum[0]?.total?.toFixed(
    2
  )} crore</p>`;
  return html;
}

function generateLetterNumber(template_type, current_letter_number) {
  let letterStr = "";
  let date = new Date();
  const temp = template_type.split(" ");
  for (let i = 0; i < temp.length; i++) {
    letterStr += temp[i][0];
  }
  letterStr += `/${date.getFullYear()}/${
    Math.floor(Math.random() * 90000) + 10000
  }`;
  if (current_letter_number === letterStr) generateLetterNumber(template_type);
  return letterStr;
}

function generate_rl_table_data(rl_table_data, sum) {
  let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid black; border-spacing: 0; font-size: 11px;"> 
    <thead style="color: #111; height: 25px;"> 
      <tr> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Instrument / Facility</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Amount (Rs. Crore)</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Ratings</th> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Rating Action</th> 
      </tr>
    </thead>
    <tbody>`;

  rl_table_data.forEach((item) => {
    tableHtml += ` 
        <tr> 
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.instrument
          }</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px; text-align: center">${
            item.instrument_size ? item.instrument_size.toFixed(2) : "NA"
          }</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.rating ? item.rating : "NA"
          }</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.rating_action ? item.rating_action : "NA"
          }</td>
        </tr>`;
  });

  tableHtml += `
  <tr>
  <td style="border: 1px solid black; text-align: left; padding: 8px;"> Total </td>
  <td style="border: 1px solid black; text-align: left; padding: 8px;" colspan="3"><span>${
    sum.length > 0 ? sum[0].total.toFixed(2) : "NA"
  }</span><br>
  <span>(${
    sum.length > 0
      ? toWords.convert(sum[0].total.toFixed(2) * 10000000, { currency: true })
      : "NA"
  })</span></td>
</tr>
</tbody>
  </table>`;

  return tableHtml;
}

function generate_pr_annexure_table(annexure_table) {
  let tableHtml = `
  <table style="border: 1px solid; border-collapse: collapse;">
  <thead style="border: 1px solid">
    <th style="border: 1px solid">Name of Facility</th>
    <th style="border: 1px solid">Date of Issuance</th>
    <th style="border: 1px solid">Coupon Rate/ IRR</th>
    <th style="border: 1px solid">Maturity Date</th>
    <th style="border: 1px solid">Size of Facility(Rs. Crore)</th>
    <th style="border: 1px solid">Rating Assigned/Outlook</th>
  </thead>
 <tbody style="border: 1px solid">`;
  annexure_table.forEach((item) => {
    tableHtml += `
  <tr style="border: 1px solid">
  <td style="border: 1px solid; text-align: center;">${
    item.category_text ? item.category_text : "NA"
  }</td>
  <td style="border: 1px solid; text-align: center;">${
    item.issuance_date ? item.issuance_date : "NA"
  }</td>
  <td style="border: 1px solid; text-align: center;">${
    item.coupon_rate ? item.coupon_rate : "NA"
  }</td>
  <td style="border: 1px solid; text-align: center;">${
    item.maturity_date ? item.maturity_date : "NA"
  }</td>
  <td style="border: 1px solid; text-align: center;">${
    item.instrument_size_number ? item.instrument_size_number.toFixed(2) : "NA"
  }</td>
  <td style="border: 1px solid; text-align: center;">${
    item.rating_assigned ? item.rating_assigned : "NA"
  }</td>
</tr>`;
  });

  tableHtml += `</tbody>
</table> 
  `;
  return tableHtml;
}

function generate_pr_annexure_table_2() {
  let tableHtml = `
  <table style="border: 1px solid;width: 100%;border-collapse: collapse;">
    <thead style="border: 1px solid">
        <th style="border: 1px solid; text-align: left;">Name of Facility</th>
        <th style="border: 1px solid; text-align: left;">Date of Issuance</th>
    </thead>
  <tbody style="border: 1px solid">
    <tr style="border: 1px solid">
        <td style="border: 1px solid">Name</td>
        <td style="border: 1px solid">Date</td>
    </tr>
  </tbody>
</table>`;
  return tableHtml;
}

function generate_pr_annexure_table_3() {
  let tableHtml = `
  <table style="border: 1px solid; width: 100%; border-collapse: collapse;">
        <thead>
              <th colspan="2" style="border: 1px solid; text-align: left;">Name of the Instrument </th>
              <th style="text-align: center;border: 1px solid;text-align: left;">Detailed Explanation </th>
        </thead>
        <tbody>
            <td style="border: 1px solid; padding: 8px;"></td>
            <td style="font-weight: 600; border: 1px solid;">Financial Convenant</td>
            <td style="border: 1px solid;"></td>
        </tbody>
        <tbody>
            <td style="border: 1px solid;padding: 8px;"></td>
            <td style="font-weight: 600; border: 1px solid;">i.</td>
            <td  style="border: 1px solid"></td>
        </tbody>
        <tbody>
            <td  style="border: 1px solid;padding: 8px;"></td>
            <td style="font-weight: 600;border: 1px solid;">ii.</td>
            <td  style="border: 1px solid"></td>
        </tbody>
        <tbody>
            <td style="border: 1px solid;padding: 8px;"></td>
            <td style="font-weight: 600;border: 1px solid;">Non-financial Convenant</td>
            <td style="border: 1px solid"></td>
        </tbody>
        <tbody>
            <td style="border: 1px solid;padding: 8px;"></td>
            <td style="font-weight: 600;border: 1px solid;">i.</td>
            <td style="border: 1px solid"></td>
        </tbody>
        <tbody>
            <td style="border: 1px solid;padding: 8px;"></td>
            <td style="font-weight: 600;border: 1px solid;">ii.</td>
            <td style="border: 1px solid"></td>
        </tbody>
    </table>
  `;
  return tableHtml;
}

function pr_table_data(pr_table, sum) {
  let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid black; border-spacing: 0;"> 
  <thead style="color: #111; height: 25px;"> 
    <tr> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Instrument / Facility</th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Amount (Rs. Crore)</th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Ratings</th> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Rating Action</th> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Compexity Indicator (Simple/Complex/Highly Complex)</th>
    </tr>
  </thead>`;

  pr_table.forEach((item) => {
    tableHtml += `
    <tbody> 
      <tr> 
        <td style="border: 1px solid black; text-align: left; padding: 8px;">${
          item.instrument
        }</td>
        <td style="border: 1px solid black; text-align: left; padding: 8px; text-align: center">${
          item.instrument_size_number
            ? item.instrument_size_number.toFixed(2)
            : "NA"
        }</td>
        <td style="border: 1px solid black; text-align: left; padding: 8px;">${
          item.rating ? item.rating : "NA"
        }</td>
        <td style="border: 1px solid black; text-align: left; padding: 8px;">${
          item.rating_action ? item.rating_action : "NA"
        }</td>
        <td>${item.complexity_level ? item.complexity_level : "NA"}</td>
      </tr>`;
  });

  tableHtml += `
<tr>
<td style="border: 1px solid black; text-align: left; padding: 8px;"> Total </td>
<td style="border: 1px solid black; text-align: left; padding: 8px;" colspan="4"><span>${
    sum.length > 0 ? sum[0].total.toFixed(2) : "NA"
  }</span><br>
<span>(${
    sum.length > 0
      ? toWords.convert(sum[0].total.toFixed(2) * 10000000, { currency: true })
      : "NA"
  })</span>
</td>
</tr>
</tbody>
</table>`;

  return tableHtml;
}

function pr_rating_history(rating_history_table) {
  let rating_history = ""
  if (rating_history_table.length == 0 || rating_history_table.length < 0) {
    rating_history = `
    <table style="border-collapse: collapse; width: 100%; border: 1px solid black; border-spacing: 0;">
  <thead style="color: #111; height: 25px;">
    <tr> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Sr. No.</th> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Name of Instrument / Facilities </th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;" colspan="3" >Current Ratings (Year ${moment().format(
        "YYYY"
      )} - ${moment().add(1, "year").format("YY")})</th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;" colspan="3">Rating History for the past 3 years</th>
    </tr>
    <tr> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;"> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;"> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Type</th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Amount Outstanding (Rs. Crore)
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Rating</th> 
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Date(s) & Rating(s) assigned in ${moment()
        .subtract(2, "year")
        .format("YYYY")} - ${moment().subtract(1, "year").format("YY")}</th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Date(s) & Rating(s) assigned in ${moment()
        .subtract(3, "year")
        .format("YYYY")} - ${moment().subtract(2, "year").format("YY")}</th>
      <th style="border: 1px solid black; text-align: left; padding: 8px;">Date(s) & Rating(s) assigned in ${moment()
        .subtract(4, "year")
        .format("YYYY")} - ${moment().subtract(3, "year").format("YY")}</th>
    </tr>
  </thead>
  <tbody>`;
  } else  {
    rating_history = `
    <table style="border-collapse: collapse; width: 100%; border: 1px solid black; border-spacing: 0;">
    <thead style="color: #111; height: 25px;">
      <tr> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Sr. No.</th> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Name of Instrument / Facilities </th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;" colspan="3" >Current Ratings (Year ${moment().format(
          "YYYY"
        )} - ${moment().add(1, "year").format("YY")})</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;" colspan="3">Rating History for the past 3 years</th>
      </tr>
      <tr> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;"> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;"> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Type</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Amount Outstanding (Rs. Crore)
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Rating</th> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Date(s) & Rating(s) assigned in ${moment()
          .subtract(2, "year")
          .format("YYYY")} - ${moment().subtract(1, "year").format("YY")}</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Date(s) & Rating(s) assigned in ${moment()
          .subtract(3, "year")
          .format("YYYY")} - ${moment().subtract(2, "year").format("YY")}</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Date(s) & Rating(s) assigned in ${moment()
          .subtract(4, "year")
          .format("YYYY")} - ${moment().subtract(3, "year").format("YY")}</th>
      </tr>
    </thead>
    <tbody>`;
    rating_history_table.forEach((item, index) => {
      rating_history += `
        <tr>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            index + 1
          }
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.instrument ? item.instrument : "NA"
          }</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.current_type ? item.current_type : "NA"
          }</td> 
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.amount_outstanding ? item.amount_outstanding : "NA"
          }</td> 
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.rating ? item.rating : "NA"
          }/${item.rating_outlook ? item.rating_outlook : "NA"}</td> 
          <td style="border: 1px solid black; text-align: left; padding: 8px;"><span>${
            item.rating ? item.rating : "NA"
          }/${item.rating_outlook ? item.rating_outlook : "NA"}</span><br><span>(${
        item.rating ? item.date_assigned : "NA"
      })</span></td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;"><span>${
            item.rating ? item.rating : "NA"
          }/${item.rating_outlook ? item.rating_outlook : "NA"}</span><br><span>(${
        item.rating ? item.date_assigned : "NA"
      })</span></td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;"><span>${
            item.rating ? item.rating : "NA"
          }/${item.rating_outlook ? item.rating_outlook : "NA"}</span><br><span>(${
        item.rating ? item.date_assigned : "NA"
      })</span></td>
        </tr>
    `;
    });
    rating_history += `</tbody>
  </table>`
  }
  ;
  return rating_history;
}

async function letter_lists_routes(fastify) {
  fastify.post("/letter_lists", async (request, reply) => {
    try {
      const { limit, offset } = request.body?.params;
      const params = request.body.params;
      let sortBy = "created_at";
      let sortOrder = "DESC";
      let llimit = limit;
      let ooffset = offset;
      var company;
      var financial_year;
      let where_clause = {};
      if (limit === "all") {
        llimit = 10000;
      }

      if (Object.keys(params).includes("company_uuid")) {
        company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true
          }
        })
        where_clause.company_id = company.id
      }

      if (Object.keys(params).includes("reference_date")) {
        financial_year = await FinancialYear.findOne({
          where: {
            reference_date: params["reference_date"],
            is_active: true,
          }
        })
        where_clause.financial_year = financial_year.reference_date
      }

      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const pre_letter_lists = await LetterList.findAndCountAll({
        where: where_clause,
        attributes: { exclude: ["id"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["uuid", "name"],
          },
          {
            model: TemplateList,
            as: "template_list",
            attributes: ["uuid", "template_name", "letter_id", "html_string"],
          },
        ],
        limit: llimit,
        offset: ooffset,
        order: [[String(sortBy), String(sortOrder)]],
      });

      reply.send({
        success: true,
        letter_lists: pre_letter_lists,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/create", async (request, reply) => {
    try {
      const { params } = request.body;

      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
      });

      const template_list = await TemplateList.findOne({
        where: {
          uuid: params["template_list_uuid"],
          is_active: true,
        },
        include: [
          {
            model: TemplateType,
            as: "template_type",
          },
        ],
      });

      const particular_letter_list = await LetterList.findOne({
        where: {
          template_list_id: template_list.id,
          is_active: true,
        },
      });

      const mandates = await Mandate.findAll({
        where: {
          uuid: params["mandate_ids"],
          is_active: true,
        },
        attributes: ["id"],
      });

      const mandates_with_id = mandates.map((m) => m.id);

      const rating_committee_meeting = await RatingCommitteeMeeting.findOne({
        where: {
          uuid: params["rating_committee_meeting_uuid"],
          is_active: true,
        },
      });

      const existed_letter_list = await LetterList.findOne({
        where: {
          company_id: company.id,
          template_list_id: template_list.id,
          is_active: true
        }
      })

      if (existed_letter_list) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: `${template_list.template_name} already exist for this company.`
        })
      }

      const financial_year = await DB_CLIENT.query(`
        SELECT TOP(1) fy.reference_date FROM financial_years fy
        INNER JOIN mandates m ON m.id = (SELECT m1.id FROM mandates m1 WHERE m1.id IN (:mandate_ids))
        INNER JOIN companies c ON c.id = m.company_id
        INNER JOIN rating_committee_meetings rcm ON rcm.id = :rating_committee_meeting_id
        INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id
        INNER JOIN instrument_details id ON id.financial_year_id = fy.id AND id.rating_process_id = :rating_process_id
        ORDER BY fy.reference_date DESC
      `, {
        replacements: {
          mandate_ids: mandates_with_id,
          rating_committee_meeting_id: rating_committee_meeting.id,
          rating_process_id: rating_process.id
        },
        type: QueryTypes.SELECT
      })

      let document_type_name = "";

      if (template_list.template_name == "Provisional communication Letter_BLR" || template_list.template_name == "Provisional communication Letter_Issuer") {
        document_type_name = "provisional_communication"
      } else {
        document_type_name = template_list.template_name.toLocaleLowerCase().split(" ").join("_")
      }

      const document_type_details = await DocumentType.findOne({
        where: {
          name: document_type_name,
          is_active: true
        }
      })

      const rating_letter_data = await DB_CLIENT.query(
        `SELECT TOP(1) rcmr.category_text, c.name as company_name, cd.name as company_contact, cd.email as email, cd.designation, CONCAT(ca.address_1, ca.address_2) as company_address, m.mandate_date 
        FROM companies c
        LEFT JOIN contact_details cd on cd.company_id = c.id
        LEFT JOIN company_addresses ca on ca.company_id = c.id
        LEFT JOIN mandates m on m.company_id = c.id
        INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id AND m.company_id = :company_id
        INNER JOIN instrument_details id On id.transaction_instrument_id = ti.id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id = id.id AND rcmr.rating_committee_meeting_id = :rating_committee_meeting_id
        WHERE c.id = :company_id AND cd.is_primary_contact = 1 AND cd.is_active = 1
      `,
        {
          replacements: {
            company_id: company.id,
            rating_committee_meeting_id: rating_committee_meeting.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      if (!rating_letter_data || rating_letter_data.length == 0) {
        reply.statusCode = 422;
        return reply.send({
          success: "false",
          error: "Either primary contact or meeting not found.",
        });
      }

      const rating_letter_table_data = await DB_CLIENT.query(
        `
        SELECT m.mandate_id AS mandate, CONCAT(rcmr.category_text, '-',rcmr.sub_category_text,'-',rcmr.instrument_text) AS instrument, 
        rcmr.instrument_size_number AS instrument_size, rcmr.rating_action, rcmr.long_term_rating_assgined_text AS rating, rcmr.is_long_term, rcmr.is_short_term,
        u.full_name, u.email, ua.designation
        FROM mandates m 
        INNER JOIN transaction_instruments ti ON ti.mandate_id =m.id AND m.company_id = :company_id
        INNER JOIN users u ON u.id = m.ra_id 
        INNER JOIN user_attributes ua ON ua.user_id = u.id
        INNER JOIN instrument_details id ON id.transaction_instrument_id =ti.id AND id.rating_process_id = :rating_process_id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id =id.id AND rcmr.rating_committee_meeting_id = :rating_committee_meeting_id 
        WHERE m.id IN (:mandate_ids)
      `,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
            rating_committee_meeting_id: rating_committee_meeting.id,
            mandate_ids: mandates_with_id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const sum_in_rl_table_data = await DB_CLIENT.query(
        `
        SELECT SUM(rcmr.instrument_size_number) AS total 
        FROM mandates m
        INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id AND m.company_id = :company_id
        INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id AND id.rating_process_id = :rating_process_id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id =id.id AND rcmr.rating_committee_meeting_id = :rating_committee_meeting_id 
        where m.id in (:mandate_ids)
      `,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
            rating_committee_meeting_id: rating_committee_meeting.id,
            mandate_ids: mandates_with_id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const e_sign_data = await DB_CLIENT.query(
        `select DISTINCT u.full_name, u.email, r.name as designation from companies c
        inner join mandates m on m.company_id = c.id
        inner join users u on u.id = m.ra_id
        inner join user_has_roles uhr on uhr.user_id = u.id
        inner join roles r on r.id = uhr.role_id 
        inner join user_attributes ua on ua.user_id = u.id
        where c.id = :company_id
      `,
        {
          replacements: {
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const group_head = await DB_CLIENT.query(
        `
        select DISTINCT u.full_name, u.email, r.name as designation from companies c
        inner join mandates m on m.company_id = c.id
        inner join users u on u.id = m.gh_id
        inner join user_has_roles uhr on uhr.user_id = u.id
        inner join roles r on r.id = uhr.role_id 
        inner join user_attributes ua on ua.user_id = u.id
        where c.id = :company_id
      `,
        {
          replacements: {
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const press_release_ratings = await DB_CLIENT.query(
        `
        SELECT CONCAT(rcmr.category_text, '-', rcmr.sub_category_text, '-', rcmr.instrument_text) AS instrument, rcmr.instrument_size_number, rcmr.is_long_term, rcmr.is_short_term, rcmr.long_term_rating_assgined_text AS rating, rcmr.rating_action, ti.complexity_level,
        rcmr.rating_committee_meeting_id
        FROM rating_committee_meeting_registers rcmr 
        INNER JOIN instrument_details id ON id.id = rcmr.instrument_detail_id
        INNER JOIN transaction_instruments ti ON ti.id = rcmr.transaction_instrument_id
        WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND rcmr.company_id = :company_id
      `,
        {
          replacements: {
            rating_committee_meeting_id: rating_committee_meeting.id,
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const sum_in_pr = await DB_CLIENT.query(
        `
        SELECT SUM(rcmr.instrument_size_number) AS total FROM rating_committee_meeting_registers rcmr WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND rcmr.company_id = :company_id
      `,
        {
          replacements: {
            rating_committee_meeting_id: rating_committee_meeting.id,
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const rating_history = await DB_CLIENT.query(
        `
      SELECT rcmr.instrument_text AS instrument, rcmr.instrument_size_number AS amount_outstanding, rcmr.sub_category_text AS current_type,
        rcmr.long_term_outlook_recommendation AS rating_outlook, rcmr.long_term_rating_recommendation AS rating, fy.reference_date, FORMAT(id.press_release_date, 'MMM dd, yyyy') AS date_assigned, u.full_name AS rating_analyst, u.email
        FROM rating_committee_meeting_registers rcmr
        LEFT JOIN instrument_details id ON id.id = rcmr.instrument_detail_id AND id.rating_process_id != 2
        LEFT JOIN financial_years fy ON fy.id = id.financial_year_id
        INNER JOIN mandates m ON m.id = rcmr.mandate_id
        INNER JOIN users u ON u.id = m.ra_id
        WHERE rcmr.rating_committee_meeting_id = :rating_committee_meeting_id AND rcmr.company_id = :company_id
      `,
        {
          replacements: {
            rating_committee_meeting_id: rating_committee_meeting.id,
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const pr_contact_details = await DB_CLIENT.query(
        `
        select DISTINCT u.full_name as rating_analyst, u.email as rating_analyst_email, u1.full_name as group_head,
        u1.email as group_head_email, c.name as company_name from companies c
        inner join mandates m on m.company_id = c.id
        inner join users u on u.id = m.ra_id
        inner join users u1 on u1.id = m.gh_id
        inner join user_attributes ua on ua.user_id = u.id
        where c.id = :company_id
      `,
        {
          replacements: {
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const pr_annexure_1 = await DB_CLIENT.query(
        `
        SELECT DISTINCT rcmr.category_text, rcmr.instrument_size_number, 
        CONCAT(rcmr.long_term_rating_recommendation, '/', rcmr.long_term_outlook) AS rating_assigned, FORMAT(ti.issuance_date, 'dd/MM/yyyy') AS issuance_date,
        bl.coupon_rate, FORMAT(bl.maturity_date, 'MMMM, yyyy') AS maturity_date
        FROM rating_committee_meeting_registers rcmr
        INNER JOIN companies c ON c.id = rcmr.company_id
        INNER JOIN mandates m ON m.id = rcmr.mandate_id
        INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id
        INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id
        INNER JOIN banker_lenders bl ON bl.instrument_detail_id = id.id 
        WHERE c.id = :company_id
      `,
        {
          replacements: {
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const rl_annexure_data = await DB_CLIENT.query(
        `
      SELECT m.mandate_id AS mandate, CONCAT(rcmr.category_text, '-',rcmr.sub_category_text,'-',rcmr.instrument_text) AS instrument, CONCAT(rcmr.sub_category_text, '-', rcmr.instrument_text) AS instrument_display,
        rcmr.instrument_size_number AS instrument_size, rcmr.rating_action, rcmr.long_term_rating_assgined_text AS rating, rcmr.is_long_term, rcmr.is_short_term,
        bl.rated_amount, bl.remark AS remarks, FORMAT(bl.maturity_date, 'MMMM yyyy') AS maturity_date, c.name AS lender_name, bl.isin, bl.coupon_rate, ti.issuance_date
        FROM mandates m 
        INNER JOIN transaction_instruments ti ON ti.mandate_id =m.id AND m.company_id = :company_id
        INNER JOIN users u ON u.id = m.ra_id 
        INNER JOIN user_attributes ua ON ua.user_id = u.id
        INNER JOIN instrument_details id ON id.transaction_instrument_id =ti.id AND id.rating_process_id = :rating_process_id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id =id.id AND rcmr.rating_committee_meeting_id = :rating_committee_meeting_id 
        LEFT JOIN banker_lenders bl ON bl.instrument_detail_id = id.id
        LEFT JOIN companies c ON c.id = bl.bank_id
        WHERE m.id IN (:mandate_ids)
    `,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
            rating_committee_meeting_id: rating_committee_meeting.id,
            mandate_ids: mandates_with_id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const sum_rl_annexure = await DB_CLIENT.query(
        `
        SELECT SUM(bl.rated_amount) AS total 
        FROM mandates m 
        INNER JOIN transaction_instruments ti ON ti.mandate_id =m.id AND m.company_id = :company_id
        INNER JOIN users u ON u.id = m.ra_id 
        INNER JOIN user_attributes ua ON ua.user_id = u.id
        INNER JOIN instrument_details id ON id.transaction_instrument_id =ti.id AND id.rating_process_id = :rating_process_id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id =id.id AND rcmr.rating_committee_meeting_id = :rating_committee_meeting_id 
        LEFT JOIN banker_lenders bl ON bl.instrument_detail_id = id.id
        LEFT JOIN companies c ON c.id = bl.bank_id
        WHERE m.id IN (:mandate_ids)
      `,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
            rating_committee_meeting_id: rating_committee_meeting.id,
            mandate_ids: mandates_with_id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const rl_annexure_var = generate_rl_annexure(
        rl_annexure_data,
        sum_rl_annexure
      );

      const pr_contacts = pr_contact_details[0];

      const tableHtml = generate_rl_table_data(
        rating_letter_table_data,
        sum_in_rl_table_data
      );

      const pr_table = pr_table_data(press_release_ratings, sum_in_pr);

      const pr_rating_history_table = pr_rating_history(rating_history);

      const pr_annexure_1_table = generate_pr_annexure_table(pr_annexure_1);

      const pr_annexure_2_table = generate_pr_annexure_table_2();

      const pr_annexure_3_table = generate_pr_annexure_table_3();

      const rl_content = rating_letter_data[0];

      const e_sign = e_sign_data[0];

      const group_head_data = group_head[0];

      const rl_data_constants = [
        {
          value: rl_content.company_name ? rl_content.company_name : "-",
          regEx: "#COMPANYNAME#",
        },
        {
          value: rl_content.designation ? rl_content.designation : "-",
          regEx: "#COMPANYCONTACTDESIGNATION#",
        },
        {
          value: rl_content.company_contact ? rl_content.company_contact : "-",
          regEx: "#COMPANYCONTACT#",
        },
        {
          value: rl_content.email ? rl_content.email : "-",
          regEx: "#COMPANYCONTACTEMAIL#",
        },
        {
          value: rl_content.company_address ? rl_content.company_address : "-",
          regEx: "#COMPANYADDRESS#",
        },
        {
          value: params["letter_date"]
            ? moment(params["letter_date"]).format("Do MMMM YYYY")
            : "-",
          regEx: "#DATE#",
        },
        {
          value: rl_content.mandate_date
            ? moment(rl_content.mandate_date).format("Do MMMM YYYY")
            : "-",
          regEx: "#MANDATEDATE#",
        },
        {
          value: rating_process["name"] ? rating_process["name"] : "-",
          regEx: "#TYPE#",
        },
        {
          value: tableHtml ? tableHtml : "-",
          regEx: "#TABLE#",
        },
        {
          value: params["e_sign"] == true ? e_sign.full_name : "-",
          regEx: "#E_SIGN#",
        },
        {
          value: e_sign.full_name ? e_sign.full_name : "-",
          regEx: "#NAME#",
        },
        {
          value: e_sign.designation ? e_sign.designation : "-",
          regEx: "#DESIGNATION#",
        },
        {
          value: e_sign.email ? e_sign.email : "-",
          regEx: "#EMAIL#",
        },
        {
          value: pr_table ? pr_table : "-",
          regEx: "#PR_TABLE#",
        },
        {
          value: pr_rating_history_table ? pr_rating_history_table : "-",
          regEx: "#PR_RATING_HISTORY#",
        },
        {
          value: pr_contacts.rating_analyst ? pr_contacts.rating_analyst : "-",
          regEx: "#PR_RA#",
        },
        {
          value: pr_contacts.rating_analyst_email
            ? pr_contacts.rating_analyst_email
            : "-",
          regEx: "#PR_RA_EMAIL#",
        },
        {
          value: pr_contacts.group_head ? pr_contacts.group_head : "-",
          regEx: "#PR_GH#",
        },
        {
          value: pr_contacts.group_head_email
            ? pr_contacts.group_head_email
            : "-",
          regEx: "#PR_GH_EMAIL#",
        },
        {
          value: pr_annexure_1_table ? pr_annexure_1_table : "-",
          regEx: "#PR_ANNEXURE_1#",
        },
        {
          value: pr_annexure_2_table ? pr_annexure_2_table : "-",
          regEx: "#PR_ANNEXURE_2#",
        },
        {
          value: pr_annexure_3_table ? pr_annexure_3_table : "-",
          regEx: "#PR_ANNEXURE_4#",
        },
        {
          value: group_head_data.full_name ? group_head_data.full_name : "-",
          regEx: "#GH_NAME#",
        },
        {
          value: group_head_data.email ? group_head_data.email : "-",
          regEx: "#GH_EMAIL#",
        },
        {
          value: group_head_data.designation
            ? group_head_data.designation
            : "-",
          regEx: "#GH_DESIGNATION#",
        },
        {
          value: rl_annexure_var ? rl_annexure_var : "-",
          regEx: "#RL_ANNEXURE#",
        },
        {
          value: rl_content.category_text ? rl_content.category_text : "-",
          regEx: "#INSTRUMENTCATEGORY#",
        },
      ];

      const parsedString = processTemplateSyntax(
        template_list.html_string ? template_list.html_string : "",
        rl_data_constants
      );

      const letterNumberStr = generateLetterNumber(
        template_list.template_type.name,
        particular_letter_list.letter_number
      );

      const letter_list = await LetterList.create({
        uuid: uuidv4(),
        remarks: params["remarks"],
        letter_number: letterNumberStr,
        parsed_html_string: parsedString,
        financial_year: financial_year.reference_date,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        letter_date: params["letter_date"],
      });

      await letter_list.setCompany(company);
      await letter_list.setRating_process(rating_process);
      await letter_list.setTemplate_list(template_list);
      await letter_list.setRating_committee_meeting(rating_committee_meeting);
      await letter_list.setDocument_type(document_type_details)

      mandates_with_id.forEach(async (m) => {
        await DB_CLIENT.query(
          `
        INSERT into letter_lists_has_mandates (letter_id, mandate_id) VALUES(:letter_id , :mandates);
      `,
          {
            replacements: {
              letter_id: letter_list.id,
              mandates: m,
            },
            type: QueryTypes.INSERT,
          }
        );
      });

      reply.send({
        success: true,
        letter_list: letter_list,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/view", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const letter_list = await LetterList.findOne({
        where: {
          uuid: params["uuid"],
        },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["uuid", "name"],
          },
          {
            model: RatingCommitteeMeeting,
            as: "rating_committee_meeting",
            attributes: [
              "uuid",
              [
                Sequelize.fn(
                  "FORMAT",
                  Sequelize.col("meeting_at"),
                  "%yyyy-%d-%M %H:%m:%s"
                ),
                "committee_date",
              ],
            ],
          },
          {
            model: RatingProcess,
            as: "rating_process",
            attributes: ["uuid", "name"],
          },
          {
            model: TemplateList,
            as: "template_list",
            attributes: ["uuid", "template_name"],
            include: [
              {
                model: TemplateType,
                as: "template_type",
                attributes: ["uuid", "name"],
              },
            ],
          },
        ],
      });

      reply.send({
        success: true,
        letter_list: letter_list,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/selected_mandates", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const letter_list = await LetterList.findOne({
        where: {
          uuid: params["letter_list_uuid"],
        },
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
        },
      });

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
        },
      });

      const selected_mandates = await DB_CLIENT.query(
        `
        SELECT m.id, m.mandate_id AS mandate, m.uuid, rcmr.instrument_size_number AS instrument_size, CONCAT(rcmr.category_text, '-', rcmr.instrument_text, '-', rcmr.instrument_text) AS instrument 
        FROM mandates m 
        INNER JOIN transaction_instruments ti ON ti.mandate_id =m.id AND m.company_id =:company_id 
        INNER JOIN instrument_details id ON id.transaction_instrument_id =ti.id
        INNER JOIN letter_lists_has_mandates llhm ON llhm.mandate_id = m.id
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id =id.id AND id.rating_process_id =:rating_process_id 
        WHERE llhm.letter_id = :letter_id
      `,
        {
          replacements: {
            letter_id: letter_list.id,
            rating_process_id: rating_process.id,
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      reply.send({
        success: true,
        selected_mandates: selected_mandates,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/edit", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const letter_list_updated = await LetterList.update(
        APPEND_USER_DATA(request, {
          remarks: params["remarks"],
          is_active: params["is_active"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      reply.send({
        success: true,
        letter_list_updated: letter_list_updated,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/generate/pdf", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const letter_list = await LetterList.findOne({
        where: {
          uuid: params["letter_list_uuid"],
        },
        include: [
          {
            model: TemplateList,
            as: "template_list",
            attributes: ["uuid", "template_name", "html_string"],
          },
          {
            model: RatingCommitteeMeeting,
            as: "rating_committee_meeting",
            attributes: ["id"],
          },
        ],
      });

      let document_name = ""

      if (letter_list.template_list.template_name == "Provisional communication Letter_BLR" || letter_list.template_list.template_name == "Provisional communication Letter_Issuer") {
        document_name = "provisional_communication"
      } else  {
        document_name = letter_list.template_list.template_name.toLocaleLowerCase().split(" ").join("_")
      }

      const document_type_details = await DocumentType.findOne({
        where: {
          name: document_name,
          is_active: true
        }
      })

      let fetched_document_type_id = 0;

      if (document_name === document_type_details.name) {
        fetched_document_type_id = document_type_details.id
      }

      const GENERATE_UUID = uuidv4();

      const path = `generated/letter_list_${GENERATE_UUID}.pdf`;

      const footer = () => {
        return `<p style="border-top: 1px solid black;font-weight: 600;font-size: 9px;color: #000000;text-align:justify;text-align-last:center; padding:10px 30px;">Corporate Office: Office No. 1105, B Wing, Kanakia Wallstreet,Off. Andheri Kurla Road, Andheri (East), Mumbai-400093, India. Phone : +91-22-43471920 , 40036966 , Email : mumbai@infomerics.com, Website : www.infomerics.com <br />Registered & Head Office : Flat No. 104/108 1st Floor Golf Apartment Sujan Singh Park, New Delhi-110003, India Phone : +91-11-26401142 , 24611910 , 24649428, Fax: +91-11-24627549 , Email : vma@infomerics.com CIN : U32202DL1986PTC024575</p>
        </p>`;
      };

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--headless"],
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 595,
        height: 842,
      });
      await page.setContent(letter_list.parsed_html_string, {
        waitUntil: "networkidle0",
      });
      await page.emulateMediaType("screen");
      await page.addStyleTag({
        content: ".date-time,.pageNumber,.title{ display: none !important; },",
      });
      await page.pdf({
        path: path,
        margin: { top: "90px", bottom: "100px", left: "30px", right: "30px" },
        printBackground: true,
        format: "A4",
      });
      // await browser.close();

      const pdf = readFileSync(path);

      const document_url = await UPLOAD_TO_AZURE_STORAGE(pdf, {
        path: path,
      });

      await RatingCommitteeMeetingDocument.create({
        uuid: uuidv4(),
        path: document_url,
        is_active: true,
        rating_committee_meeting_id: letter_list.rating_committee_meeting.id,
        doc_type: "pdf",
        document_type_id: document_type_details?.id ? document_type_details.id : NULL,
        company_id: letter_list.company_id,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      var response = {};
      response["uuid"] = uuidv4();
      response["document_url"] = document_url;

      reply.send(response);
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/generate/word", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const letter_list = await LetterList.findOne({
        where: {
          uuid: params["letter_list_uuid"],
        },
        include: [
          {
            model: TemplateList,
            as: "template_list",
            attributes: ["uuid", "template_name", "html_string"],
          },
          {
            model: RatingCommitteeMeeting,
            as: "rating_committee_meeting",
            attributes: ["id"],
          },
        ],
      });

      let document_name = ""

      if (letter_list.template_list.template_name == "Provisional communication Letter_BLR" || letter_list.template_list.template_name == "Provisional communication Letter_Issuer") {
        document_name = "provisional_communication"
      } else  {
        document_name = letter_list.template_list.template_name.toLocaleLowerCase().split(" ").join("_")
      }

      const document_type_details = await DocumentType.findOne({
        where: {
          name: document_name,
          is_active: true
        }
      })

      let fetched_document_type_id = 0;

      if (document_name == document_type_details.name) {
        fetched_document_type_id = document_type_details.id
      }

      const GENERATE_UUID = uuidv4();

      const path = `generated/letter_list_${GENERATE_UUID}.docx`;

      console.log("letter_list===========================>", letter_list);

      let doc_buffer = htmlDocx.asBlob(letter_list.parsed_html_string);

      // console.log("converted_html===================================>", converted_html);

      const html_buffer = await doc_buffer.arrayBuffer();

      const doc_url_promise = await new Promise((resolve, reject) => {
        async function createDoc(html_buffer, parsed_html_string) {
          writeFile(path, parsed_html_string, (err) => {
            if (err) {
              reject(err);
              return;
            }
          });

          const document_link = await UPLOAD_TO_AZURE_STORAGE(html_buffer, {
            path: path,
          });

          if (!document_link) {
            reject({
              success: false,
              error: "Document Link Not Available",
            });
          }

          resolve(document_link);
        }
        createDoc(html_buffer, letter_list.parsed_html_string);
      });

      const document_url = await doc_url_promise;

      await RatingCommitteeMeetingDocument.create({
        uuid: uuidv4(),
        path: document_url,
        is_active: true,
        rating_committee_meeting_id: letter_list.rating_committee_meeting.id,
        doc_type: "docx",
        document_type_id: fetched_document_type_id,
        company_id: letter_list.company_id,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      var response = {};
      response["uuid"] = uuidv4();
      response["document_url"] = document_url;
      reply.send(response);
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/letter_lists/committee_dates", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
      });

      // workflow should not be completed when fetching committee dates

      const committee_dates = await DB_CLIENT.query(
        `
        SELECT TOP(1) FORMAT(rcm.meeting_at,'yyyy-MM-dd hh:mm:s tt') AS committee_date, id.id, rcm.uuid AS rating_committee_meeting_uuid
        FROM companies c
        INNER JOIN mandates m ON m.company_id = c.id AND c.id = :company_id
        INNER JOIN transaction_instruments ti ON m.id = ti.mandate_id 
        INNER JOIN instrument_details id ON id.transaction_instrument_id =ti.id AND id.is_workflow_done = 0
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id = id.id
        INNER JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id AND rcm.is_active = 1
      `,
        {
          replacements: {
            company_id: company.id,
            rating_process_id: rating_process.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      reply.send({
        success: true,
        committee_dates: committee_dates,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post(
    "/letter_lists/companies_with_committee_meetings",
    async (request, reply) => {
      try {
        const { params } = request.body;
        //   await CHECK_PERMISSIONS(request, 'Instruments');

        const companies_committee_meetings = await DB_CLIENT.query(
          `
          select DISTINCT c.uuid as company_uuid, c.name as company_name from rating_committee_meeting_registers rcmr
          inner join companies c on c.id = rcmr.company_id
          where rcmr.company_id is not null and rcmr.rating_committee_meeting_id is not null
      `,
          {
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          companies_committee_meetings: companies_committee_meetings,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    }
  );

  fastify.post(
    "/letter_lists/mandates_having_committee_meeting",
    async (request, reply) => {
      try {
        const { params } = request.body;
        //   await CHECK_PERMISSIONS(request, 'Instruments');\

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
          },
        });

        const rating_process = await RatingProcess.findOne({
          where: {
            uuid: params["rating_process_uuid"],
            is_active: true,
          },
        });

        const mandates_with_committee_meeting = await DB_CLIENT.query(
          `
        SELECT m.mandate_id AS mandate, m.uuid AS mandate_uuid, CONCAT(rcmr.category_text, '-',rcmr.sub_category_text,'-',rcmr.instrument_text) AS instrument, 
        rcmr.instrument_size_number AS instrument_size
        FROM mandates m 
        INNER JOIN transaction_instruments ti ON ti.mandate_id =m.id AND m.company_id =:company_id 
        INNER JOIN instrument_details id ON id.transaction_instrument_id =ti.id AND id.rating_process_id =:rating_process_id 
        INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id =id.id
      `,
          {
            replacements: {
              company_id: company.id,
              rating_process_id: rating_process.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          mandates_with_committee_meeting: mandates_with_committee_meeting,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    }
  );
}
module.exports = {
  letter_lists_routes,
};
