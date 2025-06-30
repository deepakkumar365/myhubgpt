// Performance configuration settings

export const PERFORMANCE_CONFIG = {
  // Chat API settings
  MAX_STEPS: 3, // Reduced from 5 for faster responses
  MAX_TOKENS: 2048, // Limit response length
  TEMPERATURE: 0.7, // Balance between speed and creativity
  
  // Streaming settings
  CHUNKING_MODE: 'line' as const, // 'word' | 'line' | 'sentence'
  STREAM_DELAY_MS: 0, // Remove artificial delays
  
  // Request management
  MAX_CONCURRENT_REQUESTS: 3,
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  
  // Caching settings
  CACHE_TTL_MS: 60000, // 1 minute
  MAX_CACHE_SIZE: 100,
  
  // Database optimization
  ENABLE_PARALLEL_DB_OPS: true,
  DB_BATCH_SIZE: 5,
  
  // Tool optimization
  ENABLE_SMART_TOOL_SELECTION: true,
  DEFAULT_TOOLS: [
    'getContainers', 
    'getShipments', 
    'getBookings', 
    'getOrders',
    'getDocuments',
    'getInvoices', 
    'getTasks',
    'getComments',
    'getExceptions',
    'getJobrouts',
    'getBrokerages'
  ], // All logistics tools available
  
  // Performance monitoring
  ENABLE_PERFORMANCE_LOGGING: process.env.NODE_ENV === 'development',
  LOG_SLOW_OPERATIONS_MS: 1000, // Log operations slower than 1 second
} as const;

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  Object.assign(PERFORMANCE_CONFIG, {
    ENABLE_PERFORMANCE_LOGGING: false,
    MAX_CONCURRENT_REQUESTS: 5, // Higher concurrency in production
    CACHE_TTL_MS: 300000, // 5 minutes cache in production
  });
}

export type PerformanceConfig = typeof PERFORMANCE_CONFIG;