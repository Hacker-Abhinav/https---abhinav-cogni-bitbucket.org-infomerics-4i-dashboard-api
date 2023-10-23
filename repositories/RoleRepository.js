const { Role } = require("../models/modules/onboarding");

// GET_ROLE
async function GET_ROLE(query) {
  return new Promise(async (resolve, reject) => {
    const result = await Role.findOne({
      where: query
    });

    if (result) { resolve(result); }

    else {
      reject({
        success: false,
        error: "ROLE_NOT_FOUND",
      });
    }
  });
}

module.exports = {
  GET_ROLE,
}