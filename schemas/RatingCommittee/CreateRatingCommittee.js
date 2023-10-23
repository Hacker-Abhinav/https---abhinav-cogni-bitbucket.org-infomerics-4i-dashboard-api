const CreateRatingCommitteeSchema = {
  body: {
    type: 'object',
    required: ['params'],
  },
};

const CreateCommitteeMinutesSchema = {
  body: {
    type: 'object',
    required: ['params'],
  },
};
  
module.exports = {
  CreateRatingCommitteeSchema,
};