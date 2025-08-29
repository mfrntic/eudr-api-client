/**
 * EUDR API Client Services - Main Entry Point
 * 
 * This module provides a unified interface for all EUDR services with automatic
 * endpoint generation capabilities.
 * 
 * Automatic endpoint generation:
 * - For webServiceClientId 'eudr': production environment
 * - For webServiceClientId 'eudr-test': acceptance environment
 * - For custom webServiceClientId: endpoint must be provided manually
 * 
 * @example
 * // Import all services
 * const { EudrEchoClient, EudrRetrievalClient, EudrSubmissionClient, EudrSubmissionClientV2 } = require('./services');
 * 
 * // Create clients with automatic endpoint generation
 * const echoClient = new EudrEchoClient({
 *   username: 'user',
 *   password: 'pass',
 *   webServiceClientId: 'eudr-test',
 *   ssl: false // Allow unauthorized certificates
 * });
 * 
 * const submissionClient = new EudrSubmissionClient({
 *   username: 'user',
 *   password: 'pass',
 *   webServiceClientId: 'eudr',
 *   ssl: true // Use secure SSL/TLS
 * });
 * 
 * @example
 * // Manual endpoint override
 * const customClient = new EudrSubmissionClientV2({
 *   endpoint: 'https://custom-endpoint.com/ws/service',
 *   username: 'user',
 *   password: 'pass',
 *   webServiceClientId: 'custom-client',
 *   ssl: false // Allow unauthorized certificates for development
 * });
 * 
 * @example
 * // Access configuration information
 * const supportedIds = services.config.getSupportedClientIds();
 * const supportedServices = services.config.getSupportedServices();
 * const standardIds = services.config.STANDARD_CLIENT_IDS;
 */

const EudrEchoClient = require('./echo-service');
const EudrRetrievalClient = require('./retrieval-service');
const EudrSubmissionClient = require('./submission-service');
const EudrSubmissionClientV2 = require('./submission-service-v2');

// Re-export endpoint utilities as config for convenience
const { endpointUtils } = require('../utils');

module.exports = {
  // Service Clients
  EudrEchoClient,
  EudrRetrievalClient,
  EudrSubmissionClient,
  EudrSubmissionClientV2,
  
  // Configuration & metadata
  config: endpointUtils
};
