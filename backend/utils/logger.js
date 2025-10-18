// utils/logger.js
const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${getTimestamp()} - ${message}`, Object.keys(meta).length ? meta : '');
  },
  
  error: (message, error = null, meta = {}) => {
    const logData = {
      ...meta,
      errorMessage: error?.message,
      errorStack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    };
    console.error(`[ERROR] ${getTimestamp()} - ${message}`, logData);
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${getTimestamp()} - ${message}`, Object.keys(meta).length ? meta : '');
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${getTimestamp()} - ${message}`, Object.keys(meta).length ? meta : '');
    }
  }
};