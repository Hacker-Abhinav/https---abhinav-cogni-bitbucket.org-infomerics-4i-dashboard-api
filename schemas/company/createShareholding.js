
const CreateShareholding = {
    body: {
      type: 'object',
      required: ['company_uuid', 'params'],
      properties: {
        params: {
          type: 'array',
          items: {
            type: 'object',
              properties : {
                holding_type: { type: 'string' },
                holding_percentage: { type: 'number' },
                as_on_date: { type: 'string', format: "date" }
             }
          }
        }
      }
    },
  };
    
  module.exports = {
    CreateShareholding
  };