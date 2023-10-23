const { masters_common_routes } = require("./common");
const { categories_routes } = require("./instrument-category");
const { cities_routes } = require("./city");
const { countries_routes } = require("./country");
const { departments_routes } = require("./department");
const { industries_routes } = require("./industry");
const {
  macro_economic_indicator_routes,
} = require("./macro-economic-indicator");
const { states_routes } = require("./state");
const { sub_categories_routes } = require("./instrument-sub-category");
const { sub_industries_routes } = require("./sub-industry");
const { sectors_routes } = require("./sector");
const { branch_office_routes } = require("./branch-office");
const { instrument_routes } = require("./instrument");
const { code_of_conduct_routes } = require("./code-of-conduct");
const { relative_routes } = require("./relationship");
const { securities_routes } = require("./securities");
const { material_event_reason } = require("./material-event-reason");
const { material_event_status } = require("./material-event-status");
const { rating_status } = require("./rating-status");
const { nds_question_routes } = require("./nds-questions");
const { template_type_routes } = require("./template-types");

module.exports = {
  masters_common_routes,
  categories_routes,
  cities_routes,
  countries_routes,
  departments_routes,
  industries_routes,
  macro_economic_indicator_routes,
  states_routes,
  sub_categories_routes,
  sub_industries_routes,
  sectors_routes,
  branch_office_routes,
  instrument_routes,
  code_of_conduct_routes,
  relative_routes,
  securities_routes,
  material_event_reason,
  material_event_status,
  rating_status,
  nds_question_routes,
  template_type_routes,
};
