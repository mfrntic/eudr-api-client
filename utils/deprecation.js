/**
 * One-time deprecation warnings.
 */

const { logger } = require('./logger');

const warned = new Set();

/**
 * Warn once per process that a get*ByIdentifiers operation no longer returns content.
 * Since release 8.2.2 the Commission answers every getDdsByIdentifiers / getSdByIdentifiers call,
 * on V3 and V4 alike, with a NotFoundException ("... detail access is possible only over UI").
 *
 * @param {string} operationName
 */
function warnDetailRetrievalDeprecated(operationName) {
  if (warned.has(operationName)) {
    return;
  }
  warned.add(operationName);
  logger.warn(
    { operation: operationName },
    `${operationName} is deprecated: since EUDR release 8.2.2 declaration detail is available only in the web UI, ` +
    'and the API always answers with a NotFoundException (EUDR_DETAIL_RETRIEVAL_UNSUPPORTED). ' +
    'Use the overview operations (getDds/getDdsByInternalReference, getSd/getSdByInternalReference) instead.'
  );
}

/** Test hook: forget which warnings were already emitted. */
function resetDeprecationWarnings() {
  warned.clear();
}

module.exports = {
  warnDetailRetrievalDeprecated,
  resetDeprecationWarnings
};
