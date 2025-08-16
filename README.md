# EUDR API Client

Comprehensive Node.js library for EU Deforestation Regulation (EUDR) system integration. Supports Due Diligence Statements (DDS) submission, retrieval, amendment, and retraction with V1 and V2 API versions.

## 🔧 Features

- **Complete EUDR API Coverage**: V1 and V2 API versions
- **Robust Logging System**: Configurable logging with Pino integration and console fallback
- **SOAP Web Services**: Full WSSE security implementation
- **Error Handling**: Comprehensive error handling and validation
- **Testing**: Full test suite with real API integration
- **Documentation**: Detailed API documentation and examples

## 🚀 Quick Start

### Installation

```bash
npm install eudr-api-client
```

### Basic Usage

```javascript
const { EudrSubmissionClient } = require('eudr-api-client');

const client = new EudrSubmissionClient({
  endpoint: 'https://your-eudr-endpoint.com/tracesnt/ws/EUDRSubmissionServiceV1',
  username: 'your-username',
  password: 'your-password',
  webServiceClientId: 'your-client-id'
});

// Submit a DDS
const result = await client.submitDds({
  operatorType: 'TRADER',
  statement: {
    internalReferenceNumber: 'REF-001',
    activityType: 'TRADE',
    countryOfActivity: 'HR',
    // ... more data
  }
});
```

## 📝 Logging System

The EUDR API Client includes a robust logging system that provides:

- **Pino Integration**: High-performance structured logging when available
- **Console Fallback**: Lightweight console logging when Pino is not available
- **Configurable Levels**: Set log levels via `EUDR_LOG_LEVEL` environment variable
- **Child Loggers**: Contextual logging with additional bindings
- **Conflict-Free**: Designed to work alongside parent application loggers

### Logging Configuration

```bash
# Set log level via environment variable
export EUDR_LOG_LEVEL=debug

# Or inline
EUDR_LOG_LEVEL=info npm test
```

### Logging Usage

```javascript
const { logger, createLogger, createChildLogger } = require('eudr-api-client/utils/logger');

// Use default logger
logger.info('Application started');

// Create custom logger
const customLogger = createLogger({ level: 'debug' });

// Create child logger with context
const requestLogger = createChildLogger({ requestId: 'req-123' });
```

For detailed logging documentation, see [tests/LOGGER_README.md](tests/LOGGER_README.md).

## 🧪 Testing

### Test Structure

The test suite is organized to ensure proper testing order:

1. **Logger Tests** (`tests/logger.test.js`) - Run FIRST to validate logging infrastructure
2. **Integration Tests** - Real API calls to EUDR system
3. **Service Tests** - Individual service functionality

### Running Tests

```bash
# Run all tests (logger first, then integration)
npm test

# Run only logger tests
npm run test:logger

# Run specific service tests
npm run test:echo
npm run test:retrieval
npm run test:submission
npm run test:submission:v2

# Use test runner for more control
npm run test:runner
```

### Test Categories

- **Logger System**: 34 tests covering logging infrastructure
- **Echo Service**: 11 tests (connection, auth, functionality, performance, errors, security)
- **Retrieval Service**: 16 tests (DDS retrieval, supply chain, all methods tested)
- **Submission Service V1**: Multiple tests (DDS submission, amendment, retraction)
- **Submission Service V2**: Multiple tests (V2 structure, activity-specific rules)

## 📚 API Documentation

### Services

- **EudrSubmissionClient**: Submit and manage DDS statements
- **EudrRetrievalService**: Retrieve DDS information and supply chain data
- **EudrEchoService**: Test connectivity and authentication

### Configuration

```javascript
const config = {
  endpoint: 'https://your-endpoint.com/tracesnt/ws/EUDRSubmissionServiceV1',
  username: 'your-username',
  password: 'your-password',
  webServiceClientId: 'your-client-id',
  timestampValidity: 60,        // seconds
  timeout: 30000               // milliseconds
};
```

## 🔐 Security

- **WSSE Implementation**: Full WS-Security support
- **Timestamp Validation**: Configurable timestamp validity
- **Credential Management**: Secure credential handling
- **Network Security**: HTTPS/TLS support

## 🌍 Environment Variables

Create a `.env` file based on `env.example`:

```bash
EUDR_TRACES_USERNAME=your-username
EUDR_TRACES_PASSWORD=your-password
EUDR_TRACES_BASE_URL=https://your-eudr-endpoint.com
EUDR_WEB_SERVICE_CLIENT_ID=your-client-id
EUDR_LOG_LEVEL=warn  # Optional: trace, debug, info, warn, error, fatal
```

## 📦 Dependencies

### Required
- Node.js >= 14.0.0
- axios, crypto, uuid, xml2js

### Optional
- pino (for enhanced logging performance)

## 🤝 Contributing

1. **Run logger tests first**: `npm run test:logger`
2. **Ensure all tests pass**: `npm test`
3. **Follow coding standards**: Use descriptive names, early returns, handle errors
4. **Update documentation**: Keep README and test documentation current

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [EUDR Official Documentation](https://ec.europa.eu/environment/forests/eu-regulation-deforestation-free-products_en)
- [GitHub Repository](https://github.com/eudr-api-client/eudr-api-client)
- [Issue Tracker](https://github.com/eudr-api-client/eudr-api-client/issues)

## 📞 Support

- **Email**: support@eudr-api.eu
- **GitHub Issues**: [Create an issue](https://github.com/eudr-api-client/eudr-api-client/issues)
- **Documentation**: [tests/LOGGER_README.md](tests/LOGGER_README.md) for logging details
