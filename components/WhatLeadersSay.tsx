'use client'

import { useState } from 'react'
import type { PlaylistVideo } from '@/lib/getPlaylistVideos'

type Testimonial = {
  quote: string
  author: string
  role?: string
}

type Props = {
  testimonials: Testimonial[]
  videos: PlaylistVideo[]
}

export default function WhatLeadersSay({ testimonials, videos }: Props) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [videoIndex, setVideoIndex] = useState(0)

  const prevQuote = () => setQuoteIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))
  const nextQuote = () => setQuoteIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1))
  const prevVideo = () => setVideoIndex((i) => (i === 0 ? videos.length - 1 : i - 1))
  const nextVideo = () => setVideoIndex((i) => (i === videos.length - 1 ? 0 : i + 1))

  const navBtn: React.CSSProperties = {
    background: 'none',
    border: '1.5px solid #E8E4DC',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#633806',
    flexShrink: 0,
    transition: 'border-color 0.15s',
  }

  return (
    <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Section header */}
        <p style={{
          fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#633806', marginBottom: '0.75rem',
        }}>
          What Leaders Say
        </p>
        <h2 style={{
          fontFamily: 'Lora, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: '#2C2C2A', marginBottom: '3rem',
        }}>
          In their own words.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>

          {/* Written testimonials carousel */}
          {testimonials.length > 0 && (
            <div>
              <p style={{
                fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '1.25rem',
              }}>
                Written
              </p>
              <div style={{
                background: '#fff', borderRadius: '10px',
                padding: '2rem', minHeight: '180px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <p style={{
                  fontSize: '1.5rem', color: '#FAEEDA', fontFamily: 'Georgia, serif',
                  lineHeight: 1, marginBottom: '1rem',
                }}>
                  &ldquo;
                </p>
                <p style={{
                  fontSize: '0.95rem', lineHeight: 1.75, color: '#2C2C2A',
                  fontStyle: 'italic', flexGrow: 1, marginBottom: '1.25rem',
                }}>
                  {testimonials[quoteIndex].quote}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#633806', fontWeight: 600 }}>
                  {testimonials[quoteIndex].author}
                </p>
                {testimonials[quoteIndex].role && (
                  <p style={{ fontSize: '0.78rem', color: '#5F5E5A', marginTop: '0.2rem' }}>
                    {testimonials[quoteIndex].role}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <button style={navBtn} onClick={prevQuote} aria-label="Previous testimonial">&#8592;</button>
                <span style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>
                  {quoteIndex + 1} / {testimonials.length}
                </span>
                <button style={navBtn} onClick={nextQuote} aria-label="Next testimonial">&#8594;</button>
              </div>
            </div>
          )}

          {/* Video carousel */}
          {videos.length > 0 && (
            <div>
              <p style={{
                fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '1.25rem',
              }}>
                On Camera
              </p>
              <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    key={videos[videoIndex].videoId}
                    src={`https://www.youtube.com/embed/${videos[videoIndex].videoId}?rel=0&modestbranding=1`}
                    title={videos[videoIndex].title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%', border: 'none',
                    }}
                  />
                </div>
              </div>
              <p style={{
                fontSize: '0.85rem', color: '#2C2C2A', marginTop: '0.65rem',
                fontWeight: 500, lineHeight: 1.4,
              }}>
                {videos[videoIndex].title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button style={navBtn} onClick={prevVideo} aria-label="Previous video">&#8592;</button>
                <span style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>
                  {videoIndex + 1} / {videos.length}
                </span>
                <button style={navBtn} onClick={nextVideo} aria-label="Next video">&#8594;</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
