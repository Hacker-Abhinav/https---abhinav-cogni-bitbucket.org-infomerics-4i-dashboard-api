const { MIS_DB_INSTANCE } = require("./mis");

MIS_DB_INSTANCE.sync({ force: false }).then(async () => {
  console.log("MIS report table Sync done!");
  // await MIS_DB_INSTANCE.close();
});