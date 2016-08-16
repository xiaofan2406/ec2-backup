const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

const MonthlyLogger = new (winston.Logger)({
  transports: [
    new (DailyRotateFile)({
      datePattern: 'HH-mm',
      filename: path.join(__dirname, '../logs/schedule.log'),
      json: false,
      timestamp() {
        return new Date();
      },
      formatter(options) {
        return `[${options.timestamp()}] ${options.message}`;
      }
    })
  ]
});

module.exports = MonthlyLogger;
