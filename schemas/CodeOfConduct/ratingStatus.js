const RatingStatusListSchema = {
  body: {
    type: "object",
    required: ["params"],
    properties: {
      params: {
        type: "object",
        properties: {
          is_active: {
            type: "boolean",
          },
          uuid: {
            type: "string",
          },
        },
      },
    },
  },
};

const RatingStatusCreateSchema = {
  body: {
    type: "object",
    required: ["params"],
    properties: {
      params: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
          is_active: {
            type: "boolean",
          },
        },
      },
    },
  },
};

const RatingStatusViewSchema = {
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
        },
      },
    },
  },
};

const RatingStatusEditSchema = {
  body: {
    type: "object",
    required: ["params"],
    properties: {
      params: {
        type: "object",
        required: ["uuid", "name", "is_active"],
        properties: {
          uuid: {
            type: "string",
          },
          name: {
            type: "string",
          },
          is_active: {
            type: "boolean",
          },
        },
      },
    },
  },
};

module.exports = {
  RatingStatusListSchema,
  RatingStatusCreateSchema,
  RatingStatusViewSchema,
  RatingStatusEditSchema,
};
