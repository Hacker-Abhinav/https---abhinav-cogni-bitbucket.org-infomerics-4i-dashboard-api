const { createLogger } = require("winston");
const LokiTransport = require("winston-loki");

function GET_LOKI_LOGGER(logType, apiCtx) {
  let options = {
    transports: [
      new LokiTransport({
        host: process.env['LOKI_ENDPOINT'],
        json: true,
        labels: {
          log_type: logType,
        }
      }),
    ],
  };
  return createLogger(options);
}

const warning_logger = GET_LOKI_LOGGER(`WARNING`);
const error_logger = GET_LOKI_LOGGER(`ERROR`);

module.exports = {
  warning_logger,
  error_logger
};