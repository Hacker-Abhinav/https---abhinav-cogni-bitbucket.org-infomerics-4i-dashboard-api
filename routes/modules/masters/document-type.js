const { v4: uuidv4 } = require("uuid");
const { Sector, Industry, DocumentType } = require("../../../models/modules/onboarding");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function document_types_routes(fastify) {
  fastify.post("/document_types", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');
      const { params } = request.body;

      let whereClause = Object.keys(params).length === 0 ? {} : params;
      const document_types = await DocumentType.findAll({
        where: whereClause,
        order: [
          ['name', 'ASC']
        ],
        attributes: { exclude: ["id"] },
      });

      reply.send({
        success: true,
        document_types: document_types,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/document_types/create", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
      const { params } = request.body;

      
        const document_type = await DocumentType.create({
          uuid: uuidv4(),
          name: params["name"],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: request.user.id,
        });

        reply.send({
          success: true,
          document_type_uuid: document_type.uuid,
        });
    } catch (error) {
      console.log("error: ", error)
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });

  fastify.post("/document_types/view", async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const document_type = await DocumentType.findOne({
        where: {
          uuid: request.body.params.uuid,
        },
        attributes: { exclude: ["id"] },
        
      });

      reply.send({
        success: true,
        document_type: document_type,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"] ?? String(error),
      });
    }
  });

  fastify.post("/document_types/edit", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;

      const document_type_object = await DocumentType.findOne({
        where: {
          uuid: params["uuid"],
        },
      });

      const document_type = await Industry.update(
        APPEND_USER_DATA(request, {
          name: params["name"],
          is_active: params["is_active"],
          updated_at: Date.now(),
          updated_by: request.user.id
        }),
        {
          where: {
            uuid: params["uuid"],
          },
        }
      );

      reply.send({
        success: true,
        document_type_update_done: Boolean(document_type[0] === 1),
      });
    } catch (error) {
      
      reply.statusCode = 422;
      reply.send({
        success: false,
        error: error["errors"],
      });
    }
  });
}

module.exports = {
  document_types_routes,
};
