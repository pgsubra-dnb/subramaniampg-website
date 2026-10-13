/**
 * The Performance Conversation: monthly live series (second Tuesday, 11:00 AM IST).
 * Update this one object each month. The landing page, form and API all read it.
 */
export const SERIES_NAME = 'The Performance Conversation'

export type Episode = {
  id: string // stored in Brevo, e.g. PC-EP1
  number: number
  title: string // headline
  shortTitle: string // under 75 characters, for the event title
  subtitle: string
  dateLabel: string
  timeLabel: string
  startUtc: string // YYYYMMDDTHHMMSSZ
  endUtc: string
  learn: string[]
  liveOnly: string
  links: { linkedin: string; youtube: string; facebook: string }
}

export const CURRENT_EPISODE: Episode = {
  id: 'PC-EP1',
  number: 1,
  title: 'You cannot be accountable for what you cannot control.',
  shortTitle: 'Performance Conversation Ep 1: You Cannot Be Accountable Without Control',
  subtitle: 'A free monthly live session with Subramaniam P G.',
  dateLabel: 'Tuesday, 10 November 2026',
  timeLabel: '11:00 AM IST | 45 minutes',
  startUtc: '20261110T053000Z', // 11:00 IST
  endUtc: '20261110T061500Z',
  learn: [
    'The three zones of every role: Accountable, Influence and No control',
    'How to spot a goal that sits in the wrong zone',
    'A real goal reviewed live, and rewritten so it is fair',
  ],
  liveOnly: 'Live only: an exclusive Goal Ally coupon for people who join the session.',
  links: {
    // LinkedIn: confirm this public event link in a private window before launch.
    linkedin: 'https://www.linkedin.com/events/7515658506667139072/',
    youtube: 'https://www.youtube.com/watch?v=KEY7ddPXfZc',
    facebook: 'https://www.facebook.com/events/1074444732079796',
  },
}
