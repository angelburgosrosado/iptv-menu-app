type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(severity: LogLevel, message: string, payload: Record<string, any> = {}) {
    const logEntry = {
      severity,
      message: `[${this.serviceName}] ${message}`,
      serviceContext: {
        service: this.serviceName,
      },
      ...payload,
      timestamp: new Date().toISOString(),
    };

    // Google Cloud Run automatically parses structured JSON logs written to stdout/stderr
    if (severity === 'ERROR') {
      console.error(JSON.stringify(logEntry));
    } else if (severity === 'WARNING') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, payload?: Record<string, any>) {
    this.log('INFO', message, payload);
  }

  warn(message: string, payload?: Record<string, any>) {
    this.log('WARNING', message, payload);
  }

  error(message: string, error?: any, payload: Record<string, any> = {}) {
    const errorDetails = error instanceof Error 
      ? { name: error.name, stack: error.stack, errorMessage: error.message }
      : { rawError: error };

    this.log('ERROR', message, { ...payload, ...errorDetails });
  }

  debug(message: string, payload?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, payload);
    }
  }
}

export const logger = new Logger('iptv-system');
