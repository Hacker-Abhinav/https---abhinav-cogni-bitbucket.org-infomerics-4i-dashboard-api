const { createClient } = require('redis');

const redis_client = createClient();
(async () => {
  await redis_client.connect();
})();

async function SET_REDIS_DATA(key, data) {
  data['cached_at'] = new Date();
  await redis_client.set(key, JSON.stringify(data));
  return true;
}

async function GET_REDIS_DATA(key) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await redis_client.get(key);
      const json_data = JSON.parse(data);
      resolve(json_data);
    } catch (error) {
      resolve(null);
    }
  })
}

async function DELETE_REDIS_DATA(key) {
  return new Promise(async (resolve, reject) => {
    try {
      await redis_client.del(key);
      resolve(true);
    } catch (error) {
      resolve(null);
    }
  })
}

module.exports = {
  SET_REDIS_DATA,
  GET_REDIS_DATA,
  DELETE_REDIS_DATA
};