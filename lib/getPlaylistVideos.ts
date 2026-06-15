export type PlaylistVideo = {
  videoId: string
  title: string
  thumbnail: string
}

type RawItem = {
  snippet?: {
    resourceId?: { videoId?: string }
    title?: string
    thumbnails?: {
      high?: { url: string }
      default?: { url: string }
    }
  }
}

export async function getPlaylistVideos(): Promise<PlaylistVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID

  if (!apiKey || !playlistId) return []

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()

    if (!data.items) return []

    const videos: PlaylistVideo[] = []
    for (const item of data.items as RawItem[]) {
      const videoId = item.snippet?.resourceId?.videoId
      if (!videoId) continue
      videos.push({
        videoId,
        title: item.snippet?.title ?? '',
        thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? '',
      })
    }
    return videos
  } catch {
    return []
  }
}
