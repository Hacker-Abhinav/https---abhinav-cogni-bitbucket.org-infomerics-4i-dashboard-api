const { RatingProcess } = require("../models/modules/rating-model");

// GET_RATING_PROCESS
async function GET_RATING_PROCESS(query) {
  return new Promise(async (resolve, reject) => {
    const result = await RatingProcess.findOne({
      where: query
    });

    if (result) { resolve(result); }

    else {
      reject({
        success: false,
        error: "RATING_PROCESS_NOT_FOUND",
      });
    }
  });
}

module.exports = {
  GET_RATING_PROCESS,
}