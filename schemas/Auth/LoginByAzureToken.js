const LoginByAzureToken = {
  body: {
    type: 'object',
    required: ['token'],
  },
};

module.exports = {
  LoginByAzureToken,
};