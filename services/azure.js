var axios = require("axios").default;
const { ENCODE_JWT_DATA } = require("../helpers");

const config = {
  "tenant_id": "2a220760-d40f-4891-a09a-204ae4227f3d",
  "client_id": "73ceb786-5f70-430b-8187-7b9a47d7c843",
  "client_secret": "HPE8Q~bN3R3zQR5d7RyqstHW4D2x5c-MecLlCcK-",
  "scope": ['User.ReadBasic.All'],
  "response_type": "code",
  "redirect_mode": "query",
  "redirect_uri": `${process.env['API_DOMAIN']}/auth/response_azure`,
  "app_login_response_uri": `${process.env['DASHBOARD_DOMAIN']}`,
};

function GET_LOGIN_URL() {
  const url = new URL(`https://login.microsoftonline.com/${config['tenant_id']}/oauth2/v2.0/authorize`);
  url.searchParams.append("client_id", config['client_id']);
  url.searchParams.append("scope", config['scope']);
  url.searchParams.append("response_type", config['response_type']);
  url.searchParams.append("redirect_mode", config['redirect_mode']);
  url.searchParams.append("redirect_uri", config['redirect_uri']);
  return url.href;
}

async function GET_USER(code) {
  console.log("*************>>>>>> azure GET_USER: ", code);
  var options = {
    method: 'POST',
    url: `https://login.microsoftonline.com/${config['tenant_id']}/oauth2/v2.0/token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: {
      client_id: config['client_id'],
      client_secret: config['client_secret'],
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config['redirect_uri']
    }
  };

  return new Promise((resolve, reject) => {
    axios.request(options).then(function async (response) {

      console.log("*************>>>>>> azure GET_USER: response: ", response.data.access_token);

      const token = response.data.access_token;
      var options = {
        method: 'GET',
        url: 'https://graph.microsoft.com/v1.0/me/',
        headers: {
          Authorization: `Bearer ${token}`
        },
      };

      axios.request(options).then(function async (response) {
        const user = response.data; 
        console.log("*************>>>>>> azure GET_USER: user: ", user);
        resolve(user);
      }).catch(function (error) {
        reject(error);
      });

    }).catch(function (error) {
      console.log("error: ", error);
      reject(error);
    });
  });
}

async function GET_LOGIN_RESPONSE_URL(uuid) {
  const token = await ENCODE_JWT_DATA({
    'uuid': uuid,
  });
  return `${config['app_login_response_uri']}/?token=${token}`;
}

module.exports = {
  GET_LOGIN_URL,
  GET_USER,
  GET_LOGIN_RESPONSE_URL,
};