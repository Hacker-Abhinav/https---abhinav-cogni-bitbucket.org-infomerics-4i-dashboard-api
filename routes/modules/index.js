const { outlook_routes } = require("./outlook");
const { rating_model_routes } = require("./rating-model");
const { rating_committee_routes } = require("./rating-committee");
const { due_diligence_json } = require("./due-dilligence");
const { interaction_routes } = require("./interaction");
const { workflows_routes } = require("./workflow");
const { inbox_routes } = require("./inbox");
const {
  rating_sheet_docs_routes,
} = require("./meeting-docs/rating-sheet-docs");
const { agenda_docs_routes } = require("./meeting-docs/agenda-docs");
const { mis_reports_routes } = require("./mis/reports");

const { code_of_conduct_form_routes } = require("./code-of-conduct-forms");
const { mom_docs_routes } = require("./meeting-docs/mom-docs");
const {
  press_release_docs_routes,
} = require("./meeting-docs/press-release-docs");
const { mis_data_mart_routes } = require("./mis-data-mart/index");
const {
  rating_letter_docs_routes,
} = require("./meeting-docs/rating-letter-docs");
const {
  provisional_comm_blr_docs_routes,
} = require("./meeting-docs/provisional-comm-blr-docs");
const { compliance_routes } = require("./compliance");
const {
  inc_rating_letter_docs_routes,
} = require("./meeting-docs/inc-rating-letter-docs");
const { provisional_comm_ir_docs_routes } = require("./meeting-docs/provisional-comm-ir-docs")
const { surveillance_inc_rating_letter_docs_routes } = require("./meeting-docs/surveillance-inc-rating-letter")
const { other_rating_agency_routes } = require("./other-rating-agency")
const { corporate_guarantee_routes } = require("./corporate-guarantee")
const { template_lists_routes } = require("./template-list");
const { letter_lists_routes } = require("./letter-lists");
const { removal_of_credit_watch_docs_routes } = require("./meeting-docs/removal-of-credit-watch-docs")
const { rejection_representation_rl_docs_routes } = require("./meeting-docs/rejection-of-representation-docs")
const { dms_routes }= require('../dms/index');
const { document_types_routes } = require('./masters/document-type');
module.exports = {
  outlook_routes,
  rating_model_routes,
  rating_committee_routes,
  due_diligence_json,
  interaction_routes,
  workflows_routes,
  inbox_routes,
  mis_reports_routes,
  rating_sheet_docs_routes,
  agenda_docs_routes,
  press_release_docs_routes,
  mom_docs_routes,
  mis_data_mart_routes,
  code_of_conduct_form_routes,
  mom_docs_routes,
  rating_letter_docs_routes,
  provisional_comm_blr_docs_routes,
  compliance_routes,
  inc_rating_letter_docs_routes,
  provisional_comm_ir_docs_routes,
  surveillance_inc_rating_letter_docs_routes,
  other_rating_agency_routes,
  corporate_guarantee_routes,
  removal_of_credit_watch_docs_routes,
  rejection_representation_rl_docs_routes,
  template_lists_routes,
  letter_lists_routes,
  dms_routes,
  document_types_routes
};
