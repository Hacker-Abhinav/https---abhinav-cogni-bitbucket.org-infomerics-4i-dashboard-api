const LoginByUserCode = {
  body: {
    type: 'object',
    required: ['uuid', 'password'],
  },
};

module.exports = {
  LoginByUserCode,
};