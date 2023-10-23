var axios = require("axios").default;
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const {
  CrmDataDump,
  Company,
  Country,
  Industry,
  Sector,
  Mandate,
} = require("../models/modules/onboarding");
const { DB_CLIENT } = require("../db");
const { QueryTypes, Op } = require("sequelize");
const { UPLOAD_TO_AZURE_STORAGE } = require("../helpers");
const path = require("path");

const cms_config = {
  get_customer_api_url: "https://infomerics.com/uatcrm/all_data_date_wise.php",
  get_customer_api_key: "APIKEY0023$$",
  get_crm_api_url: "https://infomerics.com/crm/all_data.php",
  get_crm_api_key: "APIKEY0023LIVE$$",
};

// For Customers
async function GET_CMS_DATA() {
  return new Promise((resolve, reject) => {
    const current_time = new Date();
    console.log(`Running CMS Data Integration at ${current_time}`);

    const pre_date = "2023-01-16";
    const post_date = "2023-07-17";

    var options = {
      method: "POST",
      url: cms_config["get_customer_api_url"],
      params: {
        apikey: cms_config["get_customer_api_key"],
        predate: pre_date,
        postdate: post_date,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        const customers = response.data.body;
        resolve(customers);
      })
      .catch(function (error) {
        console.error(error);
        reject(error);
      });
  });
}

// For Mandates
async function GET_CMS_MANDATE_DATA() {
  return new Promise((resolve, reject) => {
    var options = {
      method: "POST",
      url: cms_config["get_crm_api_url"],
      params: {
        apikey: cms_config["get_crm_api_key"],
      },
    };

    axios
      .request(options)
      .then(function (response) {
        const mandates = response.data.body;
        // console.log("*********** ", mandates)
        resolve(mandates);
      })
      .catch(function (error) {
        console.error(error);
        reject(error);
      });
  });
}

const get_sector_id = async (sector) => {
  const sector_res = await Sector.findOne({
    where: {
      name: {
        [Op.like]: `%${sector}%`,
      },
    },
  });

  return sector_res ? sector_res.id : null;
};

const get_industry_id = async (industry) => {
  const industry_res = await Industry.findOne({
    where: {
      name: {
        [Op.like]: `%${industry}%`,
      },
    },
  });
  return industry_res ? industry_res.id : null;
};

const get_country_id = async (country) => {
  const country_res = await Country.findOne({
    where: {
      name: {
        [Op.like]: `%${country}%`,
      },
    },
  });

  return country_res ? country_res.id : null;
};

const get_state_id = async (state) => {
  const state_res = await DB_CLIENT.query(
    `SELECT id FROM states WHERE name like :name`,
    {
      replacements: {
        name: `%${state}%`,
      },
      type: QueryTypes.SELECT,
    }
  );

  return state_res.length > 0 ? state_res[0].id : null;
};

const get_city_id = async (city) => {
  const city_res = await DB_CLIENT.query(
    `SELECT id FROM cities WHERE name like :name`,
    {
      replacements: {
        name: `${city}%`,
      },
      type: QueryTypes.SELECT,
    }
  );

  return city_res.length > 0 ? city_res[0].id : null;
};

function convertToEmailFormat(name) {
  const parts = name.split(" ");
  const lastName = parts[parts.length - 1].toLowerCase();
  const firstName = parts
    .slice(0, parts.length - 1)
    .join("")
    .toLowerCase();
  return `${lastName}.${firstName}@infomerics.com`;
}

const get_bd_id = async (bd) => {
  let result = {};
  const bd_res = await DB_CLIENT.query(
    `SELECT id FROM users WHERE full_name like :name`,
    {
      replacements: {
        name: `%${bd}%`,
      },
      type: QueryTypes.SELECT,
    }
  );

  result = bd_res.length > 0 ? bd_res[0].id : null;

  if (!result) {
    result = await DB_CLIENT.query(
      `INSERT INTO users  (uuid,full_name, email)
       OUTPUT INSERTED.id
       VALUES (:uuid,:name,:email)`,
      {
        replacements: {
          uuid: uuidv4(),
          name: bd,
          email: convertToEmailFormat(bd),
        },
        type: QueryTypes.SELECT,
      }
    );
    result = result[0].id;
  }

  console.log("return result:", result);

  return result;
};

const get_gh_id = async (gh) => {
  let result = {};
  const gh_res = await DB_CLIENT.query(
    `SELECT id FROM users WHERE full_name like :name`,
    {
      replacements: {
        name: `%${gh}%`,
      },
      type: QueryTypes.SELECT,
    }
  );

  result = gh_res.length > 0 ? gh_res[0].id : null;

  if (!result) {
    result = await DB_CLIENT.query(
      `INSERT INTO users  (uuid,full_name,email)
       OUTPUT INSERTED.id
       VALUES (:uuid,:name,:email)`,
      {
        replacements: {
          uuid: uuidv4(),
          name: gh,
          email: convertToEmailFormat(gh),
        },
        type: QueryTypes.SELECT,
      }
    );
    result = result[0].id;
  }
  console.log("result:: ", result);
  return result;
};

// For Mandates per day
async function GET_CMS_MANDATE_DATA_PER_DAY() {
  return new Promise((resolve, reject) => {
    let current_time = moment(new Date()).format("YYYY-MM-DD");
    let previous_time = moment(
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    ).format("YYYY-MM-DD");

    var options = {
      method: "POST",
      url: cms_config["get_crm_api_url"],
      params: {
        apikey: cms_config["get_crm_api_key"],
        predate: previous_time,
        postdate: current_time,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        const mandates = response.data.body;
        resolve(mandates);
      })
      .catch(function (error) {
        console.error(error);
        reject(error);
      });
  });
}

// Function to download a PDF from a given URL
async function downloadPDFFromURL(url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Set the response type to arraybuffer to handle binary data
    });

    console.log("response: ", response.data);

    const fileName = path.basename(url); // Extract the file name from the URL

    const new_blob = response
      ? await UPLOAD_TO_AZURE_STORAGE(response.data, { path: fileName })
      : null;
    console.log("new_blob: ", new_blob);
    return new_blob ? new_blob : null;
  } catch (error) {
    console.error("Error while downloading the PDF:", error.message);
    throw error;
  }
}

async function INSERT_CRM_DATA(el) {
  console.log("el: ", el);
  try {
    const company = await Company.create({
      uuid: uuidv4(),
      name: el["leadname"],
      is_listed: el["companylist"] ? 1 : 0,
      pan: el["pano"],
      tan: el["companytanno"],
      gst: el["gstino"],
      industry_id:
        el.industry != null ? await get_industry_id(el.industry) : null,
      sector_id:
        el["companysector"] != null
          ? await get_sector_id(el.companysector)
          : null,
      is_active: true,
      is_crm: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const mandate = await Mandate.create({
      uuid: uuidv4(),
      total_size: el.leadiamount,
      initial_fee_charged: el.leadfees,
      mandate_id: el.leadmandatef,
      is_active: true,
      bd_id: el.fullname != null ? await get_bd_id(el.fullname) : null,
      gh_id:
        el.ratingapprovedby != null
          ? await get_gh_id(el.ratingapprovedby)
          : null,
    });

    await Promise.all([
      // DB_CLIENT.query(
      //   `INSERT INTO mandate_documents (uuid,mandate_part_1_document,mandate_part_2_document,mandate_id)
      //    VALUES (:uuid,:mandate_part_1_document,:mandate_part_2_document,:mandate_id)`,
      //   {
      //     type: QueryTypes.INSERT,
      //     replacements: {
      //       uuid: uuidv4(),
      //       mandate_part_1_document: await downloadPDFFromURL(
      //         process.env.MANDATE_DOC_BASE_URL + el.mandateupload
      //       ),
      //       mandate_part_2_document: await downloadPDFFromURL(
      //         process.env.MANDATE_DOC_BASE_URL + el.scannedupload
      //       ),
      //       mandate_id: mandate.id,
      //     },
      //   }
      // ),

      DB_CLIENT.query(
        `INSERT INTO company_addresses (uuid,address_1,country_id,state_id,city_id,pincode,company_id,is_active) 
         VALUES (:uuid,:address,:country_id,:state_id,:city_id,:pincode,:company_id,1)`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            uuid: uuidv4(),
            company_id: company.id,
            address: el.address,
            country_id:
              el.shipcountry != null
                ? await get_country_id(el.shipcountry)
                : null,
            state_id:
              el.shipstate != null ? await get_state_id(el.shipstate) : null,
            city_id:
              el.shipcity != null ? await get_city_id(el.shipcity) : null,
            pincode: el.pincode,
            is_active: true,
          },
        }
      ),
      DB_CLIENT.query(
        `INSERT INTO contact_details (uuid,name,email,mobile,designation,is_primary_contact,company_id,is_active) 
         VALUES (:uuid,:conpersonnamee,:conemailid,:conmobile,:condesignation,1,:company_id,1)`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            uuid: uuidv4(),
            company_id: company.id,
            conpersonnamee: el?.conpersonnamee,
            conemailid: el?.conemailid,
            conmobile: el?.conmobile,
            condesignation: el?.condesignation,
            is_active: true,
          },
        }
      ),
      DB_CLIENT.query(
        `INSERT INTO contact_details (uuid,name,email,mobile,designation,is_primary_contact,company_id) 
         VALUES (:uuid,:conpersonnamee,:conemailid,:conmobile,:condesignation,0,:company_id)`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            uuid: uuidv4(),
            company_id: company.id,
            conpersonnamee: el.secondryconpersonnamee,
            conemailid: el.secondryconemailid,
            conmobile: el.secondryconmobile,
            condesignation: el.secondrycondesignation,
            is_active: true,
          },
        }
      ),
    ]);
  } catch (err) {
    console.log("err: ", err);
  }
}

// Create intermediate crm
async function CREATE_CRM_BUFFER(mandates) {
  console.log("CREATE_CRM_BUFFER CALLED");

  let bulk_data = [];
  mandates.map((el) => {
    el.uuid = uuidv4();
    el.created_at = new Date();
    el.updated_at = new Date();
    el.action_date = new Date();

    bulk_data.push(el);
  });

  try {
    await CrmDataDump.bulkCreate(bulk_data);
  } catch (error) {
    console.log("error: ", error);
  }

  try {
    const new_crm_data = await DB_CLIENT.query("SELECT * FROM crm_data_dump", {
      type: QueryTypes.SELECT,
    });

    for (const el of new_crm_data) {
      const check_company = await DB_CLIENT.query(
        "SELECT id FROM companies WHERE name=:name",
        {
          type: QueryTypes.SELECT,
          replacements: {
            name: el.leadname,
          },
        }
      );

      if (check_company.length === 0) {
        await INSERT_CRM_DATA(el);
      }
    }
  } catch (err) {
    console.log("err: ", err);
  }
}

// Update intermediate crm data dump
async function UPDATE_CRM_BUFFER(mandates) {
  const my_set = new Set();
  const unique_crm_data = [];

  const filtered_data = mandates.map((el) => {
    if (!my_set.has(el.leadname)) {
      my_set.add(el.leadname);
      unique_crm_data.push(el);
    }
  });

  const bulk_data = await Promise.all(
    unique_crm_data.map(async (el) => {
      el.uuid = el.uuid ? el.uuid : uuidv4();
      el.updated_at = new Date();
      el.action_date = new Date();
      await CrmDataDump.upsert(el);
    })
  );

  const new_crm_data = await DB_CLIENT.query(
    `SELECT * FROM crm_data_dump WHERE updated_at > :pre_date AND updated_at < :cur_date `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        uuid: uuidv4(),
        pre_date: moment(
          new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
        ).format("YYYY-MM-DD"),
        cur_date: moment(new Date()).format("YYYY-MM-DD"),
      },
    }
  );

  // console.log("new_crm_data: ", new_crm_data);

  await Promise.all(
    new_crm_data.map(async (el) => {
      const check_company = await DB_CLIENT.query(
        `SELECT id FROM companies WHERE name=:name`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            name: el.leadname,
          },
        }
      );

      // console.log("check_company: ", check_company);

      if (check_company.length === 0) {
        await CREATE_CRM_BUFFER(el);
      } else {
        const company = await Company.update(
          {
            is_listed: el["companylist"] ? 1 : 0,
            pan: el["pano"],
            tan: el["companytanno"],
            gst: el["gstino"],
            industry_id: el["industry_id"],
            sector_id: el["sector_id"],
            is_active: true,
            updated_at: new Date(),
          },
          {
            where: {
              name: el["leadname"],
            },
          }
        );

        const mandate_update = await DB_CLIENT.query(
          `UPDATE mandates set total_size =:leadiamount,initial_fee_charged =:leadfees WHERE company_id (SELECT id FROM companies WHERE name= :company_name)`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              leadiamount: el.leadiamount,
              leadfees: el.leadfees,
              company_name: el.leadname,
            },
          }
        );

        //   await DB_CLIENT.query(
        //     `INSERT INTO mandate_documents (uuid,mandate_part_1_document,mandate_part_2_document,mandate_id)
        //  VALUES (:uuid,:mandate_part_1_document,:mandate_part_2_document,:mandate_id) WHERE mandate_id = (SELECT id FROM mandates m INNER JOIN companies c ON c.id = m.company_id WHERE c.name = :company_name)
        //  IF @@ROWCOUNT = 0
        //  UPDATE mandate_documents SET mandate_part_1_document =:mandate_part_1_document,mandate_part_2_document=:mandate_part_2_document WHERE mandate_id = (SELECT id FROM mandates m
        //  INNER JOIN companies c ON c.id = m.company_id WHERE c.name = :company_name)`,
        //     {
        //       type: QueryTypes.INSERT,
        //       replacements: {
        //         uuid: uuidv4(),
        //         mandate_part_1_document: await downloadPDFFromURL(
        //           el.mandateupload
        //         ),
        //         mandate_part_2_document: await downloadPDFFromURL(
        //           el.scannedupload
        //         ),
        //         company_name: el.leadname,
        //       },
        //     }
        //   );

        const company_address_update = await DB_CLIENT.query(
          `UPDATE company_addresses set address_1 =:address,country_id =:country_id ,state_id =:state_id ,city_id=:city_id,pincode =:pincode WHERE company_id=:company_id`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              company_id: check_company[0].id,
              address: el.address,
              country_id: el.country_id,
              state_id: el.state_id,
              city_id: el.city_id,
              pincode: el.pincode,
            },
          }
        );

        const company_primary_contact_insert = await DB_CLIENT.query(
          `INSERT INTO contact_details (uuid,name,email,mobile,designation,is_primary_contact,company_id) VALUES (:uuid,:conpersonnamee,:conemailid,:conmobile,:condesignation,1,:company_id)`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              uuid: uuidv4(),
              company_id: check_company[0].id,
              conpersonnamee: el.conpersonnamee,
              conemailid: el.conemailid,
              conmobile: el.conmobile,
              condesignation: el.condesignation,
            },
          }
        );

        const company_secondary_contact_insert = await DB_CLIENT.query(
          `INSERT INTO contact_details (uuid,name,email,mobile,designation,is_primary_contact,company_id) VALUES (:uuid,:conpersonnamee,:conemailid,:conmobile,:condesignation,0,:company_id)`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              uuid: uuidv4(),
              company_id: company.id,
              conpersonnamee: el.secondryconpersonnamee,
              conemailid: el.secondryconemailid,
              conmobile: el.secondryconmobile,
              condesignation: el.secondrycondesignation,
            },
          }
        );
      }
    })
  );
}

const xyz = async () => {
  const mandates = await GET_CMS_MANDATE_DATA();
  await CREATE_CRM_BUFFER(mandates);
};

module.exports = {
  GET_CMS_DATA,
  GET_CMS_MANDATE_DATA,
  CREATE_CRM_BUFFER,
  CREATE_CRM_BUFFER,
  GET_CMS_MANDATE_DATA_PER_DAY,
  UPDATE_CRM_BUFFER,
  xyz,
};
