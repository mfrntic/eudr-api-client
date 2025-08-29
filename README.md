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

| Service | Class | Automatic Endpoint | Manual Override |
|---------|-------|-------------------|-----------------|
| **Echo Service** | `EudrEchoClient` | ✅ Yes | ✅ Yes |
| **Submission Service V1** | `EudrSubmissionClient` | ✅ Yes | ✅ Yes |
| **Submission Service V2** | `EudrSubmissionClientV2` | ✅ Yes | ✅ Yes |
| **Retrieval Service** | `EudrRetrievalClient` | ✅ Yes | ✅ Yes |

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
  EudrRetrievalClient 
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

Retrieve DDS information and supply chain data.

```javascript
const { EudrRetrievalClient } = require('eudr-api-client');
const retrievalClient = new EudrRetrievalClient(config);

// Get DDS info by UUID
const ddsInfo = await retrievalClient.getDdsInfo('some-uuid-string');

// Get DDS info by internal reference
const ddsList = await retrievalClient.getDdsInfoByInternalReferenceNumber('DLE20/357');

// Get full DDS statement by reference and verification number
const fullDds = await retrievalClient.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');

// Get referenced DDS for supply chain traversal
const referencedDds = await retrievalClient.getReferencedDDS('25NLWPAZWQ8865', 'GLE9SMMM');
```

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

// Returns: { httpStatus: 200, ddsIdentifier: 'uuid-string', raw: 'xml...', parsed: {...} }
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

// Returns: { httpStatus: 200, success: true, message: 'DDS amended successfully' }
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

// Returns: { httpStatus: 200, ddsIdentifier: 'uuid-string', raw: 'xml...', parsed: {...} }
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

// Returns: { httpStatus: 200, success: true, message: 'DDS amended successfully' }
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
### 🔍 EudrRetrievalClient
Service for retrieving DDS information and supply chain data.

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getDdsInfo(uuids)` | Get DDS by UUID | `uuids` (String or Array) | Promise with DDS details |
| `getDdsInfoByInternalReferenceNumber(internalReferenceNumber)` | Get DDS by internal reference | `internalReferenceNumber` (String) | Promise with DDS |
| `getStatementByIdentifiers(referenceNumber, verificationNumber)` | Get full DDS statement by reference and verification number | `referenceNumber` (String), `verificationNumber` (String) | Promise with DDS |
| `getReferencedDDS(referenceNumber, verificationNumber)` | Get referenced DDS for supply chain traversal | `referenceNumber` (String), `verificationNumber` (String) | Promise with DDS |

#### Detailed Method Reference
**`getDdsInfo(uuids)`**
```javascript
const dds = await retrievalClient.getDdsInfo('some-uuid-string');
// or for multiple:
const ddsList = await retrievalClient.getDdsInfo(['uuid-1', 'uuid-2']);

// Returns: Array of DDS info objects
```

**`getDdsInfoByInternalReferenceNumber(internalReferenceNumber)`**
```javascript
const ddsList = await retrievalClient.getDdsInfoByInternalReferenceNumber('DLE20/357');

// Returns: Array of matching DDS statements
```

**`getStatementByIdentifiers(referenceNumber, verificationNumber)`**
```javascript
const fullDds = await retrievalClient.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');

// Returns: Complete DDS object with all details
```

**`getReferencedDDS(referenceNumber, verificationNumber)`**
```javascript
const referencedDds = await retrievalClient.getReferencedDDS('25NLWPAZWQ8865', 'GLE9SMMM');

// Returns: Referenced DDS object
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
  httpStatus: 200,
  ddsIdentifier: 'uuid-string',
  raw: 'raw-xml-response',
  parsed: { /* parsed XML object */ }
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

The library provides comprehensive error handling:

```javascript
try {
  const result = await client.submitDds(ddsData);
  console.log('Success:', result);
} catch (error) {
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.data);
  } else if (error.request) {
    console.error('Network Error:', error.message);
  } else {
    console.error('Unexpected Error:', error.message);
  }
}
```

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