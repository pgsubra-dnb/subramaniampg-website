const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

// Schema fields: quote, name, designation (see sanity/schemas/testimonial.ts)
const testimonials = [
  { id: 'testimonial-001', quote: 'PGS is a truly inspiring person who gave me the opportunity to start my Career as a HR person. He is well known for his best practices in all the service that he renders. He has built a rock solid reputation for himself in the industry. He has been a mentor who paved the way for the success of many individuals.', name: 'Yogesh S', designation: 'HR Leader' },
  { id: 'testimonial-002', quote: 'Subbu, as we call him has been associated with us for a long time and have helped us to implement various initiatives. His intricate knowledge of the processes, his ability to understand the challenges that the organisation or a department goes through and offer viable solutions are his greatest strength. Had couple of opportunities to work along with him on various initiatives and it was just not the enjoyment of being working with him but a great learning too!', name: 'Charan Kumar Shetty K', designation: 'HR Leader and Board Member' },
  { id: 'testimonial-003', quote: 'PGS sir is my Guru and my Mentor in ASAP Management and I learnt the Quality Management from him. I always admire his talent and knowledge. He is very sharp and explains things very easily. The belief he has on his team is amazing. He inspired me to be a true professional and shaped my career.', name: 'Ramakrishnan M', designation: 'Manager, Environment Facility and Projects at BMW' },
  { id: 'testimonial-004', quote: 'PGS has immense knowledge in diverse areas of both IT and Manufacturing areas. His training is full of real time examples and case studies that would enable even a fresher to understand with ease. He also provides immediate feedback by quickly judging individual capabilities and their areas for improvement. We are sure that his passion towards studying and exhibiting knowledge would continue as he progresses life.', name: 'Pradeep Chellakani', designation: 'Vice President Quality at ValGenesis' },
  { id: 'testimonial-005', quote: 'It has been a pleasurable journey working with PGS as fondly called. He brings with him a rich and vast experience in Process Management, IT and HR consulting expanse. A trainer par excellence whose workshops are cherished and provides the desired ROI to the participants and the organisation. He has spearheaded several quality initiatives with great ease and provided the desired outcome for our organisation. An individual who will provide a holistic 360 degree consultative approach to his stakeholders by understanding the need, culture and pain points. One can truly benefit from his association.', name: 'Sucheta Shetty', designation: 'Human Capital Function, People and Culture' },
  { id: 'testimonial-006', quote: 'PGS as I call him was introduced to me as a quality management consultant. Right from day one about 8 years back, he has been extremely great person to work with. His highly motivating lectures for our employees has really helped our company. His company has been constantly delivering what we need as a consultant to help us improve our quality.', name: 'Mukunth Venkatesan', designation: 'Founder, Director and CEO at Agaram Technologies' },
  { id: 'testimonial-007', quote: 'I met PGS first time in Chennai in 1997 and I knew him as a placement consultant those days. He helped me in getting a placement and later he associated with me as a quality management consultant. In these interactions, he was a workaholic, very dynamic, sincere in his commitments, simple in his activities and honest to all.', name: 'Siva Shanmugam S', designation: 'Director, Polyhedron Laboratories' },
  { id: 'testimonial-008', quote: 'I have known PGS now for about a decade and remain impressed with his commitment to Quality as a subject and his professionalism. His attitude to keep learning is amazing and even more special his desire to implement his learning. PGS is clear in his thinking and articulate in expression. If you are his client you are in good hands. If you are a friend count yourself lucky. Not many like PGS are around.', name: 'Anshuman Tiwari', designation: 'Global Experience Owner for HR at GSK' },
  { id: 'testimonial-009', quote: 'PG is a great process guy, he understands what makes people go off process and why they find it difficult to learn and stick to process. That is his biggest success. He does it at a reasonable cost and is effective in implementation.', name: 'Sanjaya Mariwala', designation: 'Executive Chairman and Managing Director, OmniActive Health Technologies' },
  { id: 'testimonial-010', quote: 'Subbu as we fondly call him has been a fantastic service provider — in fact more a business partner. While at Mafoi he contributed in great measure to our success. A thorough professional and a very dependable service provider.', name: 'Ajay Mallapurkar', designation: 'Founder and Chairman at Recruit CRM' },
  { id: 'testimonial-011', quote: 'PGS is a highly focused person on Process Quality and Delivery. He is passionate in bringing about transformation. He adds value to organization through his matured interventions.', name: 'Sai Prasanna', designation: 'Director at Management Consulting' },
  { id: 'testimonial-012', quote: 'P.G. Subramaniam takes his given task seriously and devotes his full concentration till he completes it. He is a good listener and reasons out all his findings with good examples and illustrations. He never lets any stone unturned. He is very inventive and thinks out of the box to bring solutions to problems which are acceptable to all. He is a pleasant and lovely person who is very cool and always approachable.', name: 'Uma Nabil', designation: 'Senior Manager Manufacturing Operations' },
  { id: 'testimonial-013', quote: 'PGS, whose ability to get things done with the highest level of perfection and statistical representation is greatly admired by many. His ability to train irrespective of the complexity of the program is commendable. I have gained insights on various aspects by just watching him and working with him.', name: 'Priya Aldam', designation: 'Vice President Learning and Development at Navitas Life Sciences' },
  { id: 'testimonial-014', quote: 'Sir, popularly known as PGS, a well-organized, highly professional and energetic person. His training sessions would be lively and very interactive with his impeccable knowledge on the subject.', name: 'Uma', designation: 'Cybersecurity and Risk Management' },
  { id: 'testimonial-015', quote: 'PGS — high energy personality having highest level of professionalism and detailing in his approach. He has a very logical and systematic approach to work. I rate him as a highly knowledgeable and approachable person. I have worked with him for few assignments.', name: 'Bobby Abraham Mathew', designation: 'VP HR at ESAF Small Finance Bank' },
  { id: 'testimonial-016', quote: 'P G Subramaniam brings a high level of passion and energy to his work. His understanding of HR Processes and Policies are amazing. He has a very logical and systematic approach to work. I found him great fun to work with.', name: 'Vaani Anand', designation: 'Writer, Biographer and Culture Specialist' },
  { id: 'testimonial-017', quote: 'Subbu brings tremendous passion, energy and dedication to his work. We take pride in having a partner like Subbu. He does not work like an outsider. He owns up assignments with more commitment than at times your own employee would own up.', name: 'Aditya Mishra', designation: 'Building IPO Bound CIEL HR Group' },
]

async function seed() {
  if (!TOKEN) {
    console.error('SANITY_WRITE_TOKEN is not set')
    process.exit(1)
  }

  const mutations = testimonials.map(t => ({
    createOrReplace: {
      _type: 'testimonial',
      _id: t.id,
      quote: t.quote,
      name: t.name,
      designation: t.designation,
    }
  }))

  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  })

  const data = await res.json()
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(data, null, 2))

  if (res.ok) {
    console.log('\nDone. All 17 testimonials seeded.')
  } else {
    console.error('\nFailed:', data)
  }
}

seed()
