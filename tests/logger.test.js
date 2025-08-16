/**
 * EUDR API Client Logger Tests
 * 
 * This test suite validates the logging system functionality before running
 * all other tests. It ensures that logging configuration, fallback mechanisms,
 * and all log levels work correctly.
 * 
 * Test Categories:
 * - Basic Logger Functionality
 * - Pino Logger Integration (when available)
 * - Fallback Logger (when pino unavailable)
 * - Configuration Options
 * - Child Logger Creation
 * - Log Level Management
 * - Edge Cases and Error Handling
 */

const { expect } = require('chai');
const path = require('path');

// Mock console methods to capture output during tests
let consoleOutput = [];
let originalConsoleLog, originalConsoleWarn, originalConsoleError;

describe('🔧 EUDR API Client Logger System Tests', function() {
  let loggerModule;
  let originalPino;

  before(function() {
    // Store original console methods
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    
    // Mock console methods to capture output
    console.log = function(...args) {
      consoleOutput.push({ level: 'log', args });
    };
    console.warn = function(...args) {
      consoleOutput.push({ level: 'warn', args });
    };
    console.error = function(...args) {
      consoleOutput.push({ level: 'error', args });
    };
    
    // Clear output buffer
    consoleOutput = [];
  });

  after(function() {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  beforeEach(function() {
    // Clear output buffer before each test
    consoleOutput = [];
    
    // Clear module cache to ensure fresh logger instances
    delete require.cache[require.resolve('../utils/logger')];
  });

  describe('📦 Module Loading & Dependencies', function() {
    it('should load logger module without errors', function() {
      expect(() => {
        loggerModule = require('../utils/logger');
      }).to.not.throw();
      
      expect(loggerModule).to.have.property('logger');
      expect(loggerModule).to.have.property('createLogger');
      expect(loggerModule).to.have.property('createChildLogger');
    });

    it('should export expected functions', function() {
      expect(loggerModule.createLogger).to.be.a('function');
      expect(loggerModule.createChildLogger).to.be.a('function');
      expect(loggerModule.logger).to.be.an('object');
    });
  });

  describe('🔧 Default Logger Instance', function() {
    it('should create default logger with correct properties', function() {
      const { logger } = loggerModule;
      
      expect(logger).to.be.an('object');
      expect(logger).to.have.property('trace');
      expect(logger).to.have.property('debug');
      expect(logger).to.have.property('info');
      expect(logger).to.have.property('warn');
      expect(logger).to.have.property('error');
      expect(logger).to.have.property('fatal');
      expect(logger).to.have.property('child');
      expect(logger).to.have.property('level');
    });

    it('should have default level set to warn', function() {
      const { logger } = loggerModule;
      expect(logger.level).to.equal('warn');
    });

    it('should have all log methods as functions', function() {
      const { logger } = loggerModule;
      
      ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(level => {
        expect(logger[level]).to.be.a('function');
      });
    });
  });

  describe('⚙️ Logger Configuration', function() {
    it('should create logger with custom options', function() {
      const customLogger = loggerModule.createLogger({
        level: 'debug',
        name: 'custom-test-logger'
      });
      
      expect(customLogger).to.be.an('object');
      expect(customLogger.level).to.equal('debug');
    });

    it('should merge custom options with defaults', function() {
      const customLogger = loggerModule.createLogger({
        level: 'trace'
      });
      
      expect(customLogger).to.be.an('object');
      expect(customLogger.level).to.equal('trace');
    });

    it('should handle empty options gracefully', function() {
      const logger = loggerModule.createLogger();
      expect(logger).to.be.an('object');
      expect(logger.level).to.equal('warn'); // Default level
    });
  });

  describe('📝 Log Level Functionality', function() {
    let testLogger;

    beforeEach(function() {
      testLogger = loggerModule.createLogger({ level: 'trace' });
    });

    it('should log at trace level when level is trace', function() {
      testLogger.trace('Test trace message');
      
      // In fallback mode, this should appear in console output
      if (!testLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].level).to.equal('log');
        expect(consoleOutput[0].args[0]).to.include('Test trace message');
      }
    });

    it('should log at debug level when level is debug or lower', function() {
      testLogger.debug('Test debug message');
      
      if (!testLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].level).to.equal('log');
        expect(consoleOutput[0].args[0]).to.include('Test debug message');
      }
    });

    it('should log at info level when level is info or lower', function() {
      testLogger.info('Test info message');
      
      if (!testLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].level).to.equal('log');
        expect(consoleOutput[0].args[0]).to.include('Test info message');
      }
    });

    it('should log at warn level when level is warn or lower', function() {
      testLogger.warn('Test warn message');
      
      if (!testLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].level).to.equal('warn');
        expect(consoleOutput[0].args[0]).to.include('Test warn message');
      }
    });

    it('should log at error level when level is error or lower', function() {
      testLogger.error('Test error message');
      
      if (!testLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].level).to.equal('error');
        expect(consoleOutput[0].args[0]).to.include('Test error message');
      }
    });

    it('should log at fatal level when level is fatal or lower', function() {
      testLogger.fatal('Test fatal message');
      
      if (!testLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].level).to.equal('error');
        expect(consoleOutput[0].args[0]).to.include('Test fatal message');
      }
    });
  });

  describe('🔒 Log Level Filtering', function() {
    it('should filter logs based on set level', function() {
      const debugLogger = loggerModule.createLogger({ level: 'debug' });
      
      // Clear output
      consoleOutput = [];
      
      debugLogger.trace('This should not appear');
      debugLogger.debug('This should appear');
      debugLogger.info('This should appear');
      
      if (!debugLogger._isPino) {
        expect(consoleOutput).to.have.length(2);
        expect(consoleOutput[0].args[0]).to.include('This should appear');
        expect(consoleOutput[1].args[0]).to.include('This should appear');
      }
    });

    it('should filter logs at warn level', function() {
      const warnLogger = loggerModule.createLogger({ level: 'warn' });
      
      // Clear output
      consoleOutput = [];
      
      warnLogger.debug('This should not appear');
      warnLogger.info('This should not appear');
      warnLogger.warn('This should appear');
      warnLogger.error('This should appear');
      
      if (!warnLogger._isPino) {
        expect(consoleOutput).to.have.length(2);
        expect(consoleOutput[0].args[0]).to.include('This should appear');
        expect(consoleOutput[1].args[0]).to.include('This should appear');
      }
    });

    it('should filter logs at error level', function() {
      const errorLogger = loggerModule.createLogger({ level: 'error' });
      
      // Clear output
      consoleOutput = [];
      
      errorLogger.debug('This should not appear');
      errorLogger.info('This should not appear');
      errorLogger.warn('This should not appear');
      errorLogger.error('This should appear');
      
      if (!errorLogger._isPino) {
        expect(consoleOutput).to.have.length(1);
        expect(consoleOutput[0].args[0]).to.include('This should appear');
      }
    });
  });

  describe('👶 Child Logger Creation', function() {
    it('should create child logger with bindings', function() {
      const childLogger = loggerModule.createChildLogger({
        service: 'test-service',
        requestId: 'test-123'
      });
      
      expect(childLogger).to.be.an('object');
      expect(childLogger).to.have.property('trace');
      expect(childLogger).to.have.property('debug');
      expect(childLogger).to.have.property('info');
      expect(childLogger).to.have.property('warn');
      expect(childLogger).to.have.property('error');
      expect(childLogger).to.have.property('fatal');
    });

    it('should create child logger without bindings', function() {
      const childLogger = loggerModule.createChildLogger();
      
      expect(childLogger).to.be.an('object');
      expect(childLogger).to.have.property('trace');
      expect(childLogger).to.have.property('debug');
      expect(childLogger).to.have.property('info');
      expect(childLogger).to.have.property('warn');
      expect(childLogger).to.have.property('error');
      expect(childLogger).to.have.property('fatal');
    });

    it('should maintain log level in child logger', function() {
      const parentLogger = loggerModule.createLogger({ level: 'debug' });
      const childLogger = parentLogger.child({ service: 'test' });
      
      expect(childLogger.level).to.equal('debug');
    });
  });

  describe('🔄 Level Setting & Getting', function() {
    it('should allow setting log level', function() {
      const testLogger = loggerModule.createLogger({ level: 'info' });
      
      testLogger.level = 'debug';
      expect(testLogger.level).to.equal('debug');
    });

    it('should allow getting current log level', function() {
      const testLogger = loggerModule.createLogger({ level: 'error' });
      
      expect(testLogger.level).to.equal('error');
    });

    it('should persist level changes', function() {
      const testLogger = loggerModule.createLogger({ level: 'warn' });
      
      testLogger.level = 'trace';
      expect(testLogger.level).to.equal('trace');
      
      // Change again
      testLogger.level = 'info';
      expect(testLogger.level).to.equal('info');
    });
  });

  describe('🚨 Error Handling & Edge Cases', function() {
    it('should handle invalid log levels gracefully', function() {
      const testLogger = loggerModule.createLogger();
      
      // Should not throw when setting invalid level
      // Pino logger might throw, fallback logger should handle gracefully
      if (testLogger._isPino) {
        // Pino logger might throw for invalid levels
        try {
          testLogger.level = 'invalid-level';
          // If it doesn't throw, that's fine too
        } catch (error) {
          // Pino threw an error, which is expected behavior
          expect(error.message).to.include('unknown level');
        }
      } else {
        // Fallback logger should handle invalid levels gracefully
        expect(() => {
          testLogger.level = 'invalid-level';
        }).to.not.throw();
        
        // Should fall back to default level
        expect(testLogger.level).to.equal('warn');
      }
    });

    it('should handle missing pino dependency gracefully', function() {
      // This test verifies the fallback mechanism works
      // The logger should still function even without pino
      const testLogger = loggerModule.createLogger();
      
      expect(testLogger).to.be.an('object');
      expect(testLogger.trace).to.be.a('function');
      expect(testLogger.debug).to.be.a('function');
      expect(testLogger.info).to.be.a('function');
      expect(testLogger.warn).to.be.a('function');
      expect(testLogger.error).to.be.a('function');
      expect(testLogger.fatal).to.be.a('function');
    });

    it('should handle null/undefined arguments in log methods', function() {
      const testLogger = loggerModule.createLogger({ level: 'trace' });
      
      expect(() => {
        testLogger.info(null);
        testLogger.info(undefined);
        testLogger.info('');
      }).to.not.throw();
    });
  });

  describe('🔍 Pino Integration (when available)', function() {
    it('should detect pino availability', function() {
      // This test checks if pino is available in the environment
      const pinoAvailable = typeof require('pino') !== 'undefined';
      
      if (pinoAvailable) {
        console.log('✅ Pino is available - testing pino logger functionality');
        
        const pinoLogger = loggerModule.createLogger({ level: 'debug' });
        expect(pinoLogger).to.be.an('object');
        expect(pinoLogger.level).to.equal('debug');
      } else {
        console.log('ℹ️ Pino not available - testing fallback logger functionality');
      }
    });

    it('should use pino when available', function() {
      try {
        const pino = require('pino');
        if (pino) {
          const pinoLogger = loggerModule.createLogger({ level: 'info' });
          expect(pinoLogger.level).to.equal('info');
        }
      } catch (error) {
        // Pino not available, skip this test
        this.skip();
      }
    });
  });

  // describe('📊 Performance & Memory', function() {
  //   it('should handle rapid log calls without errors', function() {
  //     const testLogger = loggerModule.createLogger({ level: 'trace' });
      
  //     expect(() => {
  //       for (let i = 0; i < 100; i++) {
  //         testLogger.info(`Performance test message ${i}`);
  //       }
  //     }).to.not.throw();
  //   });

  //   it('should create multiple loggers without conflicts', function() {
  //     const loggers = [];
      
  //     expect(() => {
  //       for (let i = 0; i < 10; i++) {
  //         const logger = loggerModule.createLogger({
  //           level: 'info',
  //           name: `test-logger-${i}`
  //         });
  //         loggers.push(logger);
  //       }
  //     }).to.not.throw();
      
  //     expect(loggers).to.have.length(10);
  //     loggers.forEach(logger => {
  //       expect(logger).to.be.an('object');
  //       expect(logger.level).to.equal('info');
  //     });
  //   });
  // });

  describe('🌍 Environment Integration', function() {
    it('should respect EUDR_LOG_LEVEL environment variable', function() {
      const originalEnv = process.env.EUDR_LOG_LEVEL;
      
      try {
        // Test different log levels
        const testLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
        
        testLevels.forEach(level => {
          process.env.EUDR_LOG_LEVEL = level;
          
          // Clear module cache to get fresh logger
          delete require.cache[require.resolve('../utils/logger')];
          const freshLoggerModule = require('../utils/logger');
          
          expect(freshLoggerModule.logger.level).to.equal(level);
        });
      } finally {
        // Restore original environment
        if (originalEnv) {
          process.env.EUDR_LOG_LEVEL = originalEnv;
        } else {
          delete process.env.EUDR_LOG_LEVEL;
        }
        
        // Clear module cache again
        delete require.cache[require.resolve('../utils/logger')];
      }
    });

    it('should handle missing EUDR_LOG_LEVEL gracefully', function() {
      const originalEnv = process.env.EUDR_LOG_LEVEL;
      
      try {
        delete process.env.EUDR_LOG_LEVEL;
        
        // Clear module cache to get fresh logger
        delete require.cache[require.resolve('../utils/logger')];
        const freshLoggerModule = require('../utils/logger');
        
        expect(freshLoggerModule.logger.level).to.equal('warn'); // Default level
      } finally {
        // Restore original environment
        if (originalEnv) {
          process.env.EUDR_LOG_LEVEL = originalEnv;
        }
        
        // Clear module cache again
        delete require.cache[require.resolve('../utils/logger')];
      }
    });
  });

  describe('✅ Integration with Services', function() {
    it('should provide logger to services without errors', function() {
      const { logger } = loggerModule;
      
      // Simulate service usage
      expect(() => {
        logger.info('Service initialization started');
        logger.debug('Loading configuration');
        logger.warn('Deprecated feature used');
        logger.error('Connection failed');
        logger.info('Service initialization completed');
      }).to.not.throw();
    });

    it('should maintain log level across service operations', function() {
      const serviceLogger = loggerModule.createLogger({ level: 'debug' });
      
      expect(serviceLogger.level).to.equal('debug');
      
      // Simulate service operations
      serviceLogger.debug('Starting operation');
      serviceLogger.info('Operation in progress');
      serviceLogger.debug('Operation details');
      serviceLogger.info('Operation completed');
      
      expect(serviceLogger.level).to.equal('debug');
    });
  });
});
