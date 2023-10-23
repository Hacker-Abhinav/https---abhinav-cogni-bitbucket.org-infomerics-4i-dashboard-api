const { Activity } = require("../models/modules/workflow");

// GET_ACTIVITY
async function GET_ACTIVITY(query) {
  return new Promise(async (resolve, reject) => {
    const result = await Activity.findOne({
      where: query
    });
    
    if (result) { resolve(result); }

    else {
      reject({
        success: false,
        error: "ACTIVITY_NOT_FOUND",
      });
    }
  });
}

module.exports = {
  GET_ACTIVITY,
}