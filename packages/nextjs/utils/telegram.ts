import { formatEther, parseEther } from "viem";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

// Utility function to format numbers safely
const safeFormatEther = (value?: string | bigint | null): string => {
  if (!value) return "0";
  try {
    return formatEther(typeof value === "string" ? parseEther(value) : value);
  } catch {
    return "0";
  }
};

interface TelegramMessage {
  text: string;
  parse_mode?: "HTML" | "Markdown";
  disable_web_page_preview?: boolean;
}

interface TelegramMediaMessage {
  chat_id: string;
  caption: string;
  photo?: string; // URL of the image
  video?: string; // URL of the video
  parse_mode?: "HTML" | "Markdown";
}

interface PostNotificationProps {
  title: string;
  author: string;
  coinAddress: string;
  content: string;
  marketCap: bigint;
  totalSupply: bigint;
  mediaUrl?: string;
}

interface TradeNotificationProps {
  title: string;
  coinAddress: string;
  marketCap?: bigint;
  volume24h?: bigint;
  totalSupply?: bigint;
  holders: number;
  author: string;
  createdAt: string;
  isBuy: boolean;
  mediaUrl?: string;
}

interface EarningsNotificationProps {
  type: "channel" | "creator" | "coin" | "post";
  name: string;
  earnings: bigint;
  timeframe: "24h" | "7d" | "30d" | "all";
  growth?: number; // Percentage growth
  totalTrades?: number;
  uniqueTraders?: number;
  coinAddress?: string;
  postId?: string;
  mediaUrl?: string;
}

interface TelegramMessageProps {
  chat_id?: string;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  disable_web_page_preview?: boolean;
}

interface TelegramMediaMessageProps {
  chat_id: string;
  photo: string;
  caption?: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
}

interface Channel {
  name: string;
  volume: bigint;
  memberCount: number;
}

interface TradedCoin {
  name: string;
  volume: bigint;
  trades: number;
}

interface LeaderboardUpdateProps {
  topChannels: Channel[];
}

interface VolumeUpdateProps {
  totalVolume24h: bigint;
  topTraded: TradedCoin[];
}

interface Channel {
  title: string;
  marketCap: string;
  volume24h: string;
  holders: number;
}

interface VolumeStats {
  totalVolume24h: string;
  topTraded: Array<{
    title: string;
    volume24h: string;
  }>;
}

const sendTelegramMessage = async (message: TelegramMessage) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error("Telegram credentials not configured");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        ...message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
};

const sendTelegramMediaMessage = async (mediaMessage: TelegramMediaMessage) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error("Telegram credentials not configured");
    return;
  }

  try {
    const endpoint = mediaMessage.photo ? "sendPhoto" : mediaMessage.video ? "sendVideo" : null;

    if (!endpoint) {
      throw new Error("No media provided");
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mediaMessage),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending Telegram media message:", error);
  }
};

// Message templates
export const sendNewPostNotification = async ({
  title,
  author,
  coinAddress,
  content,
  marketCap,
  totalSupply,
  mediaUrl,
}: PostNotificationProps) => {
  const messageText = `🆕🪙 NEW CHANNEL CREATED

📛 ${title}
💰 Market Cap: $${safeFormatEther(marketCap)}
📊 Total Supply: ${safeFormatEther(totalSupply)}B
👤 ${author}
📄 Contract: ${coinAddress}
📝 ${content || ""}

🔗 View on <a href="https://zora.co/creator-coins/base:${coinAddress}">Zora</a> | <a href="https://basescan.org/address/${coinAddress}">BaseScan</a> | <a href="https://dexscreener.com/base/${coinAddress}">DexScreener</a>`;

  if (mediaUrl) {
    // Send as media message if there's an image/video
    await sendTelegramMediaMessage({
      chat_id: TELEGRAM_CHANNEL_ID!,
      caption: messageText,
      photo: mediaUrl,
      parse_mode: "HTML",
    });
  } else {
    // Send as regular message if no media
    await sendTelegramMessage({
      text: messageText,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
};

export const sendTradeNotification = async ({
  title,
  coinAddress,
  marketCap,
  volume24h,
  totalSupply,
  holders,
  author,
  createdAt,
  isBuy,
  mediaUrl,
}: TradeNotificationProps) => {
  const messageText = `${isBuy ? "🟢💰 BUY" : "🔄📊 TRADE"} ACTIVITY

📛 ${title}
💰 Market Cap: $${safeFormatEther(marketCap)}
📊 24h Volume: $${safeFormatEther(volume24h)}
📊 Total Supply: ${safeFormatEther(totalSupply)}B
👥 Holders: ${holders}
👤 ${author}
📄 Contract: ${coinAddress}
📅 Created: ${new Date(createdAt).toUTCString()}

🔗 View on <a href="https://zora.co/creator-coins/base:${coinAddress}">Zora</a> | <a href="https://basescan.org/address/${coinAddress}">BaseScan</a> | <a href="https://dexscreener.com/base/${coinAddress}">DexScreener</a>`;

  if (mediaUrl) {
    await sendTelegramMediaMessage({
      chat_id: TELEGRAM_CHANNEL_ID!,
      caption: messageText,
      photo: mediaUrl,
      parse_mode: "HTML",
    });
  } else {
    await sendTelegramMessage({
      text: messageText,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
};

export const sendLeaderboardUpdate = async ({ topChannels }: LeaderboardUpdateProps) => {
  let message = "🏆 TOP CHANNELS BY MARKET CAP\n\n";

  topChannels.forEach((channel: Channel, index: number) => {
    message += `${index + 1}. ${channel.name}
💰 MC: $${safeFormatEther(channel.volume)}
👥 ${channel.memberCount} members\n\n`;
  });

  await sendTelegramMessage({
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
};

export const sendVolumeUpdate = async ({ totalVolume24h, topTraded }: VolumeUpdateProps) => {
  let message = `📊 PLATFORM STATISTICS

💎 24h Volume: $${safeFormatEther(totalVolume24h)}

🔝 Top Traded:
`;

  topTraded.forEach((coin: TradedCoin, index: number) => {
    message += `${index + 1}. ${coin.name} - $${safeFormatEther(coin.volume)} (${coin.trades} trades)\n`;
  });

  await sendTelegramMessage({
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
};

export const sendEarningsNotification = async ({
  type,
  name,
  earnings,
  timeframe,
  growth,
  totalTrades,
  uniqueTraders,
  coinAddress,
  postId,
  mediaUrl,
}: EarningsNotificationProps) => {
  const typeEmoji = {
    channel: "📢",
    creator: "👨‍🎨",
    coin: "🪙",
    post: "📝",
  }[type];

  const timeframeText = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    all: "All Time",
  }[timeframe];

  let messageText = `${typeEmoji} ${type.toUpperCase()} EARNINGS UPDATE

📛 ${name}
💰 Earnings: $${safeFormatEther(earnings)}
⏰ Period: ${timeframeText}`;

  if (growth !== undefined) {
    const growthEmoji = growth >= 0 ? "📈" : "📉";
    messageText += `\n${growthEmoji} Growth: ${growth > 0 ? "+" : ""}${growth.toFixed(2)}%`;
  }

  if (totalTrades) {
    messageText += `\n🔄 Total Trades: ${totalTrades}`;
  }

  if (uniqueTraders) {
    messageText += `\n👥 Unique Traders: ${uniqueTraders}`;
  }

  // Add relevant links based on type
  if (coinAddress) {
    messageText += `\n\n🔗 View on <a href="https://zora.co/creator-coins/base:${coinAddress}">Zora</a> | <a href="https://basescan.org/address/${coinAddress}">BaseScan</a>`;
  }

  if (postId) {
    messageText += `\n\n🔗 <a href="https://app.zorapp.com/post/${postId}">View Post</a>`;
  }

  if (mediaUrl) {
    await sendTelegramMediaMessage({
      chat_id: TELEGRAM_CHANNEL_ID!,
      caption: messageText,
      photo: mediaUrl,
      parse_mode: "HTML",
    });
  } else {
    await sendTelegramMessage({
      text: messageText,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
};
