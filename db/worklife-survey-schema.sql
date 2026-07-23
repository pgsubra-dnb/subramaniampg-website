-- Work Life Survey — Neon/Postgres schema
-- Run this once against the survey's Neon database before deploying /worklife.

CREATE TABLE IF NOT EXISTS worklife_survey_responses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,                        -- from ?src= query param
  age_group TEXT,
  experience_years TEXT,
  role_type TEXT,                     -- renamed from current_role: CURRENT_ROLE is a reserved Postgres keyword
  role_type_other TEXT,
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

CREATE INDEX IF NOT EXISTS idx_worklife_survey_signature ON worklife_survey_responses (submission_signature, created_at);
CREATE INDEX IF NOT EXISTS idx_worklife_survey_email ON worklife_survey_responses (email);
CREATE INDEX IF NOT EXISTS idx_worklife_survey_created_at ON worklife_survey_responses (created_at);
