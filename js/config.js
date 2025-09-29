// API Configuration
const CONFIG = {
  // Railway backend URL (update this with your actual Railway URL)
  API_BASE_URL: 'https://teen-crm-backend-production-xxxx.up.railway.app/api',
  
  // Alternative for local development
  // API_BASE_URL: 'http://localhost:3001/api',
  
  // Local development
  // API_BASE_URL: 'http://localhost:3001/api',
  
  // Authentication
  TOKEN_STORAGE_KEY: 'teen_crm_token',
  REFRESH_TOKEN_KEY: 'teen_crm_refresh_token',
  
  // Features
  ENABLE_OFFLINE_MODE: false, // Set to false when using backend
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // File uploads (if implemented)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Business rules
  PAYOUT_AMOUNTS: {
    WON: 9,
    LIVE: 7
  }
};

// Export for use in other files
window.CONFIG = CONFIG;