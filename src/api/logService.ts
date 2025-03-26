
/**
 * Simple console logging helper for development
 */
const logService = {
  debug: (message, data) => {
    console.debug(message, data || '');
  },
  
  info: (message, data) => {
    console.info(message, data || '');
  },
  
  warn: (message, data) => {
    console.warn(message, data || '');
  },
  
  error: (message, data) => {
    console.error(message, data || '');
  }
};

export { logService };
