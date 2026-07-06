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

module.exports = { delay, pollUntil };
