const FormTypeListSchema = {
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

const FormTypeCreateSchema = {
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

const FormTypeViewSchema = {
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

const FormTypeEditSchema = {
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
  FormTypeListSchema,
  FormTypeCreateSchema,
  FormTypeViewSchema,
  FormTypeEditSchema,
};
