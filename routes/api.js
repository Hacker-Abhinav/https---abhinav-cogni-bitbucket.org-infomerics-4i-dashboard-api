const bcrypt = require("bcrypt");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const { Sequelize, Op, QueryTypes, where } = require("sequelize");

const {
  Role,
  Permission,
  Navigation,
  User,
  Company,
  CompanyAddress,
  UserAttribute,
  Department,
  Industry,
  SubIndustry,
  Country,
  State,
  City,
  BoardOfDirector,
  ListingDetail,
  Stakeholder,
  ContactDetail,
  Shareholding,
  MacroEconomicIndicator,
  Sector,
  Tag,
  CompanyDocument,
  Subsidiary,
  Mandate,
  MandateDocument,
  BranchOffice,
  IncCasesRating,
  CrmDataDump,
  MandateAllocationHistory,
  DocumentType,
} = require("../models/modules/onboarding");

const {
  InstrumentCategory,
  InstrumentSubCategory,
  Instrument,
  InstrumentDetail,
  TransactionInstrument,
  BankerLender,
  RatingProcess,
  RatingSheet,
  RatingSymbolCategory,
  FinancialYear,
  RatingSymbolMaster,
  RatingSymbolMapping,
} = require("../models/modules/rating-model");

const {
  SET_REDIS_DATA,
  GET_REDIS_DATA,
  DELETE_REDIS_DATA,
} = require("../redis-client");
const { LANG_DATA } = require("../lang");
const {
  APPEND_USER_DATA,
  UPLOAD_DOCUMENT,
  CHECK_PERMISSIONS,
  GET_PAGINATION_PARAMS,
  SET_PAGINATION_PARAMS,
  SET_PAGINATION_PAGE_CONF,
  UPLOAD_TO_AZURE_STORAGE,
  MONTH_DIFFERENCE,
} = require("../helpers");
const { DB_CLIENT } = require("../db");
const {
  WorkflowInstance,
  WorkflowConfig,
  Activity,
  WorkflowInstanceLog,
} = require("../models/modules/workflow");
const { CreateShareholding } = require("../schemas/company/createShareholding");
const { uploadProfileImage } = require("../schemas/User/uploadProfileImage");
const {
  RatingCommitteeMeetingRegister,
} = require("../models/modules/rating-committee");
const { SEND_GENERAL_EMAIL } = require("../services/send-email");
const { EMAIL_TEMPLATE } = require("../constants/constant");
const { start_workflow } = require("../services/workflow-activities-bl");
const { default: axios } = require("axios");
const { log } = require("console");
const {
  check_stake_in_company,
  FIND_CUR_FIN_YEAR,
} = require("./modules/inbox");
const L = LANG_DATA();
const { upload_file_to_dms } = require("./modules/inbox");
const { STAKE_CHECK_FUNC } = require("./modules/inbox");

module.exports = { manage_allocation_history };

async function manage_allocation_history(params) {
  const mandate_history = await MandateAllocationHistory.create({
    uuid: uuidv4(),
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
    from_role_id: params.from_role_id,
    from_user_id: params.from_user_id,
    to_user_id: params.to_user_id,
    to_role_id: params.to_role_id,
    mandate_id: params.mandate_id,
    company_id: params.company_id,
    created_by: params.created_by,
  });
}

async function api_routes(fastify) {
  fastify.post("/check_permissions", async (request, reply) => {
    await CHECK_PERMISSIONS(request, "Company Management");
    return reply.send({
      api: "check_permissions",
      user_permissions: request.user_permissions,
    });
  });

  fastify.post("/dashboard", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Dashboard.View");
      var response = {};
      response["success"] = true;
      response["activities"] = [];
      response["cards"] = [];
      reply.send(response);
    } catch (error) {
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies", async (request, reply) => {
    try {
      // console.log("permissions ", request.user_permissions);
      await CHECK_PERMISSIONS(request, "CompanyManagement.List");
      // dstructure
      const { searchBy, searchValue, limit, offset } = request?.body?.params;
      let sortBy = "created_at";
      let sortOrder = "DESC";
      let llimit = limit;
      let ooffset = offset;
      if (limit === "all") {
        llimit = 10000;
      }
      const where_query = {
        is_active: true,
      };

      // old code
      if (request.query.tags) {
        const total_count = await Company.count({
          where: where_query,
        });
        const tag = await Tag.findOne({
          where: {
            uuid: request.query.tags,
          },
          raw: true,
        });

        const companies = await DB_CLIENT.query(
          `
    SELECT c.name AS name, c.uuid AS uuid, c.short_code AS short_code, c.created_at AS created_at, c.updated_at AS updated_at from company_has_tags cht INNER JOIN companies c ON c.id = cht.company_id
    WHERE cht.tag_id = :tag_id;
    `,
          {
            replacements: {
              tag_id: tag.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          companies: companies,
          page_config: SET_PAGINATION_PAGE_CONF(request, {
            total: total_count,
          }),
        });
      }
      // old code end not touch by tarun

      let where1 = {};
      let where2 = {};
      let where3 = {};

      if (searchBy != undefined && searchBy === "company_name") {
        where1 = {
          ...where1,
          name: {
            [Op.like]: "%" + searchValue + "%",
          },
        };
      }
      if (searchBy != undefined && searchBy === "industry") {
        where2 = {
          ...where2,
          name: {
            [Op.like]: "%" + searchValue + "%",
          },
        };
      }
      if (searchBy != undefined && searchBy === "sub_industry") {
        where3 = {
          ...where3,
          name: {
            [Op.like]: "%" + searchValue + "%",
          },
        };
      }
      let companies = await Company.findAndCountAll({
        where: {
          ...where1,
        },
        attributes: [
          "uuid",
          "name",
          "short_code",
          "type",
          "created_at",
          "updated_at",
        ],
        include: [
          {
            model: Industry,
            as: "company_industry",
            where: {
              ...where2,
            },
            attributes: {
              exclude: ["id"],
            },
            required: false,
          },
          {
            model: SubIndustry,
            as: "company_sub_industry",
            where: {
              ...where3,
            },
            attributes: {
              exclude: ["id"],
            },
            required: false,
          },
        ],
        limit: llimit,
        offset: ooffset,
        order: [[String(sortBy), String(sortOrder)]],
      });

      reply.send({
        success: true,
        companies: companies,
        // page_config: SET_PAGINATION_PAGE_CONF(request, {
        // total: total_count,
        // }),
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  // companies all with limited fillds
  fastify.post("/companies-listing", async (request, reply) => {
    try {
      // console.log("permissions ", request.user_permissions);
      await CHECK_PERMISSIONS(request, "CompanyManagement.List");
      // dstructure
      const { searchBy, searchValue, limit, offset } = request?.body?.params;
      let sortBy = "created_at";
      let sortOrder = "DESC";
      let llimit = limit;
      let ooffset = offset;
      if (limit === "all") {
        llimit = 20000;
      }
      const where_query = {
        is_active: true,
      };

      // old code
      if (request.query.tags) {
        const total_count = await Company.count({
          where: where_query,
        });
        const tag = await Tag.findOne({
          where: {
            uuid: request.query.tags,
          },
          raw: true,
        });

        const companies = await DB_CLIENT.query(
          `
    SELECT c.name AS name, c.uuid AS uuid, c.short_code AS short_code, c.created_at AS created_at, c.updated_at AS updated_at from company_has_tags cht INNER JOIN companies c ON c.id = cht.company_id
    WHERE cht.tag_id = :tag_id;
    `,
          {
            replacements: {
              tag_id: tag.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          companies: companies,
          page_config: SET_PAGINATION_PAGE_CONF(request, {
            total: total_count,
          }),
        });
      }
      // old code end not touch by tarun

      let where1 = {};
      let where2 = {};
      let where3 = {};

      if (searchBy != undefined && searchBy === "company_name") {
        where1 = {
          ...where1,
          name: {
            [Op.like]: "%" + searchValue + "%",
          },
        };
      }
      if (searchBy != undefined && searchBy === "industry") {
        where2 = {
          ...where2,
          name: {
            [Op.like]: "%" + searchValue + "%",
          },
        };
      }
      if (searchBy != undefined && searchBy === "sub_industry") {
        where3 = {
          ...where3,
          name: {
            [Op.like]: "%" + searchValue + "%",
          },
        };
      }
      let companies = await Company.findAndCountAll({
        where: {
          ...where1,
        },
        attributes: ["uuid", "name"],
        include: [
          {
            model: Industry,
            as: "company_industry",
            where: {
              ...where2,
            },
            attributes: ["name"],
            required: false,
          },
          {
            model: SubIndustry,
            as: "company_sub_industry",
            where: {
              ...where3,
            },
            attributes: ["name"],
            required: false,
          },
        ],
        limit: llimit,
        offset: ooffset,
        order: [[String(sortBy), String(sortOrder)]],
      });

      reply.send({
        success: true,
        companies: companies,
        // page_config: SET_PAGINATION_PAGE_CONF(request, {
        // total: total_count,
        // }),
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/companies/overview", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");
      const data = await GET_REDIS_DATA(request.body.uuid);
      if (data) {
        return reply.send({
          success: true,
          company: data,
        });
      }

      const company = await Company.findOne({
        where: {
          uuid: request.body.uuid,
        },
        attributes: [
          "uuid",
          "name",
          "short_code",
          ["group_of_company", "group"],
          ["type", "company_type"],
          "former_name",
          "sez",
          "legal_status",
          "is_listed",
          "is_infomerics_client",
          "cin",
          "pan",
          "tan",
          "gst",
          "controlling_office",
          "website",
          "date_of_incorporation",
          "is_active",
          "created_at",
          "updated_at",
        ],
        include: [
          {
            model: MacroEconomicIndicator,
            as: "company_macro_economic_indicator",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: Sector,
            as: "company_sector",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: Industry,
            as: "company_industry",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: SubIndustry,
            as: "company_sub_industry",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: Company,
            as: "subsidiaries",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: Tag,
            as: "tags",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: User,
            as: "company_created_by",
            attributes: ["uuid", "full_name", "email"],
            required: false,
          },
          {
            model: User,
            as: "company_updated_by",
            attributes: ["uuid", "full_name", "email"],
            required: false,
          },
          {
            model: Shareholding,
            as: "shareholdings",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: Stakeholder,
            as: "stakeholders",
            attributes: { exclude: ["id"] },
            required: false,
            include: {
              model: Company,
              as: "stakeholder_company",
              attributes: ["uuid", "name", "short_code"],
              required: false,
            },
          },
          {
            model: ListingDetail,
            as: "listingdetails",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: BoardOfDirector,
            as: "boardofdirectors",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: ContactDetail,
            as: "contactdetails",
            attributes: { exclude: ["id"] },
            required: false,
          },
          {
            model: CompanyAddress,
            as: "company_addresses",
            attributes: [
              "uuid",
              "address_1",
              "address_2",
              "landmark",
              "type",
              "pincode",
            ],
            required: false,
            include: [
              {
                model: Country,
                as: "company_country",
                attributes: ["uuid", "name"],
                required: false,
              },
              {
                model: State,
                as: "company_state",
                attributes: ["uuid", "name"],
                required: false,
              },
              {
                model: City,
                as: "company_city",
                attributes: ["uuid", "name"],
                required: false,
              },
            ],
          },
          {
            model: CompanyDocument,
            as: "company_document",
            attributes: { exclude: ["id"] },
            required: false,
          },
        ],
      });

      await SET_REDIS_DATA(company.uuid, company);

      reply.send({
        success: true,
        company: company,
      });
    } catch (error) {
      console.log("error: ", error);
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/view", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

      const company = await Company.findOne({
        where: {
          uuid: request.body.uuid,
        },
        attributes: [
          "uuid",
          "name",
          "short_code",
          ["group_of_company", "group"],
          ["type", "company_type"],
          "former_name",
          "sez",
          "registered",
          "legal_status",
          "is_listed",
          "is_infomerics_client",
          "cin",
          "pan",
          "tan",
          "gst",
          "controlling_office",
          "website",
          "date_of_incorporation",
          "is_active",
          "created_at",
          "updated_at",
        ],
        include: [
          {
            model: MacroEconomicIndicator,
            as: "company_macro_economic_indicator",
            attributes: { exclude: ["id"] },
          },
          {
            model: Sector,
            as: "company_sector",
            attributes: { exclude: ["id"] },
          },
          {
            model: Industry,
            as: "company_industry",
            attributes: { exclude: ["id"] },
          },
          {
            model: SubIndustry,
            as: "company_sub_industry",
            attributes: { exclude: ["id"] },
          },
          {
            model: Company,
            as: "subsidiaries",
            attributes: { exclude: ["id"] },
          },
          {
            model: Tag,
            as: "tags",
            attributes: { exclude: ["id"] },
          },
          {
            model: CompanyDocument,
            as: "company_document",
            attributes: { exclude: ["id"] },
          },
        ],
      });

      reply.send({
        success: true,
        company: company,
      });
    } catch (error) {
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/get_subsidiaries", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.List");

      const companies = await Company.findAll({
        where: {
          uuid: {
            [Op.ne]: request.body.company_uuid,
          },
        },
        attributes: [
          "uuid",
          "name",
          "short_code",
          ["group_of_company", "group"],
          ["type", "company_type"],
        ],
      });

      reply.send({
        success: true,
        companies: companies,
      });
    } catch (error) {
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/add", async (request, reply) => {
    try {
      const { params } = request.body;

      const check_permission = await CHECK_PERMISSIONS(
        request,
        "Company.Create"
      );

      if (!check_permission) {
        reply.status_code = 401;
        return reply.send({
          success: false,
          error: L["NO_ACCESS_TO_MODULE"],
        });
      }

      const tags = await Tag.findAll({
        where: {
          uuid: params["tags_uuid"],
          is_active: true,
        },
      });

      const macro_economic_indicator = await MacroEconomicIndicator.findOne({
        where: {
          uuid: params["macro_economic_indicator_uuid"],
          is_active: true,
        },
      });

      const sector = await Sector.findOne({
        where: {
          uuid: params["sector_uuid"],
          is_active: true,
        },
      });

      const industry = await Industry.findOne({
        where: { uuid: params["industry_id"] },
      });

      const sub_industry = await SubIndustry.findOne({
        where: { uuid: params["sub_industry_id"] },
      });

      const company = await Company.create({
        uuid: uuidv4(),
        name: params["name"],
        short_code: params["short_code"],
        group_of_company: params["group"],
        type: params["company_type"],
        former_name: params["former_name"],
        registered: params["registered"],
        sez: params["sez"],
        legal_status: params["legal_status"],
        is_listed: params["is_listed"],
        is_infomerics_client: params["is_infomerics_client"],
        cin: params["cin"],
        controlling_office: params["controlling_office"],
        pan: params["pan"],
        tan: params["tan"],
        gst: params["gst"],
        website: params["website"],
        date_of_incorporation: params["date_of_incorporation"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        updated_by: request.user.id,
      });

      if (tags) {
        await company.setTags(tags);
      }

      if (macro_economic_indicator) {
        await company.setCompany_macro_economic_indicator(
          macro_economic_indicator
        );
      }

      if (sector) {
        await company.setCompany_sector(sector);
      }

      if (industry) {
        await company.setCompany_industry([industry.id]);
      }

      if (sub_industry) {
        await company.setCompany_sub_industry([sub_industry.id]);
      }

      await SET_REDIS_DATA(company.uuid, company);

      reply.send({
        success: true,
        company: company,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/edit", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company_object = await Company.findOne({
        where: { uuid: params["uuid"] },
      });

      if (!company_object) {
        reply.status_code = 403;
        return reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
      }

      await DELETE_REDIS_DATA(company_object.uuid);

      const subsidiaries = await Company.findAll({
        where: {
          uuid: params["subsidiary_uuid"],
          is_active: true,
        },
      });

      const tags = await Tag.findAll({
        where: {
          uuid: params["tags_uuid"],
          is_active: true,
        },
      });

      const macro_economic_indicator = await MacroEconomicIndicator.findOne({
        where: {
          uuid: params["macro_economic_indicator_uuid"],
          is_active: true,
        },
      });

      const sector = await Sector.findOne({
        where: {
          uuid: params["sector_uuid"],
          is_active: true,
        },
      });

      const industry = await Industry.findOne({
        where: { uuid: params["industry_id"] },
      });

      const sub_industry = await SubIndustry.findOne({
        where: { uuid: params["sub_industry_id"] },
      });

      const company_update_result = await Company.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          short_code: params["short_code"],
          group_of_company: params["group"],
          type: params["company_type"],
          former_name: params["former_name"],
          sez: params["sez"],
          registered: params["registered"],
          legal_status: params["legal_status"],
          is_listed: params["is_listed"],
          is_infomerics_client: params["is_infomerics_client"],
          cin: params["cin"],
          controlling_office: params["controlling_office"],
          pan: params["pan"],
          tan: params["tan"],
          gst: params["gst"],
          website: params["website"],
          date_of_incorporation: params["date_of_incorporation"],
          updated_at: Date.now(),
          updated_by: request.user.id,
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      if (tags) {
        await company_object.setTags(tags);
      }

      if (subsidiaries) {
        await company_object.setSubsidiaries(subsidiaries);
      }

      if (macro_economic_indicator) {
        await company_object.setCompany_macro_economic_indicator(
          macro_economic_indicator
        );
      }

      if (sector) {
        await company_object.setCompany_sector(sector);
      }

      if (industry) {
        await company_object.setCompany_industry([industry.id]);
      }

      if (sub_industry) {
        await company_object.setCompany_sub_industry([sub_industry.id]);
      }

      reply.send({
        success: true,
        company_update_result: Boolean(company_update_result[0] === 1),
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/assign_documents", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.List");

      const company = await Company.findOne({
        where: {
          uuid: request.body.company_uuid.value,
          is_active: true,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      await DELETE_REDIS_DATA(company.uuid);

      const doc_object = await CompanyDocument.findOne({
        where: {
          company_id: company.id,
          is_active: true,
        },
        raw: true,
      });

      let document_buffer = {};
      var pan = doc_object ? doc_object.pan : "";
      var tan = doc_object ? doc_object.tan : "";
      var gst = doc_object ? doc_object.gst : "";

      if (request.body["pan"]) {
        document_buffer = await request.body["pan"].toBuffer();
        pan = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
          path: request.body.pan.filename,
        });
        const blob = new Blob([document_buffer]);

        const upload_params = {
          company_name: company.name,
          fileName: request.body.pan.filename,
          file: blob,
          document_type: "pan",
          request: request,
          rating_process: null
        };

        const result = await upload_file_to_dms(upload_params);
      }

      if (request.body["tan"]) {
        document_buffer = await request.body["tan"].toBuffer();
        tan = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
          path: request.body.tan.filename,
        });
        const blob = new Blob([document_buffer]);
        const upload_params = {
          company_name: company.name,
          fileName: request.body.tan.filename,
          file: blob,
          document_type: "tan",
          request: request,
          rating_process: null
        };

        const result = await upload_file_to_dms(upload_params);
      }
      if (request.body["gst"]) {
        document_buffer = await request.body["gst"].toBuffer();
        gst = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
          path: request.body.gst.filename,
        });
        const blob = new Blob([document_buffer]);

        const upload_params = {
          company_name: company.name,
          fileName: request.body.gst.filename,
          file: blob,
          document_type: "gst",
          request: request,
          rating_process: null
        };

        const result = await upload_file_to_dms(upload_params);
      }

      const company_document = await CompanyDocument.upsert({
        uuid: request.body.uuid ? request.body.uuid.value : uuidv4(),
        company_id: company.id,
        pan: pan,
        tan: tan,
        gst: gst,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        updated_by: request.user.id,
      });

      reply.send({
        success: true,
        company_document_uuid: company_document,
      });
    } catch (error) {
      console.log("error: ", error);
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/view_documents", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

      const company = await Company.findOne({
        where: {
          uuid: request?.body?.company_uuid,
          is_active: true,
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

      const company_document = await CompanyDocument.findOne({
        where: {
          company_id: company.id,
          is_active: true,
        },
      });

      reply.send({
        success: true,
        company_document: company_document,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/assign_address", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Create");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
      });

      await DELETE_REDIS_DATA(company.uuid);

      const country = await Country.findOne({
        where: {
          uuid: params["country_uuid"],
        },
        raw: true,
      });

      const state = await State.findOne({
        where: {
          uuid: params["state_uuid"],
        },
        raw: true,
      });

      const city = await City.findOne({
        where: {
          uuid: params["city_uuid"],
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      const address = await CompanyAddress.create({
        uuid: uuidv4(),
        address_1: params["address_1"],
        address_2: params["address_2"],
        landmark: params["landmark"],
        lat: params["lat"],
        lng: params["lng"],
        pincode: params["pincode"],
        type: params["type"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        country_id: country ? country.id : null,
        state_id: state ? state.id : null,
        city_id: city ? city.id : null,
      });

      if (company) {
        address.setCompany(company);
      }

      reply.send({
        success: true,
        address: address,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/view_address", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

      const company = await Company.findOne({
        where: {
          uuid: request.body.company_uuid,
          is_active: true,
        },
        raw: true,
      });

      const addresses = await CompanyAddress.findAll({
        where: {
          company_id: company.id,
        },
        include: [
          {
            model: Country,
            as: "company_country",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: State,
            as: "company_state",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: City,
            as: "company_city",
            attributes: {
              exclude: ["id"],
            },
          },
        ],
        order: [["updated_at", "DESC"]],
      });

      reply.send({
        success: true,
        addresses: addresses,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/edit_address", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
      });

      const country = await Country.findOne({
        where: {
          uuid: params["country_uuid"],
        },
        raw: true,
      });

      const state = await State.findOne({
        where: {
          uuid: params["state_uuid"],
        },
        raw: true,
      });

      const city = await City.findOne({
        where: {
          uuid: params["city_uuid"],
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      await DELETE_REDIS_DATA(company.uuid);

      const address_update_result = await CompanyAddress.update(
        APPEND_USER_DATA(request, {
          address_1: params["address_1"],
          address_2: params["address_2"],
          landmark: params["landmark"],
          lat: params["lat"],
          lng: params["lng"],
          pincode: params["pincode"],
          type: params["type"],
          is_active: params["is_active"],
          country_id: country ? country.id : null,
          state_id: state ? state.id : null,
          city_id: city ? city.id : null,
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      reply.send({
        success: true,
        address_update_result: Boolean(address_update_result[0] === 1),
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post(
    "/companies/assign_board_of_directors",
    async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "Company.List");

        const company = await Company.findOne({
          where: {
            uuid: params["company_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!company) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        await DELETE_REDIS_DATA(company.uuid);

        const board_of_director = await BoardOfDirector.create({
          uuid: uuidv4(),
          name: params["name"],
          din: params["din"],
          position: params["position"],
          director_function: params["director_function"],
          qualification: params["qualification"],
          date_of_joining: params["date_of_joining"],
          is_defaulter: params["is_wilful_defaulter"],
          total_experiance: params["total_experiance"],
          past_experiance: params["past_experiance"],
          last_working_day: params["last_working_day"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
        });

        reply.send({
          success: true,
          board_of_director: board_of_director,
        });
      } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error:
              "This DIN/Director Already Assigned For This Company, Please Check Details Again!",
          });
        } else {
          reply.statusCode = 422;
          reply.send({ success: false, error: error["errors"] ?? error });
        }
      }
    }
  );

  fastify.post("/companies/edit_board_of_directors", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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

      await DELETE_REDIS_DATA(company.uuid);

      const board_of_director_object = await BoardOfDirector.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      const board_of_director_update_result = await BoardOfDirector.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          din: params["din"],
          position: params["position"],
          director_function: params["director_function"],
          qualification: params["qualification"],
          date_of_joining: params["date_of_joining"],
          is_defaulter: params["is_wilful_defaulter"],
          total_experiance: params["total_experiance"],
          past_experiance: params["past_experiance"],
          last_working_day: params["last_working_day"],
          is_active: params["director_status"],
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      if (company) {
        board_of_director_object.setCompany_board(company);
      }

      reply.send({
        success: true,
        board_of_director_update_result: Boolean(
          board_of_director_update_result[0] == 1
        ),
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        reply.statusCode = 403;
        reply.send({
          success: false,
          error:
            "This DIN/Director Already Assigned For This Company, Please Check Details Again!",
        });
      } else {
        reply.statusCode = 422;
        reply.send({ success: false, error: error["errors"] ?? String(error) });
      }
    }
  });

  fastify.post("/companies/view_board_of_directors", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

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
          error: L["NO_COMPANY"],
        });
        return;
      }
      const board_of_directors = await BoardOfDirector.findAll({
        where: {
          company_id: company.id,
        },
        attributes: [
          "uuid",
          "name",
          "din",
          "position",
          "director_function",
          "qualification",
          ["is_defaulter", "is_wilful_defaulter"],
          "total_experiance",
          "past_experiance",
          ["is_active", "director_status"],
          "date_of_joining",
          "updated_at",
          "last_working_day",
        ],
        order: [["updated_at", "DESC"]],
      });

      reply.send({
        success: true,
        board_of_directors: board_of_directors,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/assign_listing_details", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Create");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const listing_detail = await ListingDetail.create({
        uuid: uuidv4(),
        exchange: params["exchange"],
        scrip_code: params["scrip_code"],
        isin: params["isin"],
        listed_status: params["listed_status"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      if (company) {
        listing_detail.setCompany_listing_detail(company);
      }

      reply.send({
        success: true,
        listing_detail: listing_detail,
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

  fastify.post("/companies/view_listing_details", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

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
          error: L["NO_COMPANY"],
        });
        return;
      }

      const listing_details = await ListingDetail.findAll({
        where: {
          company_id: company.id,
        },
        order: [["updated_at", "DESC"]],
      });
      reply.send({
        success: true,
        listing_details: listing_details,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/edit_listing_details", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const listing_detail_object = await ListingDetail.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      const listing_detail_update_result = await ListingDetail.update(
        APPEND_USER_DATA(request, {
          exchange: params["exchange"],
          scrip_code: params["scrip_code"],
          isin: params["isin"],
          listed_status: params["listed_status"],
          is_active: params["is_active"],
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      if (company) {
        listing_detail_object.setCompany_listing_detail(company);
      }

      reply.send({
        success: true,
        listing_detail_update_result: Boolean(
          listing_detail_update_result[0] === 1
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

  fastify.post("/companies/assign_stakeholders", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Create");

      const stakeholder_company = await Company.findOne({
        where: {
          uuid: params["stakeholder_company_uuid"],
          is_active: true,
        },
      });

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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

      await DELETE_REDIS_DATA(company.uuid);

      const country = await Country.findOne({
        where: {
          uuid: params["country_uuid"],
        },
        raw: true,
      });

      const state = await State.findOne({
        where: {
          uuid: params["state_uuid"],
        },
        raw: true,
      });

      const city = await City.findOne({
        where: {
          uuid: params["city_uuid"],
        },
        raw: true,
      });

      const department = await Department.findOne({
        where: {
          uuid: params["department_uuid"],
          is_active: true,
        },
      });

      const stakeholder = await Stakeholder.create({
        uuid: uuidv4(),
        name: params["name"],
        type: params["type"],
        contact_name: params["contact_name"],
        email: params["email"],
        mobile: params["mobile"],
        landline: params["landline"],
        gender: params["gender"],
        designation: params["designation"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        country_id: country ? country.id : null,
        state_id: state ? state.id : null,
        city_id: city ? city.id : null,
      });

      if (company) {
        stakeholder.setParent_company(company);
      }

      if (stakeholder_company) {
        stakeholder.setStakeholder_company(stakeholder_company);
      }

      if (department) {
        await stakeholder.setStakeholder_department(department);
      }

      reply.send({
        success: true,
        stakeholder: stakeholder,
      });
    } catch (error) {
      console.log("error: ", error);
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/view_stakeholders", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

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
          error: L["NO_COMPANY"],
        });
        return;
      }

      const where_query = {
        company_id: company.id,
      };

      if (request.body.stakeholder_type) {
        where_query.type = request.body.stakeholder_type;
      }

      if (request.body.is_active) {
        where_query.is_active = request.body.is_active;
      }

      const stakeholders = await Stakeholder.findAll({
        where: where_query,
        include: [
          {
            model: Company,
            as: "stakeholder_company",
            attributes: ["uuid", "name", "short_code"],
          },
          {
            model: Department,
            as: "stakeholder_department",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: Country,
            as: "stakeholder_country",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: State,
            as: "stakeholder_state",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: City,
            as: "stakeholder_city",
            attributes: {
              exclude: ["id"],
            },
          },
        ],
        order: [["updated_at", "DESC"]],
      });
      reply.send({
        success: true,
        stakeholders: stakeholders,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/edit_stakeholders", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
      });

      await DELETE_REDIS_DATA(company.uuid);

      const stakeholder_company = await Company.findOne({
        where: {
          uuid: params["stakeholder_company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      const country = await Country.findOne({
        where: {
          uuid: params["country_uuid"],
        },
        raw: true,
      });

      const state = await State.findOne({
        where: {
          uuid: params["state_uuid"],
        },
        raw: true,
      });

      const city = await City.findOne({
        where: {
          uuid: params["city_uuid"],
        },
        raw: true,
      });

      const department = await Department.findOne({
        where: {
          uuid: params["department_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const stakeholder_object = await Stakeholder.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      if (!stakeholder_object) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO_STAKEHOLDER_COMPANY",
        });
        return;
      }

      console.log("state: ", state);

      const stakeholder_update_result = await Stakeholder.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          type: params["type"],
          contact_name: params["contact_name"],
          email: params["email"],
          mobile: params["mobile"],
          landline: params["landline"],
          gender: params["gender"],
          designation: params["designation"],
          country_id: country ? country.id : null,
          state_id: state ? state.id : null,
          city_id: city ? city.id : null,
          is_active: params["is_active"],
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
          department_id: department ? department.id : null,
          stakeholder_company_id: stakeholder_company
            ? stakeholder_company.id
            : null,
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      stakeholder_object.setParent_company(company);

      reply.send({
        success: true,
        stakeholder_update_result: Boolean(stakeholder_update_result[0] === 1),
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/assign_shareholdings", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.List");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }
      await DELETE_REDIS_DATA(company.uuid);

      let holding_percentage_count = await DB_CLIENT.query(
        `SELECT ROUND(SUM(holding_percentage), 2) AS holding from shareholdings WHERE company_id = :company_id AND is_active = 1 AND as_on_date = :as_on_date;`,
        {
          replacements: {
            company_id: company.id,
            as_on_date: params["as_on_date"],
          },
          type: QueryTypes.SELECT,
        }
      );

      if (
        holding_percentage_count[0].holding &&
        holding_percentage_count[0].holding + params["holding_percentage"] > 100
      ) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "Shareholdings can't exceed 100%",
        });
        return;
      }

      const shareholding = await Shareholding.create({
        uuid: uuidv4(),
        holding_type: params["holding_type"],
        holder_name: params["holder_name"],
        holding_percentage: params["holding_percentage"],
        pledge_share: params["pledge_share"],
        as_on_date: params["as_on_date"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        company_id: company.id,
      });

      reply.send({
        success: true,
        shareholding: shareholding,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/view_shareholdings", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

      const where_query = {
        is_active: true,
      };

      // if (request.query && request.query.as_on_date) {
      //   where_query.as_on_date = request.query.as_on_date;
      // }
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
          error: L["NO_COMPANY"],
        });
        return;
      }

      where_query.company_id = company.id;

      const shareholdings = await DB_CLIENT.query(
        `SELECT * from shareholdings WHERE company_id = :company_id AND is_active = 1 AND as_on_date = ${request.query.as_on_date
          ? `'${request.query.as_on_date}'`
          : "(SELECT MAX(as_on_date) from shareholdings WHERE company_id = :company_id AND is_active = 1 )"
        };`,
        {
          replacements: {
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      reply.send({
        success: true,
        shareholdings: shareholdings,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/view_shareholding_dates", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

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
          error: L["NO_COMPANY"],
        });
        return;
      }
      const shareholding_dates = await Shareholding.findAll({
        where: {
          company_id: company.id,
          is_active: true,
        },
        attributes: [
          Sequelize.fn("DISTINCT", Sequelize.col("as_on_date")),
          "as_on_date",
        ],
        distinct: true,
      });
      reply.send({
        success: true,
        shareholding_dates: shareholding_dates,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/copy_shareholdings", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.View");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      let shareholdings = await DB_CLIENT.query(
        `SELECT holding_type, holder_name, holding_percentage, pledge_share, as_on_date, is_active, created_at, updated_at, company_id, created_by, updated_by FROM shareholdings WHERE company_id = :company_id
        AND as_on_date = :as_on_date AND is_active = 1`,
        {
          replacements: {
            as_on_date: params["as_on_date"],
            company_id: company.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      await DB_CLIENT.query(
        `UPDATE shareholdings SET is_active = 0 WHERE company_id = :company_id AND as_on_date = :as_on_date 
        `,
        {
          replacements: {
            company_id: company.id,
            as_on_date: params["assigned_as_on_date"],
          },
          type: QueryTypes.UPDATE,
        }
      );

      shareholdings = shareholdings.map((el) => {
        el.uuid = uuidv4();
        el.as_on_date = params["assigned_as_on_date"];
        return el;
      });

      const shareholdings_bulk_data = await Shareholding.bulkCreate(
        shareholdings
      );

      reply.send({
        success: true,
        shareholdings: shareholdings_bulk_data,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/companies/edit_shareholdings", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const shareholding_object = await Shareholding.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      let holding_percentage_count = await DB_CLIENT.query(
        `SELECT ROUND(SUM(holding_percentage), 2) AS holding from shareholdings WHERE company_id = :company_id AND is_active = 1 AND as_on_date = :as_on_date AND uuid <> :uuid;`,
        {
          replacements: {
            company_id: company.id,
            as_on_date: params["as_on_date"],
            uuid: params["uuid"],
          },
          type: QueryTypes.SELECT,
        }
      );

      if (
        holding_percentage_count[0].holding &&
        params["holding_percentage"] &&
        holding_percentage_count[0].holding + params["holding_percentage"] > 100
      ) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "Shareholdings can't exceed 100%",
        });
        return;
      }

      const shareholding_update_result = await Shareholding.update(
        APPEND_USER_DATA(request, {
          holding_type: params["holding_type"],
          holder_name: params["holder_name"],
          holding_percentage: params["holding_percentage"],
          pledge_share: params["pledge_share"],
          as_on_date: params["as_on_date"],
          is_active: params["is_active"],
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      if (company) {
        shareholding_object.setCompany_shareholding(company);
      }

      reply.send({
        success: true,
        shareholding_update_result: Boolean(
          shareholding_update_result[0] === 1
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

  fastify.post("/companies/assign_contact_details", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Create");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const department = await Department.findOne({
        where: {
          uuid: params["department_uuid"],
          is_active: true,
        },
      });

      const contact_detail = await ContactDetail.create({
        uuid: uuidv4(),
        name: params["name"],
        email: params["email"],
        mobile: params["mobile"],
        landline: params["landline"],
        designation: params["designation"],
        send_provisional_communication_letter:
          params["send_provisional_communication_letter"],
        send_rating_letter: params["send_rating_letter"],
        send_nds_email: params["send_nds_email"],
        send_press_release: params["send_press_release"],
        is_key_managerial_person: params["is_key_managerial_person"],
        is_primary_contact: params["is_primary_contact"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      await contact_detail.setCompany_contact(company);

      if (department) {
        await contact_detail.setDepartment(department);
      }

      reply.send({
        success: true,
        contact_detail: contact_detail,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/view_contact_details", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.View");

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
          error: L["NO_COMPANY"],
        });
        return;
      }

      const contact_details = await ContactDetail.findAll({
        where: {
          company_id: company.id,
        },
        include: [
          {
            model: Department,
            as: "department",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: Company,
            as: "company_contact",
            attributes: ["id"],
            include: 
            {
              model: BoardOfDirector,
              attributes: ["id", "name", "uuid"]
            }
          },
        ],
        order: [["updated_at", "DESC"]],
      });
      reply.send({
        success: true,
        contact_details: contact_details,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/edit_contact_details", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const department = await Department.findOne({
        where: {
          uuid: params["department_uuid"],
          is_active: true,
        },
      });

      const contact_detail_object = await ContactDetail.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      const contact_detail_update_result = await ContactDetail.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          email: params["email"],
          mobile: params["mobile"],
          landline: params["landline"],
          designation: params["designation"],
          send_provisional_communication_letter:
            params["send_provisional_communication_letter"],
          send_rating_letter: params["send_rating_letter"],
          send_nds_email: params["send_nds_email"],
          send_press_release: params["send_press_release"],
          is_key_managerial_person: params["is_key_managerial_person"],
          is_primary_contact: params["is_primary_contact"],
          is_active: params["is_active"],
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      await contact_detail_object.setCompany_contact(company);

      if (department) {
        await contact_detail_object.setDepartment(department);
      }
      reply.send({
        success: true,
        contact_detail_update_result: Boolean(
          contact_detail_update_result[0] === 1
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

  fastify.post("/companies/assign_subsidiaries", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.List");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const subsidiary_company = await Company.findOne({
        where: {
          uuid: params["subsidiary_company_uuid"],
          is_active: true,
        },
      });

      const subsidiary = await Subsidiary.create({
        uuid: uuidv4(),
        stake: params["stake"],
        type: params["type"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      if (subsidiary_company) {
        subsidiary.setSubsidiary_company(subsidiary_company);
      }

      subsidiary.setParent_company(company);

      reply.send({
        success: true,
        subsidiary_uuid: subsidiary.uuid,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/edit_subsidiaries", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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
      await DELETE_REDIS_DATA(company.uuid);

      const subsidiary_company = await Company.findOne({
        where: {
          uuid: params["subsidiary_company_uuid"],
          is_active: true,
        },
      });

      const subsidiary_object = await Subsidiary.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      const subsidiary = await Subsidiary.update(
        APPEND_USER_DATA(request, {
          stake: params["stake"],
          type: params["type"],
          is_active: params["is_active"],
          updated_at: params["updated_at"],
          updated_by: params["updated_by"],
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      if (subsidiary_company) {
        subsidiary_object.setSubsidiary_company(subsidiary_company);
      }

      subsidiary_object.setParent_company(company);

      reply.send({
        success: true,
        subsidiary_uuid: subsidiary.uuid,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/view_subsidiaries", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "CompanyManagement.Subsidiary");
      const { is_active } = request.body;
      let whereIsActive = {};
      if (is_active !== undefined) {
        whereIsActive.is_active = is_active;
      }
      const company = await Company.findOne({
        where: {
          uuid: request.body?.company_uuid,
          ...whereIsActive,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      const subsidiaries = await Subsidiary.findAll({
        where: {
          company_id: company.id,
          ...whereIsActive,
        },
        include: [
          {
            model: Company,
            as: "subsidiary_company",
            attributes: ["uuid", "name", "short_code"],
          },
          {
            model: Company,
            as: "parent_company",
            attributes: ["uuid", "name", "short_code"],
          },
        ],
      });

      reply.send({
        success: true,
        subsidiaries: subsidiaries,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/assign_mandates", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Create");

      let parent_mandate_object =
        params["parent_mandate_id"] != null
          ? await Mandate.findOne({
              where: {
                mandate_id: params["parent_mandate_id"],
                is_active: true,
              },
              raw: true,
            })
          : null;

      console.log("parent_mandate_object : ", parent_mandate_object);

      let rating_register = [];

      if (parent_mandate_object) {
        rating_register = await DB_CLIENT.query(
          `SELECT rcmr.id FROM mandates m 
          INNER JOIN transaction_instruments ti ON ti.mandate_id = m.id 
          INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id 
          INNER JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id = id.id 
          WHERE id.is_workflow_done = 0 AND m.id = :mandate_id`,
          {
            replacements: {
              mandate_id: parent_mandate_object.id,
            },
            type: QueryTypes.SELECT,
          }
        );
      }

      if (rating_register.length > 0) {
        reply.statusCode = 403;
        reply.send({
          success: false,
          error: "Parent mandate is already sent to committee.",
        });
        return;
      }

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
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

      const bd = await User.findOne({
        where: {
          uuid: params["bd_uuid"],
          is_active: true,
        },
      });

      if (!bd) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_BUSINESS_DEVELOPER_FOUND"],
        });
        return;
      }

      let stake_check_bd = await STAKE_CHECK_FUNC(company.id, bd.id);

      if (stake_check_bd.length > 0) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "User has stake in this company",
          stake_check: "fail",
          stake_check_fail_for: "BD",
        });
        return;
      }

      const rh = await User.findOne({
        where: {
          uuid: params["rh_uuid"],
          is_active: true,
        },
      });

      if (!rh) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_RATING_HEAD_FOUND"],
        });
        return;
      }

      const financial_year = await FinancialYear.findOne({
        where: {
          is_current_fy: true,
        },
      });

      let stake_check_rh = await STAKE_CHECK_FUNC(company.id, rh.id);
      if (stake_check_rh.length > 0) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: "User has stake in this company",
          stake_check: "fail",
          stake_check_fail_for: "RH",
        });
        return;
      }

      const branch_office = await BranchOffice.findOne({
        where: {
          uuid: params["branch_office_uuid"],
          is_active: true,
        },
      });

      const mandate = await Mandate.create({
        uuid: uuidv4(),
        mandate_source: params["mandate_source"],
        mandate_status: params["mandate_status"],
        mandate_date: params["mandate_date"],
        mandate_type: params["mandate_type"],
        total_size: params["total_size"],
        initial_fee_charged: params["initial_fee_charged"],
        bases_point: params["bases_point"],
        remark: params["remark"],
        surveillance_fee_charged: params["surveillance_fee_charged"],
        minimum_surveillance_fee: params["minimum_surveillance_fee"],
        surveillance_bases_point: params["surveillance_bases_point"],
        received_date: params["received_date"],
        is_verified: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        parent_mandate_id: parent_mandate_object
          ? parent_mandate_object.id
          : null,
        gh_id: parent_mandate_object ? parent_mandate_object.gh_id : null,
        ra_id: parent_mandate_object ? parent_mandate_object.ra_id : null,
      });

      mandate.setBusiness_developer(bd);
      mandate.setRating_head(rh);
      mandate.setCompany_mandate(company);
      mandate.setBranch_office(branch_office);

      reply.send({
        success: true,
        mandate_uuid: mandate.uuid,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/view_mandates", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "CompanyManagement.Mandate");

      const company = await Company.findOne({
        where: {
          uuid: request.body?.company_uuid,
          is_active: true,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      const where_query = {
        company_id: company.id,
      };

      if (Object.keys(request.body).includes("is_active")) {
        where_query["is_active"] = true;
      }

      if (Object.keys(request.body).includes("is_verified")) {
        where_query["is_verified"] = true;
      }

      where_query.parent_mandate_id = null;

      console.log("where_query: ", where_query);

      let mandates = await Mandate.findAll({
        where: where_query,
        raw: true,
        nest: true,
        include: [
          {
            model: User,
            as: "group_head",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: User,
            as: "rating_analyst",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: User,
            as: "rating_head",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: User,
            as: "business_developer",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: BranchOffice,
            as: "branch_office",
            attributes: ["uuid", "name"],
          },
          {
            model: Company,
            as: "company_mandate",
            attributes: ["uuid", "name"],
          },
        ],
        order: [["updated_at", "DESC"]],
      });

      const res = await Promise.all(
        mandates.map(async (el) => {
          child_mandates = await DB_CLIENT.query(
            `SELECT m.*,u.full_name AS business_developer,u.employee_code AS bd_code, u2.full_name AS rating_head,
          u2.employee_code AS rating_head_code,bo.name AS branch_office_name FROM mandates m 
          LEFT JOIN users u ON u.id = m.bd_id 
          LEFT JOIN users u2  ON u2.id = m.rh_id
          INNER JOIN branch_offices bo ON bo.id = m.branch_office_id WHERE m.parent_mandate_id = :parent_mandate_id AND m.is_active = 1 ORDER BY m.created_at ASC`,
            {
              replacements: {
                parent_mandate_id: el.id,
              },
              type: QueryTypes.SELECT,
            }
          );
          el.child_mandates = child_mandates;

          return el;
        })
      );

      // console.log("res: ", res);

      const res1 = await Promise.all(
        res.map(async (el) => {
          last_activity = await DB_CLIENT.query(
            `SELECT TOP 1
        CASE
          WHEN rp.id = 5 AND id.is_workflow_done = 0 THEN ti.id
          WHEN id.is_workflow_done = 1 THEN ti.id
        END
        AS id
         FROM transaction_instruments ti
                INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id 
                INNER JOIN rating_processes rp ON rp.id = id.rating_process_id 
                WHERE ti.mandate_id=:parent_mandate_id ORDER BY id.id DESC`,
            {
              replacements: {
                parent_mandate_id: el.id,
              },
              type: QueryTypes.SELECT,
            }
          );

          console.log("last_activity: ", last_activity);
          el.rating_done =
            last_activity.length > 0 && last_activity[0].id != null
              ? true
              : false;
          return el;
        })
      );

      return reply.send({
        success: true,
        mandates: res1,
        // instrument_promises: instrument_promises,
        // instrument_promises_array: instrument_promises_array,
      });
    } catch (error) {
      console.log("error: ", error);
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error,
      });
    }
  });

  fastify.post("/companies/mandates/view", async (request, reply) => {
    try {
      const { params } = request.body;
      await CHECK_PERMISSIONS(request, "Company.View");

      const where_query = {
        uuid: params["uuid"],
      };

      if (Object.keys(params).includes("is_active")) {
        where_query["is_active"] = true;
      }

      const mandate = await Mandate.findOne({
        where: where_query,
        raw: true,
        nest: true,
        include: [
          {
            model: User,
            as: "group_head",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: User,
            as: "rating_analyst",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: User,
            as: "rating_head",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: User,
            as: "business_developer",
            attributes: ["uuid", "full_name", "employee_code", "email"],
          },
          {
            model: BranchOffice,
            as: "branch_office",
            attributes: ["uuid", "name"],
          },
          {
            model: Company,
            as: "company_mandate",
            attributes: ["uuid", "name"],
          },
          {
            model: Mandate,
            as: "parent_mandate",
            attributes: ["uuid", "mandate_id"],
          },
        ],
      });

      const transaction_instruments = await TransactionInstrument.findAll({
        where: {
          mandate_id: mandate.id,
          is_active: true,
        },
        include: [
          {
            model: InstrumentCategory,
            as: "instrument_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: InstrumentSubCategory,
            as: "instrument_sub_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: Instrument,
            as: "instrument",
            attributes: {
              exclude: ["id"],
            },
          },
        ],
      });

      mandate.transaction_instruments = transaction_instruments;

      reply.send({
        success: true,
        mandate: mandate,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/based_on_roles", async (request, reply) => {
    try {
      const { params } = request.body;

      let foreign_key = {};

      foreign_key =
        request.active_role_name
          .split(" ")
          .map((word) => word.charAt(0))
          .slice(0, 2)
          .join("") + "_id";
      foreign_key = foreign_key.toLowerCase();

      var companies = {};

      if (request.active_role_name === "System Admin") {
        companies = await DB_CLIENT.query(
          `SELECT  (c.name) AS company_name,c.uuid AS company_uuid from companies c
        where c.is_active = 1 ORDER BY id DESC`,
          {
            type: QueryTypes.SELECT,
          }
        );
      } else if (
        request.active_role_name === "Rating Analyst" ||
        request.active_role_name === "Group Head" ||
        request.active_role_name === "Rating Head"
      ) {
        companies = await DB_CLIENT.query(
          `SELECT  (c.name) AS company_name,c.uuid AS company_uuid from companies c
        where c.id IN (select DISTINCT(company_id) from mandates where ${foreign_key} = :id ) 
        ORDER BY id DESC`,
          {
            replacements: {
              id: request.user.id,
            },
            type: QueryTypes.SELECT,
          }
        );
      }
      reply.send({
        success: true,
        companies: companies,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/group_head/companies", async (request, reply) => {
    try {
      const { params } = request.body;
      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const mandates = await Mandate.findAll({
        where: {
          gh_id: request.user.id,
          is_active: true,
          mandate_status: "ASSIGNED",
          company_id: company.id,
        },
        raw: true,
      });

      console.log("mandates: ", mandates);

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
        },
        raw: true,
      });

      const mandate_ids = mandates.map((el) => {
        return el.id;
      });

      let transaction_instruments = await TransactionInstrument.findAll({
        where: {
          mandate_id: mandate_ids,
          is_active: true,
        },
        include: [
          {
            model: Mandate,
            as: "mandate",
            attributes: {
              exclude: ["id"],
            },
            include: [
              {
                model: Company,
                as: "company_mandate",
                attributes: ["uuid", "name"],
              },
              {
                model: BranchOffice,
                as: "branch_office",
                attributes: ["uuid", "name"],
              },
            ],
          },
          {
            model: InstrumentCategory,
            as: "instrument_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: InstrumentSubCategory,
            as: "instrument_sub_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: Instrument,
            as: "instrument",
            attributes: {
              exclude: ["id"],
            },
            include: {
              model: RatingSymbolCategory,
              as: "rating_symbol_category",
            },
          },
          {
            model: InstrumentDetail,
            as: "instrument_detail",
            attributes: [
              "uuid",
              "proposed_long_term_rating",
              "proposed_short_term_rating",
              "proposed_outlook",
              "model_based_long_term_rating",
              "model_based_short_term_rating",
            ],
            where: {
              is_workflow_done: false,
              is_active: true,
            },
            include: {
              model: RatingProcess,
              as: "rating_process",
            },
          },
        ],
        order: [["mandate_id", "ASC"]],
        raw: true,
        nest: true,
      });

      const result = await Promise.all(
        transaction_instruments.map(async (el) => {
          const previous_record = await DB_CLIENT.query(
            `SELECT long_term_rating_assgined_text, long_term_outlook FROM rating_committee_meeting_registers WHERE transaction_instrument_id= :id AND is_fresh = 1`,
            {
              replacements: {
                id: el.id,
              },
              type: QueryTypes.SELECT,
            }
          );

          const agenda_type = await DB_CLIENT.query(
            `SELECT rp.name AS agenda_type FROM instrument_details id
            INNER JOIN rating_processes rp ON id.agenda_type_id = rp.id
             WHERE id.transaction_instrument_id = :id AND id.is_workflow_done = 0`,
            {
              replacements: {
                id: el.id,
              },
              type: QueryTypes.SELECT,
            }
          );

          el.instrument_detail.previous_rating = previous_record.length
            ? previous_record[0].long_term_rating_assgined_text
            : null;
          el.instrument_detail.previous_outlook = previous_record.length
            ? previous_record[0].long_term_outlook
            : null;
          el.instrument_detail.agenda_type = agenda_type.length
            ? agenda_type[0].agenda_type
            : null;

          console.log("el: ", el);
          return el;
        })
      );

      console.log("result : ", result);

      reply.send({
        success: true,
        transaction_instruments: result,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/companies/edit_mandates", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Company.Edit");

      let parent_mandate_object =
        params["parent_mandate_id"] != null
          ? await Mandate.findOne({
              where: {
                mandate_id: params["parent_mandate_id"],
                is_active: true,
              },
              raw: true,
            })
          : null;

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
        },
      });

      const financial_year = await FinancialYear.findOne({
        where: {
          is_current_fy: true,
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

      const bd = await User.findOne({
        where: {
          uuid: params["bd_uuid"],
        },
      });

      if (!bd) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_BUSINESS_DEVELOPER_FOUND"],
        });
        return;
      }

      const rh = await User.findOne({
        where: {
          uuid: params["rh_uuid"],
        },
      });

      if (!rh) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_RATING_HEAD_FOUND"],
        });
        return;
      }

      await Promise.all([
        check_stake_in_company({
          user_id: rh.id,
          company_id: company.id,
          financial_year_id: financial_year.id,
          reply: reply,
          stake_check_for: "RH",
        }),
        check_stake_in_company({
          user_id: bd.id,
          company_id: company.id,
          financial_year_id: financial_year.id,
          reply: reply,
          stake_check_for: "BD",
        }),
      ]);

      const gh = await User.findOne({
        where: {
          uuid: params["gh_uuid"],
        },
      });

      const ra = await User.findOne({
        where: {
          uuid: params["ra_uuid"],
          is_active: true,
        },
      });

      const branch_office = await BranchOffice.findOne({
        where: {
          uuid: params["branch_office_uuid"],
        },
      });

      const mandate_object = await Mandate.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      // console.log("mandate_object----->", mandate_object);

      if (!mandate_object || mandate_object.is_verified) {
        reply.statusCode = 403;
        reply.send({
          success: false,
          error: "NO_MANDATE_FOUND",
        });
        return;
      }

      const last_updated_mandate = await DB_CLIENT.query(
        `SELECT TOP 1 * from mandates order by created_at DESC `,
        {
          type: QueryTypes.SELECT,
        }
      );

      const check_instrument = await DB_CLIENT.query(
        `SELECT id.id FROM transaction_instruments ti 
        INNER JOIN instrument_details id ON id.transaction_instrument_id = ti.id
        WHERE ti.mandate_id = :mandate_id`,
        {
          replacements: {
            mandate_id: mandate_object.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      if(check_instrument.length === 0){
        reply.statusCode = 403;
        return reply.send({
          success: false,
          error: "Instrument not assigned to the mandate",
        });
      }

      // console.log("last_updated_mandate: ", last_updated_mandate);
      const un_no = mandate_object.id + 1000;

      const generated_mandate_id =
        new Date().toISOString().split("T")[0] +
        "/" +
        bd.full_name
          .split(" ")
          .map((word) => word.charAt(0))
          .join("") +
        "/" +
        un_no;

      console.log("generated_mandate_id: ", generated_mandate_id);

      if (mandate_object.is_verified) {
        reply.statusCode = 403;
        return reply.send({
          success: false,
          error: "MANDATE NOT EDITABLE",
        });
      }

      var workflow_instance_log = {};

      if (params["is_verified"] && !parent_mandate_object) {
        await DB_CLIENT.query(
          `UPDATE mandates set mandate_id= :mandate_id where id= :id`,
          {
            replacements: {
              mandate_id: generated_mandate_id,
              id: mandate_object.id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        let d = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        d = moment(d).add(5, "hours").format("YYYY-MM-DD HH:mm:ss");
        d = moment(d).add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");

        const financial_year_id = await DB_CLIENT.query(
          `SELECT fy.id FROM financial_years fy WHERE :cur_date >= fy.start_date AND :cur_date <= fy.end_date`,
          {
            replacements: {
              cur_date: d,
            },
            type: QueryTypes.UPDATE,
          }
        );

        const rating_process = await RatingProcess.findOne({
          where: {
            name: "Initial",
            is_active: true,
          },
          raw: true,
        });

        await DB_CLIENT.query(
          `UPDATE instrument_details set rating_process_id= :rating_process_id, agenda_type_id= :rating_process_id WHERE 
          transaction_instrument_id IN (SELECT id from transaction_instruments WHERE mandate_id = :mandate_id)`,
          {
            replacements: {
              rating_process_id: rating_process.id,
              mandate_id: mandate_object.id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        const configs = await DB_CLIENT.query(
          `SELECT wc.id FROM workflow_configs wc WHERE wc.current_activity_id IN (SELECT id FROM
             activities a WHERE a.code IN (10100, 10000, 10050)) AND wc.rating_process_id = :rating_process_id             
        `,
          {
            replacements: {
              rating_process_id: rating_process.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        if (!financial_year_id.length || !rating_process || !configs.length) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "Couldn't start the workflow on this mandate",
          });
          return;
        }

        // console.log("financial_year_id: ", financial_year_id);

        await DB_CLIENT.query(
          `UPDATE mandates set mandate_status= 'Assigned' where id= :id`,
          {
            replacements: {
              mandate_id: generated_mandate_id,
              id: mandate_object.id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        const workflow_instance = await WorkflowInstance.create({
          uuid: uuidv4(),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          assigned_at: new Date(),
          performed_at: new Date(),
          financial_year_id: financial_year_id[0][0].id,
          rating_process_id: rating_process.id,
        });

        // console.log("workflow_instance: ", workflow_instance);

        await workflow_instance.setCompany(company);
        await workflow_instance.setMandate(mandate_object);

        const bulk_data = [];

        configs.map((el) => {
          const obj = {
            uuid: uuidv4(),
            log: "ASSIGNED TO RH",
            ip_address: params["ip_address"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            assigned_at: new Date(),
            performed_at: new Date(),
            created_by: request.user.id,
            updated_by: request.user.id,
            assigned_by: bd.id,
            performed_by: rh.id,
            workflow_config_id: el.id,
            workflow_instance_id: workflow_instance.id,
          };
          bulk_data.push(obj);
        });

        // const allocation_params = {
        //   bd_id: bd_id
        // }

        // manage_allocation_history(allocation_params);

        workflow_instance_log = await WorkflowInstanceLog.bulkCreate(bulk_data);

        await DB_CLIENT.query(
          `UPDATE workflow_instances_log set is_active = 0, status = 'Completed' 
          WHERE workflow_config_id IN (23,24);           
        `,
          {
            type: QueryTypes.UPDATE,
          }
        );

        const email_params = {
          activity_code: 10050,
          activity_name: "Assign Mandate to Rating Head",
          template_type: EMAIL_TEMPLATE.WORKFLOW_ASSIGNMENT,
          rating_process: rating_process.name,
          to_user_name: rh.full_name,
          from_user_name: bd.full_name,
          to_user_email: rh.email,
          company: company.name,
          mandate_type: mandate_object.mandate_type,
          total_size: mandate_object.total_size,
        };
        // console.log("email_params: ", email_params);
        SEND_GENERAL_EMAIL(email_params);
      }

      if (parent_mandate_object && params["is_verified"]) {
        const child_mandate = await DB_CLIENT.query(
          `SELECT TOP 1 mandate_id FROM mandates m WHERE parent_mandate_id =:id AND m.mandate_id IS NOT NULL ORDER BY updated_at DESC`,
          {
            replacements: {
              id: parent_mandate_object.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        if (child_mandate.length > 0 && child_mandate[0].mandate_id) {
          let suffix_no =
            parseInt(child_mandate[0].mandate_id.split("/")[3]) + 1;
          generated_child_mandate_id =
            parent_mandate_object.mandate_id + `/${suffix_no}`;
        } else {
          generated_child_mandate_id = parent_mandate_object.mandate_id + `/1`;
        }

        await DB_CLIENT.query(
          `UPDATE mandates set mandate_id= :mandate_id where id= :id`,
          {
            replacements: {
              mandate_id: generated_child_mandate_id,
              id: mandate_object.id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        let rating_process_name = null;

        const parent_rating_proces = await DB_CLIENT.query(
          `SELECT TOP 1 rp.name FROM workflow_instances wi
          INNER JOIN rating_processes rp ON rp.id = wi.rating_process_id 
          WHERE mandate_id = :mandate_id ORDER BY wi.id DESC               
        `,
          {
            replacements: {
              mandate_id: parent_mandate_object.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log("parent_rating_proces: ", parent_rating_proces);

        if (parent_rating_proces[0].name === "Surveillance") {
          rating_process_name = "Surveillance cum Enhancement";
        } else {
          rating_process_name = "Enhancement";
        }

        const rating_process = await RatingProcess.findOne({
          where: {
            name: rating_process_name,
            is_active: true,
          },
          raw: true,
        });

        if (!rating_process_name) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: `${parent_rating_proces[0].name} is running on the parent mandate so couldn't start new workflow on child mandate`,
          });
          return;
        }

        const total_size = await DB_CLIENT.query(
          `SELECT SUM(instrument_size) AS instrument_size FROM transaction_instruments where mandate_id = :id AND is_active = 1`,
          {
            replacements: {
              id: parent_mandate_object.id
              },
            type: QueryTypes.SELECT,
          }
        );
  
        await DB_CLIENT.query(
          `UPDATE mandates set total_size = :total_size where id= :id`,
          {
            replacements: {
              id: parent_mandate_object.id,
              total_size: total_size[0].instrument_size + params["total_size"]
            },
            type: QueryTypes.UPDATE,
          }
        );

        // const workflow_instance = await WorkflowInstance.create({
        //   uuid: uuidv4(),
        //   log: "ASSIGNED TO RA",
        //   is_active: true,
        //   created_at: new Date(),
        //   updated_at: new Date(),
        //   created_by: request.user.id,
        //   updated_by: request.user.id,
        //   mandate_id: parent_mandate_object.id,
        //   company_id: company.id,
        // });

        const start_workflow_params = {
          rating_process: rating_process.id,
          mandate_id: parent_mandate_object.id,
          company_id: company.id,
          request: request,
          instance: null,
          flag: 0,
        };

        await start_workflow(start_workflow_params);
      }

      const mandate = await Mandate.update(
        APPEND_USER_DATA(request, {
          mandate_source: params["mandate_source"],
          mandate_status: params["mandate_status"],
          mandate_date: params["mandate_date"],
          mandate_type: params["mandate_type"],
          total_size: params["total_size"],
          initial_fee_charged: params["initial_fee_charged"],
          bases_point: params["bases_point"],
          remark: params["remark"],
          surveillance_fee_charged: params["surveillance_fee_charged"],
          minimum_surveillance_fee: params["minimum_surveillance_fee"],
          surveillance_bases_point: params["surveillance_bases_point"],
          received_date: params["received_date"],
          is_verified: params["is_verified"],
          is_active: params["is_active"],
          parent_mandate_id: parent_mandate_object
            ? parent_mandate_object.id
            : null,
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      if (gh) {
        mandate_object.setBusiness_developer(gh);
      }
      if (ra) {
        mandate_object.setBusiness_developer(ra);
      }
      mandate_object.setBusiness_developer(bd);
      mandate_object.setRating_head(rh);
      mandate_object.setCompany_mandate(company);
      mandate_object.setBranch_office(branch_office);

      reply.send({
        success: true,
        workflow_instance_log: workflow_instance_log,
        mandate_update_result: Boolean(mandate[0] === 1),
      });
    } catch (error) {
      console.log("error: ", error);
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/mandates/assign_documents", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Mandate.Create");

      const mandate = await Mandate.findOne({
        where: {
          uuid: request.body["mandate_uuid"].value,
          is_active: true,
        },
        include: {
          model: Company,
          as: "company_mandate",
          attributes: ["name"],
        },
        raw: true,
        nest: true,
      });

      console.log("mandate: ", mandate);

      if (!mandate) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_MADATE_FOUND"],
        });
        return;
      }

      let document_buffer = {};
      var document_path_part_1_doc = null;
      var document_path_part_2_doc = null;
      if (request.body["mandate_part_1_document"]) {
        document_buffer = await request.body[
          "mandate_part_1_document"
        ].toBuffer();
        document_path_part_1_doc = await UPLOAD_TO_AZURE_STORAGE(
          document_buffer,
          {
            path: request.body.mandate_part_1_document.filename,
          }
        );
        const blob = new Blob([document_buffer]);

        const upload_params = {
          company_name: mandate.company_mandate.name,
          fileName: request.body.mandate_part_1_document.filename,
          file: blob,
          document_type: "mandate_part_1_document",
          request: request,
          rating_process: null
        };

        await upload_file_to_dms(upload_params);
      }
      if (request.body["mandate_part_2_document"]) {
        document_buffer = await request.body[
          "mandate_part_2_document"
        ].toBuffer();
        document_path_part_2_doc = await UPLOAD_TO_AZURE_STORAGE(
          document_buffer,
          {
            path: request.body.mandate_part_2_document.filename,
          }
        );
        const blob = new Blob([document_buffer]);

        const upload_params = {
          company_name: mandate.company_mandate.name,
          fileName: request.body.mandate_part_2_document.filename,
          file: blob,
          document_type: "mandate_part_2_document",
          request: request,
          rating_process: null
        };

        await upload_file_to_dms(upload_params);
      }

      const mandate_documents = await MandateDocument.findOne({
        where: {
          mandate_id: mandate.id,
          is_active: true
        },
        raw: true
      })

      let mandate_document = {};

      mandate_document = await MandateDocument.upsert({
        uuid: request.body.uuid ? request.body.uuid.value : uuidv4(),
        mandate_id: mandate.id,
        mandate_part_1_document: document_path_part_1_doc ? document_path_part_1_doc : mandate_documents?.mandate_part_1_document,
        mandate_part_2_document: document_path_part_2_doc ? document_path_part_2_doc : mandate_documents?.mandate_part_2_document,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      reply.send({
        success: true,
        mandate_document: mandate_document,
      });
    } catch (error) {
      console.log("error: ", error);
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/mandates/delete_documents", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Mandate.Edit");

      const mandate = await Mandate.findOne({
        where: {
          uuid: request.body.mandate_uuid,
          is_active: true,
        },
      });

      if (!mandate) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO_MANDATE_FOUND",
        });
        return;
      }

      const mandate_document_delete = await MandateDocument.update(
        APPEND_USER_DATA(request, {
          mandate_part_2_document: null,
          updated_at: new Date(),
          updated_by: request.user.id,
        }),
        {
          where: {
            mandate_id: mandate.id,
          },
        }
      );

      reply.send({
        success: true,
        mandate_document_delete: mandate_document_delete,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/company/delete_documents", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Company.Edit");

      const { params } = request.body;

      const company = await Company.findOne({
        where: {
          uuid: params.company_uuid,
          is_active: true,
        },
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO_COMPANY_FOUND",
        });
        return;
      }

      const obj = {};

      params.pan ? (obj.pan = null) : "";
      params.tan ? (obj.tan = null) : "";
      params.gst ? (obj.gst = null) : "";

      const company_document_delete = await CompanyDocument.update(
        APPEND_USER_DATA(request, {
          obj,
        }),
        {
          where: {
            company_id: company.id,
          },
        }
      );

      reply.send({
        success: true,
        company_document_delete: company_document_delete,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/mandates/view_documents", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Mandate.View");

      const where_query = {
        uuid: request?.body?.mandate_uuid,
      };

      if (Object.keys(request.body).includes("is_active")) {
        where_query["is_active"] = true;
      }

      const mandate = await Mandate.findOne({
        where: where_query,
      });

      if (!mandate) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_MANDATE_FOUND"],
        });
        return;
      }

      const mandate_documents = await MandateDocument.findOne({
        where: {
          mandate_id: mandate.id,
          is_active: true,
        },
      });

      reply.send({
        success: true,
        mandate_documents: mandate_documents,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/transaction_instruments", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Instruments.List");
      const { params } = request.body;

      const mandates = await Mandate.findAll({
        where: {
          uuid: params["mandate_uuid"],
        },
        raw: true,
      });

      console.log(mandates);

      const mandate_ids = mandates.map((el) => {
        return el.id;
      });

      const where_query = {
        mandate_id: mandate_ids,
      };

      if (Object.keys(params).includes("is_active")) {
        where_query["is_active"] = params["is_active"];
      }

      let transaction_instruments = await TransactionInstrument.findAll({
        where: where_query,
        include: [
          {
            model: Mandate,
            as: "mandate",
            order: [["mandate_id", "DESC"]],
            include: [
              {
                model: User,
                as: "rating_head",
                attributes: ["uuid", "full_name", "employee_code", "email"],
              },
              {
                model: User,
                as: "group_head",
                attributes: ["uuid", "full_name", "employee_code", "email"],
              },
            ],
          },
          {
            model: InstrumentCategory,
            as: "instrument_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: InstrumentSubCategory,
            as: "instrument_sub_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: Instrument,
            as: "instrument",
            attributes: {
              exclude: ["id"],
            },
          },
        ],
        raw: true,
        nest: true,
        order: [["created_at", "DESC"]],
      });

      let copied_ti = transaction_instruments;

      const res = await Promise.all(
        copied_ti.map(async (el) => {
          child_mandates = await DB_CLIENT.query(
            `SELECT m.*,u.full_name AS business_developer,u.employee_code AS bd_code, u2.full_name AS rating_head,
          u2.employee_code AS rating_head_code,bo.name AS branch_office_name FROM mandates m 
          LEFT JOIN users u ON u.id = m.bd_id 
          LEFT JOIN users u2  ON u2.id = m.rh_id
          INNER JOIN branch_offices bo ON bo.id = m.branch_office_id WHERE m.parent_mandate_id = :parent_mandate_id AND m.is_active = 1 ORDER BY m.created_at ASC`,
            {
              replacements: {
                parent_mandate_id: el.mandate.id,
              },
              type: QueryTypes.SELECT,
            }
          );
          el.child_mandates = child_mandates;

          return el;
        })
      );

      reply.send({
        success: true,
        transaction_instruments: res,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/transaction_instruments/view", async (request, reply) => {
    try {
      const { params } = request.body;

      await CHECK_PERMISSIONS(request, "Instruments.View");

      const child_mandate_size = await DB_CLIENT.query(
        `SELECT m2.total_size
        FROM transaction_instruments ti 
        INNER JOIN mandates m ON m.id = ti.mandate_id 
        INNER JOIN mandates m2 ON m2.parent_mandate_id = m.id 
        WHERE ti.uuid = :uuid`,
        {
          replacements: {
            uuid: params.uuid,
          },
          type: QueryTypes.SELECT,
        }
      );

      let transaction_instrument = await TransactionInstrument.findOne({
        where: {
          uuid: params["uuid"],
        },
        include: [
          {
            model: Mandate,
            as: "mandate",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: InstrumentCategory,
            as: "instrument_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: InstrumentSubCategory,
            as: "instrument_sub_category",
            attributes: {
              exclude: ["id"],
            },
          },
          {
            model: Instrument,
            as: "instrument",
            attributes: {
              exclude: ["id"],
            },
          },
        ],
      });

      // child_mandate_size ? transaction_instrument.mandate.total_size = child_mandate_size[0].total_size : transaction_instrument.mandate.total_size;

      const rating_cycle = await DB_CLIENT.query(
        `
        select rp.name as rating_cycle from instrument_details id
        inner join rating_processes rp on rp.id = id.rating_process_id
        inner join transaction_instruments ti on ti.id = id.transaction_instrument_id
        where ti.id = :transaction_instrument_id and rp.is_active = 1
        `,
        {
          replacements: {
            transaction_instrument_id: transaction_instrument.id,
          },
          type: QueryTypes.SELECT,
        }
      );

      console.log("rating_cycle================>", rating_cycle);

      reply.send({
        success: true,
        transaction_instrument: transaction_instrument,
        rating_cycle: rating_cycle.length > 0 ? rating_cycle[0] : {},
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

  fastify.post(
    "/mandates/create_transaction_instrument",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Mandate.Create");
        const { params } = request.body;

        const mandate = await Mandate.findOne({
          where: {
            uuid: params["mandate_uuid"],
            is_active: true,
          },
          raw: true,
        });

        console.log("mandate: ", mandate);

        if (!mandate) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_MANDATE",
          });
          return;
        }

        if (mandate.mandate_status === "SENT TO COMMITTEE") {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "MANDATE ALREADY SENT TO COMMITTEE",
          });
          return;
        }

        const instrument = await Instrument.findOne({
          where: {
            uuid: params["instrument_uuid"],
            is_active: true,
          },
          raw: true
        });

        console.log("instrument : ", instrument);

        if (!instrument) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_INSTRUMENT_FOUND",
          });
          return;
        }

        const category = await InstrumentCategory.findOne({
          where: {
            uuid: params["instrument_category_uuid"],
            is_active: true,
          },
        });

        if (!category) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_INSTRUMENT_CATEGORY_FOUND",
          });
          return;
        }

        const sub_category = await InstrumentSubCategory.findOne({
          where: {
            uuid: params["instrument_sub_category_uuid"],
            is_active: true,
          },
        });

        if (!sub_category) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_INSTRUMENT_SUB_CATEGORY_FOUND",
          });
          return;
        }

        const transaction_instrument = await TransactionInstrument.create({
          uuid: uuidv4(),
          instrument_size: params["instrument_size"],
          placed_date: params["placed_date"],
          is_active: true,
          complexity_level: params["complexity_level"],
          remark: params["remark"],
          issuance_date: params["issuance_date"],
          instrument_listing_status: params["instrument_listing_status"],
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          mandate_id: mandate.id,
          instrument_id: instrument.id
        });

        console.log("transaction_instrument: ", transaction_instrument);

        transaction_instrument.setInstrument_category(category);
        transaction_instrument.setInstrument_sub_category(sub_category);

        let d = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        d = moment(d).add(5, "hours").format("YYYY-MM-DD HH:mm:ss");
        d = moment(d).add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");

        const workflow_instance = await DB_CLIENT.query(
          `SELECT id.rating_process_id, id.agenda_type_id, id.annual_result_date, id.annual_result, id.quarterly_result FROM instrument_details id 
          INNER JOIN transaction_instruments ti ON ti.id = id.transaction_instrument_id AND id.is_workflow_done =0 AND id.rating_process_id is not null
          INNER JOIN mandates m ON m.id = ti.mandate_id AND m.id = :mandate_id`,
          {
            replacements: {
              mandate_id: mandate.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        const rating_process_object = await DB_CLIENT.query(
          `SELECT TOP 1 rp.id FROM 
          mandates m INNER JOIN workflow_instances wi ON wi.mandate_id = m.id AND m.id = :mandate_id AND wi.is_active = 1
          INNER JOIN rating_processes rp ON rp.id = wi.rating_process_id ORDER BY wi.id DESC `,
          {
            replacements: {
              mandate_id: mandate.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log("rating_process_object : ", rating_process_object);

        const model_rating = await DB_CLIENT.query(
          `SELECT rs.model_based_long_term_rating, rs.model_based_short_term_rating, rs.proposed_long_term_rating,
          rs.proposed_short_term_rating, rs.proposed_outlook FROM 
                    companies c
                    INNER JOIN mandates m ON m.company_id = c.id AND m.id = :mandate_id
                    INNER JOIN rating_sheets rs ON rs.company_id = c.id`,
          {
            replacements: {
              mandate_id: mandate.id,
            },
            type: QueryTypes.SELECT,
          }
        );


        const financial_year_id = await DB_CLIENT.query(
          `SELECT fy.id FROM financial_years fy WHERE is_current_fy = 1`,
          {
            type: QueryTypes.SELECT,
          }
        );

        let rating_process_id = null, agenda_type_id = null;
        if (workflow_instance.length > 0) {
          rating_process_id = rating_process_object.length > 0 ? rating_process_object[0].id : null;
          agenda_type_id = workflow_instance[0].agenda_type_id;
        }

        let financial_year = null;
        if (financial_year_id.length > 0) {
          financial_year = financial_year_id[0].id;
        }

        console.log(
          "financial_year  rating_process_id : ",
          financial_year,
          rating_process_id
        );

        const instrument_detail = await InstrumentDetail.create({
          uuid: uuidv4(),
          instrument_size: params["instrument_size"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
          financial_year_id: financial_year,
          rating_process_id: rating_process_object.length > 0 ? rating_process_object[0].id : null,
          agenda_type_id: agenda_type_id,
          annual_result_date: workflow_instance.length > 0 ? workflow_instance[0].annual_result_date : null,
          annual_result: workflow_instance.length > 0 ? workflow_instance[0].annual_result : null,
          quarterly_result: workflow_instance.length > 0 ? workflow_instance[0].quarterly_result: null,
          proposed_long_term_rating: instrument.is_long_term ? model_rating.length > 0 ? model_rating[0].proposed_long_term_rating :null : null,
          proposed_short_term_rating: instrument.is_short_term ? model_rating.length > 0 ? model_rating[0].proposed_short_term_rating :null : null,
          proposed_outlook: instrument.is_long_term ? model_rating.length > 0 ? model_rating[0].proposed_outlook :null : null,
          model_based_long_term_rating: instrument.is_long_term ? model_rating.length > 0 ? model_rating[0].model_based_long_term_rating :null : null,
          model_based_short_term_rating: instrument.is_short_term ? model_rating.length > 0 ? model_rating[0].model_based_short_term_rating :null : null,

        });

        console.log("instrument_detail : ", instrument_detail);

        await instrument_detail.setTransaction_instrument(
          transaction_instrument
        );

        reply.send({
          success: true,
          transaction_instrument_uuid: transaction_instrument.uuid,
          instrument_detail_uuid: instrument_detail.uuid,
        });
      } catch (error) {
        console.log("error: ", error);
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: String(error),
        });
      }
    }
  );

  fastify.post(
    "/mandates/edit_transaction_instrument",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Mandate.Edit");
        const { params } = request.body;

        const mandate = await Mandate.findOne({
          where: {
            uuid: params["mandate_uuid"],
            is_active: true,
          },
        });

        if (!mandate) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        if (mandate.mandate_status === "SENT TO COMMITTEE") {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "Mandate is in committee",
          });
          return;
        }

        const instrument = await Instrument.findOne({
          where: {
            uuid: params["instrument_uuid"],
            is_active: true,
          },
        });

        const category = await InstrumentCategory.findOne({
          where: {
            uuid: params["instrument_category_uuid"],
            is_active: true,
          },
        });

        const sub_category = await InstrumentSubCategory.findOne({
          where: {
            uuid: params["instrument_sub_category_uuid"],
            is_active: true,
          },
        });

        const transaction_instrument_object =
          await TransactionInstrument.findOne({
            where: {
              uuid: params["uuid"],
            },
          });

        const transaction_instrument_update =
          await TransactionInstrument.update(
            APPEND_USER_DATA(request, {
              instrument_size: params["instrument_size"],
              placed_date: params["placed_date"],
              complexity_level: params["complexity_level"],
              remark: params["remark"],
              issuance_date: params["issuance_date"],
              is_active: params["is_active"],
              instrument_listing_status: params["instrument_listing_status"],
            }),
            {
              where: {
                uuid: params["uuid"],
              },
            }
          );

        transaction_instrument_object.setMandate(mandate);
        transaction_instrument_object.setInstrument_category(category);
        transaction_instrument_object.setInstrument_sub_category(sub_category);
        transaction_instrument_object.setInstrument(instrument);

        // console.log(
        //   "transaction_instrument_object---->",
        //   transaction_instrument_object
        // );

        const instrument_detail_update = await InstrumentDetail.update(
          {
            instrument_size: params["instrument_size"],
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            updated_by: request.user.id,
          },
          {
            where: {
              transaction_instrument_id: transaction_instrument_object.id,
              is_active: true,
              is_workflow_done: false,
            },
          }
        );

        reply.send({
          success: true,
          transaction_instrument_update_result: Boolean(
            transaction_instrument_update[0] === 1
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

  fastify.post(
    "/transaction_instrument/edit_instrument_details",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Mandate.Edit");
        const { params } = request.body;

        const mandate = await Mandate.findOne({
          where: {
            uuid: params["mandate_uuid"],
            is_active: true,
          },
        });

        if (!mandate) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_COMPANY"],
          });
          return;
        }

        if (mandate.mandate_status === "SENT TO COMMITTEE") {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: "Mandate is in committee",
          });
          return;
        }

        const transaction_instrument_object =
          await TransactionInstrument.findOne({
            where: {
              uuid: params["transaction_instrument_uuid"],
            },
            raw: true,
          });

        const agenda_type = await RatingProcess.findOne({
          where: {
            uuid: params["agenda_type_uuid"],
          },
          is_active: true,
          raw: true,
        });

        // Update a new record in instrument_details table
        const instrument_detail_new = await InstrumentDetail.update(
          {
            updated_at: new Date(),
            updated_by: request.user.id,
            reduce_enhancement: params.reduce_enhancement,
            instrument_size: params.instrument_size,
            agenda_type_id: agenda_type.id,
          },
          {
            where: {
              transaction_instrument_id: transaction_instrument_object.id,
              is_workflow_done: false,
            },
          }
        );

        const tra_instrument = await TransactionInstrument.update(
          {
            updated_at: new Date(),
            updated_by: request.user.id,
            instrument_size: params.instrument_size,
          },
          {
            where: {
              uuid: params.transaction_instrument_uuid,
            },
          }
        );

        reply.send({
          success: true,
          instrument_detail_update_result: Boolean(
            instrument_detail_new[0] === 1
          ),
        });
      } catch (error) {
        reply.statusCode = 422;
        console.log("error: ", error);
        reply.send({
          success: false,
          error: String(error),
        });
      }
    }
  );

  fastify.post(
    "/transaction_instrument/view_banker_lenders",
    async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "Instruments.View");

        const instrument_detail = await InstrumentDetail.findOne({
          where: {
            uuid: params["instrument_detail_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!instrument_detail) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_TRANSACTION_INSTRUMENT_FOUND"],
          });
          return;
        }

        let banker_lenders = {};

        if (!Object.keys(params).includes("is_active")) {
          banker_lenders = await DB_CLIENT.query(
            `SELECT ti.uuid AS transaction_instrument_uuid, c.name AS bank, c.uuid AS bank_uuid, i.name AS instrument, ic.category_name AS instrument_category_name, isc.category_name AS
            instrument_sub_category_name, bl.* from banker_lenders bl 
            LEFT JOIN companies c ON c.id = bl.bank_id
            INNER JOIN instrument_details id ON id.id =bl.instrument_detail_id 
            INNER JOIN transaction_instruments ti ON ti.id=id.transaction_instrument_id 
            INNER JOIN instrument_categories ic
            ON ic.id = ti.instrument_category_id 
            INNER JOIN instrument_sub_categories isc ON isc.id = ti.instrument_sub_category_id 
            INNER JOIN instruments i ON i.id=ti.instrument_id            
            WHERE id.id = :instrument_id`,
            {
              replacements: {
                instrument_id: instrument_detail.id,
              },
              type: QueryTypes.SELECT,
            }
          );
        }

        banker_lenders = await DB_CLIENT.query(
          `SELECT ti.uuid AS transaction_instrument_uuid, c.name AS bank, c.uuid AS bank_uuid, i.name AS instrument, ic.category_name AS instrument_category_name, isc.category_name AS
          instrument_sub_category_name, bl.* from banker_lenders bl 
          LEFT JOIN companies c ON c.id = bl.bank_id
          INNER JOIN instrument_details id ON id.id =bl.instrument_detail_id 
          INNER JOIN transaction_instruments ti ON ti.id=id.transaction_instrument_id 
          INNER JOIN instrument_categories ic
          ON ic.id = ti.instrument_category_id 
          INNER JOIN instrument_sub_categories isc ON isc.id = ti.instrument_sub_category_id 
          INNER JOIN instruments i ON i.id=ti.instrument_id            
          WHERE id.id = :instrument_id` + ` AND id.is_active=:xyz`,
          {
            replacements: {
              instrument_id: instrument_detail.id,
              xyz: params["is_active"],
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          banker_lenders: banker_lenders,
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
    "/transaction_instrument/copy_banker_lenders",
    async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "Instruments.List");

        const instrument_detail = await InstrumentDetail.findOne({
          where: {
            uuid: params["instrument_detail_uuid"],
          },
          raw: true,
        });

        if (!instrument_detail) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_TRANSACTION_INSTRUMENT_FOUND"],
          });
          return;
        }

        let status = await DB_CLIENT.query(
          `
        select is_copied from banker_lenders where instrument_detail_id = :instrument_detail_id  and is_active = 1
      `,
          {
            replacements: {
              instrument_detail_id: instrument_detail.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        const statusBits = status.map((item) => {
          return item.is_copied;
        });

        if (statusBits[0] == 1) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "NOT ALLOWED",
          });
        }

        const instrument_size = await DB_CLIENT.query(
          `
        select ti.instrument_size from instrument_details id 
        inner join transaction_instruments ti on ti.id = id.transaction_instrument_id 
        where id.id = :instrument_detail_id and ti.updated_at > ti.created_at and id.is_workflow_done = 1
      `,
          {
            replacements: {
              instrument_detail_id: instrument_detail.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        if (instrument_size.length <= 0) {
          reply.statusCode = 422;
          return reply.send({
            success: false,
            error: "NO INSTRUMENT SIZE FOUND",
          });
        }

        console.log("instrument_size=============>", instrument_size);

        const number_of_bl = await DB_CLIENT.query(
          `
        select count(bl.id) as number_of_banker_lenders from banker_lenders bl
        where bl.instrument_detail_id = :instrument_detail_id and bl.is_active = 1
      `,
          {
            replacements: {
              instrument_detail_id: instrument_detail.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log("number_of_bl===========>", number_of_bl);

        const each_bl_size = Math.trunc(
          instrument_size[0].instrument_size /
            number_of_bl[0].number_of_banker_lenders
        );

        console.log("each_bl_size==============>", each_bl_size);

        let banker_lenders_updated = await DB_CLIENT.query(
          `
        SELECT instrument_size, placed_at, is_active, coupon_rate, interest_due_date, maturity_date, rated_amount, outstanding_amount, sanction_amount, interest_rate, asset_classification, purpose, repayment_terms, created_at, updated_at, bank_id, instrument_detail_id, remark from banker_lenders
        WHERE instrument_detail_id = :instrument_detail_id and is_active = 1
      `,
          {
            replacements: {
              instrument_detail_id: instrument_detail.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        console.log(
          "banker_lenders afterrr================>",
          banker_lenders_updated
        );

        await DB_CLIENT.query(
          `
      update banker_lenders set is_active = 0 where id in (select id from banker_lenders where instrument_detail_id = :instrument_detail_id)
    `,
          {
            replacements: {
              instrument_detail_id: instrument_detail.id,
            },
            type: QueryTypes.UPDATE,
          }
        );

        banker_lenders_updated = banker_lenders_updated.map((el) => {
          el.uuid = uuidv4();
          el.is_active = true;
          el.is_copied = true;
          el.instrument_size = each_bl_size;
          return el;
        });

        const banker_lenders_bulk_data = await BankerLender.bulkCreate(
          banker_lenders_updated
        );

        return reply.send({
          success: true,
          banker_lenders_bulk_data: banker_lenders_bulk_data,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    }
  );

  fastify.post("/instrument_details/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Instruments.List");
      const { params } = request.body;

      const transaction_instrument = await TransactionInstrument.findOne({
        where: {
          uuid: params["transaction_instrument_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!transaction_instrument) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_TRANSACTION_INSTRUMENT_FOUND"],
        });
        return;
      }

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!rating_process) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO_RATING_PROCESS_FOUND",
        });
        return;
      }

      const instrument_details = await InstrumentDetail.create({
        uuid: uuidv4(),
        instrument_size: transaction_instrument.instrument_size,
        is_active: true,
        financial_result: params["financial_result"],
        quarterly_result: params["quarterly_result"],
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
        transaction_instrument_id: transaction_instrument.id,
        rating_process_id: rating_process.id,
      });

      reply.send({
        success: true,
        instrument_details_uuid: instrument_details.uuid,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  fastify.post("/instrument_details/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Instruments.Edit");
      const { params } = request.body;

      const transaction_instrument = await TransactionInstrument.findOne({
        where: {
          uuid: params["transaction_instrument_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!transaction_instrument) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_TRANSACTION_INSTRUMENT_FOUND"],
        });
        return;
      }

      const instrument_detail = await InstrumentDetail.findOne({
        where: {
          uuid: params["instrument_detail_uuid"],
          is_active: true,
        },
        raw: true,
      });

      const change =
        params["instrument_size"] - instrument_detail.instrument_size;

      let transaction_instrument_size = await DB_CLIENT.query(
        `SELECT SUM(instrument_size) AS instrument_total_size from transaction_instruments WHERE mandate_id = :mandate_id AND is_active = 1`,
        {
          replacements: {
            mandate_id: transaction_instrument.mandate_id,
          },
          type: QueryTypes.SELECT,
        }
      );

      const transaction_instrument_total_size =
        transaction_instrument_size[0].instrument_total_size + change;

      const mandate = await Mandate.findOne({
        where: {
          id: transaction_instrument.mandate_id,
        },
      });

      if (transaction_instrument_total_size > mandate.total_size) {
        reply.status_code = 403;
        return reply.send({
          success: false,
          error: "Instrument Size Cannot Exceed Mandate Instrument Size!",
        });
      }

      const instrument_detail_update_result = await InstrumentDetail.update(
        APPEND_USER_DATA(request, {
          instrument_size: transaction_instrument_total_size,
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!rating_process) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: "NO_RATING_PROCESS_FOUND",
        });
        return;
      }

      reply.send({
        success: true,
        instrument_detail_update_result: instrument_detail_update_result,
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
    "/transaction_instrument/view_instrument_details",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Instruments.View");
        const { params } = request.body;
        const where_query = {};

        if (Object.keys(params).includes("is_active")) {
          where_query["is_active"] = params["is_active"];
        }

        const transaction_instrument = await TransactionInstrument.findOne({
          where: {
            uuid: params["transaction_instrument_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!transaction_instrument) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_TRANSACTION_INSTRUMENT_FOUND"],
          });
          return;
        }

        where_query.transaction_instrument_id = transaction_instrument.id;

        const instrument_details = await InstrumentDetail.findAll({
          where: where_query,
        });

        reply.send({
          success: true,
          instrument_details: instrument_details,
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
    "/transaction_instrument/banker_lender/view",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Instuments.View");
        const { params } = request.body;

        const where_query = params ? params : {};

        const banker_lender = await BankerLender.findOne({
          where: where_query,
          include: {
            model: Company,
            as: "bank",
          },
        });

        reply.send({
          success: true,
          banker_lender: banker_lender,
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
    "/transaction_instrument/create_banker_lender",
    async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Instruments.Create");
        const { params } = request.body;

        const instrument_detail = await InstrumentDetail.findOne({
          where: {
            uuid: params["instrument_detail_uuid"],
            is_active: true,
          },
        });

        if (!instrument_detail) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_INSTRUMENT_DETAIL_FOUND",
          });
          return;
        }

        const bank = await Company.findOne({
          where: {
            uuid: params["bank_uuid"],
            is_active: true,
          },
        });

        const banker_lender = await BankerLender.create(
          APPEND_USER_DATA(request, {
            uuid: uuidv4(),
            instrument_size: params["instrument_size"],
            placed_at: params["placed_at"],
            coupon_rate: params["coupon_rate"],
            interest_due_date: params["interest_due_date"],
            maturity_date: params["maturity_date"],
            rated_amount: params["rated_amount"],
            outstanding_amount: params["outstanding_amount"],
            sanction_amount: params["sanction_amount"],
            interest_rate: params["interest_rate"],
            asset_classification: params["asset_classification"],
            purpose: params["purpose"],
            remark: params["remark"],
            interest_frequency: params["frequency_interest"],
            principle_repayment_date: params["principle_repayment_date"],
            repayment_terms: params["repayment_terms"],
            is_active: true,
          })
        );

        await banker_lender.setInstrument_detail(instrument_detail);
        if (bank) {
          await banker_lender.setBank(bank);
        }

        reply.send({
          success: true,
          banker_lender_uuid: banker_lender.uuid,
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
    "/transaction_instrument/edit_banker_lender",
    async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "Instruments.Edit");

        const instrument_detail = await InstrumentDetail.findOne({
          where: {
            uuid: params["instrument_detail_uuid"],
            is_active: true,
          },
        });

        if (!instrument_detail) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: "NO_INSTRUMENT_DETAIL_FOUND",
          });
          return;
        }

        const bank = await Company.findOne({
          where: {
            uuid: params["bank_uuid"],
            is_active: true,
          },
        });

        const banker_lender = await BankerLender.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        const banker_lender_update = await BankerLender.update(
          APPEND_USER_DATA(request, {
            instrument_size: params["instrument_size"],
            placed_at: params["placed_at"],
            coupon_rate: params["coupon_rate"],
            interest_due_date: params["interest_due_date"],
            maturity_date: params["maturity_date"],
            rated_amount: params["rated_amount"],
            outstanding_amount: params["outstanding_amount"],
            sanction_amount: params["sanction_amount"],
            interest_rate: params["interest_rate"],
            asset_classification: params["asset_classification"],
            purpose: params["purpose"],
            repayment_terms: params["repayment_terms"],
            interest_frequency: params["frequency_interest"],
            principle_repayment_date: params["principle_repayment_date"],
            is_active: params["is_active"],
          }),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        await banker_lender.setInstrument_detail(instrument_detail);
        await banker_lender.setBank(bank);

        reply.send({
          success: true,
          banker_lender_update_result: Boolean(banker_lender_update[0] === 1),
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
    "/transaction_instrument/rating_metadata",
    async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "Instruments.List");

        // let flag = 0;

        // Object.keys(params).forEach((el) => {
        //   if (el === 'is_active') {
        //     flag = 1;
        //   }
        // });

        const transaction_instrument = await TransactionInstrument.findOne({
          where: {
            uuid: params["transaction_instrument_uuid"],
            is_active: true,
          },
          raw: true,
        });

        if (!transaction_instrument) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_TRANSACTION_INSTRUMENT_FOUND"],
          });
          return;
        }

        let rating_metadata = await DB_CLIENT.query(
          `SELECT id.uuid AS instrument_details_uuid,id.id,id.reduce_enhancement, fy.reference_date AS financial_year,
          CASE
                WHEN rcmr.is_deferred = 1
                    THEN CONCAT(rp.name, '/', 'Deferred')
                 ELSE rp.name
            END
           AS rating_cycle
          ,rcmr.rating_action,rcmr.is_active AS mandate_status, rcmr.long_term_outlook AS outlook,rcmr.previous_rating,
          rp1.name AS agenda_type,rp1.uuid AS agenda_type_uuid,
         rcmr.long_term_rating_assgined_text AS rating, id.press_release_date AS press_release,id.quarterly_result,id.annual_result,id.annual_result_date,id.rating_letter_date,
          id.rating_acceptance_status 
                   AS rating_acceptance, ti.uuid AS transaction_instrument_uuid, rcm.meeting_at AS meeting_date, id.instrument_size,id.press_release_date,id.provisional_communication_date,
                   id.rating_acceptance_date,
                   CASE
                    WHEN id.is_workflow_done = 1 THEN 'Closed'
                    ELSE 'Active'
                   END AS workflow_status 
                  from transaction_instruments ti 
                  INNER JOIN instrument_details id ON id.transaction_instrument_id  = ti.id 
                  INNER JOIN rating_processes rp ON rp.id = id.rating_process_id 
                  LEFT JOIN rating_processes rp1 ON rp1.id = id.agenda_type_id
                  LEFT JOIN financial_years fy ON fy.id = id.financial_year_id
                  LEFT JOIN rating_committee_meeting_registers rcmr ON rcmr.instrument_detail_id  = id.id
                  LEFT JOIN rating_committee_meetings rcm ON rcm.id = rcmr.rating_committee_meeting_id
        WHERE ti.id = :transaction_instrument_id ORDER BY id.id ASC`,
          {
            replacements: {
              transaction_instrument_id: transaction_instrument.id,
            },
            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          rating_metadata: rating_metadata,
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

  fastify.post("/companies/inc_rating", async (request, reply) => {
    try {
      const { params } = request.body;

      const company = await Company.findOne({
        where: {
          uuid: params["company_uuid"],
          is_active: true,
        },
        raw: true,
      });

      if (!company) {
        reply.status_code = 403;
        reply.send({
          success: false,
          error: L["NO_COMPANY"],
        });
        return;
      }

      const month_difference = MONTH_DIFFERENCE(
        params["rating_date"],
        new Date()
      );

      const flag = month_difference > 12 ? 0 : 1;

      if (flag) {
        const email_params = {
          template_type: EMAIL_TEMPLATE.INC_CASE_ENCOUNTERED,
          to_user_name: request.user.full_name,
          from_user_name: request.user.full_name,
          to_user_email: request.user.email,
          company: company.name,
          rating_agency: params["agency"],
        };
        SEND_GENERAL_EMAIL(email_params);
      }

      const inc_rating = await IncCasesRating.create(
        APPEND_USER_DATA(request, {
          uuid: uuidv4(),
          agency: params["agency"],
          rating_date: params["rating_date"],
          is_active: true,
          created_at: new Date(),
          created_by: request.user.id,
          company_id: company.id,
        })
      );

      reply.send({
        success: true,
        inc_rating: inc_rating,
        create_mandate: flag,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: String(error),
      });
    }
  });

  // Only ADMIN can access these routes
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

    fastify.post("/users", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.List");
        const { limit, offset, department_uuid, role_uuid, designation } =
          request?.body;
        let llimit = limit;
        let ooffset = offset;
        if (limit === "all") {
          llimit = 10000;
        }
        // let whereClause =
        //   Object.keys(request.body).length === 0 ? {} : request.body;
        let whereClauseRole = {};
        let whereClauseDepartment = {};
        let whereClauseDesignation = {};
        if (role_uuid !== null) {
          const role = await Role.findOne({
            where: {
              uuid: request.body?.role_uuid,
            },
            raw: true,
          });
          if (role !== null) {
            whereClauseRole = {
              id: role ? role?.id : null,
            };
          }
        }

        if (department_uuid !== null) {
          const department = await Department.findOne({
            where: {
              uuid: department_uuid,
            },
          });
          if (department != null) {
            whereClauseDepartment = { id: department?.id };
          }
        }
        if (designation !== null) {
          const designation_ = await UserAttribute.findOne({
            where: {
              designation: designation,
            },
          });
          if (designation_ !== null) {
            whereClauseDesignation = {
              designation: designation_?.designation
                ? designation_?.designation
                : null,
            };
          }
        }
        // whereClause["is_super_account"] = false;
        const users = await User.findAndCountAll({
          attributes: [
            "id",
            "uuid",
            "full_name",
            "employee_code",
            "email",
            "login_type",
            "is_active",
            "created_at",
          ],
          include: [
            {
              model: Role,
              as: "roles",
              where: whereClauseRole,
              attributes: ["uuid", "name"],
              required: false,
            },
            {
              model: Department,
              as: "departments",
              where: whereClauseDepartment,
              attributes: {
                exclude: ["id"],
              },
              required: false,
            },
            {
              model: UserAttribute,
              attributes: {
                exclude: ["id"],
              },
              where: whereClauseDesignation,
              include: [
                {
                  model: User,
                  as: "user_attr_created_by",
                  attributes: ["uuid", "full_name", "email"],
                },
                {
                  model: User,
                  as: "user_attr_updated_by",
                  attributes: ["uuid", "full_name", "email"],
                },
              ],
              required: false,
            },
          ],
          limit: llimit,
          offset: ooffset,
          order: [["created_at", "DESC"]],
        });

        reply.send({
          success: true,
          users: users,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/users/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.Create");

        if (!request.user.is_super_account) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_ACCESS_TO_MODULE"],
          });
        }

        const { params } = request.body;

        const roles = await Role.findAll({
          where: {
            uuid: params["roles_id"],
            is_active: true,
          },
        });

        if (roles.length === 0) {
          reply.statusCode = 403;
          return reply.send({
            success: false,
            error: L["NO_ROLE"],
          });
        }

        const user = await User.create(
          APPEND_USER_DATA(request, {
            uuid: uuidv4(),
            full_name: params["full_name"],
            email: params["email"],
            password: bcrypt.hashSync(params["password"], 12),
            login_type: params["login_type"],
            is_super_account: false,
            is_active: true,
            employee_code: params["emp_code"],
            created_at: new Date(),
            created_by: request.user.id,
          })
        );

        // const emp_code = "IN-" + String(1000 + user.id);

        // await DB_CLIENT.query(
        //   `UPDATE users set employee_code = :employee_code where id = ${user.id};`,
        //   {
        //     replacements: {
        //       employee_code: emp_code,
        //     },
        //     type: QueryTypes.UPDATE,
        //   }
        // );

        await user.setRoles(roles);

        const departments = await Department.findAll({
          where: {
            uuid: params["department_id"],
            is_active: true,
          },
        });
        if (departments.length !== 0) {
          await user.setDepartments(departments);
        }

        const user_attribute = await UserAttribute.create(
          APPEND_USER_DATA(request, {
            office_address: params["attributes"]["office_address"],
            designation: params["attributes"]["designation"],
            profile_image: params["attributes"]["profile_image"],
            employment_status: params["attributes"]["employment_status"],
            gender: params["attributes"]["gender"],
            address: params["attributes"]["address"],
            contact_number: params["attributes"]["contact_number"],
            office_contact_number:
              params["attributes"]["office_contact_number"],
            marital_status: params["attributes"]["marital_status"],
            location: params["attributes"]["location"],
            date_of_birth: params["attributes"]["date_of_birth"],
            date_of_joining: params["attributes"]["date_of_joining"],
            date_of_termination: params["attributes"]["date_of_termination"],
            is_active: true,
            created_at: new Date(),
            created_by: request.user.id,
          })
        );
        await user_attribute.setUser([user.id]);

        const reports_to_user = await User.findOne({
          where: {
            uuid: params["first_reporting_person_uuid"],
            is_active: true,
          },
          attributes: ["id"],
        });
        if (reports_to_user) {
          await user.isReportsTo(reports_to_user.id);
        }

        reply.send({
          success: true,
          user: user,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/users/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.Edit");

        if (!request.user.is_super_account) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_ACCESS_TO_MODULE"],
          });
        }
        const { params } = request.body;

        const roles = await Role.findAll({
          where: {
            uuid: params["roles_id"],
            is_active: true,
          },
        });
        if (roles.length === 0) {
          reply.statusCode = 403;
          reply.send({
            success: false,
            error: L["NO_ROLE"],
          });
          return;
          return;
        }

        let departments = {};
        if (params["department_id"]) {
          departments = await Department.findAll({
            where: {
              uuid: params["department_id"],
              is_active: true,
            },
          });
        }

        const user_object = await User.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        let user_update_query = {
          full_name: params["full_name"],
          email: params["email"],
          login_type: params["login_type"],
          employee_code: params["emp_code"],
          is_active: params["is_active"],
        };

        if (params["password"]) {
          user_update_query["password"] = bcrypt.hashSync(
            params["password"],
            12
          );
        }

        const user_update_result = await User.update(
          APPEND_USER_DATA(request, user_update_query),
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );
        await user_object.setRoles(roles);

        if (departments.length !== 0) {
          await user_object.setDepartments(departments);
        }

        const user_attribute_update_result = await UserAttribute.update(
          APPEND_USER_DATA(request, {
            office_address: params["attributes"]["office_address"],
            designation: params["attributes"]["designation"],
            profile_image: params["attributes"]["profile_image"],
            employment_status: params["attributes"]["employment_status"],
            gender: params["attributes"]["gender"],
            address: params["attributes"]["address"],
            contact_number: params["attributes"]["contact_number"],
            office_contact_number:
              params["attributes"]["office_contact_number"],
            marital_status: params["attributes"]["marital_status"],
            location: params["attributes"]["location"],
            date_of_birth: params["attributes"]["date_of_birth"],
            date_of_joining: params["attributes"]["date_of_joining"],
            date_of_termination: params["attributes"]["date_of_termination"],

          }),
          {
            where: {
              user_id: user_object.id,
            },
          }
        );

        const reports_to_user = await User.findOne({
          where: {
            uuid: params["first_reporting_person_uuid"],
            is_active: true,
          },
          attributes: ["id"],
        });
        if (reports_to_user) {
          await user_object.isReportsTo(reports_to_user.id);
        }

        reply.send({
          success: true,
          user_update_result: Boolean(user_update_result[0] === 1),
          user_attribute_update_result: Boolean(
            user_attribute_update_result[0] === 1
          ),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/users/upload_profile_image", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.Create");

        let document_path = null;
        if (request.body["profile_image"]) {
          const document_buffer = await request.body[
            "profile_image"
          ].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.profile_image.filename,
          });
        }

        profile_image_update = await DB_CLIENT.query(
          `UPDATE user_attributes set profile_image = :profile_image WHERE user_id=:user_id `,
          {
            type: QueryTypes.UPDATE,
            replacements: {
              profile_image: document_path,
              user_id: request.user.id,
            },
          }
        );

        const profile_image = await DB_CLIENT.query(
          `SELECT profile_image FROM user_attributes WHERE user_id=:user_id `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              user_id: request.user.id,
            },
          }
        );

        reply.send({
          success: true,
          profile_image_update_result: Boolean(profile_image_update[1] === 1),
          profile_image: profile_image[0].profile_image,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/users/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.View");

        // if (!request.user.is_super_account) {
        //   reply.status_code = 403;
        //   reply.send({
        //     success: false,
        //     error: L["NO_ACCESS_TO_MODULE"],
        //   });
        // }

        const user = await User.findOne({
          where: {
            uuid: request.body.uuid,
          },
          attributes: [
            "uuid",
            "full_name",
            "email",
            "login_type",
            "employee_code",
            "password",
            "is_active",
            "created_at",
            "updated_at",
            "trashed_at",
          ],
          include: [
            {
              model: Role,
              as: "roles",
              attributes: {
                exclude: ["id", "is_super_seed_role"],
              },
            },
            {
              model: Department,
              as: "departments",
              attributes: {
                exclude: ["id", "is_super_seed_role"],
              },
            },
            {
              model: User,
              as: "created_by_user",
              attributes: ["uuid", "full_name", "email"],
            },
            {
              model: User,
              as: "updated_by_user",
              attributes: ["uuid", "full_name", "email"],
            },
            {
              model: User,
              as: "trashed_by_user",
              attributes: ["uuid", "full_name", "email"],
            },
            {
              model: UserAttribute,
              attributes: {
                exclude: ["id"],
              },
              include: [
                {
                  model: User,
                  as: "user_attr_created_by",   
                  attributes: ["uuid", "full_name", "email"],
                },
                {
                  model: User,
                  as: "user_attr_updated_by",
                  attributes: ["uuid", "full_name", "email"],
                },
              ],
            },
            {
              model: User,
              as: "report_to_user",
              attributes: ["uuid", "full_name", "email"],
            },
          ],
        });
        reply.send({
          success: true,
          user: user,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/users/delete", async (request, reply) => {
      try {
        const { params } = request.body;

        await CHECK_PERMISSIONS(request, "User.Edit");

        const user = await User.update(
          {
            is_active: false,
            updated_at: new Date(),
          },
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          user_update_done: Boolean(user[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });
    // change password of user uuid, old_password, new_password
    fastify.post("/users/change-password", async (request, reply) => {
      try {
        let { uuid, old_password, new_password } = request.body;
        // checking user exist or not
        const user = await User.findOne({
          where: {
            uuid: uuid,
          },
        });
        if (!user) {
          reply.statusCode = 422;
          reply.send({
            success: false,
            error: "User not found!",
          });
        }
        // check old password
        if (request.user.is_super_account !== true) {
          const result = await bcrypt.compare(old_password, user["password"]);
          if (!result) {
            reply.statusCode = 422;
            reply.send({
              success: false,
              error: "Password not match",
            });
          }
        }
        // updating password
        await User.update(
          {
            password: bcrypt.hashSync(new_password, 12),
            updated_at: new Date(),
          },
          {
            where: { uuid: uuid },
          }
        );
        reply.send({
          success: true,
          message: "Password successfully changed",
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });
    // change password by admin

    fastify.post("/users/get_user_for_reporting", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.View");
        const { params } = request.body;

        const where_query = {
          is_active: true,
          is_super_account: false,
        };

        if (params.uuid) {
          where_query.uuid = {
            [Op.ne]: params.uuid,
          };
        }
        await CHECK_PERMISSIONS(request, "User.View");

        const users = await User.findAll({
          attributes: ["full_name", "uuid", "email"],
          where: where_query,
        });
        reply.send({
          success: true,
          users: users,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/users/e_sign_image", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "User.Create");
        
        let userData;
        if (request.body.user_uuid) {
          userData = await User.findOne({ where: { uuid: request.body.user_uuid?.value }, raw: true })
        }

        let document_path = null;
        if (request.body["e_sign_image"]) {
          const document_buffer = await request.body[
            "e_sign_image"
          ].toBuffer();
          document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
            path: request.body.e_sign_image.filename,
          });
        }
        const e_sign_image_update = await UserAttribute.update(APPEND_USER_DATA(request,{
          e_sign_image: document_path,
        }),
          {
            where: {
              user_id: userData?.id || request.user.id
            }
          }
        )
        reply.send({
          success: true,
          e_sign_image_update_result: Boolean(e_sign_image_update[0] === 1),
          e_sign_image: document_path, 
        }); 
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/roles", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Roles.List");
        const { params } = request.body;

        const where_query = params ? params : {};
        where_query.is_super_seed_role = false;

        const roles = await Role.findAll({
          where: where_query,
          attributes: ["uuid", "name", "description", "is_active"],
          include: {
            model: Permission,
            attributes: ["uuid", "name", "description"],
            include: {
              model: Navigation,
              attributes: [
                "uuid",
                "name",
                "path",
                "description",
                "menu_position",
                "is_sidebar_visible",
                "icon",
              ],
              include: {
                model: Navigation,
                as: "parent_navigation",
                attributes: ["uuid", "name", "path", "description"],
              },
            },
          },
          order: [["created_at", "DESC"]],
        });

        reply.send({
          success: true,
          roles: roles,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/roles/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Role.View");

        const role = await Role.findOne({
          where: {
            uuid: request.body.uuid,
            is_super_seed_role: false,
          },
          attributes: ["uuid", "name", "description", "is_active"],
          include: {
            model: Permission,
            attributes: ["uuid", "name", "description"],
            include: {
              model: Navigation,
              attributes: [
                "uuid",
                "name",
                "path",
                "description",
                "menu_position",
                "is_sidebar_visible",
                "icon",
              ],
              include: {
                model: Navigation,
                as: "parent_navigation",
                attributes: ["uuid", "name", "path", "description"],
              },
            },
          },
          order: [["id", "DESC"]],
        });

        reply.send({
          success: true,
          role: role,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/roles/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Role.Create");
        const { params } = request.body;

        const permissions = await Permission.findAll({
          where: {
            uuid: params["permissions_uuid"],
            is_active: true,
          },
          attributes: ["id"],
        });

        if (permissions.length === 0) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_PERMISSIONS_SELECTED"],
          });
        }

        const role = await Role.create({
          uuid: uuidv4(),
          is_super_seed_role: false,
          name: params["name"],
          description: params["description"],
          is_active: true,
          is_super_seed_role: false,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (permissions) {
          await role.setPermissions(permissions);
        }

        reply.send({
          success: true,
          role_uuid: role.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/roles/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Role.Edit");
        const { params } = request.body;

        const permissions = await Permission.findAll({
          where: {
            uuid: params["permissions_uuid"],
            is_active: true,
          },
          attributes: ["id"],
        });

        if (permissions.length === 0) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_PERMISSIONS_SELECTED"],
          });
        }

        const role = await Role.update(
          {
            description: params["description"],
            is_active: params["is_active"],
            updated_at: new Date(),
          },
          {
            where: {
              uuid: params["uuid"],
              is_super_seed_role: false,
            },
          }
        );

        const role_for_permission = await Role.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        if (permissions && role_for_permission) {
          await role_for_permission.setPermissions(permissions);
        }

        reply.send({
          success: true,
          role_update_done: Boolean(role[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/roles/delete", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Role.Edit");
        const { params } = request.body;

        const role = await Role.update(
          {
            is_active: false,
            updated_at: new Date(),
          },
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          role_update_done: Boolean(role[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/roles/view_users", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Role.List");

        const role = await Role.findOne({
          where: {
            name: { [Op.like]: `%${request.body.role}%` },
            is_super_seed_role: false,
            is_active: true,
          },
          attributes: ["uuid", "name", "description"],
          include: {
            model: User,
            as: "users",
            where: {
              is_active: true,
            },
            attributes: ["id", "uuid", "full_name", "email", "employee_code"],
          },
        });

        reply.send({
          success: true,
          role: role,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/permissions/tree_structure/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Permission.List");

        const { params } = request.body;

        const role = await Role.findOne({
          where: {
            uuid: params["role_uuid"],
            is_active: true,
          },
          raw: true,
        });

        // if(!role){
        //   reply.status_code = 403;
        //   return reply.send({
        //     success: false,
        //     error: "No role found",
        //   });
        // }

        let permissions = await DB_CLIENT.query(
          `SELECT p.uuid,p.name, p.priority, p.sub_priority,p.module, 0 AS checked FROM permissions p WHERE p.module != 'null' AND p.is_active = 1 ORDER BY p.priority, p.sub_priority ASC
            `,
          {
            type: QueryTypes.SELECT,
          }
        );

        let role_permissions = await DB_CLIENT.query(
          `SELECT p.name, p.uuid  FROM permissions p 
          INNER JOIN role_has_permissions rhp ON rhp.permission_id = p.id WHERE rhp.role_id = :role_id 
          ORDER BY p.priority ASC, p.sub_priority ASC
            `,
          {
            replacements: {
              role_id: role ? role.id : null,
            },
            type: QueryTypes.SELECT,
          }
        );

        role_permissions = role_permissions.map((el) => el.uuid);

        const result = [];

        for (let i = 0; i < permissions.length; i++) {
          let permission_object = [];
          permission_object.push(permissions[i]);
          if (role_permissions.length > 0) {
            permissions[i].checked = role_permissions.includes(
              permissions[i].uuid
            )
              ? 1
              : 0;
          }
          let mod = permissions[i].module;
          while (
            i + 1 < permissions.length &&
            permissions[i + 1].module === mod
          ) {
            if (role_permissions.length > 0) {
              permissions[i + 1].checked = role_permissions.includes(
                permissions[i + 1].uuid
              )
                ? 1
                : 0;
            }
            permission_object.push(permissions[i + 1]);
            i = i + 1;
          }
          const obj = {
            [mod]: permission_object,
          };
          result.push(obj);
        }

        reply.send({
          success: true,
          permissions: result,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/permissions", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Permission.List");

        let whereClause =
          Object.keys(request.body).length === 0 ? {} : request.body;

        const permissions = await Permission.findAll({
          where: whereClause,
          attributes: { exclude: ["id"] },
          include: {
            model: Navigation,
            attributes: [
              "uuid",
              "name",
              "path",
              "description",
              "menu_position",
              "is_sidebar_visible",
              "icon",
              "is_active",
            ],
            order: [["menu_position", "ASC"]],
          },
          order: [["id", "DESC"]],
        });
        reply.send({
          success: true,
          permissions: permissions,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/permissions/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Permission.Create");
        const { params } = request.body;

        const navigation = await Navigation.findOne({
          where: {
            uuid: params["navigation_id"],
            is_active: true,
          },
        });

        if (!navigation) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_NAVIGATION_SELECTED"],
          });
        }

        const roles = await Role.findAll({
          where: {
            name: "System Admin",
            is_active: true,
          },
          raw: true,
          attributes: ["id"],
        });

        const role_ids = roles.map((role) => role.id);

        const permission = await Permission.create({
          uuid: uuidv4(),
          name: params["name"],
          description: params["description"],
          module: params["module"],
          priority: params["priority"],
          sub_priority: params["sub_priority"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (navigation) {
          await permission.setNavigations(navigation);
        }

        if (permission) {
          await permission.assignToSystemAdmin(role_ids);
        }

        reply.send({
          success: true,
          permission_uuid: permission.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/permissions/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Permission.List");

        const permission = await Permission.findOne({
          where: {
            uuid: request.body.uuid,
          },
          attributes: [
            "uuid",
            "name",
            "description",
            "module",
            "priority",
            "sub_priority",
            "is_active",
            "is_super_seed_permission",
            "seed_path",
          ],
          include: [
            {
              model: Navigation,
              as: "navigations",
              attributes: {
                exclude: ["id"],
              },
            },
          ],
        });
        reply.send({
          success: true,
          permission: permission,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/permissions/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Permission.Edit");
        const { params } = request.body;

        const navigation = await Navigation.findOne({
          where: {
            uuid: params["navigation_id"],
            is_active: true,
          },
          attribute: ["id"],
        });

        if (!navigation) {
          reply.status_code = 403;
          reply.send({
            success: false,
            error: L["NO_NAVIGATION_SELECTED"],
          });
        }

        const permission = await Permission.update(
          {
            is_active: params["is_active"],
            description: params["description"],
            module: params["module"],
            priority: params["priority"],
            sub_priority: params["sub_priority"],
          },
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        const permission_for_navigation = await Permission.findOne({
          where: {
            uuid: params["uuid"],
          },
        });

        if (navigation && permission_for_navigation) {
          await permission_for_navigation.setNavigations([navigation]);
        }

        reply.send({
          success: true,
          permission_update_done: Boolean(permission[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/permissions/delete", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Permission.Edit");
        const { params } = request.body;

        const permission = await Permission.update(
          {
            is_active: false,
            updated_at: new Date(),
          },
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          permission_update_done: Boolean(permission[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/navigations", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Navigation.List");
        var where_query = {};

        if (request.body && request.body.is_parent) {
          where_query["parent_navigation_id"] = {
            [Op.eq]: null,
          };
        }

        if (request.body && request.body.is_child) {
          where_query["parent_navigation_id"] = {
            [Op.ne]: null,
          };
        }

        const navigations = await Navigation.findAll({
          where: where_query,
          attributes: [
            "uuid",
            "name",
            "path",
            "description",
            "menu_position",
            "is_sidebar_visible",
            "icon",
            "is_active",
          ],
          include: {
            model: Navigation,
            as: "parent_navigation",
            attributes: ["uuid", "name", "path", "description"],
          },
          order: [["created_at", "DESC"]],
        });

        reply.send({
          success: true,
          navigations: navigations,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"] ?? String(error),
        });
      }
    });

    fastify.post("/navigations/create", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Navigation.Create");
        const { params } = request.body;

        var parent_navigation = null;
        if (params["parent_navigation_id"]) {
          parent_navigation = await Navigation.findOne({
            where: {
              uuid: params["parent_navigation_id"],
              is_active: true,
            },
            raw: true,
          });
        }

        const navigation = await Navigation.create({
          uuid: uuidv4(),
          name: params["name"],
          path: params["path"],
          description: params["description"],
          parent_navigation_id: parent_navigation
            ? parent_navigation["id"]
            : null,
          menu_position: params["menu_position"],
          is_active: true,
          is_sidebar_visible: params["is_sidebar_visible"],
          icon: params["icon"],
          created_at: new Date(),
          updated_at: new Date(),
        });

        reply.send({
          success: true,
          navigation_uuid: navigation.uuid,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/navigations/edit", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Navigation.Edit");
        const { params } = request.body;

        var parent_navigation = null;
        if (params["parent_navigation_id"]) {
          parent_navigation = await Navigation.findOne({
            where: {
              uuid: params["parent_navigation_id"],
              is_active: true,
            },
          });
        }

        const navigation = await Navigation.update(
          {
            path: params["path"],
            description: params["description"],
            parent_navigation_id: parent_navigation
              ? parent_navigation["id"]
              : null,
            is_active: params["is_active"],
            menu_position: params["menu_position"],
            is_sidebar_visible: params["is_sidebar_visible"],
            icon: params["icon"],
            updated_at: new Date(),
          },
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          navigation: navigation,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/navigations/view", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Navigation.View");

        const navigation = await Navigation.findOne({
          where: {
            uuid: request.body.uuid,
            is_active: true,
          },
          attributes: [
            "uuid",
            "name",
            "path",
            "description",
            "is_active",
            "parent_navigation_id",
            "is_sidebar_visible",
            "menu_position",
            "icon",
          ],
          include: {
            model: Navigation,
            as: "parent_navigation",
            attributes: ["uuid", "name", "description"],
          },
        });
        reply.send({
          success: true,
          navigation: navigation,
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/navigations/delete", async (request, reply) => {
      try {
        await CHECK_PERMISSIONS(request, "Navigation.Edit");
        const { params } = request.body;

        const navigation = await Navigation.update(
          {
            is_active: false,
            updated_at: new Date(),
          },
          {
            where: {
              uuid: params["uuid"],
            },
          }
        );

        reply.send({
          success: true,
          navigation_update_done: Boolean(navigation[0] === 1),
        });
      } catch (error) {
        reply.statusCode = 422;
        reply.send({
          success: false,
          error: error["errors"],
        });
      }
    });

    fastify.post("/search", async (request, reply) => {
      try {
        const { query } = request.body;
        const companies = await DB_CLIENT.query(
          `SELECT uuid, name FROM companies WHERE name LIKE '%${query}%' AND is_active=1 ORDER BY created_at DESC;`,
          {
            replacements: { search_name: `'${query}%'` },
            type: QueryTypes.SELECT,
          }
        );
        return reply.send({
          success: true,
          companies: companies,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    fastify.post("/users_filteration", async (request, reply) => {
      try {
        const { params } = request.body;

        let department = await Department.findOne({
          where: {
            uuid: params["department_uuid"],
          },
          raw: true,
        });

        if (!department) department = "";

        let role = await Role.findOne({
          where: {
            uuid: params["role_uuid"],
          },
          raw: true,
        });

        if (!role) role = "";

        const users = await DB_CLIENT.query(
          `
        select distinct * from users u
        inner join user_has_departments uhd on uhd.user_id = u.id
        inner join departments d on d.id = uhd.department_id
        inner join user_has_roles uhr on uhr.user_id = u.id
        inner join roles r on r.id = uhr.role_id
        inner join user_attributes ua on ua.user_id = u.id
        where uhr.role_id = :role_id or uhd.department_id = :department_id or ua.designation = :designation
        `,
          {
            replacements: {
              department_id: department.id ? department.id : "",
              role_id: role.id ? role.id : "",
              designation: params["designation"] ? params["designation"] : "",
            },
            type: QueryTypes.SELECT,
          }
        );

        return reply.send({
          success: true,
          users: users,
        });
      } catch (error) {
        reply.statusCode = 422;
        return reply.send({
          success: false,
          error: String(error),
        });
      }
    });

    // for crm dump data logs - fetching api
    fastify.post("/integrated-crm-data-logs", async (request, reply) => {
      try {
        // // updating records
        // let rowResponseNew = await CrmDataDump.findAll({});
        // for (const itrate of rowResponseNew) {

        //         await Company.update({ is_crm: true }, {
        //           where: {
        //             name: {
        //               [Op.like]: itrate.leadname
        //             },
        //           },
        //         });
        // }

        let { from, to, limit, offset, sortBy, sortOrder } = request.body;
        if (undefined == sortBy) {
          sortBy = "action_date";
        }
        if (undefined == sortOrder) {
          sortOrder = "DESC";
        }
        if (to != undefined) {
          where = from
            ? {
                ...where,
                action_date: {
                  [Op.between]: [from, to],
                },
              }
            : {
                ...where,
                action_date: {
                  [Op.lte]: to,
                },
              };
        }
        let data = await CrmDataDump.findAndCountAll({
          where: {
            ...where,
          },
          attributes: ["action_date"],
          group: ["action_date"],
          limit: limit,
          offset: offset,
          order: [[String(sortBy), String(sortOrder)]],
        });
        let responseData = {};
        responseData.status = 200;
        responseData.message = "Data found!";
        responseData.count = data?.rows.length;
        responseData.data = [];
        if (data?.rows?.length > 0) {
          for (const row of data?.rows) {
            let dataArray = [];
            console.log(JSON.stringify(row));

            let rowResponse = await CrmDataDump.findAndCountAll({
              where: {
                action_date: row.action_date,
              },
            });
            // getting total count in companies data base
            let companyResponse = await Company.findAll({
              where: {
                updated_at: row.action_date,
              },
            });

            let dataObject = {
              date: row.action_date,
              totalRecords: rowResponse?.rows.length,
              totalSynced: companyResponse?.rows?.length,
              NotSynced:
                rowResponse?.rows.length - companyResponse?.rows?.length,
              rowsData: rowResponse?.rows,
            };
            responseData.data.push(dataObject);
          }
        } else {
          responseData.status = 404;
          responseData.message = "Data not found!";
        }
        return Promise.resolve(responseData);
      } catch (error) {
        console.log("Error ", error);
        return Promise.reject(error);
      }
    });

    fastify.post("/manage_allocation_history", async (request, reply) => {
      try {
        CHECK_PERMISSIONS(request, "MANAGE_ALLOCATION_HISTORY");
        const { params } = request.body;

        const get_history = await DB_CLIENT.query(
          `
            SELECT c.name, m.mandate_id, u.full_name AS to_user, r.name AS to_role, u2.full_name AS from_user, r2.name AS from_role FROM companies c 
            INNER JOIN mandate_allocation_history mah ON mah.company_id = c.id 
            INNER JOIN mandates m ON m.id = mah.mandate_id 
            INNER JOIN users u ON u.id = mah.to_user_id 
            INNER JOIN roles r ON r.id = mah.to_role_id  
            INNER JOIN users u2 ON u2.id = mah.from_user_id 
            INNER JOIN roles r2 ON r2.id = mah.from_role_id 
            WHERE m.mandate_id = :mandate_id  
          `,
          {
            replacements: {
              mandate_id: params.mandate_id,
            },

            type: QueryTypes.SELECT,
          }
        );

        reply.send({
          success: true,
          history: get_history,
        });
      } catch (err) {
        console.error(err);
      }
    });

    done();
  });
}

module.exports = {
  api_routes,
};
