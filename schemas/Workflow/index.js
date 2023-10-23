const { ActivitySchema } = require("./Activity")
const { RatingProcessSchema } = require("./RatingProcess")
const { WorkflowConfigSchema } = require("./WorkflowConfig")
const { WorkflowInstanceSchema } = require("./WorkflowInstance") 
const { WorkflowInstanceLogSchema } = require("./WorkflowInstanceLog")

module.exports = {
    RatingProcessSchema,
    ActivitySchema,
    WorkflowConfigSchema,
    WorkflowInstanceSchema,
    WorkflowInstanceLogSchema
}