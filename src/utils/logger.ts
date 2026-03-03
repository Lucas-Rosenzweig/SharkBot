import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const rootLogger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    ...(isProduction
        ? {}
        : {
              transport: {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                  },
              },
          }),
});

/**
 * Creates a child logger scoped to a specific module.
 *
 * @example
 * const logger = createLogger('VoiceXP');
 * logger.info({ guildId }, 'Started tracking');
 */
export function createLogger(module: string) {
    return rootLogger.child({ module });
}

export default rootLogger;

