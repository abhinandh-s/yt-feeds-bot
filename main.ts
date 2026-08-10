import { Bot, webhookCallback } from 'grammy'
import { get_channel_details } from './lib/yt_bot.js'

const apiKey = Deno.env.get('YOUTUBE_API_KEY') || ''

const START_MSG = "Welcome! Send me a YouTube handle (e.g., @mkbhd) and I'll send back the Channel details & RSS link!"

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
  const details = await get_channel_details(apiKey, username)

  if (!details) {
    return ctx.reply("Sorry, I couldn't find a channel with that username/handle.")
  }

  const channelId = details.id
  const title = details.title
  const photoUrl = details.thumbnail_url
  details.free()

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const caption = `<b>${title}</b> (${username})\n\n<b>RSS Link:</b> ${rssUrl}`

  await ctx.replyWithPhoto(photoUrl, {
    caption,
    parse_mode: 'HTML',
    protect_content: true, // Prevents saving, downloading, and forwarding
  })
})

bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim()

  if (query.length < 3) {
    return await ctx.answerInlineQuery([])
  }

  const details = await get_channel_details(apiKey, query)

  if (!details) {
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

  const channelId = details.id
  const title = details.title
  const photoUrl = details.thumbnail_small_url
  details.free()

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const caption = `<b>${title}</b> (${query})\n\n<b>RSS Link:</b> ${rssUrl}`

  await ctx.answerInlineQuery([{
    type: 'article',
    id: channelId,
    title: title,
    description: `Handle: ${query} | ID: ${channelId}`,
    thumbnail_url: photoUrl,
    input_message_content: {
      message_text: caption,
      parse_mode: 'HTML',
    },
  }])
})

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
