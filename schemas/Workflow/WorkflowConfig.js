const ListWorkflowConfigSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['rating_process_uuid'],
        properties: {
          rating_process_uuid: {
            type: 'string',
          },
        }
      }
    }
  },
};

const ViewWorkflowConfigSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
          },
        }
      }
    }
  },
};

const CreateWorkflowConfigSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['rating_process_uuid'],
        properties: {
          rating_process_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        required: ['current_activity_uuid'],
        properties: {
          current_activity_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        required: ['next_activity_uuid'],
        properties: {
          next_activity_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        required: ['assigner_role_uuid'],
        properties: {
          assigner_role_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        required: ['performer_role_uuid'],
        properties: {
          performer_role_uuid: {
            type: 'string',
          },
        }
      },
    }
  },
}

const EditWorkflowConfigSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['rating_process_uuid'],
        properties: {
          rating_process_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        properties: {
          current_activity_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        properties: {
          next_activity_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        properties: {
          assigner_role_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        properties: {
          performer_role_uuid: {
            type: 'string',
          },
        }
      },
      params: {
        type: 'object',
        required: ['uuid'],
        properties: {
          uuid: {
            type: 'string',
          },
        }
      }
    }
  },
}

  
module.exports = {
  ListWorkflowConfigSchema,
  ViewWorkflowConfigSchema,
  CreateWorkflowConfigSchema,
  EditWorkflowConfigSchema
};