const {
  base_routes,
  auth_routes,
  api_routes,
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
  sync_routes,
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
} = require("./routes");
const {
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
  code_of_conduct_form_routes,
  mom_docs_routes,
  rating_letter_docs_routes,
  compliance_routes,
  mis_data_mart_routes,
  provisional_comm_blr_docs_routes,
  inc_rating_letter_docs_routes,
  surveillance_inc_rating_letter_docs_routes,
  provisional_comm_ir_docs_routes,
  other_rating_agency_routes,
  corporate_guarantee_routes,
  removal_of_credit_watch_docs_routes,
  rejection_representation_rl_docs_routes,
  template_lists_routes,
  letter_lists_routes,
  dms_routes,
  document_types_routes,
} = require("./routes/modules/index");
const { is_valid_user } = require("./middlewares/auth");

const fastifyConf = {
  logger: false,
  trustProxy: true,
};
const fastify = require("fastify")(fastifyConf);
const fastifyCors = require("@fastify/cors");
fastify.register(fastifyCors);

const fastifyMultipart = require("@fastify/multipart");
fastify.register(fastifyMultipart, {
  attachFieldsToBody: true,
  limits: {
    fileSize: 104857600,  // For multipart forms, the max file size in bytes
  }
});

const path = require("path");

const scheduledFunctions = require("./services/cron-job");

scheduledFunctions.initScheduledJobs();

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

fastify.register(require("@fastify/view"), {
  engine: {
    pug: require("pug"),
  },
});

// App
fastify.register(
  (instance, opts, done) => {
    // Base routes
    fastify.register(base_routes);
    // Auth routes
    fastify.register(auth_routes, { prefix: "auth" });
    fastify.register(
      (instance, opts, done) => {
        instance.register(nds_question_routes);
        done();
      },
      { prefix: "v1" }
    );
    // API (v1) routes
    fastify.register(
      (instance, opts, done) => {
        instance.addHook("onRequest", async (request, reply) => {
          await is_valid_user(request, reply);
        });
        instance.register(api_routes);
        instance.register(code_of_conduct_form_routes);

        instance.register(masters_common_routes);
        instance.register(categories_routes);
        instance.register(cities_routes);
        instance.register(countries_routes);
        instance.register(departments_routes);
        instance.register(industries_routes);
        instance.register(macro_economic_indicator_routes);
        instance.register(states_routes);
        instance.register(sub_categories_routes);
        instance.register(sub_industries_routes);
        instance.register(sectors_routes);
        instance.register(branch_office_routes);
        instance.register(rating_model_routes);
        instance.register(rating_committee_routes);
        instance.register(due_diligence_json);
        instance.register(outlook_routes);
        instance.register(instrument_routes);
        instance.register(interaction_routes);
        instance.register(workflows_routes);
        instance.register(inbox_routes);
        instance.register(mis_reports_routes);
        instance.register(rating_sheet_docs_routes);
        instance.register(agenda_docs_routes);
        instance.register(press_release_docs_routes);
        instance.register(code_of_conduct_routes);
        instance.register(mis_data_mart_routes);
        instance.register(relative_routes);
        instance.register(mom_docs_routes);
        instance.register(rating_letter_docs_routes);
        instance.register(compliance_routes);
        instance.register(provisional_comm_blr_docs_routes);
        instance.register(inc_rating_letter_docs_routes);
        instance.register(surveillance_inc_rating_letter_docs_routes);
        instance.register(provisional_comm_ir_docs_routes);
        instance.register(other_rating_agency_routes);
        instance.register(corporate_guarantee_routes);
        instance.register(removal_of_credit_watch_docs_routes);
        instance.register(rejection_representation_rl_docs_routes);
        instance.register(securities_routes);
        instance.register(material_event_reason);
        instance.register(material_event_status);
        instance.register(rating_status);
        instance.register(template_type_routes);
        instance.register(template_lists_routes);
        instance.register(letter_lists_routes);
        instance.register(dms_routes);
        instance.register(document_types_routes);
        done();
      },
      { prefix: "v1" }
    );

    // Sync routes
    fastify.register(sync_routes, { prefix: "sync" });

    done();
  },
  { prefix: process.env["BASE_APP_PATH"] }
);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: process.env["BASE_APP_PORT"] });
  } catch (err) {
    console.log("error", err);
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

// Fly!
