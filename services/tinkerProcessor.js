const axios = require('axios');
const Tinker = require('../models/Tinker');
const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/user');
const logger = require('../utils/logger');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function runTinkerScan() {
  logger.info(`🚀 [${new Date().toISOString()}] Running tinker job`);

  try {
    const prompt = `
      You are a real-time crypto intelligence agent with access to trending data from:
- Crypto Twitter (CT), especially influencers and community-driven buzz
- Alpha Telegram groups
- DEX launchpads and trend trackers (like DEXTools, Pump.fun, Uniswap,DexScreener)

Your job is to identify up to **1 - 5 high-potential new meme coins ("tinkers")** that are **very recently launched** and **actively gaining traction within the past 60–90 minutes** — not earlier today.

### Tinker Qualification Criteria:
Each tinker must:
- Be **less than 30 minutes old**
- Show **fresh viral momentum** (not hype from hours ago)
- Be trending or gaining mentions in **real-time Twitter threads, Telegram calls, or DEX scans**
- Appear **non-rugged so far** (no rug pull signs, still tradable, liquidity not drained)

You must **filter out coins** that:
- Were launched earlier today but are no longer trending
- Show signs of rugs, soft rugs, or extreme volatility suggesting imminent failure
- Are over-promoted but lack real buying pressure or traction

### For each coin, return this structured JSON:
- "name": UPPERCASE name of the token
- "reason": Why it’s currently gaining real-time traction
- "hypeLevel": "High", "Medium", or "Low"
- "riskLevel": "High", "Medium", or "Low" — consider age, liquidity lock, dev transparency, etc.
- "source": Where it was spotted (e.g., Twitter, Telegram, DEX)
- "Blockchain": Blockchain the token is on (e.g., Solana, Base, Ethereum, BSC)
- "foundAt": ISO timestamp when you discovered it
- "createdAt": ISO timestamp when this JSON was generated
- "CA": Optional, if you have a contract address, include it here,
- "MarketCap": Optional, if you have a market cap, include it here, make sure it is a valid market cap that is available on the blockchain explorer

### Important Notes:
- make sure the CA is available on dexScreener ,make sure it is not a rug pull also it is a valid contract address that is available on the blockchain explorer

### Output Rules:
- Return **only** the valid JSON array of 1–5 entries
- No intro text, no commentary, no code formatting — just pure JSON
- Make sure all timestamps reflect current UTC time
- Make sure the "CA" is available on dexScreener ,make sure it is not a rug pull also it is a valid contract address that is available on the blockchain explorer
- Blockchain should be only:Solana
- Again with the CA, make sure it is a valid contract address that is available on the blockchain explorer
- Analyze the data from the sources mentioned above, and make sure to include the most recent and relevant information
- If you cannot find any valid tinkers, return an empty array: []

### Example:
[
  {
    "name": "MEMEX",
    "reason": "Launched 45 mins ago. Pauly tweeted it. Over 800 holders already. Trending on DEXTools.",
    "hypeLevel": "High",
    "riskLevel": "Medium",
    "source": "Twitter",
    "Blockchain": "Base",
    "foundAt": "2025-06-29T17:00:00Z",
    "createdAt": "2025-06-29T17:03:00Z"
    "CA": "0x1234567890abcdef1234567890abcdef12345678"
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
      logger.info(`🧪 Gemini returned: ${cleaned} `);
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
          CA: t.CA || 'N/A',
          foundAt: t.foundAt ? new Date(t.foundAt) : now,
          createdAt: t.createdAt ? new Date(t.createdAt) : now,
        });

        const message = `🚀 *${t.name}*\n\n🧠 ${t.reason}\n🔥 Hype: ${t.hypeLevel}\n⚠️ Risk: ${t.riskLevel}\n🌐 Source: ${t.source}\n🧬 Chain: ${t.Blockchain}\n🧾 CA: ${t.CA}`;

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
