import { Bot, webhookCallback } from "npm:grammy";

const bot = new Bot(Deno.env.get("TELEGRAM_TOKEN") || "");

// Function to fetch YouTube Channel ID
async function getYoutubeChannelId(username: string): Promise<string | null> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  const cleanHandle = username.startsWith("@") ? username : `@${username}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${cleanHandle}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    } else {
      return null;
    }
  } catch (error) {
    console.error("YouTube API Error:", error);
    return null;
  }
}

// Handle incoming text messages
bot.on("message:text", async (ctx) => {

  if (ctx.message.via_bot) {
    return;
  }

  const username = ctx.message.text.trim();
  
  // Basic validation to ignore the default /start command
  if (username.startsWith("/")) {
    return ctx.reply("Send me a YouTube handle (e.g., @mkbhd) and I'll send back the Channel ID!");
  }

  const channelId = await getYoutubeChannelId(username);
 
if (!channelId) {
  return ctx.reply("Sorry, I couldn't find a channel with that username/handle.");
 }

await ctx.reply(`<b>YouTube RSS Feed for ${query}</b>\n\n<b>Channel ID</>: <code>${channelId}</code>\n<b>RSS</b>: https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { parse_mode: "HTML" });


});

// Inline Query Handler
bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query.trim();

  // Safeguard: Don't hit the YouTube API until they've typed at least 3 characters
  if (query.length < 3) {
    return await ctx.answerInlineQuery([]);
  }

  const channelId = await getYoutubeChannelId(query);

  if (!channelId) {
    // Show a "Not Found" result in the inline popup
    return await ctx.answerInlineQuery([{
      type: "article",
      id: "not_found",
      title: "Channel not found",
      description: `Could not find a YouTube channel for ${query}`,
      input_message_content: {
        message_text: `Could not find a YouTube channel for ${query}`
      }
    }]);
  }

  // Show the successful result in the inline popup
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  await ctx.answerInlineQuery([{
    type: "article",
    id: channelId, // Unique ID for this result
    title: `Get RSS for ${query}`,
    description: `Channel ID: ${channelId}`,
    input_message_content: {
      message_text: `<b>YouTube RSS Feed for ${query}</b>\n\nChannel ID: <code>${channelId}</code>\nRSS Link: ${rssUrl}`,
      parse_mode: "HTML",
    }
  }]);
});

// Set up the Deno server to listen for Webhooks
const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  if (req.method === "POST") {
    try {
      return await handleUpdate(req);
    } catch (err) {
      console.error(err);
      return new Response("Error processing update", { status: 500 });
    }
  }
  return new Response("Telegram Bot is running!");
});
