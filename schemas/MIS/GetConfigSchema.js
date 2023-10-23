const GetConfigSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string'
          }
        }
      }
    }
  },
};
  
module.exports = {
  GetConfigSchema,
};