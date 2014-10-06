/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 *
 * To use New Relic:
 *   - define NEWRELIC in the environment
 *   - set NEWRELIC_APP_NAME to the app name
 *   - set NEWRELIC_LICENSE_KEY to your license key
 *
 *   e.g. NEWRELIC_APP_NAME=my-app NEWRELIC_LICENSE_KEY=xxxx NEWRELIC= node app.js
 */

function ensure(param) {
  if (typeof process.env[param] === 'undefined') {
    console.error('New Relic config error: set', param, 'in the environment');
    throw new Error('New Relic config error');
  }
}

ensure('NEWRELIC_APP_NAME');
ensure('NEWRELIC_LICENSE_KEY');

exports.config = {
  /**
   * Array of application names.
   */
  app_name : [process.env.NEWRELIC_APP_NAME],
  /**
   * Your New Relic license key.
   */
  license_key : process.env.NEWRELIC_LICENSE_KEY,
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : process.env.NEWRELIC_LOGGING_LEVEL || 'info'
  }
};
