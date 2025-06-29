const axios = require('axios');
const Tinker = require('../models/Tinker');
const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/user');
const logger = require('../utils/logger');
require('dotenv').config();

// Telegram bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function runTinkerScan() {
  logger.info(`🚀 [${new Date().toISOString()}] Running tinker job`);

  try {
    const prompt = `
      You are a specialized crypto intelligence agent with real-time access to web trends, especially from:
- Twitter (Crypto Twitter influencers and threads)
- Alpha Telegram groups
- DEX launchpads (e.g., Pump.fun, DEXTools, Uniswap listings)

Your task is to identify and report on **up to 3 newly launched meme coins (called "tinkers")** that show high potential for virality, based on community hype and early market signals.

Each coin must:
- Be **recently launched** (preferably within the last 48 hours)
- Show clear signs of **hype** from credible sources (influencers, Telegram, early whales)
- Display early **viral momentum** (trending, active discussion, notable buys)

For each tinker, return a structured JSON object containing:
- "name": UPPERCASE name of the token
- "reason": A brief explanation of why it’s gaining traction
- "hypeLevel": One of "High", "Medium", or "Low" — based on observed buzz
- "riskLevel": One of "High", "Medium", or "Low" — based on volatility, anon devs, locked liquidity, etc.
- "source": The primary source where it was discovered (e.g., Twitter, Telegram, DEXTools)
- "Blockchain": The blockchain the token is on (e.g., Ethereum, BSC, Solana, Base)
- "foundAt": The timestamp (in ISO format) when the coin was first discovered
- "createdAt": The timestamp (in ISO format) when this report was generated

**Output Format:**
- Return a valid JSON array of 1 to 3 objects
- Do **not** include any introductory or extra text — return the raw JSON only
- Do **not** use markdown or code block formatting

**Example:**
[
  {
    "name": "MEMEX",
    "reason": "Launched today on Base. Mentioned by Pauly. Trending in CT.",
    "hypeLevel": "High",
    "riskLevel": "Medium",
    "source": "Twitter",
    "Blockchain": "Base",
    "foundAt": "2025-06-29T12:00:00Z",
    "createdAt": "2025-06-29T12:05:00Z"
  }
]

    `;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const rawReply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Remove any accidental code block markers, just in case
    const cleaned = rawReply.replace(/^```json|```$/gm, '').trim();

    let tinkers;
    try {
      tinkers = JSON.parse(cleaned);
      logger.info(`🧪 Gemini returned ${tinkers.length} potential tinkers`);
    } catch (e) {
      logger.error('❌ Failed to parse Gemini response:', e.message);
      logger.error(`👀 Raw response:\n${cleaned}`);
      return;
    }

    if (!Array.isArray(tinkers) || tinkers.length === 0) {
      logger.info('😐 No tinkers found by Gemini');
      return;
    }

    const users = await User.find();
    let newCount = 0;

    for (const t of tinkers) {
      const exists = await Tinker.findOne({ name: t.name });

      if (!exists) {
        const now = new Date();

        await Tinker.create({
          name: t.name,
          reason: t.reason,
          hypeLevel: t.hypeLevel,
          blockChain: t.Blockchain || 'Unknown',
          riskLevel: t.riskLevel,
          source: t.source || 'Unknown',
          Blockchain: t.Blockchain || 'Unknown',
          foundAt: t.foundAt ? new Date(t.foundAt) : now,
          createdAt: t.createdAt ? new Date(t.createdAt) : now,
        });

        const message = `🚀 *${t.name}*\n\n🧠 ${t.reason}\n🔥 Hype: ${t.hypeLevel}\n⚠️ Risk: ${t.riskLevel}\n🌐 Source: ${t.source}\n🧬 Chain: ${t.Blockchain}`;

        for (const user of users) {
          await bot.sendMessage(user.chatId, message, { parse_mode: 'Markdown' });
        }

        newCount++;
      }
    }

    if (newCount === 0) {
      for (const user of users) {
        await bot.sendMessage(user.chatId, '🤖 No *new* tinkers found in this run.', { parse_mode: 'Markdown' });
      }
    }

  } catch (err) {
    logger.error(`❌ Error running tinker job: ${err.message}`);
  }
}

module.exports = runTinkerScan;
