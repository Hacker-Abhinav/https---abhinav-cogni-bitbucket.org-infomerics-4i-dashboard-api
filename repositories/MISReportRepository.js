const { QueryTypes } = require("sequelize");
const { MIS_DB_CLIENT } = require("../mis-db");
const { MISReportConfig } = require("../models/mis");

// GET_MIS_REPORTS
async function GET_MIS_REPORTS() {
  return new Promise(async (resolve, reject) => {
    const results = await MISReportConfig.findAll({
      where: {
        "is_active": true
      },
      attributes: {
        exclude: ['config_data', 'created_at', 'updated_at'],
      },
    });
    resolve(results);
  });
}

// GET_MIS_REPORT
async function GET_MIS_REPORT(query) {
  return new Promise(async (resolve, reject) => {
    const result = await MISReportConfig.findOne({
      where: query,
    });
    
    if (result) {
      result['config_data'] = JSON.parse(result['config_data']);
      resolve(result);
    }

    else {
      reject({
        success: false,
        error: "MIS_REPORT_NOT_FOUND",
      });
    }
  });
}

// GET_MIS_REPORT_DATA
async function GET_MIS_REPORT_DATA(report) {
  return new Promise(async (resolve, reject) => {
    if (!report) {
      resolve([]);
    }

    const table_name = `mis_report_view_${report['type']}`;
    const columns = report['config_data']['db_columns'];
    const attrs = Array(columns).join(",");
    const rows = MIS_DB_CLIENT.query(`SELECT ${attrs} FROM ${table_name} WHERE is_active=1;`, {
      replacements: {},
      type: QueryTypes.SELECT,
    });
    resolve(rows);
  });
}

module.exports = {
  GET_MIS_REPORTS,
  GET_MIS_REPORT,
  GET_MIS_REPORT_DATA,
}