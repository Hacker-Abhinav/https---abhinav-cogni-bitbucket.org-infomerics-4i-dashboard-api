const axios = require("axios");
const qs = require("querystring");
const FormData = require("form-data");
const fs = require("fs");
const { logger } = require("handlebars");
class DmsExternalComm {
  async getAccessToken() {
    try {
      let data = {
        grant_type: "client_credentials",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        resource: process.env.RESOURCE,
        role: process.env.ROLE,
      };
      var url = `${process.env.LOGIN_URL}${process.env.TENANT_ID}/oauth2/token`;
      const formData = qs.stringify(data);
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      const res = await axios.post(url, formData, {
        headers,
      });
      return Promise.resolve(res.data);
    } catch (error) {
      console.log("Error in token generation", error.message);
      return Promise.reject(error.message);
    }
  }

  async getSiteWorkingFolder(accessToken) {
    // https://graph.microsoft.com/v1.0/sites/{{SiteID}}/lists/{{ListID}}/items/
    try {
      var url = `${process.env.SOURCE_URL}sites/${process.env.SITE_ID}/lists/${process.env.LIST_ID}/items`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const res = await axios.get(url, { headers });
      //   console.log("res=>", res?.data?.value);
      return res?.data;
    } catch (error) {
      console.log("Error in reading data=> excomm-38", error.message, url);
      return Promise.reject(error.message);
    }
  }

  // creating folder at sharepoint
  async createSiteFolder(accessToken, parentID, folderName) {
    // https://graph.microsoft.com/v1.0/drives/{{DrivesID}}/items/{{parent-item-id}}/children
    //https://graph.microsoft.com/v1.0/sites/{{SiteID}}/drive/items/{{parent-item-id}}/children
    try {
      var url = `${process.env.SOURCE_URL}drives/${process.env.DRIVES_ID}/items/${parentID}/children`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
      let data = {
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      };
      const formData = qs.stringify(data);
      const res = await axios.post(url, data, { headers });
      //  let res = Promise.resolve(resp);
      let response = {};
      response = {
        name: folderName,
        type: "Folder",
        id: res?.data?.id,
        id_sub: "",
        parentId: res?.data?.parentReference?.id,
        subId: res?.data?.id,
        url: res?.data?.webUrl,
        downloadLink: "",
        createdAt: res?.data?.createdDateTime,
        createdByEmail: "",
        createdByName: "",
        lastModifiedAt: "",
        lastModifiedByName: "",
        lastModifiedByEmail: "",
      };
      return response;
    } catch (error) {
      return Promise.resolve(error);
    }
  }

  // uploading file to sharepoint site
  async uploadFileToSite(accessToken, parentID, fileName, file) {
    try {
      //https://graph.microsoft.com/v1.0/drives/{{DrivesID}}/items/{{parent-item-id}}:/hello.txt:/content
      //const filepath = `_241137768-Server Separation-070923-063017.pdf`;
      // const image = fs.readFileSync(file);
      //let data= { data:image }
      // const res = await axios.put(url,{ headers },data);
      // let rep=Promise.resolve(res);
      // console.log("rep=>")
     
      parentID = "a08cf09a-f971-4241-a7de-f0dada36ec3e";
       console.log(accessToken, parentID, fileName, file);
      let config = {
        method: "put",
        timeout: "100000ms",
        maxBodyLength: Infinity,
        url: `${process.env.SOURCE_URL}/drives/${process.env.DRIVES_ID}/items/${parentID}:/${fileName}:/content`,
        headers: {
          Token: `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
          Authorization: `Bearer ${accessToken}`,
        },
        data: file,
      };
      let response = await axios.request(config);
      //   console.log("file upload response ", response);
      return Promise.resolve(response?.data?.["@microsoft.graph.downloadUrl"]);
    } catch (error) {
      console.log("error in file upload ", error.message);
      return Promise.reject(error.message);
    }
  }

  // file download
  async getFileDownLink(accessToken, itemId) {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${process.env.SOURCE_URL}drives/${process.env.DRIVES_ID}/items/${itemId}/?select=id,@microsoft.graph.downloadUrl`,
        headers: {
          Token: `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
          Authorization: `Bearer ${accessToken}`,
        },
      };
      let response = await axios.request(config);
      return Promise.resolve(response?.data?.["@microsoft.graph.downloadUrl"]);
    } catch (error) {
      return Promise.reject(error.message);
    }
  }
}
const dmsExternalCommInstance = new DmsExternalComm();
module.exports = dmsExternalCommInstance;
