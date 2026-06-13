'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const TESTIMONIALS = [
  {
    quote: 'PG is a great process guy, he understands what makes people go off process and why they find it difficult to learn and stick to process. That is his biggest success. He does it at a reasonable cost and is effective in implementation.',
    name: 'Sanjay Mariwala',
    role: 'Executive Chairman and Managing Director, OmniActive Health Technologies',
  },
  {
    quote: 'Subbu has been a fantastic service provider (in fact more a business partner). While at Mafoi (now Randstad) we have shared a long standing relationship with his company ASAP Management Consultants Pvt Limited, and he contributed in great measure to our success. A thorough professional and a very dependable service provider.',
    name: 'Ajay Mallapurkar',
    role: 'Founder and Chairman, Recruit CRM',
  },
  {
    quote: 'PGS is a highly focused person on Process Quality and Delivery. He is passionate in bringing about transformation. He adds value to organization through his matured interventions.',
    name: 'Sai Prasanna',
    role: 'Director at Management Consulting',
  },
  {
    quote: "P G Subramaniam is much more than a service provider for Ma Foi. As a Quality consultant, he is one of my company's most preferred partners. PGS was awarded a memento by the managing director in a special internal event for his contributions to Ma Foi. He helped us set high standards in quality and business excellence that helps us win the prestigious RBNQ award. PGS has the eyes of an eagle. He has an eye for small details while not missing important business perspectives at a higher level.",
    name: 'Manoj Sathyan',
    role: 'Director Bill and Pay',
  },
  {
    quote: 'It has been a pleasurable journey working with PGS. He brings with him a rich and vast experience in Process Management, IT and HR consulting. A trainer par excellence whose workshops are cherised and provides the desired ROI to the participants and the organisation. He is truly result driven, focussed and an expert in his area of work. An individual who will provide a holistic 360 degree consultative approach to his stakeholders by understanding the need, culture and pain points.',
    name: 'Sucheta Shetty',
    role: 'Human Capital Function, People and Culture',
  },
  {
    quote: 'PGS as I call him was introduced to me as a quality management consultant. Right from day one about 8 years back, he has been extremely great person to work with. His highly motivating lectures for our employees has really helped our company. His company has been constantly delivering what we need as a consultant to help us improve our quality.',
    name: 'Mukunth Venkatesan',
    role: 'Founder, Director and CEO, Agaram Technologies',
  },
  {
    quote: 'He was a workaholic, very dynamic, sincere in his commitments, simple in his activities and honest to all. He helped me in getting a placement and later he associated with me as a quality management consultant.',
    name: 'Siva Shanmugam S',
    role: 'Director, Polyhedron Laboratories',
  },
  {
    quote: 'I have known PGS now for about a decade and remain impressed with his commitment to Quality as a subject and his professionalism. His attitude to keep learning is amazing and even more special his desire to implement his learning. If you are his client you are in good hands. If you are a friend count yourself lucky. Not many like PGS are around.',
    name: 'Anshuman Tiwari',
    role: 'AI for Employee Experience, GSK',
  },
  {
    quote: 'P.G.Subramaniam takes his given task seriously and devotes his full concentration till he completes it. He is a good listener and reasons out all his findings with good examples and illustrations. He never lets any stone unturned. He is very inventive and thinks out of the box to bring solutions to problems which are acceptable to all. In total he is a highly reliable and trustworthy person who can be taken into confidence and relied upon always.',
    name: 'Uma Nabil',
    role: 'Senior Manager Manufacturing Operations, National Biscuit Industries',
  },
  {
    quote: 'PGS, whose ability to get things done with the highest level of perfection and statistical representation is greatly admired by many. His ability to train irrespective of the complexity of the program is commendable. I have gained insights on various aspects by just watching him and working with him.',
    name: 'Priya Aldam',
    role: 'Vice President Learning and Development, Navitas Life Sciences',
  },
  {
    quote: 'PGS is a truly inspiring person who gave me the opportunity to start my Career as a HR person. He is well known for his best practices in all the service that he renders. He has built a rock solid reputation for himself in the industry. He has been a mentor who paved the way for the success of many individuals.',
    name: 'Yogesh S',
    role: 'HR Leader, Strategic HR and HR Transformation',
  },
  {
    quote: 'Subbu has been associated with us for a long time and have helped us to implement various initiatives. His intricate knowledge of the processes, his ability to understand the challenges that the organisation or a department goes through and offer viable solutions are his greatest strength. Looking forward to working with him once again.',
    name: 'Charan Kumar Shetty',
    role: 'HR Leader and Board Member',
  },
  {
    quote: 'PGS sir is my Guru and my Mentor in ASAP Management and I learnt Quality Management from him. I always admire his talent and knowledge. He is very sharp and explains things very easily. The belief he has on his team is amazing. He inspired me to be a true professional and shaped my career.',
    name: 'Ramakrishnan M',
    role: 'Manager, Environment Facility and Projects, BMW',
  },
  {
    quote: 'PGS has immense knowledge in diverse areas of both IT and Manufacturing. His training is full of real time examples and case studies that would enable even a fresher to understand with ease. He also provides immediate feedback by quickly judging individual capabilities and their areas for improvement.',
    name: 'Pradeep Chellakani',
    role: 'Vice President Quality, ValGenesis',
  },
  {
    quote: 'It is a pleasure to interact and work with PG. As a service provider for Pelican Wealth Managers, I experienced great understanding on the ISO subject from him and he was able to engross the people with simple explanations to ensure understanding and easier implementation.',
    name: 'P K Raghunathan',
    role: 'Client',
  },
  {
    quote: 'P G Subramaniam brings a high level of passion and energy to his work. His understanding of HR Processes and Policies are amazing. He has a very logical and systematic approach to work. I found him great fun to work with.',
    name: 'Vaani Anand',
    role: 'Writer, Biographer, Speaker and Culture Specialist',
  },
  {
    quote: 'Subbu brings tremendous passion, energy and dedication to his work. We take pride in having a partner like Subbu. He does not work like an outsider. He owns up assignments with more commitment than at times your own employee will own up!',
    name: 'Aditya Mishra',
    role: 'Building CIEL HR Group',
  },
]

const TOTAL = TESTIMONIALS.length

export default function TestimonialsCarousel() {
  const [current, setCurrent]   = useState(0)
  const [visible, setVisible]   = useState(1) // 1 = SSR-safe default
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derive from state — no stale closure risk
  const maxIndex = TOTAL - visible

  // Responsive visible count
  useEffect(() => {
    const update = () => {
      setVisible(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Clamp current when visible changes (e.g. on resize)
  useEffect(() => {
    setCurrent(c => Math.min(c, TOTAL - visible))
  }, [visible])

  const next = useCallback(() => {
    setCurrent(c => (c >= maxIndex ? 0 : c + 1))
  }, [maxIndex])

  const prev = useCallback(() => {
    setCurrent(c => (c <= 0 ? maxIndex : c - 1))
  }, [maxIndex])

  // Auto-play — restarts whenever paused state or next() reference changes
  useEffect(() => {
    if (isPaused) return
    intervalRef.current = setInterval(next, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPaused, next])

  // translateX uses the element's own width as %, so:
  // track width = (TOTAL / visible) * 100% of container
  // advancing 1 card = 1/TOTAL * trackWidth = (1/visible) * containerWidth ✓
  const trackWidth   = `${(TOTAL / visible) * 100}%`
  const translatePct = (current / TOTAL) * 100

  const dotCount = maxIndex + 1

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Sliding track ───────────────────────────────── */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out items-stretch"
          style={{ width: trackWidth, transform: `translateX(-${translatePct}%)` }}
        >
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <div
              key={name}
              style={{ width: `${100 / TOTAL}%` }}
              className="px-3"
            >
              <div
                className="flex flex-col h-full p-7 rounded-2xl"
                style={{ backgroundColor: '#ffffff0d', border: '1px solid #ffffff14' }}
              >
                {/* Quote mark */}
                <div
                  className="font-lora text-5xl leading-none mb-3 select-none"
                  style={{ color: '#63380660' }}
                  aria-hidden="true"
                >
                  &ldquo;
                </div>

                {/* Quote body */}
                <blockquote className="text-white/80 text-sm leading-relaxed flex-1 mb-6">
                  {quote}
                </blockquote>

                {/* Attribution */}
                <div className="pt-4 border-t" style={{ borderColor: '#ffffff14' }}>
                  <p className="text-sm font-semibold text-white leading-snug">{name}</p>
                  <p className="text-xs mt-1 leading-snug" style={{ color: '#888780' }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-5 mt-8">

        {/* Prev button */}
        <button
          onClick={prev}
          aria-label="Previous testimonials"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06z" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center" style={{ maxWidth: '240px' }}>
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all duration-300 shrink-0"
              style={{
                width:           i === current ? '20px' : '8px',
                height:          '8px',
                backgroundColor: i === current ? '#633806' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          aria-label="Next testimonials"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
          </svg>
        </button>

      </div>
    </div>
  )
}
