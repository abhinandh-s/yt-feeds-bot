import { Bot, webhookCallback } from "npm:grammy";

const bot = new Bot(Deno.env.get("TELEGRAM_TOKEN") || "");

// Function to fetch YouTube Channel ID
async function getYoutubeChannelId(username: string): Promise<string> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  const cleanHandle = username.startsWith("@") ? username : `@${username}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${cleanHandle}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    } else {
      return "Sorry, I couldn't find a channel with that username/handle.";
    }
  } catch (error) {
    console.error(error);
    return "An error occurred while contacting YouTube.";
  }
}

// Handle incoming text messages
bot.on("message:text", async (ctx) => {
  const username = ctx.message.text.trim();
  
  // Basic validation to ignore the default /start command
  if (username.startsWith("/")) {
    return ctx.reply("Send me a YouTube handle (e.g., @mkbhd) and I'll send back the Channel ID!");
  }

  const channelId = await getYoutubeChannelId(username);
 // await ctx.reply(`Channel ID: <code>${channelId}</code>`, { parse_mode: "HTML" });

//  await ctx.reply(`RSS: https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);

const replyMessage = `
# Search Complete 🔍
Here is the data for **${username}**:

**Channel ID:** \`${channelId}\`

> Tip: You can just tap the Channel ID above to copy it!
  `;

  // Send the multi-line message (ensure you pass the correct parse_mode)
  await ctx.reply(replyMessage, { 
    parse_mode: "MarkdownV2" 
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
