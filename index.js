require('dotenv').config();
const connectDB = require('./db');
const TelegramBot = require('node-telegram-bot-api');


connectDB()

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const cron = require('node-cron');
const runTinkerScan = require('./services/tinkerProcessor');
const User = require('./models/user');


// Every hour at minute 0 (e.g., 12:00, 1:00, 2:00...)
cron.schedule('0 * * * *', () => {
  runTinkerScan()
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const exists = await User.findOne({ chatId });
    if (!exists) {
      await User.create({ chatId });
    }

    bot.sendMessage(chatId, '👋🏽 Welcome to TinkerScout!\nYou’ll now receive hourly tinker updates.');
  } catch (err) {
    console.error('Error saving user:', err.message);
    bot.sendMessage(chatId, '❌ Error occurred. Try again later.');
  }
});