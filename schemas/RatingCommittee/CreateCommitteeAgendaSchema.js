const CreateCommitteeAgendaSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['rating_committee_meeting_uuid'],
        properties: {
          rating_committee_meeting_uuid: {
            type: 'string'
          }
        }
      }
    }
  },
};
  
module.exports = {
  CreateCommitteeAgendaSchema,
};