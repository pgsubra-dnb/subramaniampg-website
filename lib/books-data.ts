export type Book = {
  slug: string
  title: string
  subtitle: string
  tagline: string
  description: string
  seoDescription: string
  themes: string[]
  series: boolean
  amazonUrl: string
  coverImage: string
}

export const BOOKS: Book[] = [
  {
    slug: 'master-leadership-focus',
    title: 'Master Leadership Focus',
    subtitle: '15 Effective Ways to Banish Distractions, Cultivate Resilience, and Achieve Lasting Mental Clarity',
    tagline: '15 ways to banish distractions, cultivate resilience, and achieve lasting mental clarity through yoga philosophy.',
    description:
      "Leadership in today's world is a high-stakes challenge. This book draws from yoga philosophy to reveal the nine mental distractions that sabotage leaders — doubt, laziness, false perceptions, instability, and more — and provides actionable strategies to overcome them. Covers mindfulness, emotional intelligence, SMART goals, time management, and building team trust and engagement.",
    seoDescription:
      "What separates great leaders from the rest is not talent — it is the ability to stay focused when everything around them demands attention. Master Leadership Focus draws from the timeless wisdom of yoga philosophy to reveal the hidden mental barriers that sabotage even the most capable leaders. You will discover the nine distractions outlined in ancient yoga texts — doubt, laziness, false perception, instability, and more — and learn practical strategies to overcome each one. From building emotional resilience and practising mindfulness to setting SMART goals and managing competing demands, this book gives you both the understanding and the tools to lead with unwavering clarity. Each chapter includes real-world examples, reflection guides, and step-by-step exercises. Whether you are a seasoned executive or stepping into leadership for the first time, this book will help you cut through the noise, harness your inner strength, and lead with the confidence and precision that lasting success demands.",
    themes: ['Focus and Clarity', 'Yoga Philosophy', 'Resilience', 'Emotional Intelligence', 'Time Management', 'Goal Setting', 'Team Engagement'],
    series: true,
    amazonUrl: 'https://amzn.in/d/01PmmiIV',
    coverImage: '/images/books/master-leadership-focus.jpg',
  },
  {
    slug: 'elevate-your-leadership',
    title: 'Elevate Your Leadership',
    subtitle: '8 Yoga Principles to Inspire Commitment, Boost Influence, Build Trust, and Drive Exceptional Growth',
    tagline: '8 Patanjali Yoga Sutra principles to inspire commitment, build trust, and drive exceptional growth.',
    description:
      'Drawing inspiration from the Patanjali Yoga Sutras, this book connects the eight limbs of yoga to core leadership principles. Addresses the four core challenges leaders face: inspiring commitment, boosting influence, building trust, and driving exceptional growth.',
    seoDescription:
      "What does it truly take to become an exceptional leader in today's fast-paced world? The answer, surprisingly, lies not in the latest management frameworks but in the timeless wisdom of the Patanjali Yoga Sutras — one of the most profound texts on the human mind ever written. Elevate Your Leadership maps the eight limbs of yoga onto the four core challenges every leader faces: inspiring genuine commitment, building real influence, creating high-trust environments, and driving sustainable growth. From Yama (ethical discipline) to Samadhi (unified purpose), each principle offers a deeply practical lens for leading with integrity, presence, and impact. This is not a book about meditation or spirituality. It is a blueprint for leaders who want to inspire rather than instruct, influence rather than control, and build teams that deliver results because they believe in what they are doing. Includes reflection exercises and growth guides at the end of every chapter.",
    themes: ['Patanjali Yoga Sutras', 'Influence', 'Trust', 'Commitment', 'Leadership Development', 'Ancient Wisdom', 'Team Performance'],
    series: true,
    amazonUrl: 'https://amzn.in/d/04zntDcd',
    coverImage: '/images/books/elevate-your-leadership.jpg',
  },
  {
    slug: 'beyond-the-surface',
    title: 'Beyond the Surface',
    subtitle: 'Discover Hidden Talent, Unlearn Old Patterns, Transform Leadership Through Ancient Stories',
    tagline: 'Discover hidden talent and transform leadership through stories from the Dashavatara and Srimad Bhagavatam.',
    description:
      'Draws from the Dashavatara and Srimad Bhagavatam to offer leaders soulful strategy rooted in scriptural wisdom. Each chapter follows a powerful rhythm: surface trap, unseen cost, mythological metaphor, practical mindset shift, and two reflective actions. Includes Sanskrit verses with Devanagari script.',
    seoDescription:
      "The leadership answers you are searching for may not be in the latest business trends or corporate models. They may be hidden deep within the ancient stories of India — waiting to be seen by leaders willing to look beneath the surface. Beyond the Surface takes you on a transformative journey through the Dashavatara and the Srimad Bhagavatam, reinterpreting these timeless epics to address the most urgent leadership and management challenges of today. Each chapter follows a powerful rhythm: the surface-level trap leaders fall into, the unseen cost of staying shallow, a mythological metaphor that reframes the issue, practical shifts in mindset and behaviour, and two reflective actions to embed learning. Discover how Lord Varaha's rescue of the Earth reveals the strategy to recognise hidden talent. Learn from Vamana's restraint the critical art of timing your influence. Understand why Sukadeva's presence — not his position — commanded true respect. Grounded in scriptural authority but focused on real-world results, this book includes Sanskrit verses with Devanagari script and contextual translation. It is not a retelling of mythology. It is a synthesis of ancient insight and practical leadership action.",
    themes: ['Dashavatara', 'Srimad Bhagavatam', 'Hidden Talent', 'Ancient Wisdom', 'Sanskrit', 'Leadership Transformation', 'Mythology and Management'],
    series: true,
    amazonUrl: 'https://amzn.in/d/01mB8NQ9',
    coverImage: '/images/books/beyond-the-surface.jpg',
  },
  {
    slug: 'lead-with-integrity',
    title: 'Lead with Integrity',
    subtitle: 'Master the Art of Truthfulness, Build Trust Through Virtuous Leadership, Uphold Righteousness',
    tagline: 'Master truthfulness and build trust through the life and values of Lord Rama from the Ramayana.',
    description:
      'Drawing from the life of Lord Rama in the Ramayana, this book bridges ancient and modern to offer a practical guide for ethical leadership. Includes real-world parallels from Microsoft, Patagonia, and Johnson and Johnson. Covers psychometric tools like VIA Character Strengths and MBTI.',
    seoDescription:
      "In an age of rapid change and relentless pressure, integrity is often the first casualty. Yet without it, leadership crumbles. Lead with Integrity invites you on a journey to rediscover what it truly means to lead — with character, with clarity, and with courage. Drawing from the life of Lord Rama, the legendary leader of the Ramayana, this book bridges the ancient and the modern to offer a deeply practical guide for corporate leaders, managers, and entrepreneurs. Through powerful storytelling and real-world corporate case studies — including parallels from Microsoft, Patagonia, and Johnson and Johnson — it reveals how values-driven leadership is not just idealistic. It is strategic, sustainable, and transformative. You will learn how to make ethical decisions under pressure without compromising results, build trust and loyalty by honouring your commitments, balance personal ambition with the long-term wellbeing of your team, and strengthen your leadership through accountability, transparency, and self-awareness. The book also integrates psychometric tools including VIA Character Strengths and MBTI, and offers a competency framework covering truthfulness, reliability, empathy, and more. You do not need to choose between results and principles. With the right mindset and tools, you can lead with both.",
    themes: ['Integrity', 'Ramayana', 'Lord Rama', 'Ethical Leadership', 'Trust', 'Values-Driven Leadership', 'Corporate Culture'],
    series: true,
    amazonUrl: 'https://amzn.in/d/0fClzHrL',
    coverImage: '/images/books/lead-with-integrity.jpg',
  },
  {
    slug: 'the-lamp-and-the-shadow',
    title: 'The Lamp and the Shadow',
    subtitle: 'Explorations in Knowledge, Ignorance, and the Paradoxes of Growth',
    tagline: 'Explorations in knowledge, ignorance, and the paradoxes of growth. Draws from the Isha Upanishad.',
    description:
      "A reflective story-rich exploration of how knowledge, while essential, often creates new blind spots. Draws from the Isha Upanishad's perspective on Vidya and Avidya, and leadership lessons from Abhimanyu, Shiva-Parvati, and Kabir. Twenty short powerful chapters.",
    seoDescription:
      "In a world obsessed with clarity and control, this book asks a deeper question: what do we fail to see in the light of what we know? The Lamp and the Shadow is a reflective, story-rich exploration of how knowledge — while essential — often creates new blind spots. Drawing from the Isha Upanishad's profound teaching on Vidya and Avidya, and weaving in leadership lessons from Abhimanyu, Shiva-Parvati, and Kabir, this book illuminates the paradoxes that every leader, coach, and lifelong learner must confront. Across twenty short, powerful chapters — each one serving as a lamp that exposes the shadow beneath — you will encounter the unseen dangers of overconfidence, why experience can mislead as much as it teaches, how public persona and succession planning shape long-term success, and why asking smarter questions leads to wiser strategy. This is not a book of answers. It is a mirror to your assumptions, a question to your conclusions, and a companion for your next step forward. If you are a leader, coach, entrepreneur, or lifelong learner who believes that growth begins with honest self-examination, this book will speak directly to you.",
    themes: ['Isha Upanishad', 'Knowledge and Ignorance', 'Vidya and Avidya', 'Blind Spots', 'Self-Awareness', 'Ancient Indian Philosophy', 'Growth Mindset'],
    series: false,
    amazonUrl: 'https://amzn.in/d/0dfjvlWu',
    coverImage: '/images/books/the-lamp-and-the-shadow.jpg',
  },
  {
    slug: 'master-execution-gap',
    title: 'Master Execution Gap',
    subtitle: 'Close Critical Gaps, Build Accountability, Align Action Plans, and Deliver Strategic Results',
    tagline: 'Close critical gaps, build accountability, and deliver strategic results using the OKR framework.',
    description:
      'A practical roadmap to bridge the gap between strategy and execution using the OKR framework. Covers setting SMART goals, building accountability with RACI charts, cascading priorities across teams, tracking progress with dashboards, and shifting from micromanagement to a culture of ownership.',
    seoDescription:
      "Most organisations do not fail because of poor ideas. They fail because of a gap between strategy creation and execution. Research shows that 70 percent of strategic initiatives fail, and 95 percent of employees are unclear about their role in achieving organisational goals. The result is wasted time, frustrated teams, and missed opportunities. Master Execution Gap gives you a clear, practical roadmap to bridge this gap using the proven Objectives and Key Results framework. You will learn how to transform vague ideas into actionable, measurable, and time-bound objectives, clarify roles and ensure ownership using RACI charts, cascade top-level priorities into team and individual goals, track progress through dashboards and weekly check-ins, and shift from micromanagement to a culture of ownership and results. Packed with real-world case studies, actionable tools, and step-by-step frameworks, this book helps leaders and teams turn strategy into measurable outcomes, improve collaboration, eliminate silos, and achieve faster and more impactful results. Whether you are a founder, a department head, or an operations leader, this book gives you the system to close the execution gap for good.",
    themes: ['OKR Framework', 'Strategy Execution', 'Accountability', 'RACI', 'Goal Setting', 'Leadership', 'Organisational Alignment'],
    series: false,
    amazonUrl: 'https://amzn.in/d/06Aq42fD',
    coverImage: '/images/books/master-execution-gap.jpg',
  },
  {
    slug: 'awaken-your-potential',
    title: 'Awaken Your Potential',
    subtitle: 'Discover Transformative Paths to Personal and Professional Growth Through Actionable Insights',
    tagline: 'A structured roadmap across four dimensions of personal and professional development.',
    description:
      'A structured roadmap across four dimensions: navigating your network, cognitive discovery, symbiotic success, and bridging performance gaps. Each section stands as an independent guide with Growth Steps after every chapter for immediate action.',
    seoDescription:
      "Are you feeling stuck in your personal or professional life, struggling to find the right path forward? The modern world throws countless challenges at us — leaving many people overwhelmed, uncertain, and unable to bridge the gap between where they are and where they want to be. Awaken Your Potential provides a structured roadmap to overcome these obstacles through four powerful dimensions of personal development. The first dimension, Navigate Your Network, teaches you to map and leverage your personal and professional ecosystem and build symbiotic relationships that multiply success. The second, Cognitive Discovery, helps you develop curiosity with purpose, master complementary skills, and find strategies for quick wins you can apply immediately. The third, Symbiotic Success, unlocks the power of collaboration and shows you how to lead others effectively while bridging performance gaps through improved team dynamics. The fourth, Performance Gaps, helps you identify the distance between your current state and your goals, overcome the obstacles that sabotage success, and create a personalised action plan for sustained growth. Unlike books that deal in theory, every chapter of Awaken Your Potential includes practical Growth Steps for immediate action. Whether you are an entrepreneur, a corporate professional, or someone simply seeking to evolve, this book will serve as your personal coach — offering insight, reflection, and a clear path to unlocking your full potential.",
    themes: ['Personal Development', 'Growth Mindset', 'Networking', 'Collaboration', 'Performance', 'Self-Improvement', 'Professional Growth'],
    series: false,
    amazonUrl: 'https://amzn.in/d/015kSqih',
    coverImage: '/images/books/awaken-your-potential.jpg',
  },
]

export function getBookBySlug(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug)
}

export const SERIES_BOOKS = BOOKS.filter((b) => b.series)
export const OTHER_BOOKS = BOOKS.filter((b) => !b.series)
