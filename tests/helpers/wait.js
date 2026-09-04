/**
 * Small timing helpers for live integration tests against the real EUDR
 * acceptance environment, where the server processes submissions
 * asynchronously (risk profiling etc.) before fields like referenceNumber
 * become available.
 */

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll `fn` until it returns a truthy/non-empty result or the timeout elapses.
 * Unlike retryApiCall in test-setup.js (which retries on thrown errors),
 * this retries on a successful-but-not-ready result (e.g. an empty ddsInfo[]).
 *
 * @param {() => Promise<any>} fn - called repeatedly; should resolve (not throw) even when not ready
 * @param {(result: any) => boolean} isReady - returns true when `result` is usable
 * @param {Object} [options]
 * @param {number} [options.intervalMs=3000]
 * @param {number} [options.timeoutMs=20000]
 * @returns {Promise<{ ready: boolean, result: any }>}
 */
async function pollUntil(fn, isReady, options = {}) {
  const intervalMs = options.intervalMs || 3000;
  const timeoutMs = options.timeoutMs || 20000;
  const start = Date.now();
  let lastResult;

  while (Date.now() - start < timeoutMs) {
    lastResult = await fn();
    if (isReady(lastResult)) {
      return { ready: true, result: lastResult };
    }
    await delay(intervalMs);
  }

  return { ready: false, result: lastResult };
}


/**
 * Tolerate the retrieval race that follows every write. A DDS/SD is not queryable the instant it
 * is accepted, and in that window the server legitimately answers a retrieval in one of two ways:
 * an overview array (possibly empty), or a NotFoundException. Asserting only the first makes a live
 * test race the server's own indexing - see Known Limitations #3 in docs/analysis/v3-live-test-plan.md.
 *
 * Returns the result when one came back, or null when the server answered with a not-found fault.
 * The fault is asserted to be properly typed before being swallowed, so a malformed one still fails.
 *
 * @param {Promise} retrieval - the in-flight retrieval call
 * @param {string} label - short description used in the console trace and assertion messages
 * @param {Function} expect - the caller's chai `expect` (this module stays assertion-library free)
 * @returns {Promise<Object|null>}
 */
async function resolveOrCleanNotFound(retrieval, label, expect) {
  try {
    return await retrieval;
  } catch (error) {
    console.log(`[${label}] not-found fault this soon after the write (${error.eudrErrorCode})`);
    expect(error.notFound, `${label}: a fault this soon after a write must be a clean NotFoundException`).to.be.true;
    expect(error.httpStatus).to.equal(404);
    expect(error.eudrErrorCode).to.equal('EUDR_NOT_FOUND');
    return null;
  }
}

module.exports = { delay, pollUntil, resolveOrCleanNotFound };
