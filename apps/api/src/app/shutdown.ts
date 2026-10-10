import { Logger } from '@nestjs/common';
import { appConfig } from '../config/app.config';

const logger = new Logger('Lifecycle');

export function registerProcessHandlers(): void {
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      logger.log(`${signal} received, shutting down`);
      // If a hook hangs (stuck connection, slow request), exit anyway so the
      // orchestrator is not left waiting. unref() keeps it from holding the loop.
      setTimeout(() => {
        logger.error(
          `Shutdown did not finish within ${appConfig.shutdownTimeoutMs}ms, forcing exit`,
        );
        process.exit(1);
      }, appConfig.shutdownTimeoutMs).unref();
    });
  }

  process.on('unhandledRejection', (reason) => {
    logger.error(
      'Unhandled promise rejection',
      reason instanceof Error ? reason.stack : String(reason),
    );
  });

  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception', error.stack);
    process.exit(1);
  });
}
