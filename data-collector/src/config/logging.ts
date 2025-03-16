import { format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export const loggingConfig = {
  level: 'info', // Set the default log level
  format: format.combine(
    format.colorize(), // Colorize the logs in the console
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp to logs
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
    // Rotating file transport
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, // Compress old log files
      maxSize: '20m', // Maximum size of log file (20MB)
      maxFiles: '14d' // Keep logs for 14 days
    })
  ],
}