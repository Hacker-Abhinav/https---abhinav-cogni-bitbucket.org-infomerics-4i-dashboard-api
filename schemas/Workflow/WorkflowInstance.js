const CreateWorkflowInstanceSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['company_uuid'],
        properties: {
          company_uuid: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        required: ['mandate_uuid'],
        properties: {
          mandate_uuid: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        requried: ['assigned_at'],
        properties: {
          assigned_at: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        required: ['performed_at'],
        properties: {
          performed_at: {
            type: 'string'
          }
        }
      }
    }
  },
};

const ViewWorkflowInstanceSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['uuid'],
        properties: {
          uuid: {
            type: 'string'
          }
        }
      }
    }
  }
}

const ListWorkflowInstanceSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
      }
    }
  }
}

const EditWorkflowInstanceSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['company_uuid'],
        properties: {
          company_uuid: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        required: ['mandate_uuid'],
        properties: {
          mandate_uuid: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        required: ['uuid'],
        properties: {
          uuid: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        required: ['assigned_at'],
        properties: {
          assigned_at: {
            type: 'string'
          }
        }
      },
      params: {
        type: 'object',
        required: ['performed_at'],
        properties: {
          performed_at: {
            type: 'string'
          }
        }
      }
    }
  }
}
  
module.exports = {
  CreateWorkflowInstanceSchema,
  ViewWorkflowInstanceSchema,
  ListWorkflowInstanceSchema,
  EditWorkflowInstanceSchema
};