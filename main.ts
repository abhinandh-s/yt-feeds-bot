import { Bot, webhookCallback } from 'grammy'
import { get_channel_id } from './lib/yt_bot.js'

const apiKey = Deno.env.get('YOUTUBE_API_KEY')

const START_MSG = "Welcome! Send me a YouTube handle (e.g., @mkbhd) and I'll send back the Channel ID!"

const PRIVACY_POLICY =
  '<b>Privacy policy</b>\n\nI gain absolutely <b>zero</b> monetary benefit from this. This is a passion project and I <b>do not</b> collect any user data.'

const bot = new Bot(Deno.env.get('TELEGRAM_TOKEN') || '')

bot.command('start', async (ctx) => {
  await ctx.reply(START_MSG, { parse_mode: 'HTML' })
})

bot.command('privacy', async (ctx) => {
  await ctx.reply(PRIVACY_POLICY, { parse_mode: 'HTML' })
})

bot.on('message:text', async (ctx) => {
  if (ctx.message.via_bot) {
    return
  }
  const username = ctx.message.text.trim()
  const channelId = await get_channel_id(apiKey, username)

  if (!channelId) {
    return ctx.reply("Sorry, I couldn't find a channel with that username/handle.")
  }
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

  await ctx.reply(`🔗 RSS Link: ${rssUrl}`)
})

bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim()

  // Safeguard: Don't hit the YouTube API until they've typed at least 3 characters
  if (query.length < 3) {
    return await ctx.answerInlineQuery([])
  }
  const channelId = await get_channel_id(apiKey, username)
  if (!channelId) {
    // Show a "Not Found" result in the inline popup
    return await ctx.answerInlineQuery([{
      type: 'article',
      id: 'not_found',
      title: 'Channel not found',
      description: `Could not find a YouTube channel for ${query}`,
      input_message_content: {
        message_text: `Could not find a YouTube channel for ${query}`,
      },
    }])
  }

  // Show the successful result in the inline popup
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

  await ctx.answerInlineQuery([{
    type: 'article',
    id: channelId, // Unique ID for this result
    title: `Get RSS for ${query}`,
    description: `Channel ID: ${channelId}`,
    input_message_content: {
      // message_text: `<b> 󰗃 YouTube RSS Feed for ${query}</b>\n\nChannel ID: <code>${channelId}</code>\n\nRSS Link: ${rssUrl}`,
      message_text: `🔗 RSS Link: ${rssUrl}`,
      parse_mode: 'HTML',
    },
  }])
})

// Set up the Deno server to listen for Webhooks
const handleUpdate = webhookCallback(bot, 'std/http')

Deno.serve(async (req) => {
  if (req.method === 'POST') {
    try {
      return await handleUpdate(req)
    } catch (err) {
      console.error(err)
      return new Response('Error processing update', { status: 500 })
    }
  }
  return new Response('Telegram Bot is running!')
})
