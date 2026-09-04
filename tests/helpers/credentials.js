/**
 * Credential gating for the live (no-mock) suites.
 *
 * These suites need real EUDR acceptance-environment credentials in `.env`. When those are absent
 * - CI, a fresh clone, a contributor without a TRACES NT account - the suite must **skip**, not
 * fail: a missing `.env` is a missing prerequisite, not a defect in the code under test. Throwing
 * from a `before` hook instead turns every such environment into a red build.
 *
 * Usage (note: a real `function`, not an arrow - `this` must be the mocha context):
 *
 *   const { skipWithoutCredentials } = require('../helpers/credentials');
 *
 *   before(async function () {
 *     require('dotenv').config();
 *     if (skipWithoutCredentials(this)) return;
 *     // ... build clients
 *   });
 */

const DEFAULT_REQUIRED = ['EUDR_TRACES_USERNAME', 'EUDR_TRACES_PASSWORD', 'EUDR_TRACES_BASE_URL'];

/**
 * @param {string[]} [required] - environment variable names this suite needs
 * @returns {string[]} the names that are missing or empty
 */
function missingCredentials(required = DEFAULT_REQUIRED) {
  return required.filter((name) => !process.env[name]);
}

/**
 * Skip the surrounding suite when any required credential is missing.
 *
 * `ctx.skip()` marks the whole suite pending and aborts the hook by throwing, so the `return`
 * in the calling `before` is belt-and-braces rather than load-bearing.
 *
 * @param {Mocha.Context} ctx - the mocha context (`this` inside a `function` hook)
 * @param {string[]} [required] - environment variable names this suite needs
 * @returns {boolean} false when every credential is present
 */
function skipWithoutCredentials(ctx, required) {
  const missing = missingCredentials(required);
  if (missing.length === 0) {
    return false;
  }

  console.log(
    `[skip] live suite needs ${missing.join(', ')} - set them in .env to run it against the acceptance environment`
  );
  ctx.skip();
  return true;
}

module.exports = { DEFAULT_REQUIRED, missingCredentials, skipWithoutCredentials };
