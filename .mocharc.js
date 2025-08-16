module.exports = {
  // Test file patterns
  spec: ['tests/**/*.test.js'],
  
  // Test timeout (30 seconds for API calls)
  timeout: 30000,
  
  // Reporter configuration
  reporter: 'spec',
  
  // Color output
  colors: true,
  
  // Show full stack traces
  'full-trace': true,
  
  // Require test setup
  require: ['tests/test-setup.js'],
  
  // Test environment
  env: 'node',
  
  // Async test handling
  'async-only': false,
  
  // Bail on first failure (useful for CI)
  bail: false,
  
  // Ignore certain patterns
  ignore: ['node_modules/**', 'dist/**', 'build/**'],
  
  // Watch mode settings
  watch: false,
  'watch-files': ['tests/**/*.js', 'services/**/*.js', 'utils/**/*.js'],
  
  // Exit after tests complete
  exit: true,
  
  // Recursive test discovery
  recursive: true,
  
  // Show pending tests
  'report-pending': true,
  
  // Show slow tests
  'slow': 1000,
  
  // Show test duration
  'reporter-option': {
    'show-diff': true,
    'verbose': true
  }
};
