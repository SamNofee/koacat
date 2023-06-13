import { createLogger, Logger, LoggerOptions } from 'winston'

export class Winston {
  static level: string
  static logger: Logger
  static isInit = false

  static init(loggerOptions: LoggerOptions) {
    if (Winston.isInit) return

    Winston.level = loggerOptions?.level || 'debug'
    Winston.logger = createLogger(loggerOptions)
    Winston.isInit = true
  }
}

export function WARN(message: string) {
  Winston.logger.warn(message)
}

export function ERROR(message: string) {
 Winston.logger.error(message)
}

export function LOG(message: string) {
  Winston.logger.debug(message)
}