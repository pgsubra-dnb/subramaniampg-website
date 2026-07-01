import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
// Load .env.local manually (dotenv may not be available)
try {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {}

const client = createClient({
  projectId: 'vpwi5zan',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

// ─── BOOKING LINK ─────────────────────────────────────────────────────────────

const bookingLink = {
  _id: 'raci-expert-guidance-booking',
  _type: 'bookingLink',
  label: 'RACI Decoded – Expert Guidance Call',
  url: 'https://cal.id/pgs/expert-guidance',
}

// ─── LESSONS ──────────────────────────────────────────────────────────────────

const lessons = [
  // MODULE 1 — What is RACI and Why It Matters
  {
    _id: 'raci-lesson-1-1',
    _type: 'lesson',
    title: 'What RACI Is and Why Role Clarity Matters',
    order: 1,
    body: `Picture a product launch that went wrong. Not because the product was bad. Not because the team lacked talent. It went wrong because three different people thought they were responsible for getting legal sign-off, and none of them actually did it. The marketing team found out about the delay only when the launch date had already been announced to customers. Senior leadership found out when a customer complained.

Nobody was lazy. Nobody was incompetent. The project simply had no clarity about who was supposed to do what, who had the final say, who needed to be asked before decisions were made, and who simply needed to know what was happening.

This is the most common failure mode in projects of every size — not a skills problem, but a clarity problem. RACI exists to solve exactly this.

RACI is a framework for assigning roles and responsibilities on any task or project. The letters stand for:

R — Responsible: The person who does the work.
A — Accountable: The person who owns the outcome and answers for it.
C — Consulted: People whose input is sought before or during the work — a two-way conversation.
I — Informed: People who are told what is happening — a one-way update.

These four roles, applied consistently across a project, remove the ambiguity that caused the product launch story above to go wrong.

RACI is also known by a more formal name — the Responsibility Assignment Matrix, or RAM. The "matrix" part refers to how it is typically displayed: tasks listed down the side, people or teams listed across the top, and each cell in the grid filled with one of the four letters.

This visual format is what makes RACI so effective. A complex project with dozens of tasks and many stakeholders can be summarised in a single page that anyone can scan and understand in minutes.

Think about what happens when roles are unclear on a project.

Duplicated effort: Two people quietly do the same task because each assumed the other was not doing it, or neither assumed anyone was doing it so they both stepped in defensively.

Dropped tasks: Everyone assumes someone else has it covered, so nobody actually does it. This is precisely what happened in the legal sign-off story above.

Decision paralysis: When it is unclear who has the authority to make a call, decisions get stuck in endless discussion because nobody feels they can simply decide and move forward.

Conflict: When something goes wrong, and nobody was clearly accountable, the natural response is finger-pointing. This damages trust within a team far more than the original mistake did.

RACI directly addresses all four of these problems.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Think of a recent project where role confusion caused a problem. Which of the four failure modes — duplicated effort, dropped tasks, decision paralysis, or conflict — was most visible? What would a RACI matrix have changed?',
    },
  },
  {
    _id: 'raci-lesson-1-2',
    _type: 'lesson',
    title: 'The Real Cost of Ambiguity',
    order: 2,
    body: `It is worth pausing on just how expensive role ambiguity actually is, because the cost is rarely visible in the moment it happens.

A mid-sized agency once tracked, over a single quarter, every instance where a deliverable was late, redone, or escalated to a senior leader to resolve a disagreement. When they dug into the root cause of each one, more than half traced back to the same underlying issue — nobody had been clearly told they owned that particular outcome. Not a shortage of talent. Not a shortage of effort. A shortage of clarity about who was holding the ball.

The team estimated that quarter alone cost them roughly three weeks of combined rework time across the agency — time that could have gone toward new client work instead of redoing avoidable mistakes. That is the real cost of skipping role clarity. It rarely shows up as one dramatic failure. It shows up as a slow, steady drag of rework, delay, and friction that adds up over months.

This is why RACI is worth the modest upfront time it takes to set up. The investment is small. The return — in avoided rework, avoided conflict, and faster decisions — compounds over the life of a project.

RACI in practice delivers four compounding benefits:

Role clarity: Each person knows exactly what is expected of them on a given task — whether they need to do the work, sign off on it, give input, or simply stay informed.

Improved communication: RACI tells you exactly who to talk to about what. Need technical input on a decision? Check who is Consulted. Need to update someone on progress? Check who is Informed.

Accountability: Every task has exactly one Accountable person. When a deadline is missed or a deliverable falls short, there is no ambiguity about who owns that outcome.

Workflow optimisation: When you map out a project using RACI, patterns become visible. If one person is Consulted on every single task, that is a sign they are a bottleneck. If a task has three people marked Responsible, that is a sign the task needs to be broken down further.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'The primary cost of role ambiguity in organisations typically shows up as one large, visible failure rather than a slow accumulation of rework and delay.',
      isTrue: false,
      explanation: 'Role ambiguity usually surfaces as ongoing drag — rework, missed handoffs, repeated escalations — not as a single dramatic moment. The cost is real but rarely visible in any one incident, which is exactly why it persists.',
    },
  },
  {
    _id: 'raci-lesson-1-3',
    _type: 'lesson',
    title: 'When to Use RACI — and When Not To',
    order: 3,
    body: `RACI is most valuable in situations with some complexity — multiple people involved, cross-functional dependencies, or higher stakes if something is missed. A product launch, a software development project, a marketing campaign with several teams involved, an organisational restructuring — these are all situations where RACI earns its place.

Not every task needs a RACI matrix. If you are the only person doing something, or if a task is simple enough to fit on a basic to-do list, building a full RACI matrix adds unnecessary process. The goal is always clarity, not bureaucracy. If a simple checklist already gives everyone the clarity they need, that is the right tool for that job.

A good rule of thumb: if a task involves more than two or three people, has dependencies between people, or has meaningfully high stakes if something is dropped, RACI is worth the few minutes it takes to set up.

Go back to the opening story. If that project had spent fifteen minutes at the start mapping out who was Responsible for legal sign-off, who was Accountable for the overall launch, who needed to be Consulted along the way, and who simply needed to be Informed — the entire delay, and the customer complaint that followed, would likely never have happened.

That is the promise of RACI. Not more process for its own sake, but exactly enough structure to prevent the kind of confusion that quietly derails good work.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Name one current or upcoming project in your work. Does it meet the RACI threshold — more than two or three people involved, cross-functional dependencies, or high stakes if something is missed? What would be the first task you would add to a RACI matrix for it?',
    },
  },

  // MODULE 2 — The Four Roles Explained
  {
    _id: 'raci-lesson-2-1',
    _type: 'lesson',
    title: 'Responsible and Accountable — The Critical Distinction',
    order: 1,
    body: `A mid-sized company was redesigning its website. The Project Manager, a relatively junior team member, was told she was Accountable for the redesign. The lead designer — far more senior, with twenty years of experience — was marked Responsible for the actual design work.

At the first review meeting, the designer presented work that did not match the brief. The Project Manager pushed back and asked for changes. The designer, visibly uncomfortable, said: "You're telling me what to do? I have two decades of experience."

The Project Manager held her ground. "I'm not telling you how to design. I'm accountable for this project meeting the brief and the deadline. That's my role. Your role is doing the design work, and right now it doesn't match what we agreed."

This moment is exactly what RACI is designed to make clear before it becomes a conflict. Seniority does not determine who is Accountable. The task does.

The Responsible role belongs to whoever actually executes the task — the person or team with their hands on the work. To be Responsible for something, you need two things: the skills to do the work, and the resources or time to complete it. There can be more than one Responsible person on a task, but if coordination itself becomes difficult, that is usually a sign the task needs to be broken into smaller pieces.

The Accountable person is answerable for whether the task succeeds or fails. They do not necessarily do the work themselves — but they ensure it gets done, meets the required standard, and is delivered on time.

The single most important rule in RACI: every task must have exactly one Accountable person. Not zero. Not two. Exactly one.

Why does this matter so much? Because accountability that is shared between two people quietly becomes accountability that belongs to nobody.

Responsible is about doing. Accountable is about owning.

A surgeon performing an operation is Responsible. The hospital's head of surgery, who is answerable if something goes wrong with that operation, is Accountable — even though they were not the one holding the scalpel.

A junior team member can absolutely be Accountable for a task, while a far more senior colleague is Responsible for doing the work. Accountability is about ownership of an outcome, not about hierarchy or experience.

For Responsible: does this person or team have the skill and the capacity to actually complete the task well?
For Accountable: does this person have the authority to make decisions, allocate resources, and ensure the task is delivered? Accountability without authority is an unfair position to put someone in.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'A task can have two Accountable people if the work is being split between two senior team members.',
      isTrue: false,
      explanation: 'Every task must have exactly one Accountable person. Shared accountability quietly becomes no accountability — each person can assume the other is handling it. If two senior people genuinely need to own distinct outcomes, that is a sign the task should be split into two separate tasks, each with its own single Accountable owner.',
    },
  },
  {
    _id: 'raci-lesson-2-2',
    _type: 'lesson',
    title: 'Consulted and Informed — Getting the Balance Right',
    order: 2,
    body: `Consulted is a two-way relationship. These are people whose expertise or perspective genuinely shapes how the task gets done. You ask them something, they respond, and that response influences the outcome.

This is different from simply being informed. A Consulted person's input matters enough that ignoring it would be a mistake.

In a software project, the Legal Team is Consulted to ensure the product complies with data privacy regulations. Their feedback may directly change how a feature is built.

The risk with Consulted is over-inclusion. Every additional person you consult adds a conversation, a delay, a chance for conflicting input. A good practice is to ask: would this task genuinely be worse without this person's input? If the honest answer is no, they likely do not need to be Consulted.

Informed is one-way. These people receive updates on progress or outcomes, but their input does not shape the work. They are stakeholders who are affected by or interested in the outcome, even though they are not directly involved in producing it.

In a corporate project, the Sales Team might be Informed about an upcoming product launch so they can prepare their materials in advance. Note — if the Sales Team is the one actually preparing materials, that makes them Responsible for that task, not merely Informed. The distinction is whether they are doing something with the information, or simply receiving it.

The same over-inclusion risk applies here as with Consulted. Flooding too many people with updates they do not need creates noise, and important updates get lost in it. Keep the Informed list to people who genuinely need to know.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Think of a recent meeting or decision where you were included as Consulted but your input was not actually sought or used. Should you have been marked Informed instead? What is the cost — to you and to the project — of misclassifying people as Consulted when they are really Informed?',
    },
  },
  {
    _id: 'raci-lesson-2-3',
    _type: 'lesson',
    title: 'The Golden Rule and Applying the Four Roles',
    order: 3,
    body: `The golden rule of RACI, restated:

One Responsible — though sometimes more than one if the task genuinely needs multiple hands.
One Accountable. Always exactly one. No exceptions.
A focused list of Consulted people — only those whose input truly shapes the outcome.
A focused list of Informed people — only those who genuinely need the update.

If you find a task with two people marked Accountable, that is not a quirk of this particular project — it is a sign the task itself needs to be split into two separate tasks, each with its own single Accountable owner.

Applying the roles in practice comes down to two questions for every task:

First: who is actually doing this work? That is your Responsible assignment.
Second: who is answerable if it does not get done well? That is your Accountable assignment.

Then, separately: whose expertise would genuinely improve the outcome? Those are your Consulted people. And: who needs to know what is happening without needing to influence it? Those are your Informed people.

The four roles are simple to state but easy to misapply, especially the Responsible and Accountable distinction. Get comfortable asking these two questions for every task, asked honestly, and you will get most of the way to a correct RACI assignment every time.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'If a consultant is brought in for their expertise on a task, they should always be marked Responsible since they are doing the expert work.',
      isTrue: false,
      explanation: 'Consultants are typically marked Consulted — their expertise shapes the outcome through two-way conversation, but the Responsible role belongs to the person or team actually executing the task. A consultant might be Responsible if they are directly doing the deliverable, but being an expert does not automatically mean being Responsible.',
    },
  },

  // MODULE 3 — Building Your RACI Matrix
  {
    _id: 'raci-lesson-3-1',
    _type: 'lesson',
    title: 'Steps 1 and 2 — Tasks and Stakeholders',
    order: 1,
    body: `A founder once tried to build a RACI matrix for an entire company restructuring in one sitting. She listed forty tasks, twelve stakeholders, and tried to assign roles for all of it from memory in an afternoon. The result was a confusing spreadsheet nobody trusted, several tasks with three Accountable people, and a few tasks that nobody had touched at all.

The problem was not RACI. The problem was skipping the groundwork. Building a good matrix is itself a process with steps — and skipping straight to assigning letters in a grid, without first doing the groundwork, is the single most common reason RACI implementations fail before they even begin.

Step 1 — Identify the tasks and deliverables

Before you can assign any roles, you need to know exactly what needs to get done. A deliverable is a tangible outcome — something you can point to and say "this exists now."

For larger projects, a useful tool here is a Work Breakdown Structure — a hierarchical decomposition of the project into smaller and smaller pieces, until each piece is small enough to assign clearly to one Responsible person or team.

For a product launch, deliverables might include: market research, product design, development and production, marketing, and post-launch monitoring.

There are two ways to get the breakdown wrong. Too shallow: vague tasks like "Marketing" with no further detail leave too much ambiguity about who actually does what within that broad heading. Too granular: breaking every task into ten sub-steps creates a matrix so large nobody can read it. The right level of detail is whatever lets you assign one clear Accountable person to each line.

Step 2 — List the stakeholders or team members

Once your tasks are clear, identify everyone who could plausibly be involved — every individual or team with a stake in the project. Resist the temptation to leave anyone out at this stage just because you are not yet sure of their role. It is easier to assign someone an Informed role later and trim the list than to realise halfway through that you forgot a key stakeholder entirely.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Pick a project you are currently part of. Try to list its five to eight main deliverables — specific, tangible outcomes rather than broad headings. Then list all the people or teams involved. You have just completed Steps 1 and 2 of building a RACI matrix.',
    },
  },
  {
    _id: 'raci-lesson-3-2',
    _type: 'lesson',
    title: 'Steps 3 and 4 — Assigning Roles and Creating the Matrix',
    order: 2,
    body: `Step 3 — Assign RACI roles for each task

This is where the actual matrix comes together. For every task, go through each stakeholder and ask: what is their relationship to this specific task? Are they doing it, owning it, advising on it, or simply being told about it?

Worked example — Product Design task in a product launch project:

Responsible: Design Team — they are doing the design work.
Accountable: Product Manager — they own whether the design meets the brief and timeline.
Consulted: Marketing Team — their input on what will resonate with customers shapes the design.
Informed: Senior Executives — they want visibility into progress but are not shaping the design decisions.

Notice this task does not assign every stakeholder a role. The Legal Team, for instance, might have no role at all on Product Design specifically, even though they are a stakeholder on the overall project. Not every stakeholder needs a role on every task — only assign roles where there is a genuine relationship between that person and that specific task.

Step 4 — Create the matrix

With tasks and roles defined, lay them out visually. The standard format is tasks listed down the rows, stakeholders listed across the columns, with each cell filled in with R, A, C, or I where applicable, and left blank where a stakeholder has no role on that task.

This visual layout is what makes RACI so powerful as a communication tool. Anyone glancing at the matrix can immediately see, for any task, who is doing what — without reading lengthy explanations.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Take one task from the list you drafted in the previous lesson. For that single task, assign R, A, C, and I to each stakeholder you listed. Remember: exactly one A, any number of R or C or I, and leave cells blank where the stakeholder has no relationship to this task.',
    },
  },
  {
    _id: 'raci-lesson-3-3',
    _type: 'lesson',
    title: 'Step 5 — Review, Refine, and Avoid the Pitfalls',
    order: 3,
    body: `Step 5 — Review and refine

Once the first draft of the matrix is built, review it carefully before treating it as final. Look specifically for:

Multiple Accountable people on one task. This is the most common error and the most important one to catch. If you see it, the task likely needs to be split.

Tasks with no Responsible person. If nobody is doing the work, the task will not get done, no matter how clearly everything else is defined.

Overloaded Consulted or Informed columns. If one person is Consulted on every single task, check whether that is genuinely necessary or whether it has become a default habit.

This review step is not optional. A matrix built once and never reviewed before use is the equivalent of writing a document and publishing it without proofreading.

Pitfalls to avoid:

Unclear role assignments lead straight back to the confusion RACI was meant to solve.

Overloading roles — too many people marked Consulted or Informed slows the project down rather than speeding it up.

Ambiguity in Accountability — only one person should ever be Accountable for a given task.

A RACI matrix is only as good as the groundwork behind it. The actual act of filling in the grid takes minutes. The thinking that precedes it — breaking the project down properly, identifying the right stakeholders, and reviewing carefully for errors — is where the real value of the exercise lives.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'If one person appears in the Consulted column on almost every task in a RACI matrix, this is normal and simply reflects their importance to the project.',
      isTrue: false,
      explanation: 'A Consulted column that spans nearly every task is usually a sign of a bottleneck, not importance. Every consultation adds a conversation and a potential delay. The review step should catch this pattern and prompt the question: does this person truly need to be consulted on each task, or should some of those assignments be downgraded to Informed?',
    },
  },

  // MODULE 4 — RACI for Process and Operations
  {
    _id: 'raci-lesson-4-1',
    _type: 'lesson',
    title: 'Projects vs Processes — Why the Distinction Matters',
    order: 1,
    body: `A consultant was once hired by a logistics company to "fix" their order fulfilment process using RACI. He arrived with the same approach he used for project work — asked for the project plan, looked for the Work Breakdown Structure, and tried to map tasks in sequence with a start and an end.

There was no start and end. Order fulfilment happens every single day, indefinitely, for as long as the company exists. His project-style matrix did not fit. It took him two failed attempts before he switched tools entirely — moving from a task list to a swimlane flowchart, with each function's lane showing exactly where their RACI role applied at each step of the recurring flow. That version worked immediately, because it matched the shape of the work itself.

Everything in this course so far has assumed a project — a defined piece of work with a beginning, an end, and a Work Breakdown Structure to organise it. A product launch, a website redesign, a company restructuring — these all eventually finish.

A process is different. It is recurring and ongoing. Monthly financial reporting, customer onboarding, order fulfilment, recruitment, invoice processing — these run continuously, the same steps repeating each time, with no defined finish line.

A Work Breakdown Structure assumes you can decompose a finite piece of work into smaller and smaller pieces until everything is accounted for, start to finish. A process has no "finish" to decompose toward — it loops. Trying to force a process into a WBS produces an artificial, awkward structure that does not reflect how the work actually happens.

What processes need instead is a way to represent flow — the sequence of steps, who hands off to whom, and where decisions or checks happen along the way.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'A Work Breakdown Structure is equally effective for mapping both project work and recurring operational processes.',
      isTrue: false,
      explanation: 'A WBS assumes a defined finish line — it decomposes work toward completion. A process loops indefinitely with no "finish" to decompose toward. Forcing a recurring process into a WBS produces an ill-fitting structure. Processes need a swimlane flowchart that represents flow and repeating steps, not a hierarchical task breakdown.',
    },
  },
  {
    _id: 'raci-lesson-4-2',
    _type: 'lesson',
    title: 'The Swimlane Flowchart — RACI in Motion',
    order: 2,
    body: `A swimlane flowchart organises a process into horizontal or vertical "lanes," with each lane representing a role, team, or function. The process steps are placed within the lane of whoever performs them, and arrows show the flow from one step to the next — including handoffs between lanes when work passes from one function to another.

This format does two things a simple task list cannot. First, it shows the sequence and flow of work, which matters enormously in a process where step order is fixed and repeating. Second, it makes handoffs immediately visible — a handoff is simply an arrow crossing from one lane into another. Handoffs are where processes most often break down.

Once the swimlane flowchart exists, RACI overlays onto it naturally. Each step within a lane already shows who is doing the work — effectively, the lane owner is Responsible for steps in their lane. Layer RACI markers onto specific steps to add the remaining clarity: who is Accountable for that step succeeding, who needs to be Consulted before the step proceeds, and who needs to be Informed once it is done.

Worked example — customer onboarding:

Picture a simple onboarding flow with four lanes — Sales, Customer Success, Finance, and IT.

The process starts in the Sales lane — a deal closes. Sales is Responsible for handing off the signed contract.

The flow crosses into Customer Success — they are Responsible for setting up the customer's account and scheduling a welcome call. The Customer Success Lead is Accountable for the customer being successfully onboarded within the first thirty days.

The flow briefly touches Finance — they are Consulted to confirm the billing setup is correct before the account goes live.

The flow touches IT — they are Responsible for provisioning system access, and Informed once the customer is fully active.

This single picture — four lanes, a handful of steps, RACI markers at each one — replaces what would otherwise be a confusing paragraph of explanation.

One more shift for processes: process RACI usually works better at a macro level. If you assign RACI at too granular a level for a daily process, the matrix becomes a maintenance burden nobody keeps updated. Process RACI is most useful when it focuses on the major stages of the flow and the handoffs between them.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Think of one recurring process in your organisation — something that runs on a regular cycle: weekly, monthly, or per customer or order. Sketch out its lanes (the teams or functions involved) and identify the two or three most important handoffs. Where would RACI markers at those handoff points add the most clarity?',
    },
  },
  {
    _id: 'raci-lesson-4-3',
    _type: 'lesson',
    title: 'Process Ownership and Pitfalls',
    order: 3,
    body: `Process owner: The Accountable role at the level of the entire process, not just one step within it. This is the person who is answerable for the process working well overall — its efficiency, its quality, its outcomes — even though they are not necessarily performing any individual step themselves.

Process execution: The Responsible work — the people in each lane actually doing the steps, day after day, order after order, customer after customer.

In the onboarding example, there might be one overall process owner — perhaps a Head of Customer Operations — who is Accountable for the onboarding process as a whole performing well, sitting above the individual Accountable assignments at each stage. This layered accountability is common in process environments and rarely shows up in project RACI.

Second worked example — monthly financial reporting:

Three lanes: Finance, Department Heads, and the CFO's office.

Finance is Responsible for compiling raw numbers from each department's systems. Department Heads are Consulted to validate their department's figures before the numbers are finalised. Finance remains Responsible for assembling the final consolidated report. The CFO is Accountable for the report's accuracy and timely delivery to the board — even though the CFO is not pulling a single number themselves. The Board is Informed once the report is finalised.

This process repeats every single month, identically, indefinitely. There is no WBS — just a flow, lanes, and the same RACI pattern applied every cycle.

Common pitfalls in process RACI:

Forcing project tools onto process work — as in the opening story, reach for the swimlane flowchart instead.

No clear process owner — many organisations have well-defined Responsible roles at each step but no single person Accountable for the process as a whole. This is exactly the kind of gap that lets a process slowly degrade over time.

Over-granularity — marking RACI roles for every micro-step in a process creates a matrix that is exhausting to maintain and quickly falls out of date.

Most of the work that happens inside organisations is process work, not project work. The swimlane flowchart, applied at the right level of detail, with one clear process owner accountable for the whole, brings exactly the same clarity to processes that the rest of this course has brought to projects.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'In a recurring process, it is enough to assign Responsible roles at each step. A single person Accountable for the overall process is unnecessary overhead.',
      isTrue: false,
      explanation: 'Without a process owner — someone Accountable for the process as a whole — there is no one positioned to notice when the process degrades over time, or to make holistic improvements. Step-level Responsible assignments keep the work moving day to day, but the process owner is who ensures the process continues to work well as circumstances change.',
    },
  },

  // MODULE 5 — Implementing RACI with Your Team
  {
    _id: 'raci-lesson-5-1',
    _type: 'lesson',
    title: 'Introduction and Getting Buy-In',
    order: 1,
    body: `A project manager built what he believed was a flawless RACI matrix, entirely on his own, over a weekend. On Monday morning he emailed it to the team as a finished document with a note that said: "Please follow this going forward."

By Wednesday, half the team was quietly ignoring it. Not out of defiance — but because nobody had been asked for input, several assignments did not reflect how the team actually worked, and people felt the matrix had been imposed on them rather than built with them.

A RACI matrix that the team has not helped build is, at best, a document. A RACI matrix the team has helped build is a shared agreement people actually follow. The difference is not in the matrix itself — it is in how it gets introduced.

Step 1 — Introduce the RACI Matrix to the team

Before sharing any specific assignments, take the time to properly introduce the team to what RACI is and why you are using it. Walk through the four roles and explain what each one means in practice.

Be explicit about the benefits this is meant to bring: clearer communication, less duplicated effort, faster decisions, and a shared understanding of who owns what. When people understand the "why" behind a new process, they are far more likely to actually use it rather than treat it as box-ticking.

Step 2 — Develop the matrix with team input

Build the matrix collaboratively. Bring the team into the room — literally or virtually — while you go through tasks and assign roles together. People who do the actual work often have a far better sense of realistic role assignments than someone working from the outside looking in.

This collaboration serves two purposes at once. First, it produces a more accurate matrix, because the people closest to the work catch errors a single author would miss. Second, it produces buy-in. People follow agreements they helped shape far more readily than instructions handed down to them.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Have you ever been handed a process or tool that was built without your input? How did that affect your willingness to follow it? Now think about a RACI matrix you might introduce to your team. What would you say in Step 1 to explain the "why" in a way that resonates with your specific team?',
    },
  },
  {
    _id: 'raci-lesson-5-2',
    _type: 'lesson',
    title: 'Making the Matrix Accessible — Tools and Templates',
    order: 2,
    body: `Step 3 — Make the matrix accessible

A matrix that lives in a project manager's personal notebook helps nobody. The matrix needs to be visible and easily checked by anyone who needs it, whenever they need it.

Use a shared tool — Google Sheets, a project management platform like Trello or Asana, or whatever tool your team already uses daily. The specific tool matters less than the principle: anyone on the project should be able to open it and instantly see who owns what, without having to ask.

Accessibility reinforces the roles themselves. When the matrix is easy to check, people actually check it — before a meeting, before starting a task, before reaching out to someone for input. That habit is what makes RACI a living tool rather than a document that gets created once and forgotten.

Choosing the right tool:

Excel or Google Sheets — simple, versatile, and familiar to almost everyone. The main pitfall is letting the structure become overcomplicated, or letting the sheet go stale because updates require someone to remember to open and edit it manually.

Project management software — tools like Asana, Trello, or Microsoft Project often have RACI templates or customisation options. The pitfall is reaching for heavyweight software for a small, simple project where it adds more complexity than value.

Online templates — free downloadable RACI templates save time setting up the structure from scratch. The pitfall is using a generic template exactly as downloaded without adapting it to your actual project.

Two ready-to-use RACI matrix templates are included as downloads with this module:

Template A uses separate columns for each role — Responsible, Accountable, Consulted, Informed — with the relevant person's name entered under the appropriate column for each task. This format is intuitive and works well for smaller projects.

Template B uses one column per stakeholder, with a dropdown to select R, A, C, or I for each task and stakeholder combination. This format scales better for projects with many stakeholders, and includes built-in highlighting that flags a task if it appears to have more than one Accountable assignment.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Which tool does your team already use daily for tracking work — a spreadsheet, a project management platform, or something else? How would you embed a RACI matrix into that existing tool so it is actually checked rather than filed away?',
    },
  },
  {
    _id: 'raci-lesson-5-3',
    _type: 'lesson',
    title: 'Pitfalls and the Real Work of Implementation',
    order: 3,
    body: `The pitfalls of implementation are simpler than they sound, and they are both solved the same way.

Lack of clear communication during rollout leads straight back to the confusion and inefficiency RACI was meant to solve.

Not involving the team in building the matrix creates resistance and inaccuracies — exactly what happened in the opening story.

The fix for both is the same: communicate clearly about why RACI is being introduced, and build the matrix together rather than handing it down as a finished document.

The technical part of RACI — the letters in the grid — is the easy part. The implementation part — getting a team to genuinely understand and embrace it — is where the real skill lies.

A matrix built with the team, explained clearly, and kept visible and accessible will be followed. A matrix imposed from above, however accurate, often will not be.

This is the heart of Module 5. RACI is not a document you create and send. It is a shared agreement you build together. The time invested in doing that properly — the introduction, the collaborative build, the accessible format — is paid back immediately in a team that actually uses it.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'If the RACI matrix assignments are technically accurate, the team will follow it regardless of whether they were involved in building it.',
      isTrue: false,
      explanation: 'Accuracy is necessary but not sufficient. A matrix the team did not help build can feel imposed, and people will quietly route around it — especially if assignments do not match how work actually flows on the ground. The team involvement step is what converts an accurate document into a shared agreement that gets followed.',
    },
  },

  // MODULE 6 — Sustaining and Refining RACI
  {
    _id: 'raci-lesson-6-1',
    _type: 'lesson',
    title: 'Why Review Matters — Scheduling the Habit',
    order: 1,
    body: `Six months into a major project, a team was still using the RACI matrix from day one — completely unchanged, despite three new team members joining, two original stakeholders having left the company, and the project scope having grown well beyond its original plan.

Nobody had deliberately abandoned the matrix. It had simply quietly become outdated, one small unaddressed change at a time, until it no longer reflected reality. New team members were never told their roles. Tasks that had emerged along the way had no Accountable owner at all. The matrix that once brought clarity had become, ironically, a source of confusion — because people stopped trusting it as the project moved past it.

A RACI matrix is not a one-time deliverable. It is a living document that needs deliberate maintenance, or it slowly stops being useful.

Projects change. Scope shifts, new tasks emerge, team members join and leave, and stakeholder needs evolve. A matrix that was accurate on day one can become quietly wrong within weeks if nobody is responsible for keeping it current.

Skipping reviews does not just leave the matrix slightly out of date — it actively erodes trust in the tool. Once people notice the matrix does not reflect how the team is actually working, they stop checking it, and all the benefits of role clarity disappear along with that trust.

Step 1 — Schedule regular reviews

Set a deliberate rhythm for reviewing the matrix, rather than leaving it to chance. This could be at key project milestones, or at fixed periodic intervals — for agile teams, reviewing after each sprint works well.

At each review, ask a consistent set of questions:

Have new tasks or deliverables emerged since the last review?
Has the team composition changed — new joiners, departures, or role changes?
Are there new stakeholders who now need to be added, particularly to the Informed column?

Building this review into your existing project rhythm — rather than treating it as a separate extra meeting — makes it far more likely to actually happen.`,
    interactiveType: 'true-false',
    interactiveContent: {
      statement: 'A RACI matrix that becomes outdated is simply less useful, but it does not actively cause problems for the team.',
      isTrue: false,
      explanation: 'An outdated matrix actively erodes trust. Once the team notices the matrix no longer matches reality — wrong owners listed, tasks that appeared after the matrix was built with no Accountable person, departed stakeholders still named — they stop checking it entirely. At that point, the matrix does not just become neutral; it becomes misleading, and the team reverts to the ambiguity the matrix was meant to prevent.',
    },
  },
  {
    _id: 'raci-lesson-6-2',
    _type: 'lesson',
    title: 'Gathering Feedback, Refining, and Managing Conflict',
    order: 2,
    body: `Step 2 — Gather feedback from the team

The people doing the work are often the first to notice when a RACI assignment no longer makes sense. Create space for that feedback to surface, whether through informal one-on-one conversations or as part of regular project review sessions.

If the Marketing Team feels they are being Consulted on every single decision, even ones with little relevance to their work, that is valuable feedback. It may be appropriate to revise their role on some tasks from Consulted to Informed — preserving their visibility into the project without slowing down every decision with their input.

Step 3 — Refine the matrix

Once you have gathered feedback and identified what has changed, update the matrix accordingly. Common refinements include:

Upgrading someone from Consulted to Responsible if their involvement has grown into doing actual work rather than simply advising.

Adding new stakeholders to the Informed column as the project's visibility needs change.

Reassigning Accountable ownership if the original owner has moved on or the task's nature has shifted significantly.

Refinement is not a sign the original matrix was wrong. It is a sign the project is alive and evolving — which every real project does.

Managing conflict within RACI:

The most frequent conflict happens when a Consulted person begins to feel — or act — as though they have authority over the outcome, when in fact that authority sits with the Accountable person. This usually surfaces as a Consulted stakeholder pushing back hard when their input is not fully adopted.

The fix is not to remove that person from the Consulted role. The fix is a clear, calm conversation reaffirming what Consulted actually means — their input genuinely matters and will be heard, but the Accountable person retains the final decision. Periodic review and open communication, rather than rigid rule enforcement, is usually what resolves this kind of friction well.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'Think about a project where the team or scope changed after the work began. What happened to the original role assignments — were they updated, or did the team quietly route around them? What would a structured review rhythm have prevented in that situation?',
    },
  },
  {
    _id: 'raci-lesson-6-3',
    _type: 'lesson',
    title: 'Pitfalls, Bringing It Together, and Course Completion',
    order: 3,
    body: `Pitfalls to avoid at the sustaining stage:

Skipping reviews entirely — this leads to exactly the situation in the opening story. A matrix that quietly drifts out of step with reality until it stops being trusted.

Overloading the matrix over time — as a project evolves, there is a natural temptation to keep adding more people to Consulted and Informed columns "just in case." Resist this. A matrix that has grown bloated with unnecessary entries becomes harder to read and loses the clarity that made it valuable in the first place. Keep it lean and intentional, even as the project grows.

Bringing it all together:

As you finish this course, take a few minutes to think about a project you are currently part of, or one you completed recently. Ask yourself honestly: was role clarity present? Did everyone know who was Responsible, who was Accountable, who needed to be Consulted, and who simply needed to be kept Informed?

If the answer is no, consider what a RACI matrix might have changed. Would the legal sign-off in our opening story for Module 1 have been missed if someone had been clearly marked Responsible for it? Would the website redesign conflict in Module 2 have played out differently if both the designer and the project manager had understood the Accountable role from the start?

RACI is a simple framework, but its value compounds the more consistently it is applied. The goal is not a perfect matrix on the first attempt — it is a habit of bringing this kind of clarity to every project you lead or take part in, refining it along the way as you learn what works for your team.

You have now completed RACI Decoded and earned the Master badge.`,
    interactiveType: 'reflection',
    interactiveContent: {
      prompt: 'You have now completed RACI Decoded. Identify one project you will apply a RACI matrix to in the next two weeks. Name the project, list its first three deliverables, and identify who the Accountable person is for each. That is your commitment exercise for Module 6.',
    },
  },
]

// ─── MODULES ──────────────────────────────────────────────────────────────────

const modules = [
  {
    _id: 'raci-module-1',
    _type: 'academyModule',
    title: 'What is RACI and Why It Matters',
    courseRef: { _type: 'reference', _ref: 'raci-decoded-course' },
    order: 1,
    badgeName: 'Discover',
    lessons: [
      { _type: 'reference', _ref: 'raci-lesson-1-1', _key: 'raci-lesson-1-1' },
      { _type: 'reference', _ref: 'raci-lesson-1-2', _key: 'raci-lesson-1-2' },
      { _type: 'reference', _ref: 'raci-lesson-1-3', _key: 'raci-lesson-1-3' },
    ],
    questionsToShow: 3,
    quizQuestionBank: [],
  },
  {
    _id: 'raci-module-2',
    _type: 'academyModule',
    title: 'The Four Roles Explained',
    courseRef: { _type: 'reference', _ref: 'raci-decoded-course' },
    order: 2,
    badgeName: 'Define',
    lessons: [
      { _type: 'reference', _ref: 'raci-lesson-2-1', _key: 'raci-lesson-2-1' },
      { _type: 'reference', _ref: 'raci-lesson-2-2', _key: 'raci-lesson-2-2' },
      { _type: 'reference', _ref: 'raci-lesson-2-3', _key: 'raci-lesson-2-3' },
    ],
    questionsToShow: 3,
    quizQuestionBank: [],
  },
  {
    _id: 'raci-module-3',
    _type: 'academyModule',
    title: 'Building Your RACI Matrix',
    courseRef: { _type: 'reference', _ref: 'raci-decoded-course' },
    order: 3,
    badgeName: 'Design',
    lessons: [
      { _type: 'reference', _ref: 'raci-lesson-3-1', _key: 'raci-lesson-3-1' },
      { _type: 'reference', _ref: 'raci-lesson-3-2', _key: 'raci-lesson-3-2' },
      { _type: 'reference', _ref: 'raci-lesson-3-3', _key: 'raci-lesson-3-3' },
    ],
    questionsToShow: 3,
    quizQuestionBank: [],
  },
  {
    _id: 'raci-module-4',
    _type: 'academyModule',
    title: 'RACI for Process and Operations',
    courseRef: { _type: 'reference', _ref: 'raci-decoded-course' },
    order: 4,
    badgeName: 'Adapt',
    lessons: [
      { _type: 'reference', _ref: 'raci-lesson-4-1', _key: 'raci-lesson-4-1' },
      { _type: 'reference', _ref: 'raci-lesson-4-2', _key: 'raci-lesson-4-2' },
      { _type: 'reference', _ref: 'raci-lesson-4-3', _key: 'raci-lesson-4-3' },
    ],
    questionsToShow: 3,
    quizQuestionBank: [],
  },
  {
    _id: 'raci-module-5',
    _type: 'academyModule',
    title: 'Implementing RACI with Your Team',
    courseRef: { _type: 'reference', _ref: 'raci-decoded-course' },
    order: 5,
    badgeName: 'Deploy',
    lessons: [
      { _type: 'reference', _ref: 'raci-lesson-5-1', _key: 'raci-lesson-5-1' },
      { _type: 'reference', _ref: 'raci-lesson-5-2', _key: 'raci-lesson-5-2' },
      { _type: 'reference', _ref: 'raci-lesson-5-3', _key: 'raci-lesson-5-3' },
    ],
    questionsToShow: 3,
    quizQuestionBank: [],
  },
  {
    _id: 'raci-module-6',
    _type: 'academyModule',
    title: 'Sustaining and Refining RACI',
    courseRef: { _type: 'reference', _ref: 'raci-decoded-course' },
    order: 6,
    badgeName: 'Master',
    lessons: [
      { _type: 'reference', _ref: 'raci-lesson-6-1', _key: 'raci-lesson-6-1' },
      { _type: 'reference', _ref: 'raci-lesson-6-2', _key: 'raci-lesson-6-2' },
      { _type: 'reference', _ref: 'raci-lesson-6-3', _key: 'raci-lesson-6-3' },
    ],
    questionsToShow: 3,
    quizQuestionBank: [],
  },
]

// ─── COURSE ───────────────────────────────────────────────────────────────────

const course = {
  _id: 'raci-decoded-course',
  _type: 'course',
  title: 'RACI Decoded',
  slug: { _type: 'slug', current: 'raci-decoded' },
  tagline: 'Build Clarity. Drive Ownership. Eliminate Confusion.',
  shortDescription: 'A practical six-module course on using the RACI framework to eliminate role confusion, accelerate decisions, and build accountability across any project or process.',
  descriptionLine: 'Certificate in RACI Decoded',
  price: 1999,
  status: 'draft',
  hasAssignments: true,
  discountActive: false,
  modules: [
    { _type: 'reference', _ref: 'raci-module-1', _key: 'raci-module-1' },
    { _type: 'reference', _ref: 'raci-module-2', _key: 'raci-module-2' },
    { _type: 'reference', _ref: 'raci-module-3', _key: 'raci-module-3' },
    { _type: 'reference', _ref: 'raci-module-4', _key: 'raci-module-4' },
    { _type: 'reference', _ref: 'raci-module-5', _key: 'raci-module-5' },
    { _type: 'reference', _ref: 'raci-module-6', _key: 'raci-module-6' },
  ],
  paidConsultation: {
    enabled: true,
    title: 'Expert Guidance Call',
    description: 'A one-hour paid consultation with PGS after course completion. Get personalised guidance on applying RACI to your specific organisation or project.',
    price: 5000,
    durationMinutes: 60,
    bookingLink: { _type: 'reference', _ref: 'raci-expert-guidance-booking' },
  },
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding bookingLink...')
  await client.createOrReplace(bookingLink)
  console.log('  ✓ bookingLink')

  // Seed course stub first so modules can reference it
  console.log('Seeding course stub...')
  await client.createOrReplace({ ...course, modules: [] })
  console.log('  ✓ raci-decoded-course (stub)')

  console.log('Seeding 18 lessons...')
  for (const lesson of lessons) {
    await client.createOrReplace(lesson)
    console.log(`  ✓ ${lesson._id}`)
  }

  console.log('Seeding 6 modules...')
  for (const mod of modules) {
    await client.createOrReplace(mod)
    console.log(`  ✓ ${mod._id}`)
  }

  // Patch course with full module list
  console.log('Patching course with modules...')
  await client.createOrReplace(course)
  console.log('  ✓ raci-decoded-course (full)')

  console.log('\nAll done. Totals: 1 bookingLink, 18 lessons, 6 modules, 1 course.')
  console.log('\nFLAGS:')
  console.log('  - Course price is 0 (placeholder) — PGS to confirm before publishing.')
  console.log('  - Quiz banks are empty — awaiting quiz bank document (tracked separately).')
  console.log('  - Assignments not seeded — awaiting assignment bank document (tracked separately).')
  console.log('  - No badge or cover images — RACI_badge.png and RACI_Course_Cover.png not in RACI folder.')
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
