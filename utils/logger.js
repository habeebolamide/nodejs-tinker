const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new transports.File({ filename: path.join(__dirname, '../logs/combined.log') })
  ]
});

// Only log to console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

module.exports = logger;
