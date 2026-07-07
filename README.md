# 🌲 EUDR API Client

[![npm version](https://img.shields.io/npm/v/eudr-api-client.svg)](https://www.npmjs.com/package/eudr-api-client)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js Version](https://img.shields.io/node/v/eudr-api-client.svg)](https://nodejs.org)
[![Test Status](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./tests/README.md)

> **Enterprise-grade Node.js library for EU Deforestation Regulation (EUDR) compliance**
> Complete integration with the EUDR TRACES system — V3 API: Due Diligence Statements (DDS), Simplified Declarations (SD), and Declaration Verification.

## ⚠️ V1 / V2 are discontinued — use V3

The EUDR Information System now only accepts **V3** requests. As of this writing, the acceptance environment rejects V1/V2 requests with a SOAP fault: `"This API version has been discontinued. Please use the V3 API endpoints."` **V1 and V2 client code is no longer functional against the live system.**

This README documents the **V3 API first**, since it's the only version that actually works. The V1/V2 client classes (`EudrSubmissionClient`, `EudrSubmissionClientV2`, `EudrRetrievalClient`, `EudrRetrievalClientV2`) remain in the library and are still described in this document, but only in the [Legacy: V1 / V2 API Reference](#legacy-v1--v2-api-reference-deprecated--non-functional) section at the bottom — kept for historical reference and for anyone migrating an old integration, not for new development.

**Start new integrations here:**
- `EudrSubmissionClientV3` / `EudrRetrievalClientV3` — Due Diligence Statement (DDS)
- `EudrSimplifiedDeclarationClientV3` — Simplified Declaration (SD), for micro/small primary operators
- `EudrVerifyDeclarationClientV3` — Declaration verification, for downstream operators and traders

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

The EU Deforestation Regulation (EUDR) requires operators and traders to submit Due Diligence Statements (or, for eligible micro/small primary operators, Simplified Declarations) for commodities like wood, cocoa, coffee, and more. This library provides:

- ✅ **Full V3 API Coverage** - DDS submission/retrieval, Simplified Declaration, and Declaration Verification, all fully implemented
- ✅ **Production-Ready** - Tested against the real EUDR acceptance environment
- ✅ **Well-Documented** - Comprehensive documentation with real examples
- ✅ **Enterprise Features** - Robust error handling, logging, and comprehensive validation
- ✅ **Easy Integration** - Simple API with real-world examples
- ✅ **Smart Endpoint Management** - Automatic endpoint generation for standard environments
- ✅ **Flexible Configuration** - Manual endpoint override when needed
- ✅ **Flexible Array Fields** - Array properties accept both single objects and arrays for maximum flexibility
- ℹ️ **V1/V2 retained for reference only** - kept in the library and documented at the bottom of this README, but no longer functional against the live EUDR system

## Table of Contents

- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Basic Setup](#basic-setup)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Configuration Options](#configuration-options)
  - [Configuration Priority](#configuration-priority)
  - [Example Configuration Scenarios](#example-configuration-scenarios)
  - [Accessing Configuration Information](#accessing-configuration-information)
- [Real-World Examples](#real-world-examples)
  - [Import Operations](#import-operations)
  - [Domestic Production](#domestic-production)
  - [Grouped Declarations](#grouped-declarations)
  - [Authorized Representatives](#authorized-representatives)
- [Business Rules & Validation](#business-rules--validation)
- [API Reference](#api-reference)
  - [Services Overview](#services-overview)
  - [Echo Service](#echo-service)
  - [V3 DDS Facade Clients](#v3-dds-facade-clients)
  - [V3 Simplified Declaration Client](#v3-simplified-declaration-client)
  - [EudrSubmissionClientV3](#-eudrsubmissionclientv3)
  - [EudrRetrievalClientV3](#-eudrretrievalclientv3-v3)
  - [EudrSimplifiedDeclarationClientV3](#-eudrsimplifieddeclarationclientv3-v3)
  - [EudrVerifyDeclarationClientV3](#-eudrverifydeclarationclientv3-v3)
  - [Flexible Array Fields](#-flexible-array-fields)
  - [Data Types](#data-types)
  - [Advanced Usage](#advanced-usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debug Mode](#debug-mode)
  - [FAQ](#faq)
- [Legacy: V1 / V2 API Reference (deprecated — non-functional)](#legacy-v1--v2-api-reference-deprecated--non-functional)
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
const { EudrSubmissionClientV3 } = require('eudr-api-client');

// Initialize the V3 client with automatic endpoint generation
const client = new EudrSubmissionClientV3({
  username: 'your-username',
  password: 'your-password',
  // Use "eudr-test" for the EUDR Traces acceptance environment, "eudr-repository" for production
  webServiceClientId: 'eudr-test', // See the Configuration section below for details
  ssl: false // SSL configuration: true for secure (production), false for development
});
```

**Submit your first DDS:**

```javascript
const result = await client.submitDds({
  operatorRole: 'OPERATOR', // 'OPERATOR' or 'REPRESENTATIVE_OPERATOR'
  statement: {
    internalReferenceNumber: 'REF-001', // optional in V3 - generated by the system if omitted
    activityType: 'DOMESTIC', // 'DOMESTIC' | 'IMPORT' | 'EXPORT' (no 'TRADE' in V3)
    countryOfActivity: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Domestic wood products',
        goodsMeasure: { netWeight: 20 }
      },
      hsHeading: '4401',
      speciesInfo: {
        scientificName: 'Fagus silvatica',
        commonName: 'European Beech'
      },
      producers: [{
        country: 'HR',
        name: 'Your Company Ltd.',
        // Base64-encoded GeoJSON (Point, Polygon, MultiPolygon, ...)
        geometryGeojson: 'BASE64_ENCODED_GEOJSON'
      }]
    }],
    geoLocationConfidential: false
  }
});

console.log('✅ DDS Submitted. UUID:', result.uuid);
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
  webServiceClientId: 'eudr-test', // Automatically generates the acceptance endpoint
  
  // Optional
  ssl: false, // true for production (secure), false for development
  timestampValidity: 60, // seconds
  timeout: 10000, // milliseconds
};
```

**Manual Endpoint Override (Advanced):**

```javascript
const config = {
  // Required
  endpoint: 'https://custom-endpoint.com/ws/EUDRDueDiligenceStatementServiceV3',
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
- **`webServiceClientId: 'eudr-repository'`** → Uses production environment
- **`webServiceClientId: 'eudr-test'`** → Uses acceptance environment  
- **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

### Example Configuration Scenarios

```javascript
const { EudrSubmissionClientV3 } = require('eudr-api-client');

// Scenario 1: Automatic endpoint generation (Recommended)
const autoClient = new EudrSubmissionClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test', // Automatically generates acceptance endpoint
  ssl: false // Development environment - allow self-signed certificates
});

// Scenario 2: Manual endpoint override
const manualClient = new EudrSubmissionClientV3({
  endpoint: 'https://custom-server.com/ws/EUDRDueDiligenceStatementServiceV3',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-id',
  ssl: false // Custom development server
});

// Scenario 3: Production environment
const productionClient = new EudrSubmissionClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-repository', // Automatically generates production endpoint
  ssl: true // Production environment - validate SSL certificates
});
```

### Accessing Configuration Information

**You can access endpoint configuration information through the `config` export:**

```javascript
const { config } = require('eudr-api-client');

// Get supported client IDs
const supportedIds = config.getSupportedClientIds();
console.log('Supported IDs:', supportedIds); // ['eudr-repository', 'eudr-test']

// Get supported services
const supportedServices = config.getSupportedServices();
console.log('Supported Services:', supportedServices);

// Get supported versions for a service
const submissionVersions = config.getSupportedVersions('submission');
console.log('Submission Service Versions:', submissionVersions); // ['v1', 'v2', 'v3']

// Check if a client ID is standard
const isStandard = config.isStandardClientId('eudr-repository');
console.log('Is eudr-repository standard?', isStandard); // true

// Generate endpoint manually (if needed)
const endpoint = config.generateEndpoint('submission', 'v3', 'eudr-test');
console.log('Generated endpoint:', endpoint);
```

## Real-World Examples

### Import Operations

**Scenario**: Importing wood products with producer geolocation data

```javascript
const { EudrSubmissionClientV3 } = require('eudr-api-client');

const importClient = new EudrSubmissionClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test', // Automatically generates acceptance endpoint
  ssl: false // Development environment - allow self-signed certificates
});

const importResult = await importClient.submitDds({
  operatorRole: 'OPERATOR',
  statement: {
    internalReferenceNumber: 'DLE20/359',
    activityType: 'IMPORT',
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR',
    comment: 'Import with geolocations',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Imported wood products from France',
        goodsMeasure: {
          netWeight: 300, // mandatory for IMPORT/EXPORT
          supplementaryUnit: 20,
          supplementaryUnitQualifier: 'MTQ' // cubic meters
        }
      },
      hsHeading: '4401',
      speciesInfo: {
        scientificName: 'Fagus silvatica',
        commonName: 'European Beech'
      },
      producers: [{
        country: 'FR',
        name: 'French Wood Producer',
        // Base64-encoded GeoJSON polygon
        geometryGeojson: 'BASE64_ENCODED_GEOJSON'
      }]
    }],
    geoLocationConfidential: false
  }
});

console.log(`✅ Import DDS submitted. UUID: ${importResult.uuid}`);
```

### Domestic Production

**Scenario**: Domestic wood production with multiple species

```javascript
const domesticResult = await client.submitDds({
  operatorRole: 'OPERATOR',
  statement: {
    internalReferenceNumber: 'DLE20/357',
    activityType: 'DOMESTIC',
    countryOfActivity: 'HR',
    commodities: [
      {
        position: 1,
        descriptors: {
          descriptionOfGoods: 'Prostorno drvo s glavnog stovarišta - BUKVA OBIČNA',
          goodsMeasure: { netWeight: 16, supplementaryUnit: 20, supplementaryUnitQualifier: 'MTQ' }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus silvatica',
          commonName: 'BUKVA OBIČNA'
        },
        producers: [{
          country: 'HR',
          name: 'GreenWood Solutions Ltd.',
          geometryGeojson: 'BASE64_ENCODED_GEOJSON'
        }]
      },
      {
        position: 2,
        descriptors: {
          descriptionOfGoods: 'Prostorno drvo s glavnog stovarišta - BUKVA OSTALE',
          goodsMeasure: { netWeight: 12, supplementaryUnit: 15, supplementaryUnitQualifier: 'MTQ' }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus sp.',
          commonName: 'BUKVA OSTALE'
        },
        producers: [{
          country: 'HR',
          name: 'GreenWood Solutions Ltd.',
          geometryGeojson: 'BASE64_ENCODED_GEOJSON'
        }]
      }
    ],
    geoLocationConfidential: false
  }
});

console.log(`✅ Domestic DDS submitted. UUID: ${domesticResult.uuid}`);
```

### Grouped Declarations

**Scenario**: Submitting a new DDS that references previously submitted DDS or SD declarations for grouping. This is the V3 replacement for the old V1/V2 `associatedStatements`/`TRADE` pattern — see [Data Types](#data-types) for the conceptual difference.

```javascript
const groupedResult = await client.submitDds({
  operatorRole: 'OPERATOR',
  statement: {
    internalReferenceNumber: 'GROUPED-REF-001',
    activityType: 'IMPORT',
    countryOfActivity: 'BE',
    borderCrossCountry: 'BE',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Grouped cocoa shipment',
        goodsMeasure: { netWeight: 5000 }
      },
      hsHeading: '1801',
      speciesInfo: {
        scientificName: 'Theobroma cacao',
        commonName: 'Cacao'
      },
      producers: [{
        country: 'BR',
        name: 'Producer Name',
        geometryGeojson: 'BASE64_ENCODED_GEOJSON'
      }]
    }],
    geoLocationConfidential: false,
    // References to previously submitted DDS/SD reference numbers
    groupedDeclarations: [
      { groupedDeclaration: '26FRYUI34JTQKB' },
      { groupedDeclaration: '26FRLSCV861ZVV' }
    ]
  }
});

console.log(`✅ Grouped DDS submitted. UUID: ${groupedResult.uuid}`);
```

> **Note:** referenced declarations receive `GROUPED` status and can no longer be individually amended/withdrawn while the grouping declaration is active. Submission is blocked if any referenced statement is not in `AVAILABLE` status. This is not the same concept as V1/V2's `associatedStatements` — see [V3 DDS Facade Clients](#v3-dds-facade-clients).

### Authorized Representatives

**Scenario**: Submitting on behalf of another operator (`REPRESENTATIVE_OPERATOR` role)

```javascript
const representativeResult = await client.submitDds({
  operatorRole: 'REPRESENTATIVE_OPERATOR',
  statement: {
    internalReferenceNumber: 'DLE20/360',
    activityType: 'IMPORT',
    representedOperator: {
      // EconomicOperatorReferenceNumberType - structured identifier
      operatorReferenceNumber: {
        identifierType: 'eori', // eori | vat | gln | tin | cbr | cin | duns | comp_num | comp_reg | oni
        identifierValue: 'HR123456789'
      },
      // AddressType - structured address (country/street/postalCode/city all required if provided)
      operatorAddress: {
        country: 'HR',
        street: 'Ulica Kneza Branimira 2',
        postalCode: '10000',
        city: 'Zagreb'
      },
      operatorEmail: 'contact@croatianimport.hr',
      operatorPhone: '+385 (001) 480-4111',
      operatorName: 'Croatian Import Company' // mandatory
    },
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR',
    comment: 'Import by authorized representative',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Wood products imported by representative',
        goodsMeasure: { netWeight: 250, supplementaryUnit: 12, supplementaryUnitQualifier: 'MTQ' }
      },
      hsHeading: '4401',
      speciesInfo: {
        scientificName: 'Fagus silvatica',
        commonName: 'European Beech'
      },
      producers: [{
        country: 'GH',
        name: 'Ghana Wood Board',
        geometryGeojson: 'BASE64_ENCODED_GEOJSON'
      }]
    }],
    geoLocationConfidential: false
  }
});

console.log(`✅ Representative DDS submitted. UUID: ${representativeResult.uuid}`);
```

## Business Rules & Validation

Unlike the legacy V2 client (see [Legacy FAQ](#legacy-v1--v2-api-reference-deprecated--non-functional)), the **V3 clients do not pre-validate units-of-measure business rules client-side**. V3 leans on the server for this: submit the request, and if a rule is violated the server returns a `BusinessRulesValidationException` SOAP fault, which `EudrErrorHandler` surfaces as a structured error.

The V3 clients *do* validate, client-side and before any network call, the things that are structural/schema-level rather than business rules — for example:

```javascript
try {
  await client.submitDds({
    operatorRole: 'OPERATOR',
    statement: { activityType: 'TRADE' /* not supported in V3 */, /* ... */ }
  });
} catch (error) {
  console.error(error.eudrErrorCode); // 'EUDR_V3_ACTIVITY_TYPE_TRADE_NOT_SUPPORTED'
}
```

See each V3 client's **Error Handling** subsection below for the full list of client-side `eudrErrorCode` values, and how server-side `BusinessRulesValidationException`/`PermissionDeniedException` faults surface via `error.details.soapFault`.

## API Reference

### Services Overview

**🚀 All services support automatic endpoint generation!**

> ⚠️ **V1/V2 are discontinued on the live EUDR system.** The acceptance environment rejects V1/V2 requests with a SOAP fault: `"This API version has been discontinued. Please use the V3 API endpoints."` V1/V2 client code remains in this library for historical/migration reference, but it is **not functional** against the live system. **All new integrations must use the V3 clients.**

| Service | Class | Automatic Endpoint | Manual Override | Specification |
|---------|-------|-------------------|-----------------|------------------|
| **DDS Submission (V3)** | `EudrSubmissionClientV3` | ✅ Yes | ✅ Yes | Operator API v1.0 |
| **DDS Retrieval (V3)** | `EudrRetrievalClientV3` | ✅ Yes | ✅ Yes | Operator API v1.0 |
| **Simplified Declaration (V3)** | `EudrSimplifiedDeclarationClientV3` | ✅ Yes | ✅ Yes | Operator API v1.0 |
| **Verify Declaration (V3)** | `EudrVerifyDeclarationClientV3` | ✅ Yes | ✅ Yes | Downstream Operator & Trader API v1.0 |
| **Echo Service** | `EudrEchoClient` | ✅ Yes | ✅ Yes | CF1 v1.4 |
| **Submission Service V1** ⚠️ non-functional | `EudrSubmissionClient` | ✅ Yes | ✅ Yes | CF2 v1.4 |
| **Submission Service V2** ⚠️ non-functional | `EudrSubmissionClientV2` | ✅ Yes | ✅ Yes | CF2 v1.4 |
| **Retrieval Service V1** ⚠️ non-functional | `EudrRetrievalClient` | ✅ Yes | ✅ Yes | CF3 & CF7 v1.4 |
| **Retrieval Service V2** ⚠️ non-functional | `EudrRetrievalClientV2` | ✅ Yes | ✅ Yes | CF3 & CF7 v1.4 |

**Endpoint Generation Rules:**
- **`webServiceClientId: 'eudr-repository'`** → Production environment endpoints
- **`webServiceClientId: 'eudr-test'`** → Acceptance environment endpoints
- **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

**Example:**
```javascript
const {
  EudrSubmissionClientV3,
  EudrRetrievalClientV3,
  EudrSimplifiedDeclarationClientV3,
  EudrVerifyDeclarationClientV3,
  EudrEchoClient
} = require('eudr-api-client');

const echoClient = new EudrEchoClient({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-test', ssl: false
});

const submissionV3Client = new EudrSubmissionClientV3({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-test', ssl: false
});

const retrievalV3Client = new EudrRetrievalClientV3({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-repository', ssl: true
});

const simplifiedDeclarationV3Client = new EudrSimplifiedDeclarationClientV3({
  username: 'user', password: 'pass', webServiceClientId: 'eudr-test', ssl: false
});

const verifyDeclarationV3Client = new EudrVerifyDeclarationClientV3({
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

### V3 DDS Facade Clients

> **V3 is a new API contract, not a "V2.1."** It is not backward compatible with V1/V2: field names, response shapes, operation names, and some business rules changed (see the breaking-changes table below). Treat migration to V3 like integrating a new API, not applying a patch.

V3 uses a single unified DDS backend service, but the library's public API is intentionally split into two facade clients for consistency with the existing pattern:

- `EudrSubmissionClientV3` for write operations (`submitDds`, `amendDds`, `withdrawDds`)
- `EudrRetrievalClientV3` for retrieval operations (`getDds`, `getDdsByInternalReference`, `getDdsByIdentifiers`)

```javascript
const { EudrSubmissionClientV3, EudrRetrievalClientV3 } = require('eudr-api-client');

const submissionV3 = new EudrSubmissionClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test',
  ssl: false
});

const retrievalV3 = new EudrRetrievalClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-repository',
  ssl: true
});

// Write operations
await submissionV3.submitDds({ /* V3 payload */ });
await submissionV3.amendDds('uuid', { /* V3 statement */ });
await submissionV3.withdrawDds('uuid');

// Retrieval operations
await retrievalV3.getDds('uuid'); // also accepts an array of up to 100 uuids
await retrievalV3.getDdsByInternalReference('INT-REF-001');
await retrievalV3.getDdsByIdentifiers('REFERENCE-NUMBER', 'VERIFICATION-NUMBER');
```

**V3 retrieval response shapes:**
- `getDds` / `getDdsByInternalReference` return `{ httpStatus, status, ddsInfo: [...] }` — `ddsInfo` is always an array of DDS overview entries (`uuid`, `internalReferenceNumber`, `referenceNumber`, `verificationNumber`, `status`, `date`, `updatedBy`, `version`, ...).
- `getDdsByIdentifiers` returns `{ httpStatus, status, statement: {...} }` — the full DDS statement (`activityType`, `commodities`, `geoLocationConfidential`, ...), not an overview list.

**V1/V2 -> V3 breaking changes (no silent translation):** V3 does not accept old V1/V2 field names — the library throws a clear, tagged error instead of guessing a mapping:

| Old (V1/V2) | New (V3) | If you still pass the old field |
|---|---|---|
| `operatorType` | `operatorRole` (`OPERATOR` \| `REPRESENTATIVE_OPERATOR`) | throws `EUDR_V3_LEGACY_OPERATOR_TYPE_FIELD` |
| `activityType: 'TRADE'` | not supported in V3 (`DOMESTIC` \| `IMPORT` \| `EXPORT` only) | throws `EUDR_V3_ACTIVITY_TYPE_TRADE_NOT_SUPPORTED` |
| `associatedStatements` | `groupedDeclarations: [{ groupedDeclaration: referenceNumber }]` | throws `EUDR_V3_LEGACY_ASSOCIATED_STATEMENTS_FIELD` |

Note V3 grouping is not the same concept as V1/V2 referenced statements: a grouped declaration receives `GROUPED` status and can no longer be individually amended/withdrawn while the grouping declaration is active — that's why the library doesn't auto-translate `associatedStatements`.

```javascript
try {
  await submissionV3.submitDds({ operatorType: 'TRADER', statement: { /* ... */ } });
} catch (error) {
  if (error.eudrErrorCode === 'EUDR_V3_LEGACY_OPERATOR_TYPE_FIELD') {
    console.error('Use operatorRole instead of operatorType in V3:', error.message);
  }
}
```

**Migrating an old V1/V2 integration?** See the full [Legacy: V1 / V2 API Reference](#legacy-v1--v2-api-reference-deprecated--non-functional) section at the bottom of this README for the old client examples and a side-by-side migration snippet.

---

### V3 Simplified Declaration Client

Simplified Declaration (SD) is a **new V3-only concept** with no V1/V2 equivalent — it does not replace DDS, it's an alternative track for a specific operator category:

- **Use DDS** (`EudrSubmissionClientV3` / `EudrRetrievalClientV3`) for standard, per-shipment due diligence statements.
- **Use SD** (`EudrSimplifiedDeclarationClientV3`) if you are a **micro or small primary operator** (natural person or micro/small undertaking) established in a **low-risk country**, placing on the market or exporting products **you produced yourself**. SD is a one-time declaration covering all your relevant products, submitted once instead of per shipment.

Unlike DDS, SD is exposed as a **single unified client** (no submission/retrieval split) since there's no pre-existing V1/V2 pattern to stay consistent with.

```javascript
const { EudrSimplifiedDeclarationClientV3 } = require('eudr-api-client');

const sdClient = new EudrSimplifiedDeclarationClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test',
  ssl: false
});

// Submit a new Simplified Declaration
const submitResult = await sdClient.submitSd({
  operatorRole: 'MICRO_OPERATOR', // or REPRESENTATIVE_MSPO, MEMBER_STATE
  statement: {
    internalReferenceNumber: 'SD-REF-001', // mandatory for SD (optional for DDS)
    activityType: 'IMPORT', // DOMESTIC | IMPORT | EXPORT (no TRADE)
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Cocoa beans',
        goodsMeasure: { netWeight: 1000 }
      },
      hsHeading: '1801',
      producers: [{
        producerCountry: 'CI',
        producerName: 'Producer Name',
        producerLocation: {
          // exactly one of: geometryGeojson | postalAddress | cadastralIdentifier
          geometryGeojson: 'BASE64_ENCODED_GEOJSON'
        }
      }]
    }],
    geoLocationConfidential: false
  }
});
console.log(submitResult.sdIdentifier); // note: submit response field is `sdIdentifier`, not `uuid`

// Update / withdraw (identified by sdIdentifier)
const updateResult = await sdClient.updateSd(submitResult.sdIdentifier, { /* updated statement */ });
console.log(updateResult.uuid, updateResult.status); // note: update/withdraw responses use `uuid`, not `sdIdentifier`
await sdClient.withdrawSd(submitResult.sdIdentifier);

// Retrieval
await sdClient.getSd(submitResult.sdIdentifier); // also accepts [{ uuid, version }] or an array, up to 100
await sdClient.getSdByInternalReference('SD-REF-001');
await sdClient.getSdByIdentifiers('DECLARATION-IDENTIFIER', 'VERIFICATION-NUMBER');
```

**Producer location alternatives (unlike DDS, GeoJSON is not mandatory for SD):** a producer's location must be provided as *exactly one* of:
- `geometryGeojson` — base64-encoded GeoJSON (same as DDS)
- `postalAddress` — `{ producerStreet?, producerPostalCode, producerCity }` (single object or array)
- `cadastralIdentifier` — a land-registry identifier string (single value or array)

**SD response shapes:**
- `submitSd` returns `{ httpStatus, status, sdIdentifier }`.
- `updateSd` / `withdrawSd` return `{ httpStatus, status, uuid, version, status: lifecycleStatus }` (same `EudrStatusType` lifecycle values as DDS: `SUBMITTED`, `AVAILABLE`, `REJECTED`, `WITHDRAWN`, `ARCHIVED`, `SUSPENDED`, `UPDATED`, `GROUPED`, `OBSOLETE`).
- `getSd` / `getSdByInternalReference` return `{ httpStatus, status, sdInfo: [...] }` (array of SD overview entries, same shape family as DDS `ddsInfo`).
- `getSdByIdentifiers` returns `{ httpStatus, status, statement: {...} }` — the full SD statement. Note SD commodities have **no `speciesInfo`** field (unlike DDS).

**SD validation errors** (client-side, thrown before any network call — same `error.eudrErrorCode` / `error.eudrSpecific` pattern as DDS):

| Error code | When it's thrown |
|---|---|
| `EUDR_V3_SD_OPERATOR_ROLE_INVALID` | `operatorRole` is not one of `MICRO_OPERATOR`, `REPRESENTATIVE_MSPO`, `MEMBER_STATE` |
| `EUDR_V3_SD_INTERNAL_REFERENCE_REQUIRED` | `statement.internalReferenceNumber` is missing (mandatory for SD) |
| `EUDR_V3_SD_ACTIVITY_TYPE_INVALID` | `statement.activityType` is not `DOMESTIC`, `IMPORT`, or `EXPORT` |
| `EUDR_V3_SD_PRODUCER_COUNTRY_REQUIRED` | a producer is missing `producerCountry` |
| `EUDR_V3_SD_PRODUCER_LOCATION_INVALID` | a producer's location has zero or more than one of `geometryGeojson`/`postalAddress`/`cadastralIdentifier` |

---
### 🚀 EudrSubmissionClientV3
The V3 client for submitting, amending, and withdrawing DDS statements against the unified DDS V3 service. Not backward compatible with V1/V2 payloads — see the breaking-changes table in [V3 DDS Facade Clients](#v3-dds-facade-clients).

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `submitDds(request, options)` | Submit a new DDS (V3) | `request` (Object), `options` (Object) | Promise with `uuid` |
| `amendDds(uuid, statement, options)` | Amend an existing DDS (V3) | `uuid` (String), `statement` (Object), `options` (Object) | Promise with `uuid` + lifecycle `status` |
| `withdrawDds(uuid, options)` | Withdraw a DDS (V3, renamed from `retractDds`) | `uuid` (String), `options` (Object) | Promise with `uuid` + lifecycle `status` |

#### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rawResponse` | boolean | false | Whether to return the raw XML response instead of the parsed result |

#### Detailed Method Reference

**`submitDds(request, options)`**
```javascript
const result = await submissionV3.submitDds({
  operatorRole: 'OPERATOR',  // 'OPERATOR' or 'REPRESENTATIVE_OPERATOR' (renamed from operatorType)
  statement: {
    internalReferenceNumber: 'REF-001',  // optional in V3
    activityType: 'IMPORT',  // 'DOMESTIC' | 'IMPORT' | 'EXPORT' (TRADE removed in V3)
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Wood products',
        goodsMeasure: { netWeight: 100 }
      },
      hsHeading: '4401',
      speciesInfo: { scientificName: 'Fagus silvatica', commonName: 'Beech' },
      producers: [{ country: 'HR', name: 'Producer Ltd.', geometryGeojson: 'BASE64_ENCODED_GEOJSON' }]
    }],
    geoLocationConfidential: false,
    groupedDeclarations: [{ groupedDeclaration: '25NLSN6LX69730' }]  // optional; replaces associatedStatements
  }
}, {
  rawResponse: false  // Set to true to get raw XML response
});

// Returns: { httpStatus: 200, status: 200, uuid: 'uuid-string', raw: 'xml...', parsed: {...} }
```

**`amendDds(uuid, statement, options)`**
```javascript
const result = await submissionV3.amendDds(
  'existing-dds-uuid',
  {
    activityType: 'IMPORT',
    commodities: [ /* ... */ ],
    geoLocationConfidential: false
  },
  { rawResponse: false }
);

// Returns: { httpStatus: 200, status: 'AVAILABLE', uuid: 'existing-dds-uuid', raw: 'xml...' }
// Note: `status` here is the DDS lifecycle status (see EudrStatusType below), not the HTTP status code.
// The real HTTP status code is always available in `httpStatus`.
```

**`withdrawDds(uuid, options)`**
```javascript
const result = await submissionV3.withdrawDds(
  'dds-uuid-to-withdraw',
  { rawResponse: false }
);

// Returns: { httpStatus: 200, status: 'WITHDRAWN', uuid: 'dds-uuid-to-withdraw' }
```

**`EudrStatusType` lifecycle values** (returned by `amendDds`/`withdrawDds`, and inside `ddsInfo`/`statement` from the retrieval client): `SUBMITTED`, `AVAILABLE`, `REJECTED`, `WITHDRAWN`, `ARCHIVED`, `SUSPENDED` (not active yet), `UPDATED` (not active yet), `GROUPED`, `OBSOLETE`.

#### Error Handling

```javascript
try {
  const result = await submissionV3.submitDds({
    operatorRole: 'OPERATOR',
    statement: { activityType: 'IMPORT', /* ... */ }
  });
} catch (error) {
  // Client-side validation errors, thrown before any network call (see the breaking-changes table above)
  if (error.eudrErrorCode === 'EUDR_V3_OPERATOR_ROLE_INVALID') {
    console.error('Invalid operatorRole:', error.message);
  } else if (error.eudrErrorCode === 'EUDR_V3_ACTIVITY_TYPE_TRADE_NOT_SUPPORTED') {
    console.error('TRADE is not supported in V3:', error.message);
  } else if (error.details?.soapFault) {
    // Server-side faults: BusinessRulesValidationException / PermissionDeniedException
    console.error('SOAP fault:', error.details.soapFault.faultString);
    console.error('Error details:', error.details.soapFault.errorDetails);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

#### Configuration Examples

```javascript
// Production environment with SSL validation
const productionV3Client = new EudrSubmissionClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-repository',
  ssl: true,
  timeout: 30000
});

// Development environment with relaxed SSL
const devV3Client = new EudrSubmissionClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',
  ssl: false,
  timeout: 10000
});

// Manual endpoint override
const customV3Client = new EudrSubmissionClientV3({
  endpoint: 'https://custom-endpoint.com/ws/EUDRDueDiligenceStatementServiceV3',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client',
  ssl: false
});
```

---
### 🚀 EudrRetrievalClientV3 (V3)
Retrieval facade over the unified DDS V3 service. Unlike V1/V2, retrieval and submission share the same backend service — this client exists purely to keep the library's familiar submission/retrieval split.

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getDds(uuids, options)` | Retrieve DDS overview by UUID(s), renamed from `getDdsInfo` | `uuids` (String or Array, max 100), `options` (Object) | Promise with `ddsInfo` array |
| `getDdsByInternalReference(internalReferenceNumber, options)` | Retrieve DDS overview by internal reference, renamed from `getDdsInfoByInternalReferenceNumber` | `internalReferenceNumber` (String), `options` (Object) | Promise with `ddsInfo` array |
| `getDdsByIdentifiers(referenceNumber, verificationNumber, options)` | Retrieve full DDS content, renamed from `getStatementByIdentifiers` | `referenceNumber` (String), `verificationNumber` (String), `options` (Object) | Promise with full `statement` |
| ~~`getReferencedDds()`~~ | ❌ Not available in V3 — the spec removes this operation entirely, there is no replacement | N/A | N/A |

#### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rawResponse` | boolean | false | Whether to return the raw XML response instead of the parsed result |

> Note: unlike V1/V2, `decodeGeojson` auto-decoding is **not yet implemented** for V3 — `geometryGeojson` in `getDdsByIdentifiers` results comes back base64-encoded exactly as received from the server.

#### Key Features
- ✅ **Unified backend**: retrieval and submission are the same DDS V3 service under the hood
- ✅ **Batch retrieval**: `getDds` accepts up to 100 UUIDs per call, same as V1/V2 `getDdsInfo`
- ✅ **Full statement retrieval**: `getDdsByIdentifiers` returns the complete DDS statement, not just an overview
- ✅ **Consistent array fields**: `ddsInfo` is always an array (even for a single overview result); `commodities`/`producers`/`speciesInfo`/`groupedDeclarations` inside a full `statement` are always arrays
- ⚠️ **No supply chain traversal**: V2's `getReferencedDds()` has no V3 equivalent — grouping (`groupedDeclarations`) is a different concept, not a drop-in replacement

#### Detailed Method Reference

**`getDds(uuids, options)`**
```javascript
// Single UUID
const ddsInfo = await retrievalV3.getDds('550e8400-e29b-41d4-a716-446655440000');

// Multiple UUIDs (max 100 per call)
const multipleDds = await retrievalV3.getDds([
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
]);

// Returns:
// {
//   httpStatus: 200,
//   status: 200,
//   ddsInfo: [
//     {
//       uuid: 'uuid-string',
//       internalReferenceNumber: '26BEDWNW9JD1TN',
//       referenceNumber: '26BE7XTVCZAQ2S',
//       verificationNumber: 'SFFCB4Y3',
//       status: 'AVAILABLE',       // EudrStatusType
//       rejectionReason: null,
//       communicationToOperator: null,
//       date: '2026-05-20T09:55:01.000Z',
//       updatedBy: 'User3 User3',
//       version: '1'
//     }
//   ],
//   raw: 'xml-response',   // if rawResponse: true
//   parsed: { /* parsed XML object */ }
// }
```

**`getDdsByInternalReference(internalReferenceNumber, options)`**
```javascript
const ddsList = await retrievalV3.getDdsByInternalReference('26BEDWNW9JD1TN');

// Returns: same ddsInfo overview shape as getDds
```

**`getDdsByIdentifiers(referenceNumber, verificationNumber, options)`**
```javascript
const fullDds = await retrievalV3.getDdsByIdentifiers('26BE7XTVCZAQ2S', 'SFFCB4Y3');

// Returns:
// {
//   httpStatus: 200,
//   status: 200,
//   statement: {
//     activityType: 'IMPORT',
//     commodities: [{
//       position: '1',
//       descriptors: { descriptionOfGoods: '...', goodsMeasure: { netWeight: '300.000000', ... } },
//       hsHeading: '4410',
//       speciesInfo: [{ scientificName: '...', commonName: '...' }],
//       producers: [{ country: 'FR', geometryGeojson: 'BASE64_ENCODED_GEOJSON' }]
//     }],
//     geoLocationConfidential: 'false'
//     // ... rest of the DDS statement
//   }
// }
```

#### Error Handling

```javascript
try {
  const result = await retrievalV3.getDds('some-uuid');
  console.log('Success:', result.ddsInfo);
} catch (error) {
  console.error(error.message);
  // Inspect the raw SOAP fault for NotFoundException / BusinessRulesValidationException details -
  // V3 fault-to-HTTP-status mapping in EudrErrorHandler is generic, not yet tailored per V3 fault type.
  console.error(error.details?.soapFault);
  if (error.eudrErrorCode) {
    console.error('EUDR error code:', error.eudrErrorCode);
  }
}
```

#### Configuration Examples

```javascript
// Production environment with SSL validation
const productionRetrievalV3Client = new EudrRetrievalClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-repository',
  ssl: true,
  timeout: 30000
});

// Development environment with relaxed SSL
const devRetrievalV3Client = new EudrRetrievalClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',
  ssl: false,
  timeout: 10000
});

// Manual endpoint override
const customRetrievalV3Client = new EudrRetrievalClientV3({
  endpoint: 'https://custom-endpoint.com/ws/EUDRDueDiligenceStatementServiceV3',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client',
  ssl: false
});
```

---
### 🌱 EudrSimplifiedDeclarationClientV3 (V3)
Single unified client for the new Simplified Declaration (SD) V3 service — see [V3 Simplified Declaration Client](#v3-simplified-declaration-client) for when to use SD instead of DDS.

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `submitSd(request, options)` | Submit a new Simplified Declaration | `request` (Object), `options` (Object) | Promise with `sdIdentifier` |
| `updateSd(sdIdentifier, statement, options)` | Update an existing SD | `sdIdentifier` (String), `statement` (Object), `options` (Object) | Promise with `uuid` + lifecycle `status` |
| `withdrawSd(sdIdentifier, options)` | Withdraw an SD | `sdIdentifier` (String), `options` (Object) | Promise with `uuid` + lifecycle `status` |
| `getSd(uuids, options)` | Retrieve SD overview by UUID(s)/version, max 100 | `uuids` (String, `{uuid, version}`, or Array), `options` (Object) | Promise with `sdInfo` array |
| `getSdByInternalReference(internalReferenceNumber, options)` | Retrieve SD overview by internal reference | `internalReferenceNumber` (String), `options` (Object) | Promise with `sdInfo` array |
| `getSdByIdentifiers(referenceNumber, verificationNumber, options)` | Retrieve full SD content | `referenceNumber` (String), `verificationNumber` (String), `options` (Object) | Promise with full `statement` |

#### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rawResponse` | boolean | false | Whether to return the raw XML response instead of the parsed result |

#### Key Features
- ✅ **New V3-only concept**: no V1/V2 precedent, no legacy field name compatibility concerns
- ✅ **Single unified client**: write and retrieval operations in one class (unlike the DDS submission/retrieval split)
- ✅ **One-time declaration model**: `submitSd` is meant to be called once per operator, not per shipment
- ✅ **Flexible producer location**: `geometryGeojson`, `postalAddress`, or `cadastralIdentifier` (DDS requires GeoJSON only)
- ⚠️ **Asymmetric identifier field naming**: `submitSd` returns `sdIdentifier`; `updateSd`/`withdrawSd` return `uuid` for the same value — this mirrors the actual WSDL, not an inconsistency in this library

#### Detailed Method Reference

**`submitSd(request, options)`**
```javascript
const result = await sdClient.submitSd({
  operatorRole: 'MICRO_OPERATOR',  // MICRO_OPERATOR | REPRESENTATIVE_MSPO | MEMBER_STATE
  statement: {
    internalReferenceNumber: 'SD-REF-001',  // mandatory for SD (optional for DDS)
    activityType: 'IMPORT',  // DOMESTIC | IMPORT | EXPORT
    commodities: [{
      descriptors: { descriptionOfGoods: 'Cocoa beans', goodsMeasure: { netWeight: 1000 } },
      hsHeading: '1801',
      producers: [{
        producerCountry: 'CI',
        producerName: 'Producer Name',
        producerLocation: { geometryGeojson: 'BASE64_ENCODED_GEOJSON' }  // exactly one choice
      }]
    }],
    geoLocationConfidential: false
  }
});

// Returns: { httpStatus: 200, status: 200, sdIdentifier: 'uuid-string' }
```

**`updateSd(sdIdentifier, statement, options)`**
```javascript
const result = await sdClient.updateSd('existing-sd-uuid', {
  internalReferenceNumber: 'SD-REF-001',
  activityType: 'IMPORT',
  commodities: [ /* ... */ ],
  geoLocationConfidential: false
});

// Returns: { httpStatus: 200, status: 'AVAILABLE', uuid: 'existing-sd-uuid', version: '2' }
// Note: response field is `uuid`, not `sdIdentifier` (see WSDL asymmetry note above).
```

**`withdrawSd(sdIdentifier, options)`**
```javascript
const result = await sdClient.withdrawSd('existing-sd-uuid');
// Returns: { httpStatus: 200, status: 'WITHDRAWN', uuid: 'existing-sd-uuid' }
```

**`getSd(uuids, options)`**
```javascript
// Plain uuid, or with an explicit version
await sdClient.getSd('existing-sd-uuid');
await sdClient.getSd({ uuid: 'existing-sd-uuid', version: 2 });
await sdClient.getSd(['uuid-1', { uuid: 'uuid-2', version: 1 }]); // up to 100 entries

// Returns: { httpStatus: 200, status: 200, sdInfo: [ { uuid, internalReferenceNumber, referenceNumber, verificationNumber, status, date, updatedBy, version, ... } ] }
```

**`getSdByInternalReference(internalReferenceNumber, options)`**
```javascript
const sdList = await sdClient.getSdByInternalReference('SD-REF-001');
// Returns: same sdInfo overview shape as getSd
```

**`getSdByIdentifiers(referenceNumber, verificationNumber, options)`**
```javascript
const fullSd = await sdClient.getSdByIdentifiers('S26BECB39D2GRX', 'H6ORMNTX');

// Returns:
// {
//   httpStatus: 200,
//   status: 200,
//   statement: {
//     activityType: 'IMPORT',
//     commodities: [{ descriptors: { descriptionOfGoods: '...' }, hsHeading: '1801', producers: [{ producerCountry: 'CI' }] }],
//     geoLocationConfidential: 'false'
//     // Note: no speciesInfo field on SD commodities (unlike DDS)
//   }
// }
```

#### Error Handling

```javascript
try {
  await sdClient.submitSd({ operatorRole: 'OPERATOR', statement: { /* ... */ } });
} catch (error) {
  if (error.eudrErrorCode === 'EUDR_V3_SD_OPERATOR_ROLE_INVALID') {
    console.error('Invalid SD operatorRole:', error.message);
  } else if (error.eudrErrorCode === 'EUDR_V3_SD_PRODUCER_LOCATION_INVALID') {
    console.error('Producer location must be exactly one of geometryGeojson/postalAddress/cadastralIdentifier:', error.message);
  } else if (error.details?.soapFault) {
    console.error('SOAP fault:', error.details.soapFault.faultString);
  }
}
```

See the [SD validation errors table](#v3-simplified-declaration-client) above for the full list of `EUDR_V3_SD_*` codes.

#### Configuration Examples

```javascript
// Production environment with SSL validation
const productionSdClient = new EudrSimplifiedDeclarationClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-repository',
  ssl: true,
  timeout: 30000
});

// Development environment with relaxed SSL
const devSdClient = new EudrSimplifiedDeclarationClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',
  ssl: false,
  timeout: 10000
});

// Manual endpoint override
const customSdClient = new EudrSimplifiedDeclarationClientV3({
  endpoint: 'https://custom-endpoint.com/ws/EUDRSimplifiedDeclarationServiceV3',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client',
  ssl: false
});
```

### 🔍 EudrVerifyDeclarationClientV3 (V3)
Client for the `EUDRVerifyDeclarationServiceV3` service — lets any party in the supply chain (not just the
submitting operator) confirm that a DDS or SD declaration is authentic and in a usable status, given only its
reference number and verification number. Specified in "EUDR Downstream Operator and Trader API Reference
v1.0" §4.1 (not the main Operator API Reference, which only lists this service in its summary table).

#### Methods
| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `verifyDeclaration(referenceNumber, verificationNumber, options)` | Verify a DDS or SD by reference + verification number | `referenceNumber` (String), `verificationNumber` (String), `options` (Object) | Promise with `result`, `status`, `dateTime` |

#### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rawResponse` | boolean | false | Whether to return the raw XML response instead of the parsed result |

#### Key Features
- ✅ **Single-operation client**: only `verifyDeclaration`, no submission/retrieval split
- ✅ **Role-agnostic**: usable by Operators, Authorised Representatives, and SME/Non-SME Downstream Operators or Traders alike — unlike DDS submission, which is operator-only
- ✅ **Works for both DDS and SD**: the same `referenceNumber`/`verificationNumber` pair works regardless of which service originally issued the declaration
- ✅ **Three-way result**: `EXISTING_USABLE`, `EXISTING_NON_USABLE`, or `NON_EXISTENT` — `status` (the underlying `EudrStatusType`) is only present for the two `EXISTING_*` outcomes

#### Detailed Method Reference

**`verifyDeclaration(referenceNumber, verificationNumber, options)`**
```javascript
// Declaration exists and is in a usable status (e.g. AVAILABLE)
const usable = await verifyDeclarationV3Client.verifyDeclaration('EUDR00000001BE', 'VN-2025-ABC12');
// Returns: { httpStatus: 200, result: 'EXISTING_USABLE', status: 'AVAILABLE', dateTime: '2026-05-20T10:00:00.000Z' }

// Declaration exists but is not in a usable status (e.g. WITHDRAWN, REJECTED, SUSPENDED)
const nonUsable = await verifyDeclarationV3Client.verifyDeclaration('EUDR00000002BE', 'VN-2025-XYZ99');
// Returns: { httpStatus: 200, result: 'EXISTING_NON_USABLE', status: 'WITHDRAWN', dateTime: '2026-05-20T10:00:00.000Z' }

// No declaration matches the reference/verification number combination
const missing = await verifyDeclarationV3Client.verifyDeclaration('EUDR99999999BE', 'VN-0000-NOPE1');
// Returns: { httpStatus: 200, result: 'NON_EXISTENT', status: null, dateTime: '2026-05-20T10:00:00.000Z' }
```

#### Error Handling

```javascript
try {
  await verifyDeclarationV3Client.verifyDeclaration('BAD-REF', 'BAD-VN');
} catch (error) {
  if (error.eudrErrors?.length > 0) {
    // BusinessRulesValidationException for this service reports { field, message } without an error code
    error.eudrErrors.forEach(e => console.error(`${e.field}: ${e.message}`));
  } else if (error.httpStatus === 403) {
    console.error('Permission denied - role not authorized to verify declarations:', error.message);
  } else if (error.details?.soapFault) {
    console.error('SOAP fault:', error.details.soapFault.faultString);
  }
}
```

#### Configuration Examples

```javascript
// Production environment with SSL validation
const productionVerifyClient = new EudrVerifyDeclarationClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-repository',
  ssl: true,
  timeout: 30000
});

// Development environment with relaxed SSL
const devVerifyClient = new EudrVerifyDeclarationClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',
  ssl: false,
  timeout: 10000
});

// Manual endpoint override
const customVerifyClient = new EudrVerifyDeclarationClientV3({
  endpoint: 'https://custom-endpoint.com/ws/EUDRVerifyDeclarationServiceV3',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client',
  ssl: false
});
```

### 🚀 Flexible Array Fields

All V3 statement fields that the schema allows to repeat can be provided as either a **single object** or an **array of objects** — this library normalizes either input shape before building the SOAP request, and always normalizes them back to arrays in retrieval responses.

#### Supported Flexible Fields (V3)

| Field | Where | Description |
|-------|-------|-------------|
| **`commodities`** | DDS & SD statement | Commodity entries |
| **`producers`** | DDS & SD commodity | Producer entries |
| **`speciesInfo`** | DDS commodity only (not on SD) | Species entries |
| **`groupedDeclarations`** | DDS & SD statement | Referenced declarations for grouping |
| **`postalAddress`** | SD producer location | Alternative postal address(es) for a production location |
| **`cadastralIdentifier`** | SD producer location | Alternative land-registry identifier(s) |

> **Schema change vs V1/V2:** `representedOperator.operatorReferenceNumber` is a single structured `{ identifierType, identifierValue }` object in V3, not a repeatable array like V1/V2's `operator.referenceNumber` — an operator now has exactly one reference number.

#### Examples

**Single object (works the same as an array of one):**
```javascript
const request = {
  operatorRole: 'OPERATOR',
  statement: {
    activityType: 'IMPORT',
    commodities: {  // single commodity object, not wrapped in []
      descriptors: { descriptionOfGoods: 'Wood', goodsMeasure: { netWeight: 100 } },
      hsHeading: '4401',
      speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' }, // single object
      producers: { country: 'HR', name: 'Forest Company', geometryGeojson: 'BASE64_ENCODED_GEOJSON' } // single object
    },
    geoLocationConfidential: false
  }
};
```

**Array format (multiple items):**
```javascript
const request = {
  operatorRole: 'OPERATOR',
  statement: {
    activityType: 'IMPORT',
    commodities: [{
      descriptors: { descriptionOfGoods: 'Wood', goodsMeasure: { netWeight: 100 } },
      hsHeading: '4401',
      speciesInfo: [
        { scientificName: 'Fagus sylvatica', commonName: 'European Beech' },
        { scientificName: 'Quercus robur', commonName: 'English Oak' }
      ],
      producers: [
        { country: 'HR', name: 'Croatian Forest Company', geometryGeojson: 'BASE64_ENCODED_GEOJSON' },
        { country: 'DE', name: 'German Wood Supplier', geometryGeojson: 'BASE64_ENCODED_GEOJSON' }
      ]
    }],
    geoLocationConfidential: false,
    groupedDeclarations: [  // array of grouped declarations
      { groupedDeclaration: '25NLSN6LX69730' },
      { groupedDeclaration: '25NLWPAZWQ8865' }
    ]
  }
};
```

**Mixed usage (maximum flexibility):**
```javascript
const request = {
  operatorRole: 'OPERATOR',
  statement: {
    activityType: 'IMPORT',
    commodities: [
      {
        descriptors: { descriptionOfGoods: 'Beech wood', goodsMeasure: { netWeight: 100 } },
        hsHeading: '4401',
        speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' }, // single in first commodity
        producers: [ // multiple producers in first commodity
          { country: 'HR', name: 'Croatian Producer', geometryGeojson: 'BASE64_ENCODED_GEOJSON' },
          { country: 'DE', name: 'German Producer', geometryGeojson: 'BASE64_ENCODED_GEOJSON' }
        ]
      },
      {
        descriptors: { descriptionOfGoods: 'Oak & Pine wood', goodsMeasure: { netWeight: 80 } },
        hsHeading: '4401',
        speciesInfo: [ // multiple species in second commodity
          { scientificName: 'Quercus robur', commonName: 'English Oak' },
          { scientificName: 'Pinus sylvestris', commonName: 'Scots Pine' }
        ],
        producers: { country: 'AT', name: 'Austrian Producer', geometryGeojson: 'BASE64_ENCODED_GEOJSON' } // single
      }
    ],
    geoLocationConfidential: false
  }
};
```

#### Benefits

- **📈 Scalability**: Easy to add multiple items when needed
- **🎯 Consistency**: Same pattern across all repeatable fields, DDS and SD alike
- **⚡ Performance**: No overhead for single-item arrays
- **🔄 Consistent retrieval shape**: `getDdsByIdentifiers`/`getSdByIdentifiers` always normalize these fields back to arrays, regardless of how many items the server returned

### Data Types

#### DDS Statement Structure (V3)
```javascript
{
  operatorRole: 'OPERATOR' | 'REPRESENTATIVE_OPERATOR',
  statement: {
    internalReferenceNumber: String,   // optional - generated by the system if omitted
    activityType: 'DOMESTIC' | 'IMPORT' | 'EXPORT',  // no 'TRADE' in V3
    representedOperator: {             // required when operatorRole is REPRESENTATIVE_OPERATOR
      operatorReferenceNumber: {       // EconomicOperatorReferenceNumberType - structured, optional
        identifierType: 'eori' | 'vat' | 'gln' | 'tin' | 'cbr' | 'cin' | 'duns' | 'comp_num' | 'comp_reg' | 'oni',
        identifierValue: String
      },
      operatorAddress: {                // AddressType - structured, optional
        country: String,                // required if operatorAddress is present
        street: String,                 // required if operatorAddress is present
        postalCode: String,             // required if operatorAddress is present
        city: String,                   // required if operatorAddress is present
        fullAddress: String             // optional
      },
      operatorEmail: String,            // optional
      operatorPhone: String,            // optional
      operatorName: String              // mandatory (max 200 chars)
    },
    countryOfActivity: String,          // EU Member State, ISO 3166-1 alpha-2
    borderCrossCountry: String,         // ISO 3166-1 alpha-2 (IMPORT: country of entry, EXPORT: country of exit)
    comment: String,                    // optional, max 2000 chars
    commodities: [{
      position: Number,                 // optional ordinal position
      descriptors: {
        descriptionOfGoods: String,     // max 150 chars
        goodsMeasure: {
          percentageEstimationOrDeviation: Number, // optional
          netWeight: Number,            // mandatory if activityType is IMPORT/EXPORT, in Kg
          supplementaryUnit: Number,    // optional
          supplementaryUnitQualifier: String // required if supplementaryUnit is set (e.g. 'MTQ')
        }
      },
      hsHeading: String,                // HS code, 2-6 digits
      speciesInfo: {                    // optional, for wood-based products
        scientificName: String,
        commonName: String
      },
      producers: [{                     // optional
        position: Number,
        country: String,                // ISO 3166-1 alpha-2 - country of production
        name: String,                   // max 500 chars
        geometryGeojson: String         // base64-encoded GeoJSON (mandatory if a producer entry is provided)
      }]
    }],
    geoLocationConfidential: Boolean,   // mandatory
    groupedDeclarations: [{             // optional - references to previously submitted DDS/SD for grouping
      groupedDeclaration: String        // reference number of the declaration to group
    }]
  }
}
```

#### SD Statement Structure (V3)
```javascript
{
  operatorRole: 'MICRO_OPERATOR' | 'REPRESENTATIVE_MSPO' | 'MEMBER_STATE',
  statement: {
    internalReferenceNumber: String,    // mandatory for SD (unlike DDS, where it's optional)
    activityType: 'DOMESTIC' | 'IMPORT' | 'EXPORT',
    representedOperator: { /* same EconomicOperatorIdentificationType shape as DDS, see above */ },
    countryOfActivity: String,          // optional, must be a low-risk country for MSPO eligibility
    borderCrossCountry: String,         // optional
    comment: String,                    // optional
    commodities: [{
      position: Number,
      descriptors: { /* same CommercialDescriptionType as DDS */ },
      hsHeading: String,
      producers: [{                     // note: no speciesInfo on SD commodities
        producerPosition: Number,
        producerCountry: String,        // mandatory
        producerName: String,           // optional, max 500 chars
        producerLocation: {             // mandatory - exactly one of:
          geometryGeojson: String,           // base64-encoded GeoJSON, OR
          postalAddress: [{                  // OR one/more postal addresses
            producerStreet: String,          // optional
            producerPostalCode: String,      // mandatory
            producerCity: String             // mandatory
          }],
          cadastralIdentifier: String         // OR one/more cadastral identifiers (max 80 chars each)
        }
      }]
    }],
    geoLocationConfidential: Boolean,   // mandatory
    groupedDeclarations: [{ groupedDeclaration: String }] // optional; SD-only references (DDS references are rejected)
  }
}
```

#### V3 Response Shapes

See each client's dedicated section above for the exact shape of every operation's response (`submitDds`/`amendDds`/`withdrawDds`, `getDds`/`getDdsByInternalReference`/`getDdsByIdentifiers`, the SD equivalents, and `verifyDeclaration`). In short:

- Write operations (`submitDds`, `submitSd`) return `{ httpStatus, status, uuid | sdIdentifier }`.
- Modification operations (`amendDds`, `withdrawDds`, `updateSd`, `withdrawSd`) return `{ httpStatus, status: lifecycleStatus, uuid, ... }`.
- Overview retrieval (`getDds`, `getDdsByInternalReference`, `getSd`, `getSdByInternalReference`) return `{ httpStatus, status, ddsInfo | sdInfo: [...] }` — always an array.
- Full-content retrieval (`getDdsByIdentifiers`, `getSdByIdentifiers`) return `{ httpStatus, status, statement: {...} }`.
- All responses additionally include `raw` (raw XML) and `parsed` (parsed XML object) unless `options.rawResponse` was used, in which case only `{ httpStatus, data }` (or `{ httpStatus, status, data }`) is returned.

### Advanced Usage

#### Error Handling

The library provides comprehensive error handling with smart SOAP fault conversion, shared across all client versions:

```javascript
try {
  const result = await client.submitDds(ddsData);
  console.log('Success:', result.uuid);
} catch (error) {
  // Client-side, pre-network validation errors carry a tagged eudrErrorCode (see each V3 client's
  // Error Handling subsection above for the full list)
  if (error.eudrSpecific) {
    console.error(`${error.eudrErrorCode}:`, error.message);
  } else if (error.details?.soapFault) {
    // Server-side SOAP faults (BusinessRulesValidationException, PermissionDeniedException, NotFoundException, ...)
    console.error('SOAP fault:', error.details.soapFault.faultString);
  } else if (error.details?.status === 401) {
    console.error('Authentication failed:', error.message);
  } else if (error.request) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

**Key Error Handling Features:**
- ✅ **SOAP to HTTP Conversion**: Authentication faults automatically converted from SOAP 500 to HTTP 401
- ✅ **Structured Error Objects**: Consistent error format across all services and versions
- ✅ **Detailed Error Information**: Full error context, with the original SOAP response available for debugging via `error.details.soapFault`/`error.details.data`

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
  { operatorRole: 'OPERATOR', statement: { /* DDS data 1 */ } },
  { operatorRole: 'OPERATOR', statement: { /* DDS data 2 */ } },
  { operatorRole: 'OPERATOR', statement: { /* DDS data 3 */ } }
];

const results = await Promise.all(
  submissions.map(async (dds) => {
    try {
      return await submissionV3.submitDds(dds);
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
    console.log(`✅ Submission ${index + 1} success:`, result.uuid);
  }
});
```

#### Writing Tests

```javascript
const { expect } = require('chai');
const { EudrSubmissionClientV3 } = require('eudr-api-client');

describe('My EUDR Tests', function() {
  let client;

  before(function() {
    client = new EudrSubmissionClientV3(config);
  });

  it('should submit DDS successfully', async function() {
    const result = await client.submitDds(testData);
    expect(result).to.have.property('uuid');
    expect(result.uuid).to.be.a('string');
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
const client = new EudrSubmissionClientV3({
  ...config,
  timeout: 60000,  // 60 seconds
  ssl: true  // Enable SSL validation for production
});
```

#### 3. Validation Errors

```
Error: Validation failed: Missing required field 'activityType'
```

**Solution**: Only V3 is functional on the live system — make sure you're using V3 field names (`operatorRole`, `groupedDeclarations`, ...), not the discontinued V1/V2 names (`operatorType`, `associatedStatements`, ...). See the breaking-changes table in [V3 DDS Facade Clients](#v3-dds-facade-clients).

#### 4. GeoJSON Encoding

```
Error: Invalid geometryGeojson format
```

**Solution**: `geometryGeojson` must always be Base64-encoded GeoJSON. V3 has no automatic `encodeGeojson`/`decodeGeojson` option (that was a V1/V2-only convenience) — encode/decode it yourself:

```javascript
const geojson = {
  type: "FeatureCollection",
  features: [/* your features */]
};

// Encode for submission
const encoded = Buffer.from(JSON.stringify(geojson)).toString('base64');

// Decode a value received from getDdsByIdentifiers/getSdByIdentifiers
const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
```

#### 5. SSL Certificate Errors

```
Error: unable to verify the first certificate
Error: certificate verify failed
```

**Solution**: Configure SSL settings based on your environment:

```javascript
// For production - always validate certificates
const client = new EudrSubmissionClientV3({
  ...config,
  ssl: true  // Secure - validates SSL certificates
});

// For development with self-signed certificates
const client = new EudrSubmissionClientV3({
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

#### Q: Are V1 and V2 still usable?

**A**: No. The live EUDR system (both acceptance and production) rejects V1/V2 requests outright with a SOAP fault (`"This API version has been discontinued. Please use the V3 API endpoints."`). The V1/V2 client classes remain in this library and are documented in the [Legacy: V1 / V2 API Reference](#legacy-v1--v2-api-reference-deprecated--non-functional) section, purely for migration reference — don't build new integrations on them.

#### Q: What's the difference between `httpStatus` and `status` fields in responses?

**A**: All EUDR services (V1, V2, and V3) include both fields for consistency:

- **`httpStatus`**: HTTP status code (200, 401, 500, etc.)
- **`status`**: for write/overview responses, this duplicates `httpStatus`; for V3 `amendDds`/`withdrawDds`/`updateSd`/`withdrawSd` responses specifically, `status` instead carries the DDS/SD **lifecycle status** (`AVAILABLE`, `WITHDRAWN`, ...) — see the `EudrStatusType` note in each client's method reference above.

```javascript
if (result.httpStatus === 200) { /* the HTTP call succeeded */ }
if (result.status === 'WITHDRAWN') { /* the lifecycle status, from amendDds/withdrawDds */ }
```

#### Q: How do I encode/decode GeoJSON data for V3?

**A**: V3 does not offer the automatic `encodeGeojson`/`decodeGeojson` request options that V1/V2 had — always handle Base64 encoding yourself:

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

// Encode before submitDds/amendDds
const encodedGeojson = Buffer.from(JSON.stringify(geojson)).toString('base64');

// Decode after getDdsByIdentifiers/getSdByIdentifiers
const fullDds = await retrievalV3.getDdsByIdentifiers('26BE7XTVCZAQ2S', 'SFFCB4Y3');
const producers = fullDds.statement.commodities[0].producers;
producers.forEach(producer => {
  if (producer.geometryGeojson) {
    const decodedGeojson = JSON.parse(Buffer.from(producer.geometryGeojson, 'base64').toString('utf-8'));
    console.log('Decoded GeoJSON:', decodedGeojson);
  }
});
```

#### Q: How do I handle rate limiting?

**A**: The library includes configurable timeout handling; pacing/backoff between requests is your responsibility. The published EUDR limits are **10,000 calls/minute globally** and **5 calls/second per IP** (see the Operator API Reference):

```javascript
const client = new EudrSubmissionClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test',
  ssl: false,
  timeout: 30000,
  timestampValidity: 120
});

// For batch operations, add delays between requests
for (const submission of submissions) {
  try {
    const result = await client.submitDds(submission);
    console.log('Success:', result.uuid);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  } catch (error) {
    console.error('Failed:', error.message);
  }
}
```

#### Q: What HS codes are supported?

**A**: The library doesn't restrict HS codes client-side beyond the schema's 2-6 digit pattern — the server validates against the EUDR-relevant commodity list. Common wood HS headings include:

- **4401**: Fuel wood, in logs, in billets, in twigs, in faggots or in similar forms
- **4402**: Wood charcoal (including shell or nut charcoal), whether or not agglomerated
- **4403**: Wood in the rough, whether or not stripped of bark or sapwood, or roughly squared
- **4404**: Hoopwood; split poles; piles, pickets and stakes of wood, pointed but not sawn lengthwise
- **4405**: Wood wool; wood flour
- **4406**: Railway or tramway sleepers (cross-ties) of wood
- **4407**: Wood sawn or chipped lengthwise, sliced or peeled, whether or not planed, sanded or end-jointed
- **4408**: Sheets for veneering, for plywood or for other similar laminated wood, sawn lengthwise, sliced or peeled
- **4409**: Wood continuously shaped along any of its edges or faces
- **4410**: Particle board, oriented strand board (OSB) and similar board of wood or other ligneous materials
- **4411**: Fibreboard of wood or other ligneous materials
- **4412**: Plywood, veneered panels and similar laminated wood
- **4413**: Densified wood, in blocks, plates, strips or profile shapes
- **4414**: Wooden frames for paintings, photographs, mirrors or similar objects
- **4415**: Packing cases, boxes, crates, drums, pallets and similar packings, of wood
- **4416**: Casks, barrels, vats, tubs and other coopers' products, of wood
- **4417**: Tools, tool bodies, tool handles, broom or brush bodies and handles, of wood
- **4418**: Builders' joinery and carpentry of wood
- **4419**: Tableware and kitchenware, of wood
- **4420**: Wood marquetry and inlaid wood; caskets, cases and ornaments, of wood
- **4421**: Other articles of wood
- **1801**: Cocoa beans
- Also relevant: coffee, oil palm, rubber, soya (see the full EUDR commodity list in the Operator API Reference)

#### Q: How does automatic endpoint generation work?

**A**: See the [Configuration](#configuration) section for detailed information. The EUDR API Client automatically generates service endpoints based on your `webServiceClientId`:

- **`webServiceClientId: 'eudr-repository'`** → Automatically uses production environment endpoints
- **`webServiceClientId: 'eudr-test'`** → Automatically uses acceptance environment endpoints
- **Custom `webServiceClientId`** → Requires manual `endpoint` configuration

#### Q: Can I still use manual endpoint configuration?

**A**: Yes! Manual endpoint configuration is fully supported and takes priority. See the [Configuration](#configuration) section for details.

#### Q: How do I configure SSL certificate validation?

**A**: All EUDR services support SSL configuration through the `ssl` parameter:

```javascript
// Production environment - validate SSL certificates (secure)
const productionClient = new EudrSubmissionClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-repository',
  ssl: true  // Reject unauthorized certificates
});

// Development environment - allow self-signed certificates
const devClient = new EudrSubmissionClientV3({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test',
  ssl: false  // Allow unauthorized certificates
});

// Using environment variables
const client = new EudrSubmissionClientV3({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: process.env.EUDR_CLIENT_ID,
  ssl: process.env.EUDR_SSL_ENABLED === 'true'
});
```

**SSL Configuration Options:**
- **`ssl: true`** → Validates SSL certificates (recommended for production)
- **`ssl: false`** → Allows unauthorized certificates (useful for development)
- **Not specified** → Defaults to `false`

**Security Recommendations:**
- Always use `ssl: true` in production environments
- Use `ssl: false` only for development with self-signed certificates
- Set `EUDR_SSL_ENABLED=true` in production environment variables

#### Q: How do units-of-measure business rules work in V3?

**A**: Unlike the legacy V2 client, **V3 does not pre-validate units-of-measure business rules client-side** — this is now entirely server-enforced. Submit your request and handle the resulting `BusinessRulesValidationException` fault if the server rejects it:

```javascript
try {
  const result = await client.submitDds({
    operatorRole: 'OPERATOR',
    statement: {
      activityType: 'IMPORT',
      commodities: [{
        hsHeading: '4701',
        descriptors: {
          goodsMeasure: {
            // Missing netWeight - the server, not the client, will reject this for IMPORT/EXPORT
            supplementaryUnit: 50,
            supplementaryUnitQualifier: 'KSD'
          }
        }
      }]
    }
  });
} catch (error) {
  if (error.details?.soapFault) {
    console.error('Business rule violated:', error.details.soapFault.faultString);
  }
}
```

See the historical [V2 units-of-measure validation](#legacy-v1--v2-api-reference-deprecated--non-functional) rules in the legacy section for the rule *content* (still useful as documentation of what the V3 server enforces), even though V3 no longer replicates the check client-side.

#### Q: How do flexible array fields work in V3?

**A**: See the [Flexible Array Fields](#-flexible-array-fields) section above — `commodities`, `producers`, `speciesInfo`, and `groupedDeclarations` all accept either a single object or an array, and retrieval responses always normalize them back to arrays.

## Legacy: V1 / V2 API Reference (deprecated — non-functional)

> **This entire section describes API versions that no longer work against the live EUDR system.** It's kept for two reasons: (1) if you're maintaining an old integration and need to understand what it used to do, and (2) as a migration reference when porting old code to V3 (see the breaking-changes table in [V3 DDS Facade Clients](#v3-dds-facade-clients)). Do not use any of the classes or examples below for new development — use the V3 clients documented above instead.

### Submission Service (V1 / V2)

Submit, amend, and retract DDS statements. Available in both V1 and V2 APIs with different validation requirements.

**Automatic Units of Measure Validation** - Both V1 and V2 clients include automatic validation of units of measure according to official EUDR rules. Validation occurs before API calls to ensure compliance and provide immediate feedback.

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

### Retrieval Service (V1 / V2)

Retrieve DDS information and supply chain data with automatic endpoint generation.

#### V1 Client (`EudrRetrievalClient`)

```javascript
const { EudrRetrievalClient } = require('eudr-api-client');

const retrievalClient = new EudrRetrievalClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',
  ssl: false
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

- **CF3 v1.4 Support**: `getDdsInfo`, `getDdsInfoByInternalReferenceNumber` with rejection reason & CA communication
- **CF7 v1.4 Support**: `getStatementByIdentifiers` for complete DDS retrieval
- **Batch Retrieval**: Support for up to 100 UUIDs in a single `getDdsInfo` call
- **Smart Error Handling**: Converts SOAP authentication faults to proper HTTP 401 status codes
- **Consistent Array Fields**: `commodities`, `producers`, `speciesInfo`, `referenceNumber` always returned as arrays

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
  rawResponse: false,  // Set to true to get raw XML response
  encodeGeojson: true  // Encode plain geometryGeojson strings to base64
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
    rawResponse: false,  // Set to true to get raw XML response
    encodeGeojson: true  // Encode plain geometryGeojson strings to base64
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
        geometryGeojson: 'plain-json-string'  // Will be encoded to base64 if encodeGeojson: true
      }]
    }],
    geoLocationConfidential: false
  }
}, {
  rawResponse: false,  // Set to true to get raw XML response
  encodeGeojson: true  // Encode plain geometryGeojson strings to base64
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
    rawResponse: false,  // Set to true to get raw XML response
    encodeGeojson: true  // Encode plain geometryGeojson strings to base64
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

#### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rawResponse` | boolean | false | Whether to return the raw XML response |
| `decodeGeojson` | boolean | false | Whether to decode base64 geometryGeojson to plain string |

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

// With decodeGeojson option to decode base64 geometryGeojson to plain string
const fullDdsDecoded = await retrievalClient.getStatementByIdentifiers(
  '25NLSN6LX69730', 
  'K7R8LA90',
  {
    decodeGeojson: true  // Decode base64 geometryGeojson to plain string
  }
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

**Options:**
- `rawResponse` (boolean): Whether to return the raw XML response
- `decodeGeojson` (boolean): Whether to decode base64 geometryGeojson to plain string (default: false)

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
    // Handle missing DDS (covers both EUDR-API-NO-DDS and EUDR-WEBSERVICE-STATEMENT-NOT-FOUND)
  } else if (error.details.status === 400) {
    console.error('Invalid verification number:', error.message);
    // Handle invalid verification number (EUDR-VERIFICATION-NUMBER-INVALID)
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
  webServiceClientId: 'eudr-repository',  // Production environment
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
| `getReferencedDds(referenceNumber, securityNumber, options)` | V2 Only: Supply chain traversal | CF7 v1.4 | `referenceNumber` (String), `securityNumber` (String), `options` (Object) | Promise with referenced DDS |

#### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rawResponse` | boolean | false | Whether to return the raw XML response |
| `decodeGeojson` | boolean | false | Whether to decode base64 geometryGeojson to plain string |

#### Key Features

- **All V1 Features**: CF3 v1.4 Support, CF7 v1.4 Support, Batch Retrieval, Smart Error Handling
- **Supply Chain Traversal**: `getReferencedDds()` method for following DDS references
- **Enhanced V2 Namespaces**: Updated SOAP namespaces for V2 compatibility
- **Consistent Response Format**: Includes both `httpStatus` and `status` fields for compatibility
- **Consistent Array Fields**: `commodities`, `producers`, `speciesInfo`, `referenceNumber` always returned as arrays
- **Business Rules Validation**: Comprehensive input validation with detailed error messages

#### Detailed Method Reference

**Basic Usage:**

```javascript
const { EudrRetrievalClientV2 } = require('eudr-api-client');

const retrievalClientV2 = new EudrRetrievalClientV2({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: 'eudr-test',
  ssl: false
});

// All V1 methods work the same way in V2
const ddsInfo = await retrievalClientV2.getDdsInfo('some-uuid-string');
const ddsList = await retrievalClientV2.getDdsInfoByInternalReferenceNumber('DLE20/357');
const fullDds = await retrievalClientV2.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');

// V2-only feature: Supply chain traversal
const referencedDds = await retrievalClientV2.getReferencedDds(
  '25NLWPAZWQ8865', 
  'XtZ7C6t3lFHnOhAqN9fw5w==:dRES/NzB0xL4nkf5nmRrb/5SMARFHoDK53PaCJFPNRA='
);
```

**Business Rules Validation**

The V2 Retrieval Service includes comprehensive input validation with detailed error messages for all methods:

```javascript
try {
  const result = await retrievalClientV2.getStatementByIdentifiers('25HRW9IURY3412', 'COAASVYH');
  console.log('Success:', result.ddsInfo);
} catch (error) {
  if (error.errorType === 'BUSINESS_RULES_VALIDATION') {
    console.error('Validation Error:', error.message);
    // Handle validation errors with specific error messages:
    // - "Reference number too long" (if > 15 characters)
    // - "Reference number too short" (if < 8 characters)  
    // - "Verification number must be exactly 8 characters"
    // - "Reference number must contain only uppercase letters and numbers"
    // - "Verification number must contain only uppercase letters and numbers"
  }
}
```

**Validation Rules:**
- **Reference Number**: 8-15 characters, uppercase letters and numbers only
- **Verification Number**: Exactly 8 characters, uppercase letters and numbers only
- **Internal Reference Number**: 3-50 characters (for `getDdsInfoByInternalReferenceNumber`)

**Supply Chain Traversal - `getReferencedDds(referenceNumber, securityNumber, options)`**

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
    ref.securityNumber,  // Use securityNumber, not verificationNumber
    {
      decodeGeojson: true  // Decode base64 geometryGeojson to plain string
    }
  );
  
  console.log('Referenced DDS content:', referencedDds.ddsInfo);
  
  // Continue traversing if this DDS also has references
  if (referencedDds.ddsInfo[0].referencedStatements?.length > 0) {
    // Recursive traversal possible
    console.log('This DDS has further references...');
  }
}
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
  } else if (error.details.status === 404) {
    console.error('DDS not found:', error.message);
    // Handle missing DDS (covers both EUDR-API-NO-DDS and EUDR-WEBSERVICE-STATEMENT-NOT-FOUND)
  } else if (error.details.status === 400) {
    console.error('Invalid verification number:', error.message);
    // Handle invalid verification number (EUDR-VERIFICATION-NUMBER-INVALID)
  } else if (error.details.status === 500) {
    console.error('Server error:', error.message);
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
  webServiceClientId: 'eudr-repository',  // Production V2 environment
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

### Legacy Real-World Examples (V1)

**Trade Operations** — `activityType: 'TRADE'` no longer exists in V3 (see [Grouped Declarations](#grouped-declarations) for the closest V3 equivalent):

```javascript
const { EudrSubmissionClient } = require('eudr-api-client');

const client = new EudrSubmissionClient({
  username: process.env.EUDR_USERNAME,
  password: process.env.EUDR_PASSWORD,
  webServiceClientId: process.env.EUDR_CLIENT_ID,
  ssl: process.env.EUDR_SSL_ENABLED === 'true'
});

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
        goodsMeasure: { netWeight: 20, volume: 15 }
      },
      hsHeading: "4401",
      speciesInfo: { scientificName: "Fagus silvatica", commonName: "BUKVA OBIČNA" }
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
      { referenceNumber: "25NLSN6LX69730", verificationNumber: "K7R8LA90" },
      { referenceNumber: "25NLWPAZWQ8865", verificationNumber: "GLE9SMMM" }
    ]
  }
});

console.log(`✅ Trade DDS submitted. Identifier: ${tradeResult.ddsIdentifier}`);
```

### Data Types (V1 / V2)

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

#### Response Types (V1 / V2)

**Successful Submission Response:**
```javascript
{
  httpStatus: 200,           // HTTP status code
  status: 200,               // Alias for httpStatus (for consistency)
  ddsIdentifier: 'uuid-string',
  raw: 'raw-xml-response',   // Only included if rawResponse: true
}
```

**Successful Retrieval Response:**
```javascript
{
  httpStatus: 200,           // HTTP status code
  status: 200,               // Alias for httpStatus (for consistency)
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
    status: 401,             // Alias for httpStatus (for consistency)
    statusText: 'Unauthorized',
    data: 'original-soap-response'
  }
}
```

### Using V2 API

The V2 API has stricter validation and different field requirements:

```javascript
const { EudrSubmissionClientV2 } = require('eudr-api-client');

const clientV2 = new EudrSubmissionClientV2({
  endpoint: `${process.env.EUDR_TRACES_BASE_URL}/tracesnt/ws/EUDRSubmissionServiceV2`,
  username: process.env.EUDR_TRACES_USERNAME,
  password: process.env.EUDR_TRACES_PASSWORD,
  webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID,
  ssl: process.env.EUDR_SSL_ENABLED === 'true'
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

### Legacy Units of Measure Validation (V2 client-side)

The V2 `EudrSubmissionClientV2` includes **automatic client-side validation of units of measure** according to official EUDR rules from the economic operators documentation. **This client-side validation does not exist in V1 or in V3** — V3 relies entirely on server-side enforcement (see [Business Rules & Validation](#business-rules--validation) above). It's documented here because the underlying *rules* still describe what the V3 server enforces, even though V3 doesn't check them for you beforehand.

#### Validation Rules

The validation system enforces different rules based on activity type:

##### Import/Export Activities

**Mandatory Fields:**
- **Net Mass (Kg)** - Always required for Import/Export activities
- **Supplementary Unit** - Required only if HS code appears in Appendix I

**Validation Logic:**
- If HS code is in Appendix I → Supplementary unit is **mandatory**
- If HS code is NOT in Appendix I → Supplementary unit is **forbidden**
- Percentage estimation/deviation is **not allowed** for Import/Export

**Supported HS Codes with Supplementary Units:**
- **4-digit codes** (first 4 digits): `4011`, `4013`, `4104`, `4403`, `4406`, `4408`, `4410`, `4411`, `4412`, `4413`, `4701`, `4702`, `4704`, `4705`

##### Domestic/Trade Activities

**Valid Combinations:**
1. **Net Mass + Percentage** (0-25% estimation/deviation)
2. **Net Mass + Supplementary Unit** (with valid qualifier)
3. **Net Mass + Volume** (cubic meters)

**Valid Supplementary Unit Types:**
- `NAR` - Number of articles
- `MTQ` - Cubic meters
- `KSD` - Kilograms per square decimeter

#### Error Handling (V2)

```javascript
try {
  const result = await clientV2.submitDds(ddsData);
  console.log('Success:', result.ddsIdentifier);
} catch (error) {
  if (error.eudrErrorCode === 'EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY') {
    console.error('Net Mass is mandatory for Import/Export activities');
  } else if (error.eudrErrorCode === 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING') {
    console.error('Supplementary unit is mandatory for this HS code');
  } else if (error.eudrErrorCode === 'EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_NOT_ALLOWED') {
    console.error('Percentage estimation not allowed for Import/Export activities');
  } else if (error.eudrErrorCode === 'EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID') {
    console.error('Percentage must be between 0-25% for Domestic/Trade activities');
  }
}
```

### Legacy Flexible Array Fields Reference (V1 / V2)

| Field | XSD maxOccurs | V1 Support | V2 Support | Description |
|-------|---------------|------------|------------|-------------|
| **`commodities`** | 200 | ✅ | ✅ | Commodity information |
| **`producers`** | 1000 | ✅ | ✅ | Producer information |
| **`speciesInfo`** | 500 | ✅ | ✅ | Species information |
| **`associatedStatements`** | 2000 | ✅ | ✅ | Referenced DDS statements |
| **`referenceNumber`** | 12 | ✅ | ✅ | Operator reference numbers (array in V1/V2; single structured object in V3) |

**Implementation Details:**
- **V1 Retrieval Service**: All array fields are normalized in `getStatementByIdentifiers()`
- **V2 Retrieval Service**: All array fields are normalized in `getStatementByIdentifiers()` and `getReferencedDds()`
- **XSD Schema Compliance**: Based on `maxOccurs` values from EUDRSubmissionServiceV1.xsd and EUDRSubmissionServiceV2.xsd

### Legacy FAQ (V1 / V2)

#### Q: What's the difference between V1 and V2 APIs?

**A**: The V2 API introduced several improvements over V1:
- **Enhanced operator address structure** with separate fields for street, postal code, city
- **Removed volume field** from goodsMeasure (replaced with supplementaryUnit)
- **New fullAddress field** for complete address representation
- **Updated namespaces** to reflect V2 specifications
- **Improved validation** and error handling
- **Supply Chain Traversal** with `getReferencedDds()` method in Retrieval V2
- **Consistent Response Format** with both `httpStatus` and `status` fields

Both are now discontinued in favor of V3 — see [V3 DDS Facade Clients](#v3-dds-facade-clients) for the current API.

#### Q: How did the Retrieval Service error handling work in V1/V2?

**A**: The V1/V2 Retrieval Clients included smart error handling that converted SOAP faults to proper HTTP status codes:

- **SOAP Authentication Faults** → Automatically converted to **HTTP 401 Unauthorized**
- **DDS Not Found Errors** → Both `EUDR-API-NO-DDS` and `EUDR-WEBSERVICE-STATEMENT-NOT-FOUND` converted to **HTTP 404 Not Found**
- **Invalid Verification Number** → `EUDR-VERIFICATION-NUMBER-INVALID` converted to **HTTP 400 Bad Request**

```javascript
try {
  const result = await retrievalClient.getDdsInfo('some-uuid');
} catch (error) {
  if (error.details.status === 401) {
    console.error('Invalid credentials:', error.message);
  } else if (error.details.status === 404) {
    console.error('DDS not found:', error.message);
  } else if (error.details.status === 400) {
    console.error('Invalid verification number:', error.message);
  }
}
```

**Consolidated Error Types:**
- **`DDS_NOT_FOUND` (404)**: Covers both `EUDR-API-NO-DDS` and `EUDR-WEBSERVICE-STATEMENT-NOT-FOUND` errors
- **`INVALID_VERIFICATION_NUMBER` (400)**: Covers `EUDR-VERIFICATION-NUMBER-INVALID` errors
- **`AUTHENTICATION_FAILED` (401)**: Covers SOAP authentication faults
- **`BUSINESS_RULES_VALIDATION` (400)**: Covers validation errors

V3's error handling pattern is different — see [Business Rules & Validation](#business-rules--validation) and each V3 client's own Error Handling subsection above.

#### Q: What's the difference between CF3 and CF7 specifications?

**A**: The V1/V2 Retrieval Service supported both EUDR specifications:

**CF3 v1.4 (DDS Information Retrieval):**
- `getDdsInfo()` - Retrieve DDS by UUID(s) with rejection reasons
- `getDdsInfoByInternalReferenceNumber()` - Search by internal reference
- **Features**: Rejection reasons, CA communication, batch UUID support (max 100)

**CF7 v1.4 (DDS Statement Retrieval):**
- `getStatementByIdentifiers()` - Get complete DDS content with geolocation
- ⚠️ `getReferencedDDS()` - Not available in V1 (use V2 for supply chain traversal)
- **Features**: Full DDS content, referenced statements info, availability dates

These CF-numbered specifications don't carry over to V3 — see the [Services Overview](#services-overview) table for V3's specification references.

#### Q: How did supply chain traversal work in V1/V2?

**A**: V1 could only surface referenced-statement info without traversing it; V2 added `getReferencedDds()` for actual traversal:

```javascript
// V1: can get referenced statement info but cannot directly traverse
const mainDds = await retrievalClient.getStatementByIdentifiers('25NLSN6LX69730', 'K7R8LA90');
const referencedStatements = mainDds.ddsInfo[0].referencedStatements;
// [{ referenceNumber: '25NLWPAZWQ8865', securityNumber: 'GLE9SMMM' }]

// V2: full traversal
const { EudrRetrievalClientV2 } = require('eudr-api-client');
const retrievalV2Client = new EudrRetrievalClientV2(config);
for (const ref of referencedStatements) {
  const referencedDds = await retrievalV2Client.getReferencedDds(ref.referenceNumber, ref.securityNumber);
  console.log('Referenced DDS content:', referencedDds.ddsInfo);
}
```

**V3 has no equivalent** — `getReferencedDds()` was removed entirely; `groupedDeclarations` is a related but different concept (see [V3 DDS Facade Clients](#v3-dds-facade-clients)).

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
