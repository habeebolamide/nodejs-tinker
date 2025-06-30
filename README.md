# 🤖 Telegram Tinker Bot

A Telegram bot that automatically detects **new and hyped meme coins ("tinkers")** by scanning online crypto chatter using Gemini AI. It delivers the results directly to subscribed Telegram users twice daily.

---

## 🧠 What It Does

- Scans the web (via Gemini API) to detect up to 3 high-potential meme coins based on:
  - **Hype**
  - **Newness**
  - **Influencer mentions**
  - **Blockchain info**
- Stores new tinkers in MongoDB.
- Sends real-time alerts to subscribed Telegram users (using a cron job).
- Skips old/duplicate tinkers.
- If no tinkers are found, users are informed.

---

## ⚙️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose)
- **AI**: Gemini 2.5 Flash API
- **Bot Platform**: Telegram Bot API (`node-telegram-bot-api`)
- **Scheduling**: `node-cron`
- **Logging**: `winston`

---

## 📦 Project Structure

```bash
.
├── models/
│   ├── Tinker.js       # MongoDB schema for tinkers
│   └── User.js         # MongoDB schema for Telegram users
├── utils/
│   └── logger.js       # Winston-based logger
├── jobs/
│   └── tinkerScan.js   # Core logic to fetch, parse, store, and notify
├── index.js            # Entry point
├── .env                # Environment variables
├── package.json
└── README.md


---

## 🛠️ Setup & Installation

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/telegram-tinker-bot.git
cd telegram-tinker-bot
npm install
npm start
