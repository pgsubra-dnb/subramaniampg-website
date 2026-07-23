# Build Specification: Work Life Survey Landing Page

## Purpose of this document

This is a build brief for Claude Code. The repo already contains an assessment landing page that stores data in Neon. Mirror that existing pattern for stack, folder structure, Neon connection, and deployment. Where this spec conflicts with repo conventions, follow repo conventions and note the deviation.

> **Deviation note (post-build):** at build time, no existing page in this repo actually used Neon — the OKR Health Check, Coaching Assessment, and PACE Assessment pages all persist via Brevo (email CRM), not Postgres. The `pg`-based connection in `lib/worklifeDb.ts` is net-new infrastructure for this repo, not a reuse of an existing pattern. See "Implementation notes" at the end of this document for this and other deviations discovered during the build.

## Context

We are running a discovery survey for a future learning product aimed at early career professionals in India. The survey must feel serious and neutral. It must NOT mention any product, offer, or coaching anywhere. It is presented purely as research into work life challenges.

## 1. Page

* New landing page on the existing website. Path: **/worklife** (confirmed).
* Match the visual language of the existing site and assessment page.
* Clean, simple, mobile first. Most traffic will arrive from WhatsApp forwards on phones.
* One section visible at a time with a progress indicator. Sections: About you, Your work life, Learning and spending, Close.
* Under 5 minutes to complete. All questions single tap except the two open text fields.
* No name field. No email field. No login.

### Page copy and branding

* Embiggen logo at the top of the page, with the tagline Enabling Growth beneath or beside it. Reuse the logo asset already in the repo from the assessment page.
* Headline: How is work really going for you?
* Subline: A short 5 minute survey on the everyday challenges working professionals face. Anonymous. No sales, no signup.
* Footer line: A research initiative by Embiggen. Enabling Growth.
* Branding rule: the Embiggen identity appears, but no product, service, coaching, or offer is mentioned anywhere on the page.

## 2. Survey questions

Store every answer. Option order as written. "Other" options open a short text input.

### Section 1. About you

1. age_group: 20-24 / 25-29 / 30-34 / 35-39 / 40 plus
2. experience_years: 0-2 / 3-5 / 6-10 / 11-15 / more than 15
3. current_role: Individual contributor / Team lead or first time manager / Manager of managers / Founder or self employed / Other
4. industry: IT and software / Banking and finance / Manufacturing / Services / Startup / Government / Other
5. city_type: Metro / Tier 2 city / Tier 3 or smaller

### Section 2. Your work life

6. guidance_need: In the last 3 months, did you face a work situation where you wished a senior person could guide you? Many times / A few times / Once or twice / No

   Rule for Section 2: no question may offer only two options, except pure Yes or No questions.

7. situation_type: What was that situation about? Pick up to two. Dealing with my boss / Managing my team / Office politics / A career decision / Salary or promotion / Confidence or communication / Something else (text)

   Show only if Q6 is not "No". Multi select, max 2.

8. guidance_source: Who do you go to today for such guidance? A mentor at work / A friend or family member / YouTube or online content / ChatGPT or AI tools / Nobody / Other
9. guidance_satisfaction: How satisfied are you with the guidance you get? Very satisfied / Somewhat satisfied / Not satisfied / I get no guidance

### Section 3. Learning and spending

10. paid_learning: In the last 12 months, did you pay for any learning or self growth? Multi select. A course / A subscription app / A coach or counsellor / Books / A live workshop / No, nothing paid
11. paid_amount: If yes, roughly how much in total? Under 500 rupees / 500 to 2000 / 2000 to 10000 / Above 10000

    Show only if Q10 is not "No, nothing paid".

12. completion: Did you finish what you bought? Fully / Partly / Barely started

    Show only if Q11 shown.

13. worth_paying: What would make guidance worth paying for? Pick up to two. Answers to my exact situation / A structured path for my career stage / Direct access to an experienced person / A community of people like me / Certificates / Accountability to actually act

### Section 4. Close

14. one_problem: What is the one work problem you wish someone would help you solve? Open text, optional, max 500 chars.
15. update_optin: Would you like to be updated about the findings of this survey? Yes / No
16. email: Shown only if Q15 is Yes. Your email, used only to share the survey findings with you. Validate format. Required if Q15 is Yes.
17. interview_optin: Would you be open to a short 15 minute conversation about your experiences at work? Nothing is being sold. Yes / No
18. If Yes: show booking embed or button linking to the owner's existing calendar link (same one used in prior assessments, pull from env var CALENDAR_URL). Label: Pick a time that works for you. It takes less than a minute.

Thank you screen: brief thanks. If Q17 was Yes and no booking click was registered, show the calendar link once more. If Q15 was Yes, add one line: We will write to you when the findings are ready.

## 3. Database (Neon)

Reuse the existing Neon database and connection pattern from the assessment build. New table:

```sql
CREATE TABLE worklife_survey_responses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,                        -- from ?src= query param
  age_group TEXT,
  experience_years TEXT,
  role_type TEXT,                     -- see note below: renamed from current_role
  role_type_other TEXT,               -- renamed from current_role_other
  industry TEXT,
  industry_other TEXT,
  city_type TEXT,
  guidance_need TEXT,
  situation_type TEXT[],              -- up to 2
  situation_type_other TEXT,
  guidance_source TEXT,
  guidance_source_other TEXT,
  guidance_satisfaction TEXT,
  paid_learning TEXT[],
  paid_amount TEXT,
  completion TEXT,
  worth_paying TEXT[],                -- up to 2
  one_problem TEXT,
  update_optin BOOLEAN,
  email TEXT,                         -- only when update_optin true
  interview_optin BOOLEAN,
  calendar_clicked BOOLEAN DEFAULT false,
  submission_signature TEXT,          -- sha256 of ip + user agent
  is_flagged_duplicate BOOLEAN DEFAULT false,
  turnstile_passed BOOLEAN,
  completion_seconds INT              -- time from load to submit
);
```

> **Deviation note (post-build):** the original spec named this column `current_role`. `CURRENT_ROLE` is a reserved PostgreSQL keyword (same family as `CURRENT_USER`) and cannot be used as a bare column identifier — the first attempt to run this schema against Neon failed with a syntax error. The column (and its `_other` companion) was renamed to `role_type` / `role_type_other` in the schema, in the API insert (`app/api/worklife-survey/route.ts`), and in `analysis/worklife-queries.sql`. Nothing downstream depended on the old name. The client-side and API JSON field is still called `current_role` (an ordinary JS/JSON property, no keyword conflict there) — only the database column and raw SQL text changed.

The canonical, up-to-date table definition lives in `db/worklife-survey-schema.sql` — treat that file, not this spec, as the source of truth if they ever diverge again.

## 4. API handler

* Follow the same serverless function pattern as the assessment.
* POST endpoint validates: all required fields present, option values belong to the allowed lists, multi selects within limits, text lengths within caps.
* Compute submission_signature as sha256(ip + user_agent + fixed salt from env). Do not store raw IP.
* Email: required and format validated only when update_optin is true. Must be null otherwise. Lowercase before storing.
* On insert, if the same signature already exists in the table, still insert but set is_flagged_duplicate = true. If an email is provided and the same email already exists, also set the flag.
* Rate limit: max 3 submissions per signature per hour. Reject beyond that with a generic message.
* Record calendar_clicked = true via a lightweight follow up call when the user clicks the booking link.
* Track completion_seconds from page load to submit. Submissions under 40 seconds should be inserted with is_flagged_duplicate = true (too fast to be a real read).

> **Deviation note:** the signature-based duplicate check (`recentCount > 0`) is currently scoped to the last hour (it reuses the rate-limit window query), not "ever" as written above. The email-based duplicate check has no such time limit. This is a known gap, not yet fixed.

## 5. Anti bot

1. Cloudflare Turnstile on the form. Invisible mode. Verify the token server side before insert. Keys via env vars TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.
2. Honeypot: one hidden text field. If filled, respond success but do not insert.
3. LocalStorage flag after successful submit. On revisit, show the thank you screen instead of the form. Do not block at server level based on this alone.

## 6. Source tagging

The share links will carry ?src= values: linkedin, whatsapp, hr, alumni, other. Capture into the source column. Missing param stores as 'direct'.

## 7. Analysis queries

`analysis/worklife-queries.sql` contains ready queries:

1. Response counts by experience_years.
2. guidance_need by experience_years (tests the 10 year assumption).
3. Top situation_type values overall and by experience_years.
4. paid_learning and paid_amount distribution by experience_years and city_type.
5. worth_paying distribution by experience_years.
6. interview_optin rate and calendar_clicked rate by experience_years and source.
7. Flagged duplicates listing.
8. All one_problem free text with segment columns, for qualitative reading (uses `role_type`, see deviation note above).
9. Beta user list: email, experience_years, role_type, industry for all rows where update_optin = true, deduplicated by email (uses `role_type`, see deviation note above). All queries exclude is_flagged_duplicate = true by default, with a commented variant that includes them.

## 8. Out of scope

* No admin dashboard in this pass. SQL queries are enough.
* No mandatory email collection. Email is collected only from participants who opt in to receive the survey findings.
* No product, coaching, or brand messaging on the page.

## 9. Definition of done

* Page live at the agreed path, matching site design, mobile tested.
* Submissions land correctly in Neon with all fields.
* Turnstile verified server side. Honeypot and rate limit working.
* Duplicate flagging working.
* Analysis SQL file committed.
* A short note listing env vars added and any setup steps pending — see `worklife-survey-setup-notes.md`.

## Implementation notes (deviations from this spec)

1. **No pre-existing Neon pattern existed to reuse.** Every other lead-capture page in this repo (OKR Health Check, Coaching Assessment, PACE Assessment) persists via Brevo, not Postgres. `lib/worklifeDb.ts` (using the `pg` package) is new infrastructure, added as a new dependency in `package.json`.
2. **`current_role` → `role_type` column rename**, described above, due to a reserved-keyword collision with PostgreSQL's `CURRENT_ROLE`.
3. **Neon env vars carry a `survey_` prefix.** The Vercel-Neon integration provisions variables as `survey_DATABASE_URL`, `survey_POSTGRES_URL`, etc., not plain `DATABASE_URL`/`POSTGRES_URL`. Since `lib/worklifeDb.ts` reads the unprefixed names, a plain `DATABASE_URL` was added (locally in `.env.local`, and on Vercel Production/Development) as an alias holding the same value as `survey_DATABASE_URL`. See `worklife-survey-setup-notes.md` for the full list of variables and where each one lives.
4. **Vercel Preview environment has no env vars for this feature.** The Vercel project has no connected Git repository, so Preview (which Vercel scopes per git branch) cannot accept environment variables via the CLI at all right now. Production and Development are fully configured.
5. **Duplicate-by-signature flagging is time-boxed to the last hour**, not unbounded as originally specified (see section 4 above).
