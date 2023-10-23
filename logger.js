const { UserActivity } = require("./models/modules/onboarding");

async function LOG_TO_DB(request, params) {
  return new Promise(async (resolve) => {
    await UserActivity.create({
      activity: params["activity"],
      params: JSON.stringify(params["params"]),
      ip_address: request.ip,
      user_agent: request.headers['user-agent'],
      user_id: request.user ? request.user.id : null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    resolve(true);
  });
}

module.exports = {
  LOG_TO_DB,
};