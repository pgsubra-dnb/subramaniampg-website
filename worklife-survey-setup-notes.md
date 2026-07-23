# Work Life Survey — Setup Notes

Companion to `survey-build-spec.md` (Definition of Done, item 9). Written after the Neon database was provisioned via the Vercel integration, the schema was applied, and env vars were synced.

## Environment variables

| Variable | Purpose | Where it lives |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string read by `lib/worklifeDb.ts` | Local `.env.local` (alias); Vercel **Production** and **Development** (alias) |
| `survey_DATABASE_URL` and 16 sibling `survey_*` vars (`survey_POSTGRES_URL`, `survey_PGHOST`, etc.) | Native variables auto-created by the Vercel→Neon integration | Vercel **Production**, **Preview**, **Development** |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (invisible widget, client-side) | Local `.env.local`; Vercel **Production** and **Development** |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (server-side `siteverify` call) | Local `.env.local`; Vercel **Production** and **Development** |
| `CALENDAR_URL` | Booking link shown when `interview_optin` = Yes | Local `.env.local`; Vercel **Production** and **Development** |

**Why the `DATABASE_URL` alias exists:** the Vercel-Neon integration provisions its variables with a `survey_` prefix rather than the plain Postgres names. `lib/worklifeDb.ts` reads `process.env.DATABASE_URL || process.env.POSTGRES_URL` (no prefix), so a plain `DATABASE_URL` was added everywhere, holding the same value as `survey_DATABASE_URL`. If the Neon integration ever rotates or reprovisions its own variables, this alias will need to be updated to match — it will not update itself.

## Pending / known gaps

1. **No env vars on Vercel Preview for this feature.** The Vercel project has no connected Git repository, so Preview environment variables (which Vercel scopes per git branch) cannot be set via the CLI at all right now — attempting it fails with `Project does not have a connected Git repository`. This is a pre-existing project condition, not something introduced by this build. If Preview deployments are ever enabled for this repo, all five variables above will need to be added to Preview manually once a repo is connected.
2. **Signature-based duplicate flagging only looks back 1 hour**, not indefinitely as the original spec described (see `survey-build-spec.md`, section 4 deviation note). Email-based duplicate flagging has no such limit.
3. **No live end-to-end test performed.** Schema creation was verified directly against Neon (`\d worklife_survey_responses` confirmed all 28 columns, indexes, and primary key). Turnstile verification, honeypot behavior, and rate limiting are implemented and code-reviewed, but no real form submission has been run through the deployed page yet.
4. **`role_type` column rename.** `current_role` was renamed to `role_type` in the schema, the API insert, and the analysis queries after a reserved-PostgreSQL-keyword collision blocked the original schema from running. Nothing downstream referenced the old name. Full detail in `survey-build-spec.md`.

## What's confirmed working as of this build

- `worklife_survey_responses` table exists in the Neon database (Production), matching the schema in `db/worklife-survey-schema.sql`.
- All five variables above are present in `.env.local` and in Vercel Production + Development (verified by variable name only, not value).
- Page, API route, anti-bot measures, source tagging, and analysis queries are implemented per `survey-build-spec.md`.
