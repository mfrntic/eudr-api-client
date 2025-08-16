/**
 * EUDR API Client Logger Utility
 * 
 * This module provides a Pino logger instance configured specifically for the EUDR API Client
 * to avoid conflicts with parent applications that may also use Pino.
 */

const pino = require('pino');

/**
 * Log level hierarchy for proper filtering
 */
const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

/**
 * Check if a log level should be output based on current logger level
 * @param {string} currentLevel - Current logger level
 * @param {string} messageLevel - Level of the message to log
 * @returns {boolean} Whether the message should be logged
 */
function shouldLog(currentLevel, messageLevel) {
  const current = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.warn;
  const message = LOG_LEVELS[messageLevel] ?? LOG_LEVELS.info;
  return message >= current;
}

/**
 * Create a Pino logger instance with proper formatting
 * Uses simple configuration for clean, readable output
 */
function createLogger(options = {}) {
  const defaultOptions = {
    name: 'eudr-api-client',
    level: 'warn', // Default to warn level to reduce noise
    base: null, // Remove pid, hostname, etc. to minimize output
    timestamp: () => `,"time":"${new Date().toLocaleTimeString()}"`,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      }
    },
    // Simple output format
    messageKey: 'message',
    // Better serialization
    serializers: {
      err: (err) => ({
        type: err.type,
        message: err.message,
        stack: err.stack
      })
    }
  };

  // Merge user options with defaults
  const loggerOptions = { ...defaultOptions, ...options };
  
  const pinoLogger = pino(loggerOptions);
  pinoLogger._isPino = true;
  
  return pinoLogger;
}

/**
 * Default logger instance for the EUDR API Client
 * Respects EUDR_LOG_LEVEL environment variable if set
 */
function createDefaultLogger() {
  const envLevel = process.env.EUDR_LOG_LEVEL;
  const options = {};
  
  if (envLevel && LOG_LEVELS.hasOwnProperty(envLevel)) {
    options.level = envLevel;
  }
  
  return createLogger(options);
}

const logger = createDefaultLogger();

/**
 * Create a child logger with additional context
 * @param {Object} bindings - Additional properties to bind to the logger
 * @returns {Object} Child logger instance
 */
function createChildLogger(bindings = {}) {
  return logger.child(bindings);
}

module.exports = {
  logger,
  createLogger,
  createChildLogger,
  LOG_LEVELS // Export for testing purposes
};

