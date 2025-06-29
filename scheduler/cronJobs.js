const cron = require('node-cron');
const tinkerProcessor = require('../services/tinkerProcessor');
const log = require('../utils/logger');

module.exports = function () {
  // Every hour
  cron.schedule('0 * * * *', async () => {
    log('🕐 Hourly tinker scan started...');
    await tinkerProcessor();
  });
};
