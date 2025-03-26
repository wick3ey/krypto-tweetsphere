
import apiClient from './apiClient';

/**
 * Service for handling detailed server logging from frontend
 */
export const logService = {
  /**
   * Send log message to the server or fallback to console logging
   * @param level Log level: debug, info, warn, error
   * @param message Main message
   * @param data Extra data to log
   * @param context Context for the log (e.g. component name)
   */
  log: async (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    context?: string
  ) => {
    try {
      // Create a complete log object
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        // Add walletAddress if user is logged in
        walletAddress: localStorage.getItem('wallet_address') || undefined,
        // Generate a unique session ID if it doesn't already exist
        sessionId: localStorage.getItem('debug_session_id') || generateSessionId()
      };
      
      // Always log to console first (for development and as fallback)
      console.log(`[${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}`, data || '');
      
      // Save session ID
      if (!localStorage.getItem('debug_session_id')) {
        localStorage.setItem('debug_session_id', logEntry.sessionId as string);
      }
      
      // Try to send to server - using a known endpoint that exists on the backend
      // Instead of /api/logs which doesn't exist
      await apiClient.post('https://f3oci3ty.xyz/api/auth/signMessage', {
        type: 'clientLog',
        logData: logEntry
      });
      
      return true;
    } catch (error) {
      // Avoid infinite loop by using console.error directly here
      console.error('Error sending log to server:', error);
      return false;
    }
  },

  /**
   * Debug-level logging
   */
  debug: (message: string, data?: any, context?: string) => {
    return logService.log('debug', message, data, context);
  },

  /**
   * Info-level logging
   */
  info: (message: string, data?: any, context?: string) => {
    return logService.log('info', message, data, context);
  },

  /**
   * Warn-level logging
   */
  warn: (message: string, data?: any, context?: string) => {
    return logService.log('warn', message, data, context);
  },

  /**
   * Error-level logging
   */
  error: (message: string, data?: any, context?: string) => {
    return logService.log('error', message, data, context);
  },
  
  /**
   * Send a diagnostic report with system information and error history
   */
  sendDiagnosticReport: async () => {
    try {
      // Collect system data
      const diagnosticData = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        },
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: localStorage.getItem('debug_session_id'),
        walletAddress: localStorage.getItem('wallet_address'),
        // Collect any localStorage keys (not values) for debugging
        localStorageKeys: Object.keys(localStorage)
      };
      
      // Use the same endpoint as above for consistency
      await apiClient.post('https://f3oci3ty.xyz/api/auth/signMessage', {
        type: 'diagnosticData',
        diagnosticData
      });
      
      console.info('Diagnostic data sent to server');
      return true;
    } catch (error) {
      console.error('Error sending diagnostic data:', error);
      return false;
    }
  }
};

/**
 * Generate a unique session ID to track user sessions
 */
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15);
}

/**
 * Wrapper for easy connection to existing code for monitoring
 */
export const monitorApiCall = async (
  apiCallFn: (...args: any[]) => Promise<any>,
  context: string, 
  description: string,
  ...args: any[]
) => {
  const startTime = Date.now();
  try {
    logService.debug(`API Call starting: ${description}`, { args }, context);
    const result = await apiCallFn(...args);
    
    const duration = Date.now() - startTime;
    logService.debug(
      `API Call completed: ${description}`, 
      { duration: `${duration}ms`, status: 'success', result },
      context
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logService.error(
      `API Call failed: ${description}`, 
      { duration: `${duration}ms`, status: 'error', error },
      context
    );
    throw error;
  }
};
