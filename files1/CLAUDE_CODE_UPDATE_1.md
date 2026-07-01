# Claude Code Instruction — Update Testimonial Attribution

## File to update

app/work/executive-coaching/page.tsx

---

## What to change

Find the "In their words" testimonial section.

Each testimonial card currently has an attribution line that shows a role and sector, for example:

  — Founder & CEO, B2B SaaS Company, India
  — CXO, Financial Services, South Asia
  — Managing Director, Manufacturing Group, India

Replace ALL attribution lines across ALL testimonial cards with simply:

  — A Coachee

Remove the role, sector, company, and country entirely. Keep only the text "— A Coachee".

---

## Also update the assessment page

File: app/work/executive-coaching/assessment/page.tsx

Replace the entire file content with the new version provided in the downloaded assessment/page.tsx file.

This version changes the assessment from one-question-at-a-time to all 10 questions on one page, with:
- Teal border and teal radio dot on selection
- Progress bar showing how many answered
- Submit button disabled until all 10 are answered
- Submit button text changes to "See My Result" when all answered
- Same gate form (Name, Email, Organisation)
- Same four result screens

---

## After both changes

Run the dev server and confirm:
- /work/executive-coaching shows "— A Coachee" on all testimonial cards
- /work/executive-coaching/assessment shows all 10 questions at once with teal selection cards

Then deploy to Vercel.
