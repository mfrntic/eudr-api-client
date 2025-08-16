# 🔧 EUDR API Client Logger System

## Overview

The EUDR API Client includes a robust logging system that provides:
- **Pino integration** when available (high-performance structured logging)
- **Console fallback** when Pino is not available
- **Configurable log levels** via environment variables
- **Child logger support** for contextual logging
- **Conflict-free operation** with parent application loggers

## 🏗️ Architecture

### Core Components

1. **Logger Factory** (`createLogger()`)
   - Creates logger instances with custom configuration
   - Automatically detects Pino availability
   - Falls back to console logging when needed

2. **Default Logger** (`logger`)
   - Pre-configured logger instance
   - Respects `EUDR_LOG_LEVEL` environment variable
   - Default level: `warn`

3. **Child Logger Support** (`createChildLogger()`)
   - Creates contextual loggers with additional bindings
   - Inherits parent logger configuration
   - Useful for service-specific logging

### Log Levels

| Level | Numeric | Description | Default Output |
|-------|---------|-------------|----------------|
| `trace` | 0 | Most verbose logging | Console (when level ≤ trace) |
| `debug` | 1 | Debug information | Console (when level ≤ debug) |
| `info` | 2 | General information | Console (when level ≤ info) |
| `warn` | 3 | Warning messages | Console.warn (when level ≤ warn) |
| `error` | 4 | Error messages | Console.error (when level ≤ error) |
| `fatal` | 5 | Fatal errors | Console.error (when level ≤ fatal) |

## 🚀 Usage

### Basic Usage

```javascript
const { logger, createLogger, createChildLogger } = require('./utils/logger');

// Use default logger
logger.info('Application started');
logger.warn('Deprecated feature used');
logger.error('Connection failed');

// Create custom logger
const customLogger = createLogger({
  level: 'debug',
  name: 'my-service'
});

// Create child logger with context
const requestLogger = createChildLogger({
  requestId: 'req-123',
  userId: 'user-456'
});
```

### Service Integration

```javascript
// In your service files
const { logger } = require('../utils/logger');

class EudrService {
  constructor() {
    this.logger = logger.child({ service: 'eudr-api' });
  }
  
  async submitDds(data) {
    this.logger.info('Starting DDS submission', { ddsId: data.id });
    
    try {
      // ... submission logic
      this.logger.info('DDS submission completed successfully');
    } catch (error) {
      this.logger.error('DDS submission failed', { error: error.message });
      throw error;
    }
  }
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EUDR_LOG_LEVEL` | Set default log level | `warn` |

### Examples

```bash
# Set log level via environment
export EUDR_LOG_LEVEL=debug
npm test

# Or inline
EUDR_LOG_LEVEL=trace npm test

# For production (errors only)
EUDR_LOG_LEVEL=error npm start
```

### Logger Options

```javascript
const logger = createLogger({
  level: 'info',           // Log level
  name: 'custom-name',     // Logger name
  // Pino-specific options when available
  base: null,              // Remove pid, hostname
  timestamp: false,        // Disable timestamps
  formatters: {            // Custom formatters
    level: (label) => ({ level: label })
  }
});
```

## 🧪 Testing

### Running Logger Tests

```bash
# Run only logger tests
npm run test:logger

# Run all tests (logger first, then integration)
npm test

# Use test runner for more control
npm run test:runner

# Run specific test categories
npm run test:runner -- --logger-only
npm run test:runner -- --skip-logger
```

### Test Categories

1. **Module Loading & Dependencies**
   - Module loading without errors
   - Expected function exports

2. **Default Logger Instance**
   - Correct properties and methods
   - Default configuration

3. **Logger Configuration**
   - Custom options handling
   - Option merging

4. **Log Level Functionality**
   - All log levels working
   - Proper output methods

5. **Log Level Filtering**
   - Level-based filtering
   - Correct message suppression

6. **Child Logger Creation**
   - Context binding
   - Inheritance

7. **Level Setting & Getting**
   - Dynamic level changes
   - Persistence

8. **Error Handling & Edge Cases**
   - Invalid levels
   - Missing dependencies
   - Null/undefined handling

9. **Pino Integration**
   - Pino detection
   - Pino-specific features

10. **Performance & Memory**
    - Rapid log calls
    - Multiple logger instances

11. **Environment Integration**
    - Environment variable respect
    - Graceful fallbacks

12. **Service Integration**
    - Service usage simulation
    - Level persistence

## 🔍 Debugging

### Enable Verbose Logging

```bash
# See all logs during tests
EUDR_LOG_LEVEL=trace npm test

# See debug and above
EUDR_LOG_LEVEL=debug npm test

# See only errors
EUDR_LOG_LEVEL=error npm test
```

### Console Output During Tests

The test suite captures console output to verify logging behavior:

```javascript
// Tests capture console.log, console.warn, console.error
// to verify fallback logger functionality
let consoleOutput = [];
console.log = function(...args) {
  consoleOutput.push({ level: 'log', args });
};
```

### Pino vs Fallback Detection

```javascript
// Check if using Pino or fallback
if (logger._isPino) {
  console.log('Using Pino logger');
} else {
  console.log('Using fallback console logger');
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check log level configuration
   - Verify environment variables
   - Check console output in tests

2. **Pino not working**
   - Ensure Pino is installed: `npm install pino`
   - Check for version conflicts
   - Verify import/require paths

3. **Level changes not working**
   - Clear module cache in tests
   - Check for multiple logger instances
   - Verify level validation

4. **Child logger issues**
   - Check bindings object format
   - Verify inheritance chain
   - Test fallback vs Pino behavior

### Debug Commands

```bash
# Check logger configuration
node -e "console.log(require('./utils/logger').logger.level)"

# Test logger functionality
node -e "
const { logger } = require('./utils/logger');
logger.info('Test message');
logger.warn('Test warning');
"

# Check environment variables
echo $EUDR_LOG_LEVEL
```

## 📊 Performance Considerations

### Fallback Logger
- Lightweight console-based implementation
- Minimal memory footprint
- Suitable for development and testing

### Pino Logger
- High-performance structured logging
- JSON output format
- Production-ready with proper configuration

### Best Practices
- Use appropriate log levels for production
- Avoid excessive logging in hot paths
- Use child loggers for contextual information
- Monitor log volume in production

## 🔗 Related Files

- `utils/logger.js` - Core logging implementation
- `tests/logger.test.js` - Comprehensive test suite
- `tests/run-tests.js` - Test runner ensuring correct order
- `tests/test-setup.js` - Test environment configuration
- `package.json` - Test scripts and dependencies

## 📝 Contributing

When modifying the logging system:

1. **Run logger tests first**: `npm run test:logger`
2. **Update tests** for new functionality
3. **Test both Pino and fallback modes**
4. **Verify environment variable handling**
5. **Check performance impact**
6. **Update this documentation**

## 🎯 Future Enhancements

- [ ] Structured logging in fallback mode
- [ ] Log rotation and file output
- [ ] Metrics and monitoring integration
- [ ] Custom transport support
- [ ] Performance profiling tools
