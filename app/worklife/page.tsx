import WorklifeSurveyClient from './WorklifeSurveyClient'
import { SOURCE_VALUES } from '@/lib/worklifeSurveyOptions'

export default function WorklifePage({
  searchParams,
}: {
  searchParams: { src?: string; booked?: string }
}) {
  const src = searchParams.src
  const source = (SOURCE_VALUES as readonly string[]).includes(src ?? '') ? (src as string) : 'direct'
  const bookingConfirmed = searchParams.booked === '1'

  return (
    <WorklifeSurveyClient
      source={source}
      turnstileSiteKey={process.env.TURNSTILE_SITE_KEY || ''}
      calendarUrl={process.env.CALENDAR_URL || 'https://cal.id/pgs'}
      bookingConfirmed={bookingConfirmed}
    />
  )
}
