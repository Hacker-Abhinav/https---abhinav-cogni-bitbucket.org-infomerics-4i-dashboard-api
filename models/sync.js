const { DB_INSTANCE } = require("./modules/onboarding");
const { RATING_DB_INSTANCE } = require("./modules/rating-model.js");
const { WORKFLOW_DB_INSTANCE } = require("./modules/workflow.js");
const { INTERACTION_DB_INSTANCE } = require("./modules/interaction.js");
const {
  RATING_COMMITTEE_DB_INSTANCE,
} = require("./modules/rating-committee.js");
const backup_database = require("../services/sql-dump");
const { COC_DB_INSTANCE } = require("./modules/code_of_conduct.js");
const { COMPLIANCE_DB_INSTANCE } = require("./modules/compliance");

if (false) {
  backup_database();
}

if (false) {
  DB_INSTANCE.sync({ force: true }).then(async () => {
    console.log("Base table Sync done!");
    // await DB_INSTANCE.close();
  });
}

if (false) {
  RATING_COMMITTEE_DB_INSTANCE.sync({ force: true }).then(async () => {
    console.log("Rating Committee Table Sync Done!");
    // await DB_INSTANCE.close();
  });
}

if (false) {
  WORKFLOW_DB_INSTANCE.sync({ force: true }).then(async () => {
    console.log("Workflow table sync done!");
  });
}

if (false) {
  RATING_DB_INSTANCE.sync({ force: true }).then(async () => {
    console.log("Rating Model table Sync done!");
    await RATING_DB_INSTANCE.close();
  });
}

if (false) {
  RATING_DB_INSTANCE.sync({ force: true }).then(async () => {
    console.log("Rating Committee table Sync done!");
    await RATING_DB_INSTANCE.close();
  });
}

if (true) {
  INTERACTION_DB_INSTANCE.sync({ force: true }).then(async () => {
    console.log("Interaction table Sync done!");
    await INTERACTION_DB_INSTANCE.close();
  });
}
