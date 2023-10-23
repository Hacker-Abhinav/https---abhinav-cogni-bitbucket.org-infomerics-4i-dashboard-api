const { Op, where } = require("sequelize");
const { v4: uuidv4 } = require('uuid');
const { InstrumentCategory, InstrumentSubCategory, MasterCommon, User, Department, MacroEconomicIndicator, Sector, Industry, SubIndustry, Country, State, City, Tag, Company, Instrument } = require("../../../models/modules/onboarding");
const { DB_CLIENT } = require("../../../db");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { APPEND_USER_DATA, CHECK_PERMISSIONS } = require("../../../helpers");

async function masters_common_routes(fastify) {

  fastify.post('/master', async (request, reply) => {
    try{
    await CHECK_PERMISSIONS(request, 'MasterManagement.List');
    var where_query = {};

    console.log("request.body.group---->", request.body.group);

    if (request.body && request.body.group) {
      console.log("inside first iff----->");
      where_query['group'] = {
        [Op.eq]: request.body.group
      };
    }

    if (request.body && request.body.is_active) {
      where_query['is_active'] = {
        [Op.eq]: request.body.is_active
      };
    }

    console.log("where_query---->", where_query);
    
    const masters = await MasterCommon.findAll({
      where: where_query,
      attributes: ['uuid', 'group', 'name', 'value', 'description', ['data_order', 'order'], 'group_position', 'type', 'is_active', 'created_at', 'updated_at'],
      order: [
        ['name', 'ASC']
      ],
      include: [{
        model: User,
        as: "created_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      },
      {
        model: User,
        as: "updated_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      },
      {
        model: Tag,
        as: "master_common_tags",
        attributes: ['uuid', 'name'],
      }],
      order: [
        ['group_position', 'ASC'], ['data_order', 'ASC']
      ]
    });

    reply.send({
      "success": true,
      "masters": masters,
    });}catch(error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'],
      });
    }
  });

  fastify.post('/masters_by_group', async (request, reply) => {
    try{
    await CHECK_PERMISSIONS(request, 'MasterManagement.List');
    var where_query = {};

    if (request.body && request.body.group) {
      console.log("inside first iff----->");
      where_query['group'] = {
        [Op.in]: request.body.group
      };
    }

    if (request.body && request.body.is_active) {
      where_query['is_active'] = {
        [Op.eq]: request.body.is_active
      };
    }

    console.log("where_query---->", where_query);
    
    const masters = await MasterCommon.findAll({
      where: where_query,
      attributes: ['uuid', 'group', 'name', 'value', 'description', ['data_order', 'order'], 'group_position', 'type', 'is_active', 'created_at', 'updated_at'],
      order: [
        ['name', 'ASC']
      ],
      include: [{
        model: User,
        as: "created_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      },
      {
        model: User,
        as: "updated_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      },
      {
        model: Tag,
        as: "master_common_tags",
        attributes: ['uuid', 'name'],
      }],
      order: [
        ['group_position', 'ASC'], ['data_order', 'ASC']
      ]
    });

    reply.send({
      "success": true,
      "masters": masters,
    });}catch(error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'],
      });
    }
  });

  fastify.post('/master/create', async (request, reply) => {
    try{
    await CHECK_PERMISSIONS(request, 'MasterManagement.Create');
    const { params } = request.body;
    const master = await MasterCommon.create({
      uuid: uuidv4(),
      group: params['group'],
      name: params['name'],
      value: params['value'],
      data_order: params['order'],
      description: params['description'],
      type: params['type'],
      group_position: params['group_position'],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: request.user.id,
      updated_by: request.user.id,
    });

    reply.send({
      "success": true,
      "master_uuid": master.uuid,
    });}catch(error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'],
      });
    }
  });

  fastify.post('/master/edit', async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Edit');
      const { params } = request.body;
      const masterDetail = await MasterCommon.findOne({
        where: {
          uuid: params['uuid']
        },
        raw: true
      });
      if(masterDetail.group !== params['group']){
        await MasterCommon.update({
          "group": params['group'],
        }, {
          where: {
            group: masterDetail.group
          }
        });
      }

      const master = await MasterCommon.update({
        "group": params['group'],
        "name": params['name'],
        "value": params['value'],
        "type": params['type'],
        "data_order": params["order"],
        "is_active": params['is_active'],
      }, {
        where: {
          uuid: params['uuid']
        }
      });

      reply.send({
        "success": true,
        "master": master,
      });

    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'],
      });
    }
  });

  fastify.post('/master_groups', async (request, reply) => {
  try {
    await CHECK_PERMISSIONS(request, 'MasterManagement.List')
    const groups = await DB_CLIENT.query(`select distinct [group] from master_commons`, {
      type: QueryTypes.SELECT,
    });

    const result = [];

    const data = await DB_CLIENT.query(`select * from master_commons`, {
      type: QueryTypes.SELECT,
    });

    groups.forEach(group => {

      let temp = [];
      data.forEach(el => {
        if (el.group === group.group) {
          temp.push(el);
        }
      })
      const y = {
        'key': group.group,
        'values': temp
      };
      result.push(y);
    });

    reply.send({
      "success": true,
      "masters": result,
    });
    } catch(error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'] ?? String(error),
      });
    }
  });

  fastify.post('/master/group/view', async (request, reply) => {
   try { 
    await CHECK_PERMISSIONS(request, 'MasterManagement.View');
    const groupsDetails = await MasterCommon.findOne({
      where: {
        group: request.body.group
      },
      attributes: ['uuid', 'group', 'name', 'value', 'type', ['data_order', 'order'], 'description','is_active', 'created_at', 'updated_at'],
      include: [{
        model: User,
        as: "created_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      },
      {
        model: User,
        as: "updated_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      }],
      order: [
        ['id', 'DESC']
      ]
    });

    reply.send({
      "success": true,
      "masters": groupsDetails,
    });
    } catch(error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'] ?? String(error),
      });
    }
  });

  fastify.post('/master/view', async (request, reply) => {
   try {
    await CHECK_PERMISSIONS(request, 'MasterManagement.View');
    const masters = await MasterCommon.findOne({
      where: {
        uuid: request.body.uuid,
        is_active: true
      },
      attributes: ['uuid', 'group', 'name', 'value', 'type', ['data_order', 'order'], 'description', 'created_at', 'updated_at'],
      include: [{
        model: User,
        as: "created_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      },
      {
        model: User,
        as: "updated_by_user",
        attributes: ['uuid', 'full_name', 'email'],
      }],
      order: [
        ['id', 'DESC']
      ]
    });

    reply.send({
      "success": true,
      "masters": masters,
    });
  } catch(error) {
    reply.statusCode = 422;
    reply.send({
      "success": false,
      "error": error['errors'] ?? String(error),
    });
  }
  });

  fastify.post('/tags', async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.List');

      const where_query = request.body.params

      const tags = await Tag.findAll({
        where: where_query,
        attributes: { exclude: ['id'] }
      });

      reply.send({
        "success": true,
        "tags": tags,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'] ?? String(error),
      });
    }
  });

  fastify.post('/tags/create', async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create')
      const { params } = request.body;
      const master_commons = await MasterCommon.findAll({
        where: {
          uuid: params?.master_common_uuid,
          is_active: true
        }
      })

      const tag = await Tag.create({
        "uuid": uuidv4(),
        "name": params['name'],
        "description": params['description'],
        "is_active": true,
        "created_at": new Date(),
        "updated_at": new Date(),
        "created_by": request.user.id
      });

      if(master_commons.length > 0){
        await tag.setMaster_commons(master_commons);
      }

      reply.send({
        "success": true,
        "tag": tag,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'] ?? String(error),
      });
    }
  });

  fastify.post('/tags/edit', async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.Create')
      const { params } = request.body;

      const master_commons = await MasterCommon.findAll({
        where: {
          uuid: params?.master_common_uuid,
          is_active: true
        }
      })

      const tag_object = await Tag.findOne({
        where: {
          uuid: params?.uuid,
          is_active: true
        }
      })

      const tag = await Tag.update(APPEND_USER_DATA(request,{
        "uuid": uuidv4(),
        "name": params['name'],
        "description": params['description'],
        "is_active": params['is_active']
      }),
      {
        where:{
          uuid: params['uuid']
        }
      }        
      );

      if(master_commons.length > 0){
        await tag_object.setMaster_commons(master_commons);
      }

      reply.send({
        "success": true,
        "tag_update_result": Boolean(tag[0]===1),
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'] ?? String(error),
      });
    }
  });

  fastify.post('/tags/view', async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, 'MasterManagement.View');
      const tags = await Tag.findAll({
        where: {
          uuid: request.body.tags_uuid
        },
        attributes: { exclude: ['id'] },
        include: [
          {
            model: Company,
            as: 'tag_companies',
            attributes: ['uuid', 'name', 'short_code', 'type']
          }
        ]
      });

      reply.send({
        "success": true,
        "tags": tags,
      });
    } catch (error) {
      reply.statusCode = 422;
      reply.send({
        "success": false,
        "error": error['errors'] ?? String(error),
      });
    }
  });
  
}

module.exports = {
  masters_common_routes
};