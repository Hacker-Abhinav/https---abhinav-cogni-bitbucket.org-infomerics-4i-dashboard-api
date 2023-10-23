const { Sequelize, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../db");
const { FinancialYear } = require("../models/modules/rating-model");
const Op = Sequelize.Op;

const find_cur_financial_year_obj = () => {
  return FinancialYear.findOne({
    where: {
      start_date: {
        [Op.lte]: new Date(),
      },
      end_date: {
        [Op.gte]: new Date(),
      },
    },
    raw: true,
  });
};

const fetchData = async (is_csv = false) => {
  const financial_year = await find_cur_financial_year_obj();

  try {
    const forms = await DB_CLIENT.query(
      `select u.full_name,u.employee_code,ua.designation,ft.name as form_name,
       ft.form_number ,COALESCE(fm.status,'To be filled') as form_status
from user_attributes ua join users u on ua.user_id =u.id 
join form_types ft on ft.uuid!=u.uuid and ft.form_number not in (4,6,3,5,8,10)
left join form_metadata fm on fm.form_type_id =ft.id
and fm.created_by =u.id and fm.is_active =1 and fm.financial_year =15
where fm.status is null or fm.status='Saved as draft'`,
      {
        type: QueryTypes.SELECT,
      }
      // {
      //   replacements: {
      //     financial_year_id: financial_year.id,
      //   },
      // }
    );
    if (is_csv) return forms;

    let table_data = [];

    forms.map((val) => {
      let myObjIdx = table_data.findIndex(
        (val2) => val2.employee_code == val.employee_code
      );
      if (myObjIdx > -1) {
        table_data[myObjIdx].form_data.push({
          form_name: val.form_name,
          form_status: val.form_status,
        });
      } else {
        val.form_data = [
          {
            form_name: val.form_name,
            form_status: val.form_status,
          },
        ];
        delete val.form_name;
        delete val.form_status;
        table_data.push(val);
      }
    });

    return table_data;
  } catch (error) {
    console.log(error);
  }
};
module.exports = { fetchData };
