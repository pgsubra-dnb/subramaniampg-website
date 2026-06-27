const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

const entries = [
  {
    id: 'career-embiggen-consulting',
    slug: 'embiggen-consulting',
    order: 1,
    role: 'Chief Growth Enabler',
    organisation: 'Embiggen Consulting LLP',
    city: 'Chennai',
    startDate: 'Jul 2023',
    endDate: null,
    isCurrent: true,
    description: `I offer a range of specialized coaching and consulting services, including Executive Coaching, Growth Coaching, OKR (Objectives and Key Results), and strategy consulting. My approach is built on years of experience guiding leaders through complex challenges, from refining leadership skills to driving business growth and operational efficiency. Having worked across diverse industries and business environments, I bring a practical, results-oriented perspective to each engagement.

My expertise in OKR methodology helps clients align their teams with clear objectives and measurable outcomes, ensuring accountability and focus. Through Growth Coaching, I help organizations and individuals identify opportunities for expansion while navigating the complexities of scaling. My experience in executive roles equips me to guide senior leaders in sharpening their leadership skills, improving decision-making, and fostering high-performance teams.

Whether it's shaping strategy, driving operational improvements, or developing leadership capabilities, my coaching is designed to help clients achieve lasting success.`,
  },
  {
    id: 'career-enerji-amnet',
    slug: 'enerji-amnet',
    order: 2,
    role: 'Director',
    organisation: 'Enerji Systems Pvt Ltd / Amnet Systems Pvt Ltd / We Are Amnet',
    city: 'Chennai',
    startDate: 'Mar 2022',
    endDate: null,
    isCurrent: true,
    description: `In my role managing operations within the Enerji Group, I oversaw all functions except Sales and Marketing. This gave me extensive experience across diverse areas, including Content Design, Content Publishing, Digital Accessibility, and Data Management. Managing operations across multiple locations and cultures, I developed strong skills in employee engagement and business management, learning how to unite teams in different environments.

This journey was filled with both successes and challenges, which provided me with invaluable lessons on leading businesses through transitions. One of the most powerful strategies I deployed was the OKR (Objectives and Key Results) methodology. By setting clear objectives and measurable outcomes, I aligned teams across regions, ensuring a unified focus on goals. As a coach, I now guide leaders in mastering OKRs to drive accountability and growth in their organizations.

I also implemented Six Sigma methodologies to improve processes and increase operational efficiency. This approach allowed me to reduce inefficiencies and optimize productivity, leading to significant performance improvements. These skills are central to my coaching approach, where I help clients apply data-driven strategies to enhance their operations.

Additionally, I gained exposure to Diversity, Equity, and Inclusion (DEI) initiatives and Sustainability strategies. Managing a diverse workforce taught me the importance of fostering inclusive environments that promote innovation and collaboration. Sustainability became a crucial factor in developing long-term business strategies. These insights now shape my coaching as I help leaders build sustainable, inclusive organizations.

This role gave me a well-rounded perspective on business management and operational excellence. Today, I use these experiences as a coach to help leaders navigate challenges, implement growth strategies, and build resilient, adaptable teams.`,
  },
  {
    id: 'career-amnet-coo',
    slug: 'amnet-coo',
    order: 3,
    role: 'Chief Operating Officer',
    organisation: 'Amnet Systems / Habiliss',
    city: 'Chennai',
    startDate: 'Oct 2015',
    endDate: 'Jun 2023',
    isCurrent: false,
    description: `In my role managing operations, I gained valuable exposure to the challenges and nuances of running a B2C business, both globally in the Virtual Assistant sector and within India's Self-Publishing industry. This experience allowed me to navigate different markets and understand the operational hurdles B2C businesses face. Managing these operations enhanced my ability to adapt to different environments and recognize the key factors driving customer engagement and satisfaction.

A significant aspect of my role was managing the closure of operations and overseeing the transfer of the business to another entity. This experience taught me the critical leadership skill of knowing when to exit a business. Understanding the timing of business decisions and ensuring smooth transitions were essential takeaways. These insights are central to my coaching practice, where I help leaders evaluate business sustainability and make strategic decisions about when to pivot or quit.

I also gained exposure to sales and marketing operations in a B2C environment, learning how these functions drive customer acquisition and growth. This experience deepened my appreciation for aligning operational goals with sales and marketing efforts to maximize impact.

By managing day-to-day operations, navigating business closures, and understanding sales dynamics, I developed a well-rounded perspective on leading in challenging environments. As a coach, I use these insights to guide clients through operational challenges, help them make strategic pivots, and align sales with operations to drive sustainable growth.

These experiences have shaped my coaching philosophy, enabling me to assist leaders in evaluating when to persist and when to exit — ensuring their businesses remain resilient in a fast-changing market.`,
  },
  {
    id: 'career-fresh01',
    slug: 'fresh01',
    order: 4,
    role: 'Director',
    organisation: 'Fresh01',
    city: 'Chennai',
    startDate: 'Sep 2014',
    endDate: 'Jul 2022',
    isCurrent: false,
    description: `At Fresh01, I served on the board on behalf of the Enerji Group of Companies in a primarily titular capacity. While my role was limited, I occasionally provided advisory support to the key person in the business, ensuring that the interests of the investors were safeguarded and that compliance standards were maintained. My involvement, though periodic, required a keen understanding of the company's strategic direction and investor relations.

This experience helped me sharpen my skills in providing targeted guidance while balancing stakeholder expectations. It also reinforced my ability to act as a trusted advisor, even in roles where direct influence is minimal. As a coach, this experience allows me to guide leaders in similar positions on how to effectively manage investor relations, maintain compliance, and provide strategic oversight, even in advisory or limited roles.`,
  },
  {
    id: 'career-vms-food',
    slug: 'vms-food',
    order: 5,
    role: 'Director',
    organisation: 'VMS Food and Beverages Services Pvt Ltd',
    city: 'Chennai',
    startDate: 'Dec 2008',
    endDate: 'Jul 2021',
    isCurrent: false,
    description: `At VMS, I served on the board on behalf of investors from Shriram Group of Companies, providing strategic oversight and advisory support. My primary responsibility was ensuring that the company's operations aligned with investor goals while focusing on profitability. I advised the Managing Director on key areas such as finance, quality, and plant operations, which strengthened my understanding of both operational and strategic management.

One of my key contributions was in food processing, where I helped improve both efficiency and profitability. This role enhanced my ability to balance operational output with maintaining high-quality standards. My involvement in overseeing profitability gave me insights into managing costs and optimizing resources — skills that are central to my coaching practice.

I also supported the Managing Director in navigating leadership challenges that affected multiple areas of the business. From enhancing plant operations to ensuring compliance with quality standards, my role across functions gave me a comprehensive view of business dynamics. This perspective is critical in my coaching approach, where I help leaders align different functions to achieve success.

My experience at VMS sharpened my ability to manage and advise businesses, especially in high-stakes environments where financial oversight and operational excellence are crucial. I now use these insights in my coaching practice, guiding clients through both day-to-day operations and long-term strategic decisions. Whether improving financial planning or enhancing operational efficiency, I empower leaders to make informed decisions that drive profitability and growth.

This experience has shaped my coaching philosophy, focusing on balancing operational discipline with strategic flexibility. I help leaders develop a mindset that fosters short-term success and long-term growth, ensuring they thrive in competitive environments.`,
  },
  {
    id: 'career-jeitosa',
    slug: 'jeitosa',
    order: 6,
    role: 'Senior Global Advisor APAC',
    organisation: 'Jeitosa Group International',
    city: 'Chennai',
    startDate: 'Feb 2007',
    endDate: 'Jan 2014',
    isCurrent: false,
    description: `During my partnership with Jeitosa Group International, I focused on HR regulations and compliance across Asia, with a specific emphasis on India. As part of their consulting team for a multinational corporation in Ireland, I gained valuable experience working with professionals from various countries. This exposure enhanced my understanding of different working patterns and cross-cultural dynamics.

This experience has deepened my ability to navigate diverse professional environments and manage complex international collaborations — skills that are crucial in my role as a coach. By working with global teams, I developed a keen understanding of cultural sensitivities, communication styles, and regulatory nuances, all of which I now apply to help clients thrive in multicultural settings.`,
  },
  {
    id: 'career-qimpro',
    slug: 'qimpro',
    order: 7,
    role: 'Principal Consultant',
    organisation: 'Qimpro Consultants Pvt Ltd',
    city: 'Chennai',
    startDate: 'Jun 2004',
    endDate: 'Sep 2015',
    isCurrent: false,
    description: `During my work on assignments related to Cost of Poor Quality and Six Sigma training, I had the privilege of collaborating with Mr. Suresh Lulla, a renowned figure in the quality management space. This experience gave me a deep understanding of how to drive process improvements and quality standards across various industries. I worked with prominent organizations like L&T, Vedanta, Suzlon, and Maini, gaining exposure to their systems and processes. This hands-on experience with large corporations allowed me to see firsthand how quality initiatives are implemented at scale, providing invaluable insights into the intricacies of managing operational efficiency and reducing defects.

I was also part of a panel of judges for several competitive events related to quality. This role deepened my understanding of the benchmarks for excellence in quality management and gave me the opportunity to assess, evaluate, and recognize best practices across various industries.

This combination of practical experience and exposure to large-scale operations has strengthened my capabilities as a coach. I now bring a comprehensive approach to guiding leaders on improving quality, streamlining processes, and embedding Six Sigma principles within their organizations. My experience judging quality events has also sharpened my analytical skills, which I use to help clients identify areas for improvement and develop strategies for long-term success in quality management.`,
  },
  {
    id: 'career-take-solutions',
    slug: 'take-solutions',
    order: 8,
    role: 'Consultant',
    organisation: 'TAKE Solutions Limited',
    city: 'Chennai',
    startDate: 'Dec 2000',
    endDate: 'Apr 2015',
    isCurrent: false,
    description: `At Take Solutions, I worked closely with the founding team to establish key organizational processes and systems. My primary contribution was in setting up HR processes that supported the company's growth. I also played a major role in implementing and certifying CMMI (Capability Maturity Model Integration) and PCMM (People Capability Maturity Model), helping to improve both operational and people management practices. These experiences gave me a deep understanding of how to create structured systems within an evolving organization, which I now bring to my coaching practice.

As a senior member of the team, I was actively involved in listing the company on the stock exchange. This provided firsthand experience in managing organizational transitions, overseeing financial compliance, and understanding the complexities involved in expansion. Today, I apply these insights to help clients navigate similar transitions in their organizations.

I also traveled to the USA and Malaysia to train employees, which gave me exposure to cross-cultural collaboration and team management on an international scale. These global experiences enhanced my ability to lead teams in diverse environments, a skill I now use to coach leaders in multinational settings.

For a significant period, I led both the HR and Quality functions, which gave me a comprehensive view of how different areas within an organization must align for success. This dual role strengthened my ability to manage organizational transitions, balancing both people development and operational excellence. As a coach, I draw on these experiences to help clients lead their teams effectively, ensuring their systems and processes are aligned for growth.

Having been part of such a dynamic environment, I gained a holistic perspective on how organizations must operate during periods of change. These insights allow me to guide leaders and teams through transformation, helping them optimize performance and sustain growth.`,
  },
  {
    id: 'career-apar',
    slug: 'apar',
    order: 9,
    role: 'CEO',
    organisation: 'Apar Management Consultants',
    city: 'Chennai',
    startDate: 'Jan 1995',
    endDate: 'Dec 2017',
    isCurrent: false,
    description: `I have worked extensively in management system consulting, covering disciplines such as Quality Management Systems (QMS), Information Security Management (ISMS), Environmental Management Systems (EMS), Occupational Health and Safety (OHSAS), HACCP, payroll management, and hiring consulting. I've also been involved in system certification, Six Sigma, and Process Improvement consulting. These experiences have allowed me to gain a deep understanding of how these systems contribute to organizational success.

My work spans India, where I consulted for diverse industries ranging from manufacturing and healthcare to IT and logistics. This exposure has given me the ability to address the unique challenges and opportunities faced by different sectors. As a coach, I use this experience to tailor solutions that meet the specific needs of my clients.

I have also consulted internationally, with assignments in Iran, the Middle East, Ireland, Malaysia, and the US. These global experiences have helped me develop a keen understanding of cultural differences, international regulations, and the challenges of managing teams across different regions. This international exposure informs my coaching, helping clients navigate global business dynamics while maintaining local relevance.

Having worked across nearly every sector of business, I bring a comprehensive perspective on how organizations function and grow. I help leaders and teams overcome complex challenges, whether through process improvements, system alignment, or organizational transformation. My consulting background equips me to offer practical, results-oriented coaching that drives sustainable growth and operational excellence.

By integrating my expertise in management systems and process improvement, I help clients build scalable, adaptable systems. My work across industries and geographies gives me the ability to provide insights that enhance organizational effectiveness and performance.`,
  },
  {
    id: 'career-asap',
    slug: 'asap',
    order: 10,
    role: 'Owner and CEO',
    organisation: 'ASAP Management Consultants Pvt Ltd',
    city: 'Chennai',
    startDate: 'Feb 1995',
    endDate: 'Apr 2017',
    isCurrent: false,
    description: `I have worked extensively in management system consulting, covering disciplines such as Quality Management Systems (QMS), Information Security Management (ISMS), Environmental Management Systems (EMS), Occupational Health and Safety (OHSAS), HACCP, payroll management, and hiring consulting. I've also been involved in system certification, Six Sigma, and Process Improvement consulting. These experiences have allowed me to gain a deep understanding of how these systems contribute to organizational success.

My work spans India, where I consulted for diverse industries ranging from manufacturing and healthcare to IT and logistics. This exposure has given me the ability to address the unique challenges and opportunities faced by different sectors. As a coach, I use this experience to tailor solutions that meet the specific needs of my clients.

I have also consulted internationally, with assignments in Iran, the Middle East, Ireland, Malaysia, and the US. These global experiences have helped me develop a keen understanding of cultural differences, international regulations, and the challenges of managing teams across different regions. This international exposure informs my coaching, helping clients navigate global business dynamics while maintaining local relevance.

Having worked across nearly every sector of business, I bring a comprehensive perspective on how organizations function and grow. I help leaders and teams overcome complex challenges, whether through process improvements, system alignment, or organizational transformation. My consulting background equips me to offer practical, results-oriented coaching that drives sustainable growth and operational excellence.

By integrating my expertise in management systems and process improvement, I help clients build scalable, adaptable systems. My work across industries and geographies gives me the ability to provide insights that enhance organizational effectiveness and performance.`,
  },
  {
    id: 'career-threads-of-excellence',
    slug: 'threads-of-excellence',
    order: 11,
    role: 'CEO',
    organisation: 'Threads of Excellence Knowledge Management LLP',
    city: 'Chennai',
    startDate: 'Feb 2014',
    endDate: 'Apr 2017',
    isCurrent: false,
    description: `I have worked extensively in management system consulting, covering disciplines such as Quality Management Systems (QMS), Information Security Management (ISMS), Environmental Management Systems (EMS), Occupational Health and Safety (OHSAS), HACCP, payroll management, and hiring consulting. I've also been involved in system certification, Six Sigma, and Process Improvement consulting. These experiences have allowed me to gain a deep understanding of how these systems contribute to organizational success.

My work spans India, where I consulted for diverse industries ranging from manufacturing and healthcare to IT and logistics. This exposure has given me the ability to address the unique challenges and opportunities faced by different sectors. As a coach, I use this experience to tailor solutions that meet the specific needs of my clients.

I have also consulted internationally, with assignments in Iran, the Middle East, Ireland, Malaysia, and the US. These global experiences have helped me develop a keen understanding of cultural differences, international regulations, and the challenges of managing teams across different regions. This international exposure informs my coaching, helping clients navigate global business dynamics while maintaining local relevance.

Having worked across nearly every sector of business, I bring a comprehensive perspective on how organizations function and grow. I help leaders and teams overcome complex challenges, whether through process improvements, system alignment, or organizational transformation. My consulting background equips me to offer practical, results-oriented coaching that drives sustainable growth and operational excellence.

By integrating my expertise in management systems and process improvement, I help clients build scalable, adaptable systems. My work across industries and geographies gives me the ability to provide insights that enhance organizational effectiveness and performance.`,
  },
  {
    id: 'career-kancor',
    slug: 'kancor',
    order: 12,
    role: 'Assistant Manager',
    organisation: 'Kancor Flavours and Extracts Limited',
    city: 'Kochi',
    startDate: 'Oct 1992',
    endDate: 'Mar 1995',
    isCurrent: false,
    description: `At Kancor Flavours and Extracts, I managed Environment, Safety, and EDP, playing a key role in transforming the company's environmental compliance. Initially, the company faced legal challenges, but under my leadership, we resolved them and earned recognition as the best environment-managed company in the state. This experience sharpened my ability to lead through regulatory challenges and implement sustainable solutions — skills I now apply when coaching leaders facing complex organizational challenges.

Safety management was another critical responsibility, as the plant operated under the Explosive Act, requiring strict safety measures. I developed both onsite and offsite emergency plans, ensuring safety for the workforce and community. Leading safety in such a high-risk environment taught me how to manage high-stakes operations — skills I emphasize in coaching leaders who must balance safety and operational efficiency.

I also led the development of an ERP system from scratch, which integrated multiple business functions and served the company effectively for nearly a decade. This process optimization experience has been invaluable in coaching teams to enhance efficiency and scalability.

Mentoring was another key aspect of my role. I developed a fresher to take over after my departure, ensuring leadership continuity. This emphasized the importance of nurturing future leaders — a principle central to my coaching philosophy.

Additionally, I worked closely with union leaders to balance management goals with employee needs. This enhanced my conflict resolution and negotiation skills, which I now use in coaching leaders to lead with empathy while achieving business objectives.

These experiences have shaped my leadership approach, blending technical expertise with safety and people management. As a coach, I draw on these insights to help clients navigate challenges, improve processes, and build high-performing teams that foster sustainable growth.`,
  },
  {
    id: 'career-bakelite-hylam',
    slug: 'bakelite-hylam',
    order: 13,
    role: 'Assistant Manager',
    organisation: 'Bakelite Hylam Limited',
    city: 'Hyderabad',
    startDate: 'Feb 1990',
    endDate: 'Oct 1992',
    isCurrent: false,
    description: `At Bakelite Hylam, I began as a Technical Assistant to the General Manager, which gave me exposure to both strategic decision-making and operational oversight. Later, I took on the responsibility of managing phenolic laminate production, a critical product line that required balancing technical expertise with team leadership. I led data analysis and project execution, especially in transitioning R&D innovations into efficient production processes, which sharpened my strategic planning and operational management skills.

Working closely with employees and union leaders, I developed strong negotiation and conflict resolution abilities, which were critical in maintaining smooth operations while fostering collaboration and trust. My role also involved conducting plant trials and leading initiatives to improve production efficiency, which demanded a deep understanding of process optimization and problem-solving. This helped me strengthen my ability to lead continuous improvement projects, a skill I now leverage in coaching others to enhance their leadership impact.

Another critical aspect of my role was managing the treatment of polluting chemicals. This responsibility deepened my understanding of sustainability and long-term planning, which I now emphasize in my coaching to help leaders drive both business growth and social responsibility. Additionally, managing production costing and the Excise department enhanced my financial acumen, reinforcing the importance of financial control in overall business performance. These experiences provided me with a unique blend of technical, financial, and people management skills, making me a more effective coach.

As a coach, I draw on these experiences to help individuals and organizations navigate complex challenges, improve operational efficiency, and build cohesive teams. My focus is on empowering clients to achieve sustainable growth, while balancing the needs of both people and process, to create lasting success.`,
  },
  {
    id: 'career-itc-bhadrachalam',
    slug: 'itc-bhadrachalam',
    order: 14,
    role: 'Engineer',
    organisation: 'ITC Bhadrachalam Paperboards Limited',
    city: '',
    startDate: 'Jul 1986',
    endDate: 'Feb 1990',
    isCurrent: false,
    description: `During my tenure at ITC Bhadrachalam in the Soda Recovery Boiler department, I was entrusted with managing the shift operations of a complex and highly hazardous process. Overseeing a team of 75 employees in each shift, I handled the operations of a high-temperature, explosive boiler system, ensuring both efficiency and safety at every turn. In addition, I managed the handling of chlorine cylinders — an extremely dangerous material — where precision and attention to detail were critical to prevent accidents. This responsibility honed my crisis management skills, enhanced my decision-making under pressure, and developed my ability to lead in high-stakes environments.

Working in such a dynamic and potentially volatile environment, I learned the importance of balancing operational needs with people management. Employee engagement became a key focus, and I initiated programs to build morale, increase commitment, and create a sense of belonging among my team, both inside and outside the factory. Handling labor unions added another layer to my leadership experience. The ability to mediate, negotiate, and foster a cooperative relationship with unions helped me develop patience, empathy, and a deep understanding of people's motivations.

These experiences are central to my approach as a coach. They have equipped me with practical insights into managing diverse teams, handling conflict, driving performance under pressure, and engaging people effectively. My time managing hazardous operations and leading a large workforce gave me a solid foundation for helping individuals and organizations thrive in challenging environments. As a coach, I bring these lessons forward to guide others in developing resilience, improving their leadership skills, and achieving their full potential while maintaining safety, balance, and strategic focus.`,
  },
]

const mutations = entries.map(e => ({
  createOrReplace: {
    _type: 'careerEntry',
    _id: e.id,
    role: e.role,
    organisation: e.organisation,
    city: e.city,
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    isCurrent: e.isCurrent,
    description: e.description,
    slug: { _type: 'slug', current: e.slug },
    order: e.order,
  }
}))

const res = await fetch(`https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
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
  console.log('Done. All 14 career entries seeded.')
} else {
  console.error('Failed:', data)
}
