const CreateWorkflowInstanceLogSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['workflow_instance_uuid'],
        properties: {
          workflow_instance_uuid: {
            type: 'string'
          }
        }
      }
    }
  },
};

const ListWorkflowInstanceLogSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object'
      }
    }
  }
}

const ViewWorkflowInstanceLogSchema = {
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

const EditWorkflowInstanceLogSchema = {
  body: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        required: ['workflow_instance_uuid'],
        properties: {
          workflow_instance_uuid: {
            type: 'string'
          }
        }
      }
    }
  }
}
  
module.exports = {
  CreateWorkflowInstanceLogSchema,
  ListWorkflowInstanceLogSchema,
  ViewWorkflowInstanceLogSchema,
  EditWorkflowInstanceLogSchema
};