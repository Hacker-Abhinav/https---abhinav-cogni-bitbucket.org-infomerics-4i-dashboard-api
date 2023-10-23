const fs = require("fs");
const https = require("https");
const decompress = require("decompress");
const csv = require("csv-parser");
const path = require("path");
const { ListingDetail } = require("../models/modules/onboarding");

const downloadFile = async (url, filePath) => {
  try {
    const fileStream = fs.createWriteStream(filePath);
    console.log("file stream created");
    try {
      await new Promise((resolve, reject) => {
        https.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject("Unable to download");

            return;
          } else {
            console.log(
              `Zip file downloaded successfully from ${url} and stored to ${filePath}`
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

const extractCSVFromZip = async (zipFilePath, csvFolderPath) => {
  try {
    return new Promise(async (resolve, reject) => {
      setTimeout(() => {
        const file = decompress(zipFilePath, csvFolderPath);
        resolve(file);
      }, 500);
      console.log("CSV extracted successfully.");
    });
  } catch (error) {
    console.error("Error occurred during extraction:", error);
  }
};

const getValuesFromCSV = (csvFilePath, column1Name, column2Name) => {
  return new Promise((resolve, reject) => {
    const valuesArray = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        const column1Value = row[column1Name];
        const column2Value = row[column2Name];
        if (column1Value && column2Value) {
          valuesArray.push({
            [column1Name]: column1Value,
            [column2Name]: column2Value,
          });
        }
      })
      .on("end", () => {
        resolve(valuesArray); // Resolve with the array of objects
      })
      .on("error", (error) => {
        reject(error); // Reject with the error if there was an issue reading the CSV
      });
  });
};

const downloadExtractAndGetValues = async (
  fileName,
  url,
  column1Name,
  column2Name
) => {
  try {
    const FolderPath = "generated/";
    const zipFilePath = path.join(FolderPath, fileName);
    const csvFolderPath = FolderPath;

    // Download the zip file using https
    console.log(
      `Downloading the zip file with name ${fileName} from ${url} to fetch ${column1Name} and ${column2Name}`
    );
    await downloadFile(url, zipFilePath);

    // Extract the CSV from the zip
    console.log("Extracting CSV from the zip file...");
    await extractCSVFromZip(zipFilePath, csvFolderPath);

    // Get values from the specified columns in the CSV
    console.log("Getting values from the CSV...");
    const csvFileName = fs
      .readdirSync(csvFolderPath)
      .find((file) => file.endsWith(".CSV") || file.endsWith(".csv"));
    if (!csvFileName) {
      console.log("CSV file not found in   extracted zip.");
      return;
    }
    const csvFilePath = path.join(csvFolderPath, csvFileName);
    const valuesArray = await getValuesFromCSV(
      csvFilePath,
      column1Name,
      column2Name
    );

    // Cleanup: delete the zip and extracted CSV
    console.log("Cleaning up...");
    fs.unlinkSync(zipFilePath);
    fs.unlinkSync(csvFilePath);

    console.log("Cleanup complete.");

    return valuesArray; // Return the array of objects containing values from the columns
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
};

// Replace the URL, column names with your specific values

// Call the function to download, extract, and get values from the CSV

// const searchValueInColumn = (csvFilePath, columnName, searchValue) => {
//   return new Promise((resolve, reject) => {
//     let foundValue = undefined;

//     fs.createReadStream(csvFilePath)
//       .pipe(csv())
//       .on("data", (row) => {
//         if (row[columnName] === searchValue) {
//           foundValue = row["CLOSE"];
//         }
//       })
//       .on("end", () => {
//         resolve(foundValue); // Resolve with the found value or undefined if not found
//       })
//       .on("error", (error) => {
//         reject(error); // Reject with the error if there was an issue reading the CSV
//       });
//   });
// };

module.exports = {
  downloadExtractAndGetValues,
};
