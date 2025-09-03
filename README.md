# 🌲 EUDR API Client

[![npm version](https://img.shields.io/npm/v/eudr-api-client.svg)](https://www.npmjs.com/package/eudr-api-client)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js Version](https://img.shields.io/node/v/eudr-api-client.svg)](https://nodejs.org)
[![Test Status](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./tests/README.md)

> **Enterprise-grade Node.js library for EU Deforestation Regulation (EUDR) compliance**  
> Complete integration with EUDR TRACES system for Due Diligence Statements (DDS) management

## EUDR Systems

The EUDR system operates on two environments:

- **🟢 Production (LIVE)**: [https://eudr.webcloud.ec.europa.eu/tracesnt/](https://eudr.webcloud.ec.europa.eu/tracesnt/)
  - **Purpose**: Real submissions with legal value
  - **Web Service Client ID**: `eudr`
  - **Use**: Only for products to be placed on the market or exported after entry into application
  - **Note**: Submissions have legal value and can be subject to checks by Competent Authorities

- **🟡 Acceptance (Training)**: [https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/](https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/)
  - **Purpose**: Training and familiarization platform
  - **Web Service Client ID**: `eudr-test`
  - **Use**: Testing and getting familiar with the system
  - **Note**: Submissions have no legal value

## Why EUDR API Client?

The EU Deforestation Regulation (EUDR) requires operators and traders to submit Due Diligence Statements for commodities like wood, cocoa, coffee, and more. This library provides:

- ✅ **100% API Coverage** - Both V1 and V2 EUDR APIs fully implemented
- ✅ **Production-Ready** - Battle-tested with real EUDR systems
- ✅ **Well-Documented** - Comprehensive documentation with real examples
- ✅ **Enterprise Features** - Robust error handling, logging, and comprehensive validation
- ✅ **Easy Integration** - Simple API with real-world examples
- ✅ **Smart Endpoint Management** - Automatic endpoint generation for standard environments
- ✅ **Flexible Configuration** - Manual endpoint override when needed

## Table of Contents

- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Basic Setup](#basic-setup)
  - [Configuration](#configuration)
- [Real-World Examples](#real-world-examples)
  - [Trade Operations](#trade-operations)
  - [Import Operations](#import-operations)
  - [Domestic Production](#domestic-production)
  - [Authorized Representatives](#authorized-representatives)
- [API Reference](#api-reference)
  - [Services Overview](#services-overview)
  - [Echo Service](#echo-service)
  - [Submission Service](#submission-service)
  - [Retrieval Service](#retrieval-service)
  - [Data Types](#data-types)
  - [Advanced Usage](#advanced-usage)

- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debug Mode](#debug-mode)
  - [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Quick Start

### Installation

```bash
npm install eudr-api-client
```

### Basic Setup
 
```javascript
const { EudrSubmissionClient } = require('eudr-api-client');

// Initialize the client with automatic endpoint generation
const client = new EudrSubmissionClient({
  username: 'your-username',
  password: 'your-password',
  // Use "eudr-test" EUDR Traces acceptance environment, use "eudr" for production environment
  webServiceClientId: 'eudr-test', // See [Configuration](#configuration) section for details
  ssl: false // SSL configuration: true for secure (production), false for development
});
```

**Submit your first DDS:**

```javascript
const result = await client.submitDds({
  operatorType: 'TRADER',
  statement: {
    internalReferenceNumber: 'REF-001',
    activityType: 'TRADE',
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Traded wood products',
        goodsMeasure: { netWeight: 20, volume: 15 }
      },
      hsHeading: '4401',
      speciesInfo: {
        scientificName: 'Fagus silvatica',
        commonName: 'European Beech'
      }
    }],
    operator: {
      nameAndAddress: {
        name: 'Your Company Ltd.',
        country: 'HR',
        address: 'Your Address 123, 10000 Zagreb'
      },
      email: 'info@yourcompany.com',
      phone: '+385 1 234 5678'
    },
    geoLocationConfidential: false,
    associatedStatements: [{
      referenceNumber: '25NLSN6LX69730',
      verificationNumber: 'K7R8LA90'
    }]
  }
});

console.log('✅ DDS Submitted. Identifier:', result.ddsIdentifier);
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# EUDR API Credentials
EUDR_TRACES_USERNAME=your-username
EUDR_TRACES_PASSWORD=your-password
EUDR_WEB_SERVICE_CLIENT_ID=eudr-test

# Optional: SSL Configuration
EUDR_SSL_ENABLED=false  # true for production (secure), false for development

# Optional: Logging
EUDR_LOG_LEVEL=info  # trace, debug, info, warn, error, fatal
```

### Configuration Options

**Automatic Endpoint Generation (Recommended):**

```javascript
const config = {
  // Required
  username: 'your-username',
  password: 'your-password',
  webServiceClientId: 'eudr-test', // Automatically generates acceptance endpoint
  
  // Optional
  ssl: false, // true for production (secure), false for development
  timestampValidity: 60, // seconds
  timeout: 10000, // milliseconds
};
```

**Manual Endpoint Override (Legacy/Advanced):**

```javascript
const config = {
  // Required
  endpoint: 'https://custom-endpoint.com/ws/service',
  username: 'your-username',
  password: 'your-password',
  webServiceClientId: 'custom-client', // Custom ID requires manual endpoint
  
  // Optional
  ssl: true, // true for production (secure), false for development
  timestampValidity: 60,
  timeout: 10000,
};
```

### Configuration Priority

**Priority Order for Endpoint Resolution:**

1. **Manual `endpoint`** (if provided) → Uses specified endpoint
2. **Standard `webServiceClientId`** → Automatically generates endpoint
3. **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

**What happens automatically:**
- **`webServiceClientId: 'eudr'`** → Uses production environment
- **`webServiceClientId: 'eudr-test'`** → Uses acceptance environment  
- **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

### Example Configuration Scenarios

```javascript
// Scenario 1: Automatic endpoint generation (Recommended)
const autoClient = new EudrSubmissionClient({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test', // Automatically generates acceptance endpoint
  ssl: false // Development environment - allow self-signed certificates
});

// Scenario 2: Manual endpoint override
const manualClient = new EudrSubmissionClient({
  endpoint: 'https://custom-server.com/ws/service',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-id',
  ssl: false // Custom development server
});

// Scenario 3: Production environment
const productionClient = new EudrSubmissionClient({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr', // Automatically generates production endpoint
  ssl: true // Production environment - validate SSL certificates
});
```

### Accessing Configuration Information

**You can access endpoint configuration information through the `config` export:**

```javascript
const { config } = require('eudr-api-client');

// Get supported client IDs
const supportedIds = config.getSupportedClientIds();
console.log('Supported IDs:', supportedIds); // ['eudr', 'eudr-test']

// Get supported services
const supportedServices = config.getSupportedServices();
console.log('Supported Services:', supportedServices); // ['echo', 'retrieval', 'submission']

// Get supported versions for a service
const echoVersions = config.getSupportedVersions('echo');
console.log('Echo Service Versions:', echoVersions); // ['v1', 'v2']

// Check if a client ID is standard
const isStandard = config.isStandardClientId('eudr');
console.log('Is eudr standard?', isStandard); // true

// Generate endpoint manually (if needed)
const endpoint = config.generateEndpoint('submission', 'v2', 'eudr-test');
console.log('Generated endpoint:', endpoint);
```

## Real-World Examples

### Trade Operations

**Scenario**: Trading wood products with references to existing DDS statements

```javascript
const { EudrSubmissionClient } = require('eudr-api-client');

// 🚀 NEW: Automatic endpoint generation - no need to specify endpoint!
const client = new EudrSubmissionClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: process.env.EUDR_CLIENT_ID, // Automatically generates endpoint
  ssl: process.env.EUDR_SSL_ENABLED === 'true' // SSL configuration from environment
});

// See [Configuration](#configuration) section for detailed options

// Trade submission with multiple associated statements
const tradeResult = await client.submitDds({
  operatorType: "TRADER",
  statement: {
    internalReferenceNumber: "DLE20/358",
    activityType: "TRADE",
    countryOfActivity: "HR",
    borderCrossCountry: "HR",
    comment: "Trade submission with multiple associated statements",
    commodities: [{
      descriptors: {
        descriptionOfGoods: "Traded wood products from main warehouse",
        goodsMeasure: {
          netWeight: 20,
          volume: 15
        }
      },
      hsHeading: "4401",
      speciesInfo: {
        scientificName: "Fagus silvatica",
        commonName: "BUKVA OBIČNA"
      }
    }],
    operator: {
      nameAndAddress: {
        name: "GreenWood Solutions Ltd.",
        country: "HR",
        address: "Trg Republike 15, 10000 Zagreb"
      },
      email: "info@greenwood-solutions.hr",
      phone: "+385 (001) 480-4111"
    },
    geoLocationConfidential: false,
    associatedStatements: [
      {
        referenceNumber: "25NLSN6LX69730",
        verificationNumber: "K7R8LA90"
      },
      {
        referenceNumber: "25NLWPAZWQ8865",
        verificationNumber: "GLE9SMMM"
      }
    ]
  }
});

console.log(`✅ Trade DDS submitted. Identifier: ${tradeResult.ddsIdentifier}`);
```

### Import Operations

**Scenario**: Importing wood products with geolocation data

```javascript
// 🚀 NEW: Automatic endpoint generation for import operations
const importClient = new EudrSubmissionClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test', // Automatically generates acceptance endpoint
  ssl: false // Development environment - allow self-signed certificates
});

// See [Configuration](#configuration) section for detailed options

// Import submission with producer geolocations
const importResult = await importClient.submitDds({
  operatorType: "OPERATOR",
  statement: {
    internalReferenceNumber: "DLE20/359",
    activityType: "IMPORT",
    countryOfActivity: "HR",
    borderCrossCountry: "HR",
    comment: "Import with geolocations",
    commodities: [{
      descriptors: {
        descriptionOfGoods: "Imported wood products from France",
        goodsMeasure: {
          netWeight: 30,
          volume: 15
        }
      },
      hsHeading: "4401",
      speciesInfo: {
        scientificName: "Fagus silvatica",
        commonName: "BUKVA OBIČNA"
      },
      producers: [{
        country: "FR",
        name: "French Wood Producer",
        // Base64 encoded GeoJSON polygon
        geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE4Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
      }]
    }],
    operator: {
      nameAndAddress: {
        name: "GreenWood Solutions Ltd.",
        country: "HR",
        address: "Trg Republike 15, 10000 Zagreb"
      },
      email: "info@greenwood-solutions.hr",
      phone: "+385 (001) 480-4111"
    },
    geoLocationConfidential: false
  }
});

console.log(`✅ Import DDS submitted. Identifier: ${importResult.ddsIdentifier}`);
```

### Domestic Production

**Scenario**: Domestic wood production with multiple species

```javascript
// Domestic production with multiple commodities
const domesticResult = await client.submitDds({
  operatorType: "OPERATOR",
  statement: {
    internalReferenceNumber: "DLE20/357",
    activityType: "DOMESTIC",
    countryOfActivity: "HR",
    borderCrossCountry: "HR",
    comment: "",
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: "Otprema prostornog drva s glavnog stovarišta (popratnica DLE20/357) - BUKVA OBIČNA",
          goodsMeasure: {
            volume: 20,
            netWeight: 16
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus silvatica",
          commonName: "BUKVA OBIČNA"
        },
        producers: [{
          country: "HR",
          name: "GreenWood Solutions Ltd.",
          geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE4Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
        }]
      },
      {
        descriptors: {
          descriptionOfGoods: "Otprema prostornog drva s glavnog stovarišta (popratnica DLE20/357) - BUKVA OSTALE",
          goodsMeasure: {
            volume: 15,
            netWeight: 12
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus sp.",
          commonName: "BUKVA OSTALE"
        },
        producers: [{
          country: "HR",
          name: "GreenWood Solutions Ltd.",
          geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE4Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
        }]
      }
    ],
    operator: {
      nameAndAddress: {
        name: "GreenWood Solutions Ltd.",
        country: "HR",
        address: "Trg Republike 15, 10000 Zagreb"
      },
      email: "info@greenwood-solutions.hr",
      phone: "+385 (001) 480-4111"
    },
    geoLocationConfidential: false
  }
});

console.log(`✅ Domestic DDS submitted. Identifier: ${domesticResult.ddsIdentifier}`);
```

### Authorized Representatives

**Scenario**: Submitting on behalf of another operator

```javascript
// Authorized representative submission
const representativeResult = await client.submitDds({
  operatorType: "OPERATOR",
  statement: {
    internalReferenceNumber: "DLE20/360",
    activityType: "IMPORT",
    operator: {
      // Reference to the actual operator
      referenceNumber: {
        identifierType: "eori",
        identifierValue: "HR123456789"
      },
      nameAndAddress: {
        name: "Croatian Import Company",
        country: "HR",
        address: "Ulica Kneza Branimira 2, 10000 Zagreb"
      },
      email: "contact@croatianimport.hr",
      phone: "+385 (001) 480-4111"
    },
    countryOfActivity: "HR",
    borderCrossCountry: "HR",
    comment: "Import by authorized representative",
    commodities: [{
      descriptors: {
        descriptionOfGoods: "Wood products imported by representative",
        goodsMeasure: {
          netWeight: 25,
          volume: 12
        }
      },
      hsHeading: "4401",
      speciesInfo: {
        scientificName: "Fagus silvatica",
        commonName: "BUKVA OBIČNA"
      },
      producers: [{
        country: "GH",
        name: "Ghana Wood Board",
        geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1stMS4xODY0LDYuNTI0NF0sWy0xLjE4NzQsNi41MjQ0XSxbLTEuMTg3NCw2LjUzNDRdLFstMS4xODY0LDYuNTM0NF0sWy0xLjE4NjQsNi41MjQ0XV1dfSwicHJvcGVydGllcyI6eyJuYW1lIjoiR2hhbmEgV29vZCBCb2FyZCJ9fV19"
      }]
    }],
    geoLocationConfidential: false
  }
});

console.log(`✅ Representative DDS submitted. Identifier: ${representativeResult.ddsIdentifier}`);
```

## API Reference

### Services Overview

**🚀 NEW: All services now support automatic endpoint generation!**

| Service | Class | Automatic Endpoint | Manual Override | CF Specification |
|---------|-------|-------------------|-----------------|------------------|
| **Echo Service** | `EudrEchoClient` | ✅ Yes | ✅ Yes | CF1 v1.4 |
| **Submission Service V1** | `EudrSubmissionClient` | ✅ Yes | ✅ Yes | CF2 v1.4 |
| **Submission Service V2** | `EudrSubmissionClientV2` | ✅ Yes | ✅ Yes | CF2 v1.4 |
| **Retrieval Service V1** | `EudrRetrievalClient` | ✅ Yes | ✅ Yes | CF3 & CF7 v1.4 |
| **Retrieval Service V2** | `EudrRetrievalClientV2` | ✅ Yes | ✅ Yes | CF3 & CF7 v1.4 |

**Endpoint Generation Rules:**
- **`webServiceClientId: 'eudr'`** → Production environment endpoints
- **`webServiceClientId: 'eudr-test'`** → Acceptance environment endpoints
- **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

**Example:**
```javascript
const { 
  EudrEchoClient, 
  EudrSubmissionClient, 
  EudrSubmissionClientV2, 
  EudrRetrievalClient,
  EudrRetrievalClientV2 
} = require('eudr-api-client');

// All services automatically generate endpoints 
const echoClient = new EudrEchoClient({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-test', ssl: false
});

const submissionV1Client = new EudrSubmissionClient({
  username: 'user', password: 'pass', webServiceClientId: 'eudr', ssl: true
});

const submissionV2Client = new EudrSubmissionClientV2({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-test', ssl: false
});

const retrievalClient = new EudrRetrievalClient({
  username: 'user', password: 'pass', webServiceClientId: 'eudr', ssl: true
});

const retrievalV2Client = new EudrRetrievalClientV2({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-test', ssl: false
});
```

**For detailed endpoint configuration options, see the [Configuration](#configuration) section.**

### Echo Service

Test connectivity and authentication with the EUDR system.

```javascript
const { EudrEchoClient } = require('eudr-api-client');
const echoClient = new EudrEchoClient(config);

// Test connection
const response = await echoClient.echo('Hello EUDR');

console.log('Echo response:', response.status);
```

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `echo(params)` | Test service connectivity | `message` (String) | Promise with echo response |

#### Example
```javascript
const response = await echoClient.echo('Hello EUDR');
// Returns: { message: 'Hello EUDR' }
```

### Submission Service

Submit, amend, and retract DDS statements. Available in both V1 and V2 APIs with different validation requirements.

#### V1 Client (`EudrSubmissionClient`)

```javascript
const { EudrSubmissionClient } = require('eudr-api-client');
const submissionClient = new EudrSubmissionClient(config);

// Submit DDS
const submitResult = await submissionClient.submitDds(requestObject, { rawResponse: false });

// Amend existing DDS
const amendResult = await submissionClient.amendDds(submitResult.ddsIdentifier, updatedStatement);

// Retract DDS
const retractResult = await submissionClient.retractDds(submitResult.ddsIdentifier);
```

#### V2 Client (`EudrSubmissionClientV2`)

```javascript
const { EudrSubmissionClientV2 } = require('eudr-api-client');
const submissionClientV2 = new EudrSubmissionClientV2(configV2);

// Submit DDS
const submitResultV2 = await submissionClientV2.submitDds(requestObjectV2);

// Amend existing DDS
const amendResultV2 = await submissionClientV2.amendDds(submitResultV2.ddsIdentifier, updatedStatementV2);

// Retract DDS
const retractResultV2 = await submissionClientV2.retractDds(submitResultV2.ddsIdentifier);
```

### Retrieval Service

Retrieve DDS information and supply chain data with automatic endpoint generation.

#### V1 Client (`EudrRetrievalClient`)

```javascript
const { EudrRetrievalClient } = require('eudr-api-client');

// 🚀 NEW: Automatic endpoint generation - no need to specify endpoint!
const retrievalClient = new EudrRetrievalClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test', // Automatically generates acceptance endpoint
  ssl: false // Development environment - allow self-signed certificates
});

// Get DDS info by UUID (supports single UUID or array of UUIDs, max 100)
const ddsInfo = await retrievalClient.getDdsInfo('some-uuid-string');
const multipleDds = await retrievalClient.getDdsInfo(['uuid-1', 'uuid-2', 'uuid-3']);

// Get DDS info by internal reference number (CF3 v1.4)
const ddsList = await retrievalClient.getDdsInfoByInternalReferenceNumber('DLE20/357');

// Get full DDS statement by reference and verification number (CF7 v1.4)
const fullDds = await retrievalClient.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');

// Note: getReferencedDDS is only available in V2 - use EudrRetrievalClientV2
```

#### Key Features

- ✅ **CF3 v1.4 Support**: `getDdsInfo`, `getDdsInfoByInternalReferenceNumber` with rejection reason & CA communication
- ✅ **CF7 v1.4 Support**: `getStatementByIdentifiers` for complete DDS retrieval
- ✅ **Automatic Endpoint Generation**: No manual endpoint configuration needed for standard client IDs
- ✅ **Batch Retrieval**: Support for up to 100 UUIDs in a single `getDdsInfo` call
- ✅ **Smart Error Handling**: Converts SOAP authentication faults to proper HTTP 401 status codes
- ✅ **Flexible SSL Configuration**: Configurable SSL certificate validation

---
### 📝 EudrSubmissionClient
The main client for submitting, amending, and retracting DDS statements (V1 API).

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `submitDds(request, options)` | Submit a new Due Diligence Statement | `request` (Object), `options` (Object) | Promise with DDS identifier |
| `amendDds(ddsIdentifier, statement, options)` | Amend an existing DDS | `ddsIdentifier` (String), `statement` (Object), `options` (Object) | Promise with success status |
| `retractDds(ddsIdentifier, options)` | Retract a submitted DDS | `ddsIdentifier` (String), `options` (Object) | Promise with success status |

#### Detailed Method Reference
**`submitDds(request, options)`**
```javascript
const result = await client.submitDds({
  operatorType: 'TRADER',  // 'OPERATOR' or 'TRADER'
  statement: {
    internalReferenceNumber: 'REF-001',
    activityType: 'TRADE',
    // ... other statement data
  }
}, {
  rawResponse: false  // Set to true to get raw XML response
});

// Returns: { httpStatus: 200, status: 200, ddsIdentifier: 'uuid-string', raw: 'xml...' }
```

**`amendDds(ddsIdentifier, statement, options)`**
```javascript
const result = await client.amendDds(
  'existing-dds-uuid',  // DDS identifier from previous submission
  {
    // dds statement data
    internalReferenceNumber: 'REF-001-UPDATED',
    // ... other updated fields
  },
  {
    rawResponse: false
  }
);

// Returns: { httpStatus: 200, status: 200, success: true, message: 'DDS amended successfully' }
```

**`retractDds(ddsIdentifier, options)`**
```javascript
const result = await client.retractDds(
  'dds-uuid-to-retract',
  {
    debug: true,        // Enable debug logging
    rawResponse: false  // Set to true to get raw XML response
  }
);

// Returns: { httpStatus: 200, success: true, status: 'SC_200_OK', message: 'DDS retracted successfully' }
```
---
### 🚀 EudrSubmissionClientV2
The V2 client for submitting, amending, and retracting DDS statements with enhanced validation and structure.

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `submitDds(request, options)` | Submit a new DDS (V2) | `request` (Object), `options` (Object) | Promise with DDS identifier |
| `amendDds(ddsIdentifier, statement, options)` | Amend existing DDS (V2) | `ddsIdentifier` (String), `statement` (Object), `options` (Object) | Promise with success status |
| `retractDds(ddsIdentifier, options)` | Retract DDS (V2) | `ddsIdentifier` (String), `options` (Object) | Promise with success status |

#### Detailed Method Reference
**`submitDds(request, options)`**
```javascript
const result = await clientV2.submitDds({
  operatorType: 'OPERATOR',
  statement: {
    internalReferenceNumber: 'DLE20/357',
    activityType: 'DOMESTIC',
    operator: {
      operatorAddress: {  // V2 uses operatorAddress instead of nameAndAddress
        name: 'GreenWood Solutions Ltd.',
        country: 'HR',
        street: 'Trg Republike 15',
        postalCode: '10000',
        city: 'Zagreb',
        fullAddress: 'Trg Republike 15, 10000 Zagreb'
      },
      email: 'info@greenwood-solutions.hr',
      phone: '+385 (001) 480-4111'
    },
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Wood products',
        goodsMeasure: {
          supplementaryUnit: 20,  // V2 uses supplementaryUnit for DOMESTIC
          supplementaryUnitQualifier: 'MTQ'  // Cubic meters
        }
      },
      hsHeading: '4401',
      speciesInfo: {
        scientificName: 'Fagus silvatica',
        commonName: 'BUKVA OBIČNA'
      },
      producers: [{
        country: 'HR',
        name: 'GreenWood Solutions Ltd.',
        geometryGeojson: 'base64-encoded-geojson'
      }]
    }],
    geoLocationConfidential: false
  }
}, {
  rawResponse: false  // Set to true to get raw XML response
});

// Returns: { httpStatus: 200, status: 200, ddsIdentifier: 'uuid-string', raw: 'xml...' }
```

**`amendDds(ddsIdentifier, statement, options)`**
```javascript
const result = await clientV2.amendDds(
  'existing-dds-uuid',  // DDS identifier from previous submission
  {
    // Updated statement data
    internalReferenceNumber: 'DLE20/357-UPDATED',
    // ... other updated fields
  },
  {
    rawResponse: false
  }
);

// Returns: { httpStatus: 200, status: 200, success: true, message: 'DDS amended successfully' }
```

**`retractDds(ddsIdentifier, options)`**
```javascript
const result = await clientV2.retractDds(
  'dds-uuid-to-retract',
  {
    debug: true,        // Enable debug logging
    rawResponse: false  // Set to true to get raw XML response
  }
);

// Returns: { httpStatus: 200, success: true, status: 'SC_200_OK', message: 'DDS retracted successfully' }
```
---
### 🔍 EudrRetrievalClient (V1)
Service for retrieving DDS information and supply chain data with automatic endpoint generation and smart error handling.

#### Methods
| Method | Description | CF Spec | Parameters | Returns |
|--------|-------------|---------|------------|---------|
| `getDdsInfo(uuids, options)` | Retrieve DDS info by UUID(s) | CF3 v1.4 | `uuids` (String or Array), `options` (Object) | Promise with DDS details |
| `getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options)` | Retrieve DDS by internal reference | CF3 v1.4 | `internalReferenceNumber` (String, 3-50 chars), `options` (Object) | Promise with DDS array |
| `getStatementByIdentifiers(referenceNumber, verificationNumber, options)` | Get full DDS statement | CF7 v1.4 | `referenceNumber` (String), `verificationNumber` (String), `options` (Object) | Promise with complete DDS |
| ~~`getReferencedDDS()`~~ | ❌ Not available in V1 | N/A | Use `EudrRetrievalClientV2` instead | V2 only |

#### Detailed Method Reference

**`getDdsInfo(uuids, options)` - CF3 v1.4**

Retrieve DDS information by UUID with v1.4 enhancements including rejection reasons and CA communication.

```javascript
// Single UUID
const ddsInfo = await retrievalClient.getDdsInfo('550e8400-e29b-41d4-a716-446655440000');

// Multiple UUIDs (max 100 per call)
const multipleDds = await retrievalClient.getDdsInfo([
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
]);

// With options
const ddsWithRaw = await retrievalClient.getDdsInfo('some-uuid', {
  rawResponse: true  // Get raw XML response
});

// Returns: 
// {
//   httpStatus: 200,
//   status: 200,
//   ddsInfo: [
//     {
//       identifier: 'uuid-string',
//       status: 'Accepted' | 'Rejected' | 'Processing',
//       referenceNumber: '25NLSN6LX69730',
//       verificationNumber: 'K7R8LA90',
//       rejectionReason: 'Reason if status is Rejected',  // v1.4 feature
//       caCommunication: 'CA communication if provided',  // v1.4 feature
//       // ... other DDS info
//     }
//   ],
//   raw: 'xml-response',  // if rawResponse: true
//   parsed: { /* parsed XML object */ }
// }
```

**`getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options)` - CF3 v1.4**

Search for DDS by internal reference number with v1.4 enhancements.

```javascript
// Search by internal reference (3-50 characters)
const ddsList = await retrievalClient.getDdsInfoByInternalReferenceNumber('DLE20/357');

// Returns: Array of matching DDS statements with rejection reasons and CA communication
// {
//   httpStatus: 200,
//   status: 200,
//   ddsInfo: [
//     {
//       identifier: 'uuid-string',
//       internalReferenceNumber: 'DLE20/357',
//       status: 'Accepted',
//       rejectionReason: null,      // v1.4 feature
//       caCommunication: 'text',    // v1.4 feature
//       // ... other DDS details
//     }
//   ]
// }
```

**`getStatementByIdentifiers(referenceNumber, verificationNumber, options)` - CF7 v1.4**

Retrieve complete DDS statement content including geolocation and activity data.

```javascript
// Get full DDS statement
const fullDds = await retrievalClient.getStatementByIdentifiers(
  '25NLSN6LX69730', 
  'K7R8LA90'
);

// Returns: Complete DDS object with v1.4 fields
// {
//   httpStatus: 200,
//   status: 200,
//   ddsInfo: [
//     {
//       // Full DDS content including:
//       geolocation: { /* geolocation data */ },
//       activity: { /* activity details */ },
//       commodities: [ /* complete commodity info */ ],
//       referencedStatements: [
//         {
//           referenceNumber: '25NLWPAZWQ8865',
//           securityNumber: 'GLE9SMMM'  // For supply chain traversal
//         }
//       ],
//       availabilityDate: '2024-01-15',  // v1.4 feature
//       // ... complete DDS data
//     }
//   ]
// }
```

**Supply Chain Traversal (V2 Only)**

⚠️ **Note**: The `getReferencedDDS()` method is not available in V1. For supply chain traversal, use `EudrRetrievalClientV2`:

```javascript
// V1 can get the referenced statement info from getStatementByIdentifiers
const fullDds = await retrievalClient.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');
const referencedStatements = fullDds.ddsInfo[0].referencedStatements;

// For actual traversal, use V2:
// const { EudrRetrievalClientV2 } = require('eudr-api-client');
// const v2Client = new EudrRetrievalClientV2(config);
// const referencedDds = await v2Client.getReferencedDds(ref.referenceNumber, ref.securityNumber);
```

#### Error Handling

The V1 Retrieval Client includes smart error handling that converts SOAP authentication faults to proper HTTP status codes:

```javascript
try {
  const result = await retrievalClient.getDdsInfo('some-uuid');
  console.log('Success:', result.ddsInfo);
} catch (error) {
  if (error.details.status === 401) {
    console.error('Authentication failed:', error.message);
    // Handle invalid credentials
  } else if (error.details.status === 404) {
    console.error('DDS not found:', error.message);
    // Handle missing DDS
  } else if (error.details.status === 500) {
    console.error('Server error:', error.message);
    // Handle server issues
  } else {
    console.error('Network error:', error.message);
    // Handle network issues
  }
}
```

#### Configuration Examples

```javascript
// Production environment with SSL validation
const productionClient = new EudrRetrievalClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr',  // Production environment
  ssl: true,  // Validate SSL certificates
  timeout: 30000  // 30 seconds timeout
});

// Development environment with relaxed SSL
const devClient = new EudrRetrievalClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',  // Acceptance environment
  ssl: false,  // Allow self-signed certificates
  timeout: 10000  // 10 seconds timeout
});

// Manual endpoint override
const customClient = new EudrRetrievalClient({
  endpoint: 'https://custom-endpoint.com/ws/EUDRRetrievalServiceV1',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client',
  ssl: false
});
```

---
### 🚀 EudrRetrievalClientV2 (V2)
Advanced service for retrieving DDS information and supply chain data with enhanced features including supply chain traversal.

#### Methods
| Method | Description | CF Spec | Parameters | Returns |
|--------|-------------|---------|------------|---------|
| `getDdsInfo(uuids, options)` | Retrieve DDS info by UUID(s) | CF3 v1.4 | `uuids` (String or Array), `options` (Object) | Promise with DDS details |
| `getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options)` | Retrieve DDS by internal reference | CF3 v1.4 | `internalReferenceNumber` (String, 3-50 chars), `options` (Object) | Promise with DDS array |
| `getStatementByIdentifiers(referenceNumber, verificationNumber, options)` | Get full DDS statement | CF7 v1.4 | `referenceNumber` (String), `verificationNumber` (String), `options` (Object) | Promise with complete DDS |
| `getReferencedDds(referenceNumber, securityNumber, options)` | 🚀 **V2 Only**: Supply chain traversal | CF7 v1.4 | `referenceNumber` (String), `securityNumber` (String), `options` (Object) | Promise with referenced DDS |

#### Key Features

- ✅ **All V1 Features**: CF3 v1.4 Support, CF7 v1.4 Support, Batch Retrieval, Smart Error Handling
- ✅ **🚀 NEW: Supply Chain Traversal**: `getReferencedDds()` method for following DDS references
- ✅ **Enhanced V2 Namespaces**: Updated SOAP namespaces for V2 compatibility
- ✅ **Automatic Endpoint Generation**: V2-specific endpoint generation
- ✅ **Consistent Response Format**: Includes both `httpStatus` and `status` fields for compatibility

#### Detailed Method Reference

**Basic Usage:**

```javascript
const { EudrRetrievalClientV2 } = require('eudr-api-client');

// 🚀 NEW: Automatic V2 endpoint generation
const retrievalClientV2 = new EudrRetrievalClientV2({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test', // Automatically generates V2 acceptance endpoint
  ssl: false // Development environment - allow self-signed certificates
});

// All V1 methods work the same way in V2
const ddsInfo = await retrievalClientV2.getDdsInfo('some-uuid-string');
const ddsList = await retrievalClientV2.getDdsInfoByInternalReferenceNumber('DLE20/357');
const fullDds = await retrievalClientV2.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');

// 🚀 NEW V2-only feature: Supply chain traversal
const referencedDds = await retrievalClientV2.getReferencedDds(
  '25NLWPAZWQ8865', 
  'XtZ7C6t3lFHnOhAqN9fw5w==:dRES/NzB0xL4nkf5nmRrb/5SMARFHoDK53PaCJFPNRA='
);
```

**🚀 Supply Chain Traversal - `getReferencedDds(referenceNumber, securityNumber, options)`**

The key V2 enhancement allows you to traverse the supply chain by following referenced DDS statements:

```javascript
// Step 1: Get a DDS statement that references other statements
const mainDds = await retrievalClientV2.getStatementByIdentifiers(
  '25NLSN6LX69730', 
  'K7R8LA90'
);

// Step 2: Extract referenced statements info
const referencedStatements = mainDds.ddsInfo[0].referencedStatements;
console.log('Found referenced statements:', referencedStatements);
// [
//   {
//     referenceNumber: '25NLWPAZWQ8865',
//     securityNumber: 'XtZ7C6t3lFHnOhAqN9fw5w==:dRES/NzB0xL4nkf5nmRrb/5SMARFHoDK53PaCJFPNRA='
//   }
// ]

// Step 3: Follow the supply chain using getReferencedDds
for (const ref of referencedStatements) {
  const referencedDds = await retrievalClientV2.getReferencedDds(
    ref.referenceNumber,
    ref.securityNumber  // Use securityNumber, not verificationNumber
  );
  
  console.log('Referenced DDS content:', referencedDds.ddsInfo);
  
  // Continue traversing if this DDS also has references
  if (referencedDds.ddsInfo[0].referencedStatements?.length > 0) {
    // Recursive traversal possible
    console.log('This DDS has further references...');
  }
}

// Returns: Same format as other retrieval methods
// {
//   httpStatus: 200,
//   status: 200,
//   status: 200,              // 🚀 NEW: Added for consistency
//   ddsInfo: [
//     {
//       // Complete DDS content of the referenced statement
//       geolocation: { /* geolocation data */ },
//       activity: { /* activity details */ },
//       commodities: [ /* complete commodity info */ ],
//       // ... complete referenced DDS data
//     }
//   ],
//   raw: 'xml-response'       // if rawResponse: true
// }
```

**Complete Supply Chain Analysis Example:**

```javascript
async function analyzeSupplyChain(referenceNumber, verificationNumber) {
  const chain = [];
  const visited = new Set();
  
  // Start with the main statement
  let currentDds = await retrievalClientV2.getStatementByIdentifiers(
    referenceNumber, 
    verificationNumber
  );
  
  chain.push({
    level: 0,
    referenceNumber: referenceNumber,
    dds: currentDds.ddsInfo[0]
  });
  
  // Follow the chain
  const toProcess = currentDds.ddsInfo[0].referencedStatements?.map(ref => ({
    ...ref,
    level: 1
  })) || [];
  
  while (toProcess.length > 0) {
    const ref = toProcess.shift();
    
    // Avoid circular references
    if (visited.has(ref.referenceNumber)) continue;
    visited.add(ref.referenceNumber);
    
    try {
      const referencedDds = await retrievalClientV2.getReferencedDds(
        ref.referenceNumber,
        ref.securityNumber
      );
      
      chain.push({
        level: ref.level,
        referenceNumber: ref.referenceNumber,
        dds: referencedDds.ddsInfo[0]
      });
      
      // Add next level references
      const nextRefs = referencedDds.ddsInfo[0].referencedStatements?.map(nextRef => ({
        ...nextRef,
        level: ref.level + 1
      })) || [];
      
      toProcess.push(...nextRefs);
      
    } catch (error) {
      console.warn(`Failed to retrieve ${ref.referenceNumber}:`, error.message);
    }
  }
  
  return chain;
}

// Usage
const supplyChain = await analyzeSupplyChain('25NLSN6LX69730', 'K7R8LA90');
console.log(`Supply chain has ${supplyChain.length} levels:`);
supplyChain.forEach((item, index) => {
  console.log(`Level ${item.level}: ${item.referenceNumber} - ${item.dds.activity?.activityType}`);
});
```

#### Error Handling

V2 includes the same smart error handling as V1, with enhanced error details:

```javascript
try {
  const result = await retrievalClientV2.getReferencedDds(referenceNumber, securityNumber);
  console.log('Success:', result.ddsInfo);
} catch (error) {
  // Same error handling as V1, with both httpStatus and status fields
  if (error.details.status === 401) {
    console.error('Authentication failed:', error.message);
  } else if (error.details.httpStatus === 404) {
    console.error('Referenced DDS not found:', error.message);
  }
  // error.details contains both httpStatus and status for compatibility
}
```

#### Configuration Examples

```javascript
// Production environment with V2
const productionV2Client = new EudrRetrievalClientV2({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr',  // Production V2 environment
  ssl: true,  // Validate SSL certificates
  timeout: 30000
});

// Development environment with V2
const devV2Client = new EudrRetrievalClientV2({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',  // Acceptance V2 environment
  ssl: false,  // Allow self-signed certificates
  timeout: 10000
});

// Manual V2 endpoint override
const customV2Client = new EudrRetrievalClientV2({
  endpoint: 'https://custom-endpoint.com/ws/EUDRRetrievalServiceV2',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client',
  ssl: false
});
```

### Data Types

#### DDS Statement Structure (V1)
```javascript
{
  operatorType: 'TRADER' | 'OPERATOR',
  statement: {
    internalReferenceNumber: String,
    activityType: 'TRADE' | 'IMPORT' | 'EXPORT' | 'DOMESTIC',
    countryOfActivity: String,        // ISO country code (e.g., 'HR', 'FR')
    borderCrossCountry: String,       // ISO country code
    comment: String,
    commodities: [{
      descriptors: {
        descriptionOfGoods: String,
        goodsMeasure: {
          netWeight?: Number,         // in kg
          volume?: Number,            // in m³
        }
      },
      hsHeading: String,             // HS code (e.g., '4401')
      speciesInfo: {
        scientificName: String,
        commonName: String
      },
      producers: [{
        country: String,
        name: String,
        geometryGeojson: String      // Base64 encoded GeoJSON
      }]
    }],
    operator: {
      nameAndAddress: {              // V1 API
        name: String,
        country: String,
        address: String
      },
      email: String,
      phone: String
    },
    geoLocationConfidential: Boolean,
    associatedStatements: [{         // For TRADE activities
      referenceNumber: String,
      verificationNumber: String
    }]
  }
}
```

#### DDS Statement Structure (V2)
```javascript
{
  operatorType: 'OPERATOR' | 'TRADER',
  statement: {
    internalReferenceNumber: String,
    activityType: 'TRADE' | 'IMPORT' | 'EXPORT' | 'DOMESTIC',
    operator: {
      operatorAddress: {              // V2 API - structured address
        name: String,
        country: String,
        street: String,
        postalCode: String,
        city: String,
        fullAddress: String
      },
      email: String,
      phone: String
    },
    countryOfActivity: String,
    borderCrossCountry: String,
    comment: String,
    commodities: [{
      descriptors: {
        descriptionOfGoods: String,
        goodsMeasure: {
          netWeight?: Number,         // V2 API - standard weight field
          percentageEstimationOrDeviation?: Number,
          supplementaryUnit?: Number, // V2 API - for DOMESTIC activities
          supplementaryUnitQualifier?: String, // V2 API - e.g., 'MTQ'
        }
      },
      hsHeading: String,
      speciesInfo: {
        scientificName: String,
        commonName: String
      },
      producers: [{
        country: String,
        name: String,
        geometryGeojson: String
      }]
    }],
    geoLocationConfidential: Boolean,
    associatedStatements: [{         // For TRADE activities
      referenceNumber: String,
      verificationNumber: String
    }]
  }
}
```

#### Response Types

**Successful Submission Response:**
```javascript
{
  httpStatus: 200,           // HTTP status code
  status: 200,               // 🚀 NEW: Alias for httpStatus (for consistency)
  ddsIdentifier: 'uuid-string',
  raw: 'raw-xml-response',   // Only included if rawResponse: true
  // Note: 'parsed' field removed for cleaner responses
}
```

**Successful Retrieval Response:**
```javascript
{
  httpStatus: 200,           // HTTP status code
  status: 200,               // 🚀 NEW: Alias for httpStatus (for consistency)
  ddsInfo: [
    {
      identifier: 'uuid-string',
      status: 'Accepted' | 'Rejected' | 'Processing',  // DDS status (different from HTTP status)
      referenceNumber: '25NLSN6LX69730',
      verificationNumber: 'K7R8LA90',
      // ... other DDS data
    }
  ],
  raw: 'xml-response'        // Only included if rawResponse: true
}
```

**Error Response:**
```javascript
{
  message: 'Error description',
  details: {
    httpStatus: 401,         // HTTP status code
    status: 401,             // 🚀 NEW: Alias for httpStatus (for consistency)
    statusText: 'Unauthorized',
    data: 'original-soap-response'
  }
}
```

### Advanced Usage

#### Using V2 API

The V2 API has stricter validation and different field requirements:

```javascript
const { EudrSubmissionClientV2 } = require('eudr-api-client');

const clientV2 = new EudrSubmissionClientV2({
  endpoint: `${process.env.EUDR_TRACES_BASE_URL}/tracesnt/ws/EUDRSubmissionServiceV2`,
  username: process.env.EUDR_TRACES_USERNAME,
  password: process.env.EUDR_TRACES_PASSWORD,
  webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID,
  ssl: process.env.EUDR_SSL_ENABLED === 'true' // SSL configuration from environment
});

// V2 requires specific fields based on activity type
const v2Result = await clientV2.submitDds({
  operatorType: "OPERATOR",
  statement: {
    internalReferenceNumber: "DLE20/357",
    activityType: "DOMESTIC",
    operator: {
      operatorAddress: {  // V2 uses operatorAddress instead of nameAndAddress
        name: "GreenWood Solutions Ltd.",
        country: "HR",
        street: "Trg Republike 15",
        postalCode: "10000",
        city: "Zagreb",
        fullAddress: "Trg Republike 15, 10000 Zagreb"
      },
      email: "info@greenwood-solutions.hr",
      phone: "+385 (001) 480-4111"
    },
    countryOfActivity: "HR",
    borderCrossCountry: "HR",
    commodities: [{
      descriptors: {
        descriptionOfGoods: "Wood products",
        goodsMeasure: {
          supplementaryUnit: 20,  // V2 uses supplementaryUnit for DOMESTIC
          supplementaryUnitQualifier: "MTQ"  // Cubic meters
        }
      },
      hsHeading: "4401",
      speciesInfo: {
        scientificName: "Fagus silvatica",
        commonName: "BUKVA OBIČNA"
      },
      producers: [{
        country: "HR",
        name: "GreenWood Solutions Ltd.",
        geometryGeojson: "base64-encoded-geojson"
      }]
    }],
    geoLocationConfidential: false
  }
});
```

#### Error Handling

The library provides comprehensive error handling with smart SOAP fault conversion:

```javascript
try {
  const result = await client.submitDds(ddsData);
  console.log('Success:', result);
} catch (error) {
  // 🚀 NEW: Smart error handling converts SOAP authentication faults to HTTP 401
  if (error.details.status === 401) {
    console.error('Authentication failed:', error.message);
    // Handle invalid credentials - SOAP fault converted to proper HTTP status
  } else if (error.details.status === 404) {
    console.error('Resource not found:', error.message);
  } else if (error.details.status === 500) {
    console.error('Server error:', error.message);
  } else if (error.request) {
    console.error('Network Error:', error.message);
  } else {
    console.error('Unexpected Error:', error.message);
  }
}
```

**Key Error Handling Features:**
- ✅ **SOAP to HTTP Conversion**: Authentication faults automatically converted from SOAP 500 to HTTP 401
- ✅ **Structured Error Objects**: Consistent error format across all services
- ✅ **Detailed Error Information**: Full error context with original SOAP response when needed

#### Custom Logging

The library uses a flexible logging system based on Pino. You can control the log level using the `EUDR_LOG_LEVEL` environment variable.

```javascript
// logger.js
const { logger, createLogger } = require('eudr-api-client');

// The default logger is exported and used throughout the library
logger.info('Starting EUDR submission');

// You can control logging level via environment variable
process.env.EUDR_LOG_LEVEL = 'debug';
```

To see detailed logs from the library, set the environment variable:
```bash
# Set log level for the current session
export EUDR_LOG_LEVEL=debug

# Run your application
node your-app.js
```

#### Batch Operations

Process multiple DDS submissions efficiently:

```javascript
const submissions = [
  { /* DDS data 1 */ },
  { /* DDS data 2 */ },
  { /* DDS data 3 */ }
];

const results = await Promise.all(
  submissions.map(async (dds) => {
    try {
      return await client.submitDds(dds);
    } catch (error) {
      return { error: error.message, dds };
    }
  })
);

// Process results
results.forEach((result, index) => {
  if (result.error) {
    console.error(`❌ Submission ${index + 1} failed:`, result.error);
  } else {
    console.log(`✅ Submission ${index + 1} success:`, result.referenceNumber);
  }
});
```

#### Writing Tests

```javascript
const { expect } = require('chai');
const { EudrSubmissionClient } = require('eudr-api-client');

describe('My EUDR Tests', function() {
  let client;
  
  before(function() {
    client = new EudrSubmissionClient(config);
  });
  
  it('should submit DDS successfully', async function() {
    const result = await client.submitDds(testData);
    expect(result).to.have.property('ddsIdentifier');
    expect(result.ddsIdentifier).to.be.a('string');
  });
});
```

## Testing

For comprehensive testing documentation, see [tests/README.md](tests/README.md).

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```
Error: Authentication failed: Invalid credentials
```

**Solution**: Verify your username, password, and webServiceClientId are correct.

#### 2. Network Timeouts

```
Error: Request timeout of 30000ms exceeded
```

**Solution**: Increase the timeout in configuration:

```javascript
const client = new EudrSubmissionClient({
  ...config,
  timeout: 60000,  // 60 seconds
  ssl: true  // Enable SSL validation for production
});
```

#### 3. Validation Errors

```
Error: Validation failed: Missing required field 'borderCrossCountry'
```

**Solution**: Check the API version requirements. V1 and V2 have different field requirements.

#### 4. GeoJSON Encoding

```
Error: Invalid geometryGeojson format
```

**Solution**: Ensure GeoJSON is properly Base64 encoded:

```javascript
const geojson = {
  type: "FeatureCollection",
  features: [/* your features */]
};

const encoded = Buffer.from(JSON.stringify(geojson)).toString('base64');
```

#### 5. SSL Certificate Errors

```
Error: unable to verify the first certificate
Error: certificate verify failed
```

**Solution**: Configure SSL settings based on your environment:

```javascript
// For production - always validate certificates
const client = new EudrSubmissionClient({
  ...config,
  ssl: true  // Secure - validates SSL certificates
});

// For development with self-signed certificates
const client = new EudrSubmissionClient({
  ...config,
  ssl: false  // Allow unauthorized certificates
});
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set environment variable
export EUDR_LOG_LEVEL=trace

# Or in your code
process.env.EUDR_LOG_LEVEL = 'trace';
```

### FAQ

#### Q: What's the difference between V1 and V2 APIs?

**A**: The V2 API introduces several improvements:
- **Enhanced operator address structure** with separate fields for street, postal code, city
- **Removed volume field** from goodsMeasure (replaced with supplementaryUnit)
- **New fullAddress field** for complete address representation
- **Updated namespaces** to reflect V2 specifications
- **Improved validation** and error handling
- **🚀 NEW: Supply Chain Traversal** with `getReferencedDds()` method in Retrieval V2
- **🚀 NEW: Consistent Response Format** with both `httpStatus` and `status` fields

#### Q: What's the difference between `httpStatus` and `status` fields in responses?

**A**: All EUDR services now include both fields for consistency and backward compatibility:

- **`httpStatus`**: HTTP status code (200, 401, 500, etc.) - **Original field**
- **`status`**: Alias for `httpStatus` - **🚀 NEW: Added for consistency**

Both fields contain the same HTTP status value. Use either one based on your preference:

```javascript
// Both approaches work identically
if (result.httpStatus === 200) { /* success */ }
if (result.status === 200) { /* success */ }

// In error handling
catch (error) {
  if (error.details.httpStatus === 401) { /* auth error */ }
  if (error.details.status === 401) { /* auth error */ }
}
```

**Note**: In DDS content, there's also a separate `status` field for DDS processing status ('Accepted', 'Rejected', 'Processing') which is different from HTTP status.

#### Q: How do I encode GeoJSON data?

**A**: GeoJSON data must be base64-encoded before submission. Here's how:

```javascript
const geojson = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[[14.970459832, 45.192398252], [14.969858275, 45.188344106]]]
    },
    properties: { name: "Forest Area" }
  }]
};

// Encode to base64
const encodedGeojson = Buffer.from(JSON.stringify(geojson)).toString('base64');
```

#### Q: How do I handle rate limiting?

**A**: The library includes built-in retry logic and timeout handling:

```javascript
const client = new EudrSubmissionClient({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test',
  ssl: false, // Development environment
  timeout: 30000, // 30 seconds timeout
  timestampValidity: 120 // 2 minutes timestamp validity
});

// For batch operations, add delays between requests
for (const submission of submissions) {
  try {
    const result = await client.submitDds(submission);
    console.log('Success:', result.ddsIdentifier);
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  } catch (error) {
    console.error('Failed:', error.message);
  }
}
```

#### Q: What HS codes are supported?

**A**: The library supports all HS codes relevant to EUDR commodities:

- **4401**: Fuel wood, in logs, in billets, in twigs, in faggots or in similar forms
- **4402**: Wood charcoal (including shell or nut charcoal), whether or not agglomerated
- **4403**: Wood in the rough, whether or not stripped of bark or sapwood, or roughly squared
- **4404**: Hoopwood; split poles; piles, pickets and stakes of wood, pointed but not sawn lengthwise
- **4405**: Wood wool; wood flour
- **4406**: Railway or tramway sleepers (cross-ties) of wood
- **4407**: Wood sawn or chipped lengthwise, sliced or peeled, whether or not planed, sanded or end-jointed
- **4408**: Sheets for veneering (including those obtained by slicing laminated wood), for plywood or for other similar laminated wood and other wood, sawn lengthwise, sliced or peeled, whether or not planed, sanded, spliced or end-jointed, of a thickness exceeding 6 mm
- **4409**: Wood (including strips and friezes for parquet flooring, not assembled) continuously shaped (tongued, grooved, rebated, chamfered, V-jointed, beaded, moulded, rounded or the like) along any of its edges or faces, whether or not planed, sanded or end-jointed
- **4410**: Particle board, oriented strand board (OSB) and similar board (for example, waferboard) of wood or other ligneous materials, whether or not agglomerated with resins or other organic binding substances
- **4411**: Fibreboard of wood or other ligneous materials, whether or not bonded with resins or other organic substances
- **4412**: Plywood, veneered panels and similar laminated wood
- **4413**: Densified wood, in blocks, plates, strips or profile shapes
- **4414**: Wooden frames for paintings, photographs, mirrors or similar objects
- **4415**: Packing cases, boxes, crates, drums and similar packings, of wood; cable-drums of wood; pallets, box pallets and other load boards, of wood; pallet collars of wood
- **4416**: Casks, barrels, vats, tubs and other coopers' products and parts thereof, of wood, including staves
- **4417**: Tools, tool bodies, tool handles, broom or brush bodies and handles, of wood; boot or shoe lasts and trees, of wood
- **4418**: Builders' joinery and carpentry of wood, including cellular wood panels, assembled parquet panels, shingles and shakes
- **4419**: Tableware and kitchenware, of wood
- **4420**: Wood marquetry and inlaid wood; caskets and cases for jewellery or cutlery, and similar articles, of wood; statuettes and other ornaments, of wood; wooden articles of furniture not falling in Chapter 94
- **4421**: Other articles of wood

#### 🚀 NEW: Q: How does automatic endpoint generation work?

**A**: See the [Configuration](#configuration) section for detailed information. The EUDR API Client automatically generates service endpoints based on your `webServiceClientId`:

- **`webServiceClientId: 'eudr'`** → Automatically uses production environment endpoints
- **`webServiceClientId: 'eudr-test'`** → Automatically uses acceptance environment endpoints
- **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

#### 🚀 NEW: Q: Can I still use manual endpoint configuration?

**A**: Yes! Manual endpoint configuration is fully supported and takes priority. See the [Configuration](#configuration) section for details.

#### 🚀 NEW: Q: Which services support automatic endpoint generation?

**A**: All EUDR services support automatic endpoint generation. See the [Configuration](#configuration) section for complete details.

#### 🚀 NEW: Q: How do I configure SSL certificate validation?

**A**: All EUDR services support SSL configuration through the `ssl` parameter:

```javascript
// Production environment - validate SSL certificates (secure)
const productionClient = new EudrSubmissionClient({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr',
  ssl: true  // Reject unauthorized certificates
});

// Development environment - allow self-signed certificates
const devClient = new EudrSubmissionClient({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test',
  ssl: false  // Allow unauthorized certificates
});

// Using environment variables
const client = new EudrSubmissionClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: process.env.EUDR_CLIENT_ID,
  ssl: process.env.EUDR_SSL_ENABLED === 'true'
});
```

**SSL Configuration Options:**
- **`ssl: true`** → Validates SSL certificates (recommended for production)
- **`ssl: false`** → Allows unauthorized certificates (useful for development)
- **Not specified** → Defaults to `false` (backward compatible)

**Security Recommendations:**
- Always use `ssl: true` in production environments
- Use `ssl: false` only for development with self-signed certificates
- Set `EUDR_SSL_ENABLED=true` in production environment variables

#### 🚀 NEW: Q: How does the Retrieval Service error handling work?

**A**: The EUDR Retrieval Service V1 includes smart error handling that converts SOAP authentication faults to proper HTTP status codes:

- **SOAP Authentication Faults** → Automatically converted to **HTTP 401 Unauthorized**
- **Consistent Error Objects** → All services return structured error objects
- **Original SOAP Response** → Still available for debugging when needed

```javascript
try {
  const result = await retrievalClient.getDdsInfo('some-uuid');
} catch (error) {
  if (error.details.status === 401) {
    // Authentication failed - properly converted from SOAP fault
    console.error('Invalid credentials:', error.message);
  }
  // error.details.data still contains original SOAP response for debugging
}
```

#### 🚀 NEW: Q: What's the difference between CF3 and CF7 specifications?

**A**: The Retrieval Service supports both EUDR specifications:

**CF3 v1.4 (DDS Information Retrieval):**
- `getDdsInfo()` - Retrieve DDS by UUID(s) with rejection reasons
- `getDdsInfoByInternalReferenceNumber()` - Search by internal reference
- **Features**: Rejection reasons, CA communication, batch UUID support (max 100)

**CF7 v1.4 (DDS Statement Retrieval):**
- `getStatementByIdentifiers()` - Get complete DDS content with geolocation
- ⚠️ `getReferencedDDS()` - Not available in V1 (use V2 for supply chain traversal)
- **Features**: Full DDS content, referenced statements info, availability dates

#### 🚀 NEW: Q: How do I traverse the supply chain using the Retrieval Service?

**A**: Supply chain traversal capabilities depend on the service version:

**V1 Retrieval Service (Limited Traversal):**
```javascript
// V1 can get referenced statement info but cannot directly traverse
const mainDds = await retrievalClient.getStatementByIdentifiers(
  '25NLSN6LX69730', 
  'K7R8LA90'
);

// Extract referenced statements info
const referencedStatements = mainDds.ddsInfo[0].referencedStatements;
console.log('V1 provides reference info:', referencedStatements);
// [{ referenceNumber: '25NLWPAZWQ8865', securityNumber: 'GLE9SMMM' }]

// ⚠️ V1 does not have getReferencedDds() method for actual traversal
```

**🚀 V2 Retrieval Service (Full Supply Chain Traversal):**
```javascript
const { EudrRetrievalClientV2 } = require('eudr-api-client');
const retrievalV2Client = new EudrRetrievalClientV2(config);

// Step 1: Get full DDS statement
const mainDds = await retrievalV2Client.getStatementByIdentifiers(
  '25NLSN6LX69730', 
  'K7R8LA90'
);

// Step 2: Extract referenced statements
const referencedStatements = mainDds.ddsInfo[0].referencedStatements;

// Step 3: Follow the supply chain with V2's getReferencedDds
for (const ref of referencedStatements) {
  const referencedDds = await retrievalV2Client.getReferencedDds(
    ref.referenceNumber,
    ref.securityNumber  // Use security number, not verification number
  );
  
  console.log('Referenced DDS content:', referencedDds.ddsInfo);
  // Continue traversing if more references exist
}
```

**Recommendation**: Use **EudrRetrievalClientV2** for complete supply chain analysis with the `getReferencedDds()` method.

## Contributing

We welcome contributions from the community! If you'd like to contribute, please follow these steps:
1.  **Fork the repository** on GitHub.
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes** and commit them with a clear message.
4.  **Push your branch** and open a pull request.

Please check our [GitHub Issues](https://github.com/eudr-api-client/eudr-api-client/issues) for bug reports and feature requests.

## License

This project is dual-licensed. See the [LICENCE.md](LICENCE.md) file for details.

- **Open Source (AGPL v3)**: You can use, modify, and distribute this software under the terms of the GNU AGPL v3. This requires you to release the source code of any derivative works.
- **Commercial License**: For use in proprietary applications without the source code disclosure requirements of the AGPL, a commercial license is available. Please contact us at [support@eudr-api.eu](mailto:support@eudr-api.eu) for more information.

## Support

For community support, please open an issue on our [GitHub repository](https://github.com/eudr-api-client/eudr-api-client/issues).

For commercial support and licensing inquiries, please contact us at [support@eudr-api.eu](mailto:support@eudr-api.eu).