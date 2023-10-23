const { Op, where } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { DB_CLIENT } = require("../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../helpers");
const {
  TemplateList,
  TemplateType,
  TemplateConfig,
} = require("../../models/modules/template-list");
const {
  RatingProcess,
  Instrument,
} = require("../../models/modules/rating-model");
const { Company, User } = require("../../models/modules/onboarding");

function processTemplateSyntax(data, rl_data_constants) {
  // Assuming data is an object with key-value pairs for placeholders and their values

  for (let i = 0; i < rl_data_constants.length; i++) {
    data = data.replace(rl_data_constants[i].regEx, rl_data_constants[i].value);
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

function generateLetterNumber(template_type) {
  let letterStr = "";
  let date = new Date();
  let incrementor = 1;
  const temp = template_type.split(" ");
  for (let i = 0; i < temp.length; i++) {
    letterStr += temp[i][0];
    console.log(letterStr);
  }
  incrementor++;
  letterStr += `/${date.getFullYear()}/${incrementor}`;
  console.log(letterStr);
  return letterStr;
}

function generate_rl_table_data(rl_table_data, sum) {
  let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid black; border-spacing: 0;"> 
    <thead style="color: #111; height: 25px;"> 
      <tr> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Instrument / Facility</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Amount (Rs. Crore)</th>
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Ratings</th> 
        <th style="border: 1px solid black; text-align: left; padding: 8px;">Rating Action</th> 
      </tr>
    </thead>`;

  rl_table_data.forEach((item) => {
    tableHtml += `
      <tbody> 
        <tr> 
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${getInstrumentType(
            item
          )} ${item.category_text}</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.instrument_size_number
          }</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.rating
          }</td>
          <td style="border: 1px solid black; text-align: left; padding: 8px;">${
            item.rating_action ? item.rating_action : "-"
          }</td>
        </tr>
      </tbody>`;
  });

  tableHtml += `
  <tr class="total">
  <td> Total </td>
  <td>
  <p>${sum.total ? sum.total : "-"}</p> 
  <p>(${INWORDS(sum.total)})</p>
  </td>
  <td> </td>
  <td> </td>
</tr>
</tbody>
  </table>`;

  return tableHtml;
}

async function template_lists_routes(fastify) {
  fastify.post("/template_lists", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');
      let whereClause = Object.keys(params).length === 0 ? {} : params;
      if (Object.keys(params).includes("is_active")) {
        whereClause["is_active"] = params["is_active"];
      }
      const template_lists = await TemplateList.findAll({
        where: whereClause,
        order: [["template_name", "ASC"]],
        attributes: { exclude: ["id"] },
        include: [
          {
            model: User,
            as: "created_by_user",
            attributes: ["uuid", "full_name"],
          },
          {
            model: RatingProcess,
            as: "rating_process",
            attributes: ["uuid", "name"],
          },
          {
            model: TemplateType,
            as: "template_type",
            attributes: ["uuid", "name"],
          },
          {
            model: Instrument,
            as: "instrument",
            attributes: ["uuid", "name"],
          },
        ],
      });

      reply.send({
        success: true,
        template_lists: template_lists,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_lists/create", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_type = await TemplateType.findOne({
        where: {
          uuid: params["template_type_uuid"],
          is_active: true,
        },
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
      });

      const instrument = await Instrument.findOne({
        where: {
          uuid: params["instrument_uuid"],
          is_active: true,
        },
      });

      const template_list = await TemplateList.create({
        uuid: uuidv4(),
        template_name: params["template_name"],
        html_string: params["html_string"],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      template_list.setTemplate_type(template_type);
      template_list.setRating_process(rating_process);
      template_list.setInstrument(instrument);

      reply.send({
        success: true,
        template_list: template_list,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_lists/edit", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_type = await TemplateType.findOne({
        where: {
          uuid: params["template_type_uuid"],
          is_active: true,
        },
      });

      const rating_process = await RatingProcess.findOne({
        where: {
          uuid: params["rating_process_uuid"],
          is_active: true,
        },
      });

      const instrument = await Instrument.findOne({
        where: {
          uuid: params["instrument_uuid"],
          is_active: true,
        },
      });

      const template_list = await TemplateList.findOne({
        where: {
          uuid: params["uuid"],
        },
        include: [
          {
            model: TemplateType,
            as: "template_type",
          },
        ],
      });

      console.log("template_list===========>", template_list);

      const letterNumberStr = generateLetterNumber(
        template_list.template_type.name
      );

      const template_type_updated = await TemplateList.update(
        APPEND_USER_DATA(request, {
          html_string: params["html_string"],
          letter_id: letterNumberStr,
          is_active: params["is_active"],
          template_name: params["template_name"],
        }),
        {
          where: { uuid: params["uuid"] },
        }
      );

      template_list.setTemplate_type(template_type);
      template_list.setRating_process(rating_process);
      template_list.setInstrument(instrument);

      reply.send({
        success: true,
        template_type_updated: template_type_updated,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_lists/view", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_list = await TemplateList.findOne({
        where: {
          uuid: params["uuid"],
        },
        attributes: { exclude: ["id"] },
        include: [
          {
            model: RatingProcess,
            as: "rating_process",
            attributes: ["uuid", "name"],
          },
          {
            model: TemplateType,
            as: "template_type",
            attributes: ["uuid", "name"],
          },
          {
            model: Instrument,
            as: "instrument",
            attributes: ["uuid", "name"],
          },
        ],
      });

      reply.send({
        success: true,
        template_list: template_list,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_lists_based_on_template_type", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_type = await TemplateType.findOne({
        where: {
          uuid: params["uuid"],
          is_active: true
        },
      });

      const template_lists = await TemplateList.findAll({
        where: {
            template_type_id: template_type.id,
            is_active: true
        }
      })

      reply.send({
        success: true,
        template_lists: template_lists,
      });

    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });


  fastify.post("/template_config_variables", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const where_query = params

      const template_configs = await TemplateConfig.findAll({
        where: where_query,
        is_active: true
      })

      reply.send({
        success: true,
        template_configs: template_configs,
      });
      
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/template_config_variables/create", async (request, reply) => {
    try {
      const { params } = request.body;
      //   await CHECK_PERMISSIONS(request, 'Instruments');

      const template_config = await TemplateConfig.create({
        uuid: uuidv4(),
        replacement_variable: params["variable"],
        is_active: true,
        created_at: new Date(),
        created_by: request.user.id
      })

      reply.send({
        success: true,
        template_config: template_config,
      });
      
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

}
module.exports = {
  template_lists_routes,
};
