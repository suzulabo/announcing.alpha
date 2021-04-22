import { logger as fnLogger } from 'firebase-functions';

export const logger = {
  debug: (msg: string, v?: any) => {
    fnLogger.debug(msg, v);
  },
  info: (msg: string, v?: any) => {
    fnLogger.info(msg, v);
  },
  warn: (msg: string, v?: any) => {
    fnLogger.warn(msg, v);
  },
  error: (msg: string, v?: any) => {
    fnLogger.error(msg, v);
  },
};
