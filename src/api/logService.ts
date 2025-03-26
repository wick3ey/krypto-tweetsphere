
/**
 * Simple console logging helper for development
 */
const logService = {
  debug: (message, data, module = '') => {
    const modulePrefix = module ? `[${module}] ` : '';
    console.debug(`${modulePrefix}${message}`, data || '');
  },
  
  info: (message, data, module = '') => {
    const modulePrefix = module ? `[${module}] ` : '';
    console.info(`${modulePrefix}${message}`, data || '');
  },
  
  warn: (message, data, module = '') => {
    const modulePrefix = module ? `[${module}] ` : '';
    console.warn(`${modulePrefix}${message}`, data || '');
  },
  
  error: (message, data, module = '') => {
    const modulePrefix = module ? `[${module}] ` : '';
    console.error(`${modulePrefix}${message}`, data || '');
  }
};

export { logService };
