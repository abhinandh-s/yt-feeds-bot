export function extractHandle(input: string): string {
  const atIndex = input.lastIndexOf('@')
  return atIndex === -1 ? input : input.slice(atIndex + 1)
}

console.log('---- tests ----')
console.log(await getYoutubeChannelId('https://youtube.com/@judosloth'))
console.log(await getYoutubeChannelId('@pewdiepie'))
console.log(await getYoutubeChannelId('jacksepticeye'))
console.log('---------------')

// Function to fetch YouTube Channel ID
export async function getYoutubeChannelId(username: string): Promise<string | null> {
  const apiKey = Deno.env.get('YOUTUBE_API_KEY')
  // const cleanHandle = username.startsWith("@") ? username : `@${username}`;
  const cleanHandle = extractHandle(username)
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${cleanHandle}&key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      return data.items[0].id
    } else {
      return null
    }
  } catch (error) {
    console.error('YouTube API Error:', error)
    return null
  }
}
