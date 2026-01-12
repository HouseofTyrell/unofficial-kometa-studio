import pino from 'pino';

// Patterns that indicate sensitive data
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'apiKey',
  'authorization',
  'cookie',
  'credential',
  'private',
  'master_key',
  'masterKey',
  'client_secret',
  'clientSecret',
];

// Values that look like secrets (base64, hex, JWT)
const SECRET_PATTERNS = [
  /^[A-Za-z0-9+/]{32,}={0,2}$/, // Base64
  /^[a-f0-9]{32,}$/i, // Hex
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, // JWT
];

/**
 * Redact sensitive values from objects before logging
 */
function redactSecrets(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if the string looks like a secret
    if (SECRET_PATTERNS.some((pattern) => pattern.test(obj))) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key indicates sensitive data
      if (SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSecrets(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

// Get log level from environment
const LOG_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create the base logger
const baseLogger = pino({
  level: LOG_LEVEL,
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

/**
 * Application logger with secret redaction
 */
export const logger = {
  /**
   * Log debug information (only in development)
   */
  debug: (msg: string, obj?: Record<string, unknown>) => {
    if (obj) {
      baseLogger.debug(redactSecrets(obj), msg);
    } else {
      baseLogger.debug(msg);
    }
  },

  /**
   * Log general information
   */
  info: (msg: string, obj?: Record<string, unknown>) => {
    if (obj) {
      baseLogger.info(redactSecrets(obj), msg);
    } else {
      baseLogger.info(msg);
    }
  },

  /**
   * Log warnings
   */
  warn: (msg: string, obj?: Record<string, unknown>) => {
    if (obj) {
      baseLogger.warn(redactSecrets(obj), msg);
    } else {
      baseLogger.warn(msg);
    }
  },

  /**
   * Log errors
   */
  error: (msg: string, error?: Error | Record<string, unknown>) => {
    if (error instanceof Error) {
      baseLogger.error(
        {
          error: {
            message: error.message,
            name: error.name,
            // Redact stack trace in production to prevent secret leakage
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
          },
        },
        msg
      );
    } else if (error) {
      baseLogger.error(redactSecrets(error), msg);
    } else {
      baseLogger.error(msg);
    }
  },

  /**
   * Log fatal errors (before crash)
   */
  fatal: (msg: string, error?: Error | Record<string, unknown>) => {
    if (error instanceof Error) {
      baseLogger.fatal(
        {
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        },
        msg
      );
    } else if (error) {
      baseLogger.fatal(redactSecrets(error), msg);
    } else {
      baseLogger.fatal(msg);
    }
  },
};

/**
 * Get Pino options for Fastify
 * This configures Fastify's built-in request logging
 */
export function getFastifyLoggerOptions() {
  return {
    level: LOG_LEVEL,
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    // Redact sensitive headers from request logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.headers["x-plex-token"]',
      ],
      censor: '[REDACTED]',
    },
  };
}

export default logger;
