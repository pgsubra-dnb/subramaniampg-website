export type BlogPost = {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  excerpt: string
  body: string[]
  takeaways: string[]
}

export const POSTS: BlogPost[] = [
  {
    slug: 'the-illusion-of-perfect-separation',
    title: 'The Illusion of Perfect Separation: Leadership Lessons from Imperfect Systems',
    category: 'Leadership',
    date: 'Mar 25, 2026',
    readTime: '6 min read',
    excerpt:
      'There is a quiet temptation in management — the desire to sort, to refine, and to purify. Leaders often believe that with enough effort they can separate what is useful from what is not.',
    body: [
      'There is a quiet temptation in management. It is the desire to sort, to refine, and to purify. Leaders often believe that with enough effort, the right tools, and sharper judgment, they can separate what is useful from what is not. The good from the bad. The valuable from the waste. This belief is comforting. It gives a sense of control. Yet reality resists this idea.',
      'A simple act, like cleaning a bag of mixed flowers, reveals a deeper truth. You separate what is fit for use from what is not. But in doing so, you discover that the line between the two is never as clear as you imagined. Some flowers that look damaged still carry fragrance. Some that look perfect are hollow inside.',
      'Leadership works the same way. The drive for perfect separation — the desire to eliminate all ambiguity, all imperfection, all inefficiency — often creates more problems than it solves. The best leaders learn to work with imperfection, not against it.',
    ],
    takeaways: [
      'Perfect separation is an illusion — reality is always more complex than our categories',
      'The drive to eliminate all imperfection can damage what is actually valuable',
      'Great leaders learn to work with complexity rather than fighting it',
    ],
  },
  {
    slug: 'blindness-beyond-the-eyes',
    title: 'Blindness Beyond the Eyes: The Hidden Leadership Crisis',
    category: 'Leadership',
    date: 'Oct 3, 2025',
    readTime: '5 min read',
    excerpt:
      'When we hear the word blindness we immediately think of the inability to see with our eyes. But physical blindness is only one form — and perhaps not the most dangerous one.',
    body: [
      'When we hear the word blindness we immediately think of the inability to see with our eyes. But physical blindness is only one form — and perhaps not the most dangerous one.',
      'In leadership, the more prevalent blindness is selective — the inability or unwillingness to see what is inconvenient, uncomfortable, or threatening to our existing worldview. A leader can be physically sharp-sighted and yet profoundly blind to the signals their team is sending, the patterns forming in their organisation, or the direction their decisions are taking them.',
      'The cure for this kind of blindness is not sharper vision but deeper honesty. It begins with the willingness to ask: what am I not seeing? And, more importantly, why?',
    ],
    takeaways: [
      'Leadership blindness is usually selective, not accidental',
      'What we refuse to see often matters more than what we cannot see',
      'Honest self-inquiry is the first step toward clearer leadership vision',
    ],
  },
  {
    slug: 'nine-nights-nine-lessons',
    title: 'Nine Nights, Nine Lessons: Leadership Through the Forms of Durga',
    category: 'Ancient Wisdom',
    date: 'Oct 1, 2025',
    readTime: '8 min read',
    excerpt:
      'Navaratri is one of India\'s most celebrated festivals, honoring the divine feminine in her many forms. Over nine nights, devotees worship Durga, Lakshmi, and Saraswati.',
    body: [
      'Navaratri is one of India\'s most celebrated festivals, honoring the divine feminine in her many forms. Over nine nights, devotees worship Durga, Lakshmi, and Saraswati — three aspects of Shakti representing power, prosperity, and wisdom.',
      'Each form of Durga worshipped across the nine nights carries a distinct leadership lesson. Shailaputri, daughter of the mountains, teaches us about groundedness. Brahmacharini, the austere seeker, shows the power of sustained practice. Chandraghanta, adorned with a half-moon bell, embodies fearless readiness.',
      'Together, these nine forms outline a complete leadership development journey — from building inner strength, to cultivating wisdom, to channelling power in service of others.',
    ],
    takeaways: [
      'Ancient festivals encode wisdom about leadership and character development',
      'Durga\'s nine forms represent nine distinct dimensions of effective leadership',
      'True power in leadership is always in service of something greater than the self',
    ],
  },
  {
    slug: 'knowledge-as-awakening',
    title: 'Knowledge as Awakening: Reframing Learning in Leadership and Growth',
    category: 'Leadership',
    date: 'Jul 31, 2025',
    readTime: '7 min read',
    excerpt:
      'In our age of information, we are conditioned to see knowledge as a commodity — something to be acquired, stored, and deployed. But what if this view is itself a limitation?',
    body: [
      'In our age of information, we are conditioned to see knowledge as a commodity — something to be acquired, stored, and deployed. We accumulate certifications, attend workshops, read books. We measure learning by what we have consumed, not by who we have become.',
      'But ancient wisdom traditions offer a different framing. In the Vedantic tradition, true knowledge — Jnana — is not about accumulation. It is about awakening. It transforms the knower, not just their information store.',
      'The most powerful leaders are not those with the most information. They are those whose learning has changed them — who see differently, respond differently, and lead differently as a result of what they have truly understood.',
    ],
    takeaways: [
      'Real learning transforms the learner, not just their knowledge base',
      'Information consumed without reflection rarely produces wisdom',
      'Ancient wisdom distinguishes between knowing facts and being awakened by truth',
    ],
  },
  {
    slug: 'leadership-lessons-from-a-mango-tree',
    title: 'Leadership Lessons from a Mango Tree: Embracing Diversity to Build Stronger Cultures',
    category: 'Leadership',
    date: 'Jul 20, 2025',
    readTime: '5 min read',
    excerpt:
      'Every organisation wants to thrive. Every leader wants a high-performing team. But what does it take to build a culture that truly embraces diversity?',
    body: [
      'Every organisation wants to thrive. Every leader wants a high-performing team. But what does it take to build a culture that truly embraces diversity?',
      'Consider a mango tree. It does not discriminate about where it drops its fruit. Some fall on fertile soil and grow. Others fall on concrete and do not. The tree gives equally. What determines the outcome is the ground, not the gift.',
      'A leader who builds an inclusive culture creates the fertile conditions for every person to grow — regardless of background, style, or approach. The work is not in finding the perfect people. It is in building the soil that allows different kinds of people to thrive together.',
    ],
    takeaways: [
      'Inclusion is about creating conditions for growth, not uniformity',
      'Diverse teams outperform homogeneous ones when psychological safety is present',
      'A leader\'s job is to enrich the soil, not control which seeds are planted',
    ],
  },
  {
    slug: 'the-fire-within',
    title: 'The Fire Within: Lessons from Vashishta and Vishwamitra on Desire, Anger, and Leadership',
    category: 'Ancient Wisdom',
    date: 'Jun 4, 2025',
    readTime: '9 min read',
    excerpt:
      'In the ancient Indian scriptures, the story of Sage Vashishta and King Vishwamitra stands as a profound parable about transformation through adversity.',
    body: [
      'In the ancient Indian scriptures, the story of Sage Vashishta and King Vishwamitra stands as a profound parable about transformation through adversity. Vishwamitra, a powerful king consumed by ambition and pride, encountered Vashishta\'s divine cow and sought to take it by force. His failure ignited a rage that set him on a decades-long quest to surpass the sage.',
      'What makes this story remarkable is that Vishwamitra\'s anger, born of wounded ego, ultimately became the fuel for one of the greatest spiritual journeys in Indian mythology. He was transformed by the very desire that first corrupted him.',
      'The leadership lesson is profound: our most destructive impulses, when channelled with discipline and self-awareness, can become our greatest strengths. The fire within need not consume us. It can illuminate the path.',
    ],
    takeaways: [
      'Destructive impulses, properly channelled, can become sources of transformation',
      'Anger unchecked destroys; anger directed with wisdom can fuel breakthrough',
      'Vishwamitra\'s story is a reminder that our greatest obstacles often contain our greatest teachers',
    ],
  },
  {
    slug: 'goodness-vs-greatness',
    title: 'Goodness vs. Greatness: The Leadership Choice That Shapes Your Legacy',
    category: 'Leadership',
    date: 'Mar 27, 2025',
    readTime: '6 min read',
    excerpt:
      'What separates a good leader from a great one? The answer may be simpler — and more profound — than most leadership books suggest.',
    body: [
      'What separates a good leader from a great one? The answer may be simpler — and more profound — than most leadership books suggest.',
      'Good leaders deliver results. They manage well, communicate clearly, and keep their teams functional. But great leaders leave something behind that persists after they are gone — a culture, a standard, a way of thinking that others carry forward.',
      'The choice between goodness and greatness is ultimately a choice about who you are serving. Good leaders serve their organisations. Great leaders serve the future. The distinction shapes every decision, every hire, every conversation.',
    ],
    takeaways: [
      'Good leaders manage well; great leaders build something that outlasts them',
      'Legacy is not built in grand moments — it is built in daily choices',
      'The transition from goodness to greatness requires serving something larger than today\'s results',
    ],
  },
  {
    slug: 'master-execution-gap',
    title: 'Master Execution Gap: Why Strategy Without Execution Is Just a Plan',
    category: 'OKR',
    date: 'Dec 10, 2024',
    readTime: '7 min read',
    excerpt:
      "A leader's greatest test is not just guiding a team but igniting a deep sense of commitment and execution discipline within them.",
    body: [
      "A leader's greatest test is not just guiding a team but igniting a deep sense of commitment and execution discipline within them. Strategy without execution is fiction. It creates the illusion of direction without the reality of movement.",
      'Most organisations have strategy documents. Few have execution cultures. The gap between the two is not a planning problem — it is a leadership problem. It is about whether leaders create the accountability structures, the rhythms, and the psychological safety that make execution possible.',
      'The OKR framework is one powerful tool for closing this gap. But it only works when leaders model the behaviours — when they score their own OKRs honestly, when they hold check-ins consistently, when they celebrate progress rather than just celebrating arrival.',
    ],
    takeaways: [
      'The execution gap is a leadership problem, not a planning problem',
      'OKRs work only when leaders model honest scoring and consistent rhythm',
      'Strategy becomes real when accountability structures are built into daily work',
    ],
  },
  {
    slug: 'grow-with-humility',
    title: 'Grow with Humility: Why Ego Is the Enemy of Great Leadership',
    category: 'Leadership',
    date: 'Nov 5, 2024',
    readTime: '5 min read',
    excerpt:
      'In the pursuit of leadership, the greatest challenge is not external — it is the struggle within. Many talented individuals hold the seeds of greatness but are blocked by ego.',
    body: [
      'In the pursuit of leadership, the greatest challenge is not external — it is the struggle within. Many talented individuals hold the seeds of greatness but are blocked by ego. Not by lack of skill, lack of intelligence, or lack of opportunity. By ego.',
      'Ego tells us we already know. It makes us defensive when challenged, dismissive of feedback, and closed to learning. It turns the act of leadership — which is fundamentally about others — into a performance for the self.',
      'Humility is not weakness. In leadership, it is a form of strength — the capacity to remain open, to keep learning, and to put the team\'s growth above the protection of one\'s own image. The greatest leaders are often the most genuinely curious.',
    ],
    takeaways: [
      'Ego is the most common ceiling on leadership growth',
      'Humility is not self-deprecation — it is sustained openness to learning',
      'The shift from performance to service marks the transition to genuine leadership',
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
