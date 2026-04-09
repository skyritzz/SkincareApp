const isDev = __DEV__;

const formatMessage = (level: string, component: string, message: string) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return `[${timestamp}] [${level}] ${component}: ${message}`;
};

export const logger = {
  debug: (component: string, message: string, ...args: any[]) => {
    if (isDev) console.debug(formatMessage('DEBUG', component, message), ...args);
  },
  info: (component: string, message: string, ...args: any[]) => {
    if (isDev) console.info(formatMessage('INFO', component, message), ...args);
  },
  warn: (component: string, message: string, ...args: any[]) => {
    console.warn(formatMessage('WARN', component, message), ...args);
  },
  error: (component: string, message: string, ...args: any[]) => {
    console.error(formatMessage('ERROR', component, message), ...args);
  }
};