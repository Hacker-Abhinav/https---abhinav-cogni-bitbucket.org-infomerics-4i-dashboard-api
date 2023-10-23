const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const https = require("https");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");


const numInWords = [
  "",
  "One ",
  "Two ",
  "Three ",
  "Four ",
  "Five ",
  "Six ",
  "Seven ",
  "Eight ",
  "Nine ",
  "Ten ",
  "Eleven ",
  "Twelve ",
  "Thirteen ",
  "Fourteen ",
  "Fifteen ",
  "Sixteen ",
  "Seventeen ",
  "Eighteen ",
  "Nineteen ",
];
const tensInWords = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

// ENCODE_JWT_DATA
function ENCODE_JWT_DATA(params, validity) {
  return new Promise(async (resolve) => {
    let encodedObject = jwt.sign(params, process.env["JWT_SECRET_KEY"], {
      expiresIn: validity || "24h",
    });
    resolve(encodedObject);
  });
}

// FS_TO_JSON
async function FS_TO_JSON(path) {
  return new Promise(async (resolve) => {
    const file = fs.readFileSync(path);
    const response = JSON.parse(file);
    resolve(response);
  });
}

// APPEND_USER_DATA
function APPEND_USER_DATA(request, params) {
  params["updated_at"] = new Date();
  params["updated_by"] = request.user.id;
  return params;
}

// GET_PAGINATION_PARAMS
function GET_PAGINATION_PARAMS(body) {
  return {
    limit: (body && body["limit"]) ?? 600,
    offset: (body && body["offset"]) ?? 0,
  };
}

// SET_PAGINATION_PARAMS
function SET_PAGINATION_PARAMS(request, params) {
  let page_params = GET_PAGINATION_PARAMS(request.body);
  params["limit"] = page_params["limit"];
  params["offset"] = page_params["offset"];
  return params;
}

// SET_PAGINATION_PAGE_CONF
function SET_PAGINATION_PAGE_CONF(request, params) {
  let page_params = GET_PAGINATION_PARAMS(request.body);
  return {
    total: params["total"],
    page_count: Number.parseInt(params["total"] / page_params["limit"], 10) + 1,
  };
}
function GENERATE_SIX_DIGIT_OTP() {
  let digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

function AES_ENCRYPT_DATA(text) {
  // console.log(crypto.randomBytes(32).toString());
  const Securitykey = Buffer.from(process.env["AES_SECRET_KEY"], "base64");
  const iv = crypto.randomBytes(16); // Generate a random IV (Initialization Vector)
  const cipher = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
  let encrypted = cipher.update(text,"utf8", "hex");
  encrypted += cipher.final("hex");
  // Return the IV concatenated with the encrypted data
  return iv.toString("hex") + encrypted;
}


function AES_DECRYPT_DATA(encryptedText) {
  const Securitykey = Buffer.from(process.env["AES_SECRET_KEY"], "base64");
  const iv = Buffer.from(encryptedText.slice(0, 32), "hex"); // Extract the IV from the encrypted data
  const encryptedData = encryptedText.slice(32); // Extract the encrypted data without the IV
  const decipher = crypto.createDecipheriv("aes-256-cbc", Securitykey, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// CHECK_PERMISSIONS
async function CHECK_PERMISSIONS(request, permission_key) {
  return new Promise(async (resolve, reject) => {
    if (process.env["CHECK_PERMISSIONS"] === "true") {
      if (request.user_permissions.includes(permission_key)) {
        resolve(true);
      } else {
        resolve(true);
        // reject({
        //   'error': 'NO_PERMISSION'
        // });
      }
    } else {
      resolve(true);
    }
  });
}

// UPLOAD_DOCUMENT
async function UPLOAD_DOCUMENT(parts, uuid_param) {
  const account = process.env["AZURE_STORAGE_ACCOUNT"];
  const sharedKeyCredential = new StorageSharedKeyCredential(
    process.env["AZURE_STORAGE_ACCOUNT"],
    process.env["AZURE_STORAGE_ACCESS_KEY"]
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential
  );
  const containerClient = blobServiceClient.getContainerClient(
    process.env["CONTAINER_NAME"]
  );
  const fields = [];
  console.log("helper called");
  for await (const part of parts) {
    console.log("fieldname : ", part["fieldname"]);
    if (part.file) {
      try {
        fields.push(part.fieldname);
        const blobName = `${uuid_param}_${part.fieldname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const res = await blockBlobClient.uploadStream(part.file, 509800);
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }
  return fields;
}

// download file
const DOWNLOAD_FILE = async (url, filePath) => {
  try {
    const fileStream = fs.createWriteStream(filePath);
    console.log("file stream created");
    try {
      return new Promise((resolve, reject) => {
        https.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject("Unable to download");
          } else {
            console.log(
              `file downloaded successfully from ${url} and stored to ${filePath}`
            );
            response.pipe(fileStream);
            fileStream.on("finish", resolve);
            fileStream.on("error", reject);
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  } catch (error) {
    console.log(error);
  }
};

// CREATE_WORKFLOW_INSTANCE
async function CREATE_WORKFLOW_INSTANCE(params) {
  // params = company_id | mandate_id
  // return `workflow_instance_id`
}

// TRIGGER_ACTIVITY
async function TRIGGER_ACTIVITY(params) {
  // params = workflow_instance_id | primary_activity_id | assigned_by_user_id | performed_by_user_id
  // Activate `next_activity` unless current is not last_activity
  // ACTIVITY_LOGICS[code].run()
}

// CONVERT_TO_ARRAY
function CONVERT_TO_ARRAY(input) {
  return input[0] !== undefined ? input : [input];
}

function INWORDS(num) {
  if ((num = num.toString()).length > 9) return "overflow";
  n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = "";
  str +=
    n[1] != 0
      ? (numInWords[Number(n[1])] ||
          tensInWords[n[1][0]] + " " + numInWords[n[1][1]]) + "Crore "
      : "";
  str +=
    n[2] != 0
      ? (numInWords[Number(n[2])] ||
          tensInWords[n[2][0]] + " " + numInWords[n[2][1]]) + "Lakh "
      : "";
  str +=
    n[3] != 0
      ? (numInWords[Number(n[3])] ||
          tensInWords[n[3][0]] + " " + numInWords[n[3][1]]) + "Thousand "
      : "";
  str +=
    n[4] != 0
      ? (numInWords[Number(n[4])] ||
          tensInWords[n[4][0]] + " " + numInWords[n[4][1]]) + "Hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (numInWords[Number(n[5])] ||
          tensInWords[n[5][0]] + " " + numInWords[n[5][1]]) +
        "only "
      : "";
  return str;
}

// UPLOAD_TO_AZURE_STORAGE
async function UPLOAD_TO_AZURE_STORAGE(buffer, params) {
  const account = process.env["AZURE_STORAGE_ACCOUNT"];
  const credential = new StorageSharedKeyCredential(
    process.env["AZURE_STORAGE_ACCOUNT"],
    process.env["AZURE_STORAGE_ACCESS_KEY"]
  );
  const client = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential
  );
  const container_client = client.getContainerClient(
    process.env["CONTAINER_NAME"]
  );
  const block_blob_client = container_client.getBlockBlobClient(params["path"]);

  const response = await block_blob_client.uploadData(buffer);

  if (response._response.status !== 201) {
    throw new Error(
      `Error uploading document ${block_blob_client.name} to container ${block_blob_client.containerName}`
    );
  }

  return response._response.request.url;
}

function MONTH_DIFFERENCE(d1, d2) {
  var months;
  d1 = new Date(d1);
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

module.exports = {
  ENCODE_JWT_DATA,
  FS_TO_JSON,
  APPEND_USER_DATA,
  CHECK_PERMISSIONS,
  GET_PAGINATION_PARAMS,
  SET_PAGINATION_PARAMS,
  SET_PAGINATION_PAGE_CONF,
  UPLOAD_DOCUMENT,
  CONVERT_TO_ARRAY,
  UPLOAD_TO_AZURE_STORAGE,
  MONTH_DIFFERENCE,
  INWORDS,
  GENERATE_SIX_DIGIT_OTP,
  AES_DECRYPT_DATA,
  AES_ENCRYPT_DATA,
  DOWNLOAD_FILE,
  
};
