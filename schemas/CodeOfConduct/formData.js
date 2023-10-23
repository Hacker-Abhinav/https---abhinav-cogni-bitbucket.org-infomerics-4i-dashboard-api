const FormDataCreateSchema = {
  body: {
    additionalProperties: false,
    required: ["params"],
    type: "object",
    properties: {
      params: {
        type: "object",
        properties: {
          form_data: {
            type: "object",
            properties: {
              form_type_id: { type: "string" },
              status: { type: "boolean" },
              last_edited: { type: "string", format: "date" },
              signature: { type: "string" },
              financial_year: { type: "string" },
              form_date: { type: "string", format: "date" },
              user_id: { type: "string" },
              approved_at: { type: "string", format: "date" },
              approved_by: { type: "string" },
            },
          },
          relatives_data: {
            type: "array",
            properties: {
              name: { type: "string" },
              relationship: { type: "string" },
            },
          },
          relative_investment: {
            type: "array",
            properties: {
              relative_id: { type: "number" },
              name: { type: "string" },
              company_name: { type: "string" },
              face_value: { type: "number" },
              num_name_securities_acquired: { type: "string" },
              consideration_paid: { type: "number" },
              num_name_securities_disposed: { type: "string" },
              consideration_recieved: { type: "number" },
              folio: { type: "string" },
              investment_approval_date: { type: "string", format: "date" },
              approval_status: { type: "string" },
              approval_required: { type: "boolean" },
              reason_for_min_period_waiver: { type: "number" },
              form_id: { type: "string" },
              num_name_securities_held: { type: "string" },
              num_name_securities_to_be_dealt: { type: "string" },
              nature_of_transaction: { type: "string" },
              acquisition_date: { type: "string", format: "date" },
              reason_for_min_period_waiver: { type: "string" },
              num_name_securities_to_be_disposed: { type: "string" },
            },
          },
          user_investment: {
            type: "array",
            properties: {
              name: { type: "string" },
              company_name: { type: "string" },
              face_value: { type: "number" },
              num_name_securities_acquired: { type: "string" },
              consideration_paid: { type: "number" },
              num_name_securities_disposed: { type: "string" },
              consideration_recieved: { type: "number" },
              folio: { type: "string" },
              investment_approval_date: { type: "string", format: "date" },
              approval_status: { type: "string" },
              approval_required: { type: "boolean" },
              reason_for_min_period_waiver: { type: "number" },
              form_id: { type: "string" },
              num_name_securities_held: { type: "string" },
              num_name_securities_to_be_dealt: { type: "string" },
              nature_of_transaction: { type: "string" },
              acquisition_date: { type: "string", format: "date" },
              reason_for_min_period_waiver: { type: "string" },
              num_name_securities_to_be_disposed: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const FormDataEditSchema = {
  body: {
    type: "object",
    form_type_id: { type: "number" },
    status: { type: "boolean" },
    last_edited: { type: "date" },
    signature: { type: "string" },
    financial_year: { type: "string" },
    form_date: { type: "date" },
    user_id: { type: "number" },
    approved_at: { type: "string" },
    approved_by: { type: "string" },
    is_active: { type: "boolean" },
    relatives_data: {
      type: "array",
      properties: {
        name: { type: "string" },
        relationship: { type: "string" },
      },
    },

    relative_investment: {
      type: "array",
      required: ["relative_id"],
      properties: {
        relative_id: { type: "number" },
        name: { type: "string" },
        company_name: { type: "string" },
        face_value: { type: "number" },
        num_name_securities_acquired: { type: "string" },
        consideration_paid: { type: "number" },
        num_name_securities_disposed: { type: "string" },
        consideration_recieved: { type: "number" },
        folio: { type: "string" },
        investment_approval_date: { type: "date" },
        approval_status: { type: "string" },
        approval_required: { type: "boolean" },
        reason_for_min_period_waiver: { type: "number" },
        form_id: { type: "string" },
        num_name_securities_held: { type: "string" },
        num_name_securities_to_be_dealt: { type: "string" },
        nature_of_transaction: { type: "string" },
        acquisition_date: { type: "date" },
        reason_for_min_period_waiver: { type: "string" },
        num_name_securities_to_be_disposed: { type: "string" },
      },
    },
    user_investment: {
      type: "array",
      properties: {
        name: { type: "string" },
        company_name: { type: "string" },
        face_value: { type: "number" },
        num_name_securities_acquired: { type: "string" },
        consideration_paid: { type: "number" },
        num_name_securities_disposed: { type: "string" },
        consideration_recieved: { type: "number" },
        folio: { type: "string" },
        investment_approval_date: { type: "date" },
        approval_status: { type: "string" },
        approval_required: { type: "boolean" },
        reason_for_min_period_waiver: { type: "number" },
        form_id: { type: "string" },
        num_name_securities_held: { type: "string" },
        num_name_securities_to_be_dealt: { type: "string" },
        nature_of_transaction: { type: "string" },
        acquisition_date: { type: "date" },
        reason_for_min_period_waiver: { type: "string" },
        num_name_securities_to_be_disposed: { type: "string" },
      },
    },
  },
};

const FormDataViewSchema = {
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

const FormDataListSchema = {
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

module.exports = {
  FormDataCreateSchema,
  FormDataViewSchema,
  FormDataEditSchema,
  FormDataListSchema,
};
