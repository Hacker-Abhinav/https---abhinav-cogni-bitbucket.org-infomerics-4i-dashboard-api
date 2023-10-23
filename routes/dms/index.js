const { QueryTypes, Op } = require("sequelize");
const { forIn } = require("lodash");
const { parse } = require("path");
const { Exception } = require("handlebars");
const { v4: uuidv4 } = require("uuid");
const {
  SET_REDIS_DATA,
  GET_REDIS_DATA,
  DELETE_REDIS_DATA,
} = require("../../redis-client");
const dmsExternalCommInstance = require("./ExternalComm");

async function dms_routes(fastify) {
  // generate share point access token
  fastify.get("/generate-dms-token", async (request, reply) => {
    try {
      const accessToken = await dmsExternalCommInstance.getAccessToken();
      var now = new Date();
      var expireTime = new Date(Date.now() + 1 * (60 * 60 * 1000));
      await SET_REDIS_DATA(process.env.SHARE_POINT_TOKEN_KEY, {
        token: accessToken?.access_token,
        Intime: now,
        expireTime: expireTime,
      });
      return reply.send({
        success: true,
        accessToken: accessToken?.access_token,
      });
    } catch (error) {
      return reply.send({
        success: false,
        error: error,
      });
    }
  });

  // generate access token
  async function generate_access_token() {
    try {
      const accessToken = await dmsExternalCommInstance.getAccessToken();
      var now = new Date();
      var expireTime = new Date(Date.now() + 1 * (60 * 60 * 1000));
      await SET_REDIS_DATA(process.env.SHARE_POINT_TOKEN_KEY, {
        token: accessToken?.access_token,
        Intime: now,
        expireTime: expireTime,
      });
    } catch (error) {
      console.log("Error =>", error.message);
    }
  }
  // for calling extername call
  async function checkAccessTokenIsValid() {
    try {
      // await DELETE_REDIS_DATA(process.env.SHARE_POINT_TOKEN_KEY);
      const checkToken = await GET_REDIS_DATA(
        process.env.SHARE_POINT_TOKEN_KEY
      );

      let lastTokenTime = new Date(checkToken?.expireTime).getTime();
      let currentTime = new Date().getTime();
      console.log("checkToken=> ", lastTokenTime, currentTime);
      if (
        isNaN(lastTokenTime) ||
        lastTokenTime < currentTime ||
        lastTokenTime === undefined
      ) {
        console.log("In expiration");
        await generate_access_token();
      }
      const accessToken = await GET_REDIS_DATA(
        process.env.SHARE_POINT_TOKEN_KEY
      );
      return accessToken?.token;
    } catch (error) {
      console.log("Error in checking access token ", error);
    }
  }
  // for shorting the array
  async function sortArray(data) {
    return data.sort((a, b) => a.id - b.id);
  }
  // for nested array
  async function createNestedArray(data) {
    const idMap = {};
    const root = [];

    data.forEach((item) => {
      idMap[item.id] = { ...item, children: [] };
    });

    // Build the tree structure based on parentId
    data.forEach((item) => {
      if (item.parentId && idMap[item.parentId]) {
        idMap[item.parentId].children.push(idMap[item.id]);
      } else {
        root.push(idMap[item.id]);
      }
    });
    return root;
  }
  // getting all site
  fastify.post("/dms-site-content", async (request, reply) => {
    try {
      //  await generate_access_token();

      // sort array in ascending order and create a nested structure
      const final_response = await structuredSiteList();
      return reply.send({
        success: true,
        data: final_response,
        //rowData:siteData
      });
    } catch (error) {
      console.log("Error =>", error);
      return reply.send({
        success: false,
        error: error,
      });
    }
  });

  // uploadig file in a particluar folder
  fastify.post(
    "/upload-company-document-at-sharepoint",
    async (request, reply) => {
      try {
        let {
          parent,
          subParent1,
          subParent2,
          subParent3,
          subParent4,
          file,
          fileName,
        } = request.body;
        (parent = parent.value), (subParent1 = subParent1.value);
        subParent2 = subParent2.value;
        subParent3 = subParent3.value;
        subParent4 = subParent4.value;
        file = await file.toBuffer();
        fileName = fileName.value;
        let final_response = await unstructuredSiteList();
        // console.log("final_response=>",final_response)
        let result = {};
        let parentID = "";
        if (parent != null) {
          result = await findFileInSiteList_("name", parent, final_response);
          if (result === "not found") {
            let response = await createFolder(process.env.PARENT_ID, parent);
            final_response.push(response);
          }
          result = await findFileInSiteList_("name", parent, final_response);
          parentID = result.id;
        }

        if (subParent1 != null && subParent1 != "") {
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent1,
            "parentId",
            parentID,
            final_response
          );

          if (result.length <= 0) {
            let response = await createFolder(parentID, subParent1);
            final_response.push(response);
            parentID = response.parentId;
          }
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent1,
            "parentId",
            parentID,
            final_response
          );
          parentID = result[0].id;
        }

        if (subParent2 != null && subParent2 != "") {
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent2,
            "parentId",
            parentID,
            final_response
          );
          if (result.length <= 0) {
            let response = await createFolder(parentID, subParent2);
            final_response.push(response);
            parentID = response.parentId;
          }
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent2,
            "parentId",
            parentID,
            final_response
          );
          parentID = result[0].id;
        }

        if (subParent3 != null && subParent3 != "") {
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent3,
            "parentId",
            parentID,
            final_response
          );
          if (result.length <= 0) {
            let response = await createFolder(parentID, subParent3);
            final_response.push(response);
            parentID = response.parentId;
          }
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent3,
            "parentId",
            parentID,
            final_response
          );
          parentID = result[0].id;
        }

        if (subParent4 != null && subParent4 != "") {
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent4,
            "parentId",
            parentID,
            final_response
          );
          if (result.length <= 0) {
            let response = await createFolder(parentID, subParent4);
            final_response.push(response);
            parentID = response.parentId;
          }
          result = await findFileInSiteListWithParentId_(
            "name",
            subParent4,
            "parentId",
            parentID,
            final_response
          );
          parentID = result[0].id;
        }
        let fileUploadUrl = "";
        if (file !== null) {
          fileUploadUrl = await fileUpload(parentID, file, fileName);
        }
        return reply.send({
          success: true,
          data: result,
          parentID: parentID,
          uploadedFile: fileName,
          uploadedURL: fileUploadUrl,
        });
      } catch (error) {
        console.log("Error in main function=>", error);
        return reply.send({
          success: false,
          error: error,
        });
      }
    }
  );

  // forder creation at sharepoint
  async function createFolder(parentId, folder) {
    const accessToken = await checkAccessTokenIsValid();
    let status = await dmsExternalCommInstance.createSiteFolder(
      accessToken,
      parentId,
      folder
    );
    // if i got this message as a response //Request failed with status code 404
    // if (status.name===undefined) {
    //   let final_response = await unstructuredSiteList();
    //   let res = {};
    //   res = await findObject(final_response, "name", folder);
    //   if (result === undefined) {
    //     await createFolder(parentId, folder);
    //   } else {
    //     return "folder created";
    //   }
    // } else {
    return status;
    //}
  }

  // format the array into nested structure
  async function structuredSiteList() {
    try {
      const accessToken = await checkAccessTokenIsValid();
      let siteData = await dmsExternalCommInstance.getSiteWorkingFolder(
        accessToken
      );
      let response = [];
      // sort array into assending order by id
      await sortArray(siteData?.value);
      for (const data of siteData?.value) {
        let url = data?.webUrl;
        let urlArray = url.split("/");
        let name = urlArray[urlArray.length - 1];
        let id = data?.eTag.replace(/\"/g, "");
        id = id.split(",");
        let downloadLink = "";
        // if (data?.contentType?.name == "Document") {
        //   let fileLink = await dmsExternalCommInstance.getFileDownLink(
        //     accessToken,
        //     id[0]
        //   );
        //   downloadLink = fileLink;
        // }
        let data_ = {
          name: name.replace(/%20/g, " "),
          type: data?.contentType?.name,
          id: id[0],
          id_sub: id[1],
          parentId: data?.parentReference?.id,
          subId: data?.id,
          url: data.webUrl,
          downloadLink: downloadLink,
          createdAt: data.createdDateTime,
          createdByEmail: data?.createdBy?.user?.email,
          createdByName: data?.createdBy?.user?.displayName,
          lastModifiedAt: data?.lastModifiedDateTime,
          lastModifiedByName: data?.lastModifiedBy?.user?.displayName,
          lastModifiedByEmail: data?.lastModifiedBy?.user?.email,
        };
        response.push(data_);
      }
      let final_response = await createNestedArray(response);
      //console.log("final_response=>",final_response)
      return final_response;
    } catch (error) {
      return error.message;
    }
  }

  async function unstructuredSiteList() {
    try {
      const accessToken = await checkAccessTokenIsValid();
      let siteData = await dmsExternalCommInstance.getSiteWorkingFolder(
        accessToken
      );
      let response = [];
      // sort array into assending order by id
      await sortArray(siteData?.value);
      for (const data of siteData?.value) {
        let url = data?.webUrl;
        let urlArray = url.split("/");
        let name = urlArray[urlArray.length - 1];
        let id = data?.eTag.replace(/\"/g, "");
        id = id.split(",");
        let downloadLink = "";
        // if (data?.contentType?.name == "Document") {
        //   let fileLink = await dmsExternalCommInstance.getFileDownLink(
        //     accessToken,
        //     id[0]
        //   );
        //   downloadLink = fileLink;
        // }
        let data_ = {
          name: name.replace(/%20/g, " "),
          type: data?.contentType?.name,
          id: id[0],
          id_sub: id[1],
          parentId: data?.parentReference?.id,
          subId: data?.id,
          url: data.webUrl,
          downloadLink: downloadLink,
          createdAt: data.createdDateTime,
          createdByEmail: data?.createdBy?.user?.email,
          createdByName: data?.createdBy?.user?.displayName,
          lastModifiedAt: data?.lastModifiedDateTime,
          lastModifiedByName: data?.lastModifiedBy?.user?.displayName,
          lastModifiedByEmail: data?.lastModifiedBy?.user?.email,
        };
        response.push(data_);
      }
      return response;
    } catch (error) {
      return error.message;
    }
  }

  // find array into list
  async function findFileInSiteList_(key, value, final_response) {
    console.log(
      "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",
      final_response
    );
    // console.log("Here is KVFFFFFFFFFFFFF",key,value,final_response);
    try {
      //let final_response = [];
      let result = {};
      //final_response = await unstructuredSiteList();
      result = await findObject(final_response, key, value);
      if (result !== undefined) {
        return result;
      } else {
        return "not found";
      }
    } catch (error) {
      return "not found";
    }
  }

  // find folder with parent id
  // find array into list
  async function findFileInSiteListWithParentId_(
    key1,
    value1,
    key2,
    value2,
    final_response
  ) {
    console.log("this is here", key1, value1, key2, value2);
    // console.log("final-resppppp",final_response);
    try {
      //let final_response = [];
      let result = {};
      result = await findObjectTwoKeys(
        final_response,
        key1,
        value1,
        key2,
        value2
      );
      if (result !== undefined) {
        return result;
      } else {
        return "not found";
      }
    } catch (error) {
      return "not found";
    }
  }

  // find object from array on basis on key name
  async function findObject(array, key, value) {
    try {
      return array.find((item) => item[key] === value);
    } catch (error) {
      return error.message;
    }
  }
  // with two parametere
  async function findObjectTwoKeys(array, key1, value1, key2, value2) {
    try {
      // console.log("ARRAYYYYYYYYYYYYYYYYYYYYYYYYYYY",array);
      let result = {};
      result = array.filter((o) => {
        return o[key1] === value1 && o[key2] === value2;
      });
      //console.log("findObjectTwoKeys Response =>", result);
      return result;
    } catch (error) {
      return error.message;
    }
  }

  // uploading file to sharepoint site
  async function fileUpload(parentId, file, fileName) {
    try {
      let result = {};
      const accessToken = await checkAccessTokenIsValid();
      result = await dmsExternalCommInstance.uploadFileToSite(
        accessToken,
        parentId,
        fileName,
        file
      );
      return Promise.resolve(result);
    } catch (error) {
      return error.message;
    }
  }

  // getting site folder
  // generate share point access token
  fastify.post("/generate-dms-token-", async (request, reply) => {
    try {
    } catch (error) {}
  });
}

module.exports = { dms_routes };
