'use client'

import MuxPlayer from '@mux/mux-player-react'

const PLAYBACK_ID = 'bLIz9Qpq6JLJpCFeTFxuB1KZ5dutGm8vvyryz7cdD200'

export default function DemoPlayer({ src }: { src: string }) {
  return (
    <MuxPlayer
      playbackId={PLAYBACK_ID}
      streamType="on-demand"
      accentColor="#633806"
      metadata={{
        video_title: 'Goal Ally demo',
        custom_1: src,
      }}
      style={{ aspectRatio: '16 / 9', width: '100%', display: 'block' }}
    />
  )
}
