import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss.l',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.secret',
      '*.key',
      '*.email',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

export const logRequest = (req: Request, res: Response | null, duration: number) => {
  const level = res && res.status >= 400 ? 'error' : 'info';
  
  logger[level]({
    type: 'request',
    method: req.method,
    url: req.url,
    status: res?.status,
    duration,
    userAgent: req.headers.get('user-agent'),
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

export const logSecurity = (event: string, details?: Record<string, any>) => {
  logger.warn({
    type: 'security',
    event,
    ...details,
  });
};

export const logDatabase = (operation: string, details?: Record<string, any>) => {
  logger.debug({
    type: 'database',
    operation,
    ...details,
  });
};

export const logPerformance = (operation: string, duration: number, details?: Record<string, any>) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  
  logger[level]({
    type: 'performance',
    operation,
    duration,
    ...details,
  });
};