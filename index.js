const { EudrEchoClient, EudrRetrievalClient, EudrRetrievalClientV2, EudrSubmissionClient, EudrSubmissionClientV2, EudrSubmissionClientV3, EudrRetrievalClientV3, EudrSimplifiedDeclarationClientV3, EudrVerifyDeclarationClientV3 } = require('./services');
const { EudrErrorHandler, logger, createLogger, createChildLogger, endpointUtils } = require('./utils');

module.exports = {
  EudrEchoClient,
  EudrRetrievalClient,
  EudrRetrievalClientV2,
  EudrSubmissionClient,
  EudrSubmissionClientV2,
  EudrSubmissionClientV3,
  EudrRetrievalClientV3,
  EudrSimplifiedDeclarationClientV3,
  EudrVerifyDeclarationClientV3,
  EudrErrorHandler,
  logger,
  createLogger,
  createChildLogger,
  config: endpointUtils
};