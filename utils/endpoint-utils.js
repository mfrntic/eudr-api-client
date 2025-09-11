/**
 * EUDR Endpoint Utilities
 * 
 * Helper functions for automatically generating endpoints based on webServiceClientId
 * and API version, with support for manual override.
 */

/**
 * Standard EUDR webServiceClientId values that support automatic endpoint generation
 */
const STANDARD_CLIENT_IDS = ['eudr-repository', 'eudr-test'];

/**
 * Base URLs for different environments
 */
const BASE_URLS = {
  'eudr-repository': 'https://eudr.webcloud.ec.europa.eu',
  'eudr-test': 'https://acceptance.eudr.webcloud.ec.europa.eu'
};

/**
 * Service paths for different services and versions
 */
const SERVICE_PATHS = {
  'echo': {
    'v1': '/EudrEchoService',
    'v2': '/EudrEchoService' // Echo service doesn't have V2
  },
  'retrieval': {
    'v1': '/EUDRRetrievalServiceV1',
    'v2': '/EUDRRetrievalServiceV2'
  },
  'submission': {
    'v1': '/EUDRSubmissionServiceV1',
    'v2': '/EUDRSubmissionServiceV2'
  }
};

/**
 * SOAP Action URIs for different services and versions
 */
const SOAP_ACTIONS = {
  'echo': {
    'v1': 'http://ec.europa.eu/tracesnt/eudr/echo',
    'v2': 'http://ec.europa.eu/tracesnt/eudr/echo'
  },
  'retrieval': {
    'v1': 'http://ec.europa.eu/tracesnt/eudr/retrieval/v1',
    'v2': 'http://ec.europa.eu/tracesnt/eudr/retrieval/v2'
  },
  'submission': {
    'v1': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1',
    'v2': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2'
  }
};

/**
 * Check if the given webServiceClientId supports automatic endpoint generation
 * @param {string} webServiceClientId - The webServiceClientId to check
 * @returns {boolean} True if automatic endpoint generation is supported
 */
function isStandardClientId(webServiceClientId) {
  return STANDARD_CLIENT_IDS.includes(webServiceClientId);
}

/**
 * Get the base URL for the given webServiceClientId
 * @param {string} webServiceClientId - The webServiceClientId
 * @returns {string} The base URL for the environment
 * @throws {Error} If webServiceClientId is not supported
 */
function getBaseUrl(webServiceClientId) {
  if (!isStandardClientId(webServiceClientId)) {
    throw new Error(`Automatic endpoint generation not supported for webServiceClientId: ${webServiceClientId}. Please provide endpoint manually.`);
  }
  
  const baseUrl = BASE_URLS[webServiceClientId];
  if (!baseUrl) {
    throw new Error(`Unknown webServiceClientId: ${webServiceClientId}`);
  }
  
  return baseUrl;
}

/**
 * Get the service path for the given service and version
 * @param {string} service - The service name (echo, retrieval, submission)
 * @param {string} version - The API version (v1, v2)
 * @returns {string} The service path
 * @throws {Error} If service or version is not supported
 */
function getServicePath(service, version) {
  const servicePaths = SERVICE_PATHS[service];
  if (!servicePaths) {
    throw new Error(`Unknown service: ${service}. Supported services: ${Object.keys(SERVICE_PATHS).join(', ')}`);
  }
  
  const path = servicePaths[version];
  if (!path) {
    throw new Error(`Version ${version} not supported for service ${service}. Supported versions: ${Object.keys(servicePaths).join(', ')}`);
  }
  
  return path;
}
 
/**
 * Generate the complete endpoint URL for the given service, version, and webServiceClientId
 * @param {string} service - The service name (echo, retrieval, submission)
 * @param {string} version - The API version (v1, v2)
 * @param {string} webServiceClientId - The webServiceClientId
 * @returns {string} The complete endpoint URL
 * @throws {Error} If any parameter is invalid
 */
function generateEndpoint(service, version, webServiceClientId) {
  const baseUrl = getBaseUrl(webServiceClientId);
  const servicePath = getServicePath(service, version);
  
  return `${baseUrl}/tracesnt/ws${servicePath}`;
}

/**
 * Validate configuration and generate endpoint if needed
 * @param {Object} config - The configuration object
 * @param {string} service - The service name (echo, retrieval, submission)
 * @param {string} version - The API version (v1, v2)
 * @returns {Object} The validated and potentially updated configuration
 * @throws {Error} If configuration is invalid
 */
function validateAndGenerateEndpoint(config, service, version) {
  const { endpoint, webServiceClientId } = config;
  
  // If endpoint is provided, use it (manual override)
  if (endpoint) {
    return {
      ...config 
    };
  }
  
  // If no endpoint provided, webServiceClientId must be standard
  if (!webServiceClientId) {
    throw new Error('webServiceClientId is required when endpoint is not provided');
  }
  
  if (!isStandardClientId(webServiceClientId)) {
    throw new Error(
      `webServiceClientId "${webServiceClientId}" does not support automatic endpoint generation. ` +
      `Please provide endpoint manually or use one of: ${STANDARD_CLIENT_IDS.join(', ')}`
    );
  }
  
  // Generate endpoint and SOAP action
  const generatedEndpoint = generateEndpoint(service, version, webServiceClientId);
 
  
  return {
    ...config,
    endpoint: generatedEndpoint 
  };
}

/**
 * Get all supported webServiceClientId values
 * @returns {Array<string>} Array of supported webServiceClientId values
 */
function getSupportedClientIds() {
  return [...STANDARD_CLIENT_IDS];
}

/**
 * Get all supported services
 * @returns {Array<string>} Array of supported service names
 */
function getSupportedServices() {
  return Object.keys(SERVICE_PATHS);
}

/**
 * Get all supported versions for a given service
 * @param {string} service - The service name
 * @returns {Array<string>} Array of supported versions
 */
function getSupportedVersions(service) {
  const versions = SERVICE_PATHS[service];
  return versions ? Object.keys(versions) : [];
}

module.exports = {
  isStandardClientId,
  getBaseUrl,
  getServicePath, 
  generateEndpoint,
  validateAndGenerateEndpoint,
  getSupportedClientIds,
  getSupportedServices,
  getSupportedVersions,
  STANDARD_CLIENT_IDS,
  BASE_URLS,
  SERVICE_PATHS,
  SOAP_ACTIONS
};
