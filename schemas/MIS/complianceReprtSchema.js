const complianceReportSchema = {
    querystring: {
        report_type: {
        type: 'string',
        enum: ["RATING_MIS", "PR_MIS"],
                     },
        // errorMessage: "should be an RATING_MIS or PR_MIS",
     },
    body: {
      type: 'object',
      required: ['params'],
      properties: {
        params: {
          type: 'object'
        }
      }
    },
  };
    
  module.exports = {
    complianceReportSchema,
  };