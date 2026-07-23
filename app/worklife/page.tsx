import WorklifeSurveyClient from './WorklifeSurveyClient'
import { SOURCE_VALUES } from '@/lib/worklifeSurveyOptions'

export default function WorklifePage({
  searchParams,
}: {
  searchParams: { src?: string; booked?: string; reset?: string }
}) {
  const src = searchParams.src
  const source = (SOURCE_VALUES as readonly string[]).includes(src ?? '') ? (src as string) : 'direct'
  const bookingConfirmed = searchParams.booked === '1'
  // TESTING ONLY — ?reset=1 clears the "already submitted" localStorage flag so the
  // same device can go through the form again. Remove this before the survey link
  // goes out publicly (see worklife-survey-setup-notes.md).
  const resetRequested = searchParams.reset === '1'

  return (
    <WorklifeSurveyClient
      source={source}
      turnstileSiteKey={process.env.TURNSTILE_SITE_KEY || ''}
      calendarUrl={process.env.CALENDAR_URL || 'https://cal.id/pgs'}
      bookingConfirmed={bookingConfirmed}
      resetRequested={resetRequested}
    />
  )
}
