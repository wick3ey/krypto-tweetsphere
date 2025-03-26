
import apiClient from './apiClient';

/**
 * Service för att hantera detaljerad serverloggning från frontend
 */
export const logService = {
  /**
   * Skicka loggmeddelande till servern
   * @param level Loggnivå: debug, info, warn, error
   * @param message Huvudmeddelande
   * @param data Extra data att logga
   * @param context Kontext för loggen (t.ex. komponentnamn)
   */
  log: async (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    context?: string
  ) => {
    try {
      // Skapa ett komplett loggobjekt
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        // Lägg till walletAddress om användaren är inloggad
        walletAddress: localStorage.getItem('wallet_address') || undefined,
        // Generera en unik session-ID om den inte redan finns
        sessionId: localStorage.getItem('debug_session_id') || generateSessionId()
      };
      
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
      
      // Spara session-ID
      if (!localStorage.getItem('debug_session_id')) {
        localStorage.setItem('debug_session_id', logEntry.sessionId as string);
      }
      
      // Skicka till servern asynkront
      await apiClient.post('https://f3oci3ty.xyz/api/logs', logEntry);
      
      return true;
    } catch (error) {
      // Undvik oändlig loop genom att använda console.error direkt här
      console.error('Error sending log to server:', error);
      return false;
    }
  },

  /**
   * Debug-nivå loggning
   */
  debug: (message: string, data?: any, context?: string) => {
    return logService.log('debug', message, data, context);
  },

  /**
   * Info-nivå loggning
   */
  info: (message: string, data?: any, context?: string) => {
    return logService.log('info', message, data, context);
  },

  /**
   * Warn-nivå loggning
   */
  warn: (message: string, data?: any, context?: string) => {
    return logService.log('warn', message, data, context);
  },

  /**
   * Error-nivå loggning
   */
  error: (message: string, data?: any, context?: string) => {
    return logService.log('error', message, data, context);
  },
  
  /**
   * Skicka en diagnostikrapport med systeminformation och felhistorik
   */
  sendDiagnosticReport: async () => {
    try {
      // Samla systemdata
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
        // Samla eventuella localStorage-nycklar (ej värden) för debugging
        localStorageKeys: Object.keys(localStorage)
      };
      
      await apiClient.post('https://f3oci3ty.xyz/api/logs/diagnostic', diagnosticData);
      console.info('Diagnostic data sent to server');
      return true;
    } catch (error) {
      console.error('Error sending diagnostic data:', error);
      return false;
    }
  }
};

/**
 * Generera en unik session-ID för att spåra användarsessioner
 */
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15);
}

/**
 * Wrapper för enkel anslutning till befintlig kod för monitorering
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

