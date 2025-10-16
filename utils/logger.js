/**
 * Logger Utility - Conditional logging based on environment
 * 
 * W produkcji debug logi są wyłączone.
 * W development wszystkie logi działają normalnie.
 * 
 * Usage:
 *   import { logger } from '../utils/logger';
 *   
 *   logger.debug('🔍 DEBUG:', data);
 *   logger.info('ℹ️ INFO:', message);
 *   logger.warn('⚠️ WARNING:', error);
 *   logger.error('❌ ERROR:', error);
 *   logger.success('✅ SUCCESS:', result);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logs - tylko w development
   * Używaj do szczegółowych informacji diagnostycznych
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info logs - zawsze wyświetlane
   * Używaj do ważnych informacji o działaniu systemu
   */
  info: (...args) => {
    console.info(...args);
  },

  /**
   * Warning logs - zawsze wyświetlane
   * Używaj do ostrzeżeń i potencjalnych problemów
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Error logs - zawsze wyświetlane
   * Używaj do błędów i wyjątków
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Success logs - tylko w development
   * Używaj do potwierdzenia pomyślnych operacji
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Table - tylko w development
   * Używaj do wyświetlania danych w formie tabeli
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Group - tylko w development
   * Używaj do grupowania powiązanych logów
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Time tracking - tylko w development
   * Używaj do mierzenia czasu wykonania operacji
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

/**
 * API Logger - specjalnie dla API endpoints
 * Zawsze loguje do konsoli serwera, ale z ładnym formatowaniem
 */
export const apiLogger = {
  request: (method, endpoint, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📥 [${timestamp}] ${method} ${endpoint}`);
    if (data && isDevelopment) {
      console.log('   Body:', JSON.stringify(data, null, 2));
    }
  },

  response: (endpoint, status, data = null) => {
    const timestamp = new Date().toISOString();
    const icon = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(`${icon} [${timestamp}] ${endpoint} - Status: ${status}`);
    if (data && isDevelopment) {
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  },

  error: (endpoint, error) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] ${endpoint} - ERROR:`);
    console.error(error);
  },
};

export default logger;
