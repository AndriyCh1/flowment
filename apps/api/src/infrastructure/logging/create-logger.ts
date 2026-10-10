import { ConsoleLogger } from '@nestjs/common';
import { appConfig } from '../../config/app.config';

/**
 * The process-wide logger. Production writes one JSON object per line for log
 * shippers; other environments get colored, human-readable output.
 */
export function createLogger(): ConsoleLogger {
  return new ConsoleLogger({
    json: appConfig.isProduction,
    colors: !appConfig.isProduction,
    logLevels: appConfig.logLevels,
  });
}
