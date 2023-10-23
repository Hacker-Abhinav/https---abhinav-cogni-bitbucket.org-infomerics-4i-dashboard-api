const { CheckUserCode } = require("./CheckUserCode");
const { LoginByAzureToken } = require("./LoginByAzureToken");
const { LoginByUserCode } = require("./LoginByUserCode");

module.exports = {
  CheckUserCode,
  LoginByUserCode,
  LoginByAzureToken,
};
