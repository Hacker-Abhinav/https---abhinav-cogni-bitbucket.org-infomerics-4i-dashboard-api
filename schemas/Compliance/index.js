const InitialPendingStatusEditSchema = {
  body: {
    type: "object",
    required: ["params"],
    properties: {
      params: {
        type: "object",
        required: ["uuid"],
        properties: {
          uuid: {
            type: "string",
          },
          remarks: {
            type: "string",
          },
          status: {
            type: "string",
          },
          expected_date: {
            type: "string",
          },
        },
      },
    },
  },
};

const SurveillancePendingStatusEditSchema = {
  body: {
    type: "object",
    required: ["params"],
    properties: {
      params: {
        type: "object",
        required: ["company_uuid"],
        properties: {
          company_uuid: {
            type: "string",
          },
          remarks: {
            type: "string",
          },
          status: {
            type: "string",
          },
          expected_date: {
            type: "string",
          },
          revised_expected_date: {
            type: "string",
          },
        },
      },
    },
  },
};

module.exports = {
  InitialPendingStatusEditSchema,
  SurveillancePendingStatusEditSchema,
};
