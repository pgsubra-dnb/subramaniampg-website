-- Work Life Survey — analysis queries
-- Every query excludes is_flagged_duplicate = true by default.
-- A commented variant (including duplicates) is provided alongside each one.

-- ─────────────────────────────────────────────────────────────
-- 1. Response counts by experience_years
-- ─────────────────────────────────────────────────────────────
select experience_years, count(*) as responses
from worklife_survey_responses
where is_flagged_duplicate = false
group by experience_years
order by experience_years;

-- including duplicates:
-- select experience_years, count(*) as responses
-- from worklife_survey_responses
-- group by experience_years
-- order by experience_years;


-- ─────────────────────────────────────────────────────────────
-- 2. guidance_need by experience_years (tests the "10 year assumption")
-- ─────────────────────────────────────────────────────────────
select
  experience_years,
  guidance_need,
  count(*) as responses,
  round(100.0 * count(*) / sum(count(*)) over (partition by experience_years), 1) as pct_within_experience
from worklife_survey_responses
where is_flagged_duplicate = false
group by experience_years, guidance_need
order by experience_years, guidance_need;

-- including duplicates:
-- select
--   experience_years,
--   guidance_need,
--   count(*) as responses,
--   round(100.0 * count(*) / sum(count(*)) over (partition by experience_years), 1) as pct_within_experience
-- from worklife_survey_responses
-- group by experience_years, guidance_need
-- order by experience_years, guidance_need;


-- ─────────────────────────────────────────────────────────────
-- 3. Top situation_type values overall and by experience_years
-- ─────────────────────────────────────────────────────────────
-- overall
select unnest(situation_type) as situation, count(*) as responses
from worklife_survey_responses
where is_flagged_duplicate = false
group by situation
order by responses desc;

-- by experience_years
select experience_years, unnest(situation_type) as situation, count(*) as responses
from worklife_survey_responses
where is_flagged_duplicate = false
group by experience_years, situation
order by experience_years, responses desc;

-- including duplicates (overall):
-- select unnest(situation_type) as situation, count(*) as responses
-- from worklife_survey_responses
-- group by situation
-- order by responses desc;


-- ─────────────────────────────────────────────────────────────
-- 4. paid_learning and paid_amount distribution by experience_years and city_type
-- ─────────────────────────────────────────────────────────────
select
  experience_years,
  city_type,
  unnest(paid_learning) as paid_learning_option,
  count(*) as responses
from worklife_survey_responses
where is_flagged_duplicate = false
group by experience_years, city_type, paid_learning_option
order by experience_years, city_type, responses desc;

select experience_years, city_type, paid_amount, count(*) as responses
from worklife_survey_responses
where is_flagged_duplicate = false and paid_amount is not null
group by experience_years, city_type, paid_amount
order by experience_years, city_type, paid_amount;

-- including duplicates:
-- select experience_years, city_type, unnest(paid_learning) as paid_learning_option, count(*) as responses
-- from worklife_survey_responses
-- group by experience_years, city_type, paid_learning_option
-- order by experience_years, city_type, responses desc;


-- ─────────────────────────────────────────────────────────────
-- 5. worth_paying distribution by experience_years
-- ─────────────────────────────────────────────────────────────
select experience_years, unnest(worth_paying) as worth_paying_option, count(*) as responses
from worklife_survey_responses
where is_flagged_duplicate = false
group by experience_years, worth_paying_option
order by experience_years, responses desc;

-- including duplicates:
-- select experience_years, unnest(worth_paying) as worth_paying_option, count(*) as responses
-- from worklife_survey_responses
-- group by experience_years, worth_paying_option
-- order by experience_years, responses desc;


-- ─────────────────────────────────────────────────────────────
-- 6. interview_optin rate and calendar_clicked rate by experience_years and source
-- ─────────────────────────────────────────────────────────────
select
  experience_years,
  source,
  count(*) as responses,
  round(100.0 * avg(case when interview_optin then 1 else 0 end), 1) as interview_optin_pct,
  round(100.0 * avg(case when calendar_clicked then 1 else 0 end), 1) as calendar_clicked_pct
from worklife_survey_responses
where is_flagged_duplicate = false
group by experience_years, source
order by experience_years, source;

-- including duplicates:
-- select
--   experience_years,
--   source,
--   count(*) as responses,
--   round(100.0 * avg(case when interview_optin then 1 else 0 end), 1) as interview_optin_pct,
--   round(100.0 * avg(case when calendar_clicked then 1 else 0 end), 1) as calendar_clicked_pct
-- from worklife_survey_responses
-- group by experience_years, source
-- order by experience_years, source;


-- ─────────────────────────────────────────────────────────────
-- 7. Flagged duplicates listing
-- ─────────────────────────────────────────────────────────────
select id, created_at, source, submission_signature, email, completion_seconds
from worklife_survey_responses
where is_flagged_duplicate = true
order by created_at desc;


-- ─────────────────────────────────────────────────────────────
-- 8. All one_problem free text with segment columns, for qualitative reading
-- ─────────────────────────────────────────────────────────────
select
  id,
  created_at,
  experience_years,
  role_type,
  industry,
  city_type,
  guidance_need,
  one_problem
from worklife_survey_responses
where is_flagged_duplicate = false and one_problem is not null and one_problem <> ''
order by created_at desc;

-- including duplicates:
-- select id, created_at, experience_years, role_type, industry, city_type, guidance_need, one_problem
-- from worklife_survey_responses
-- where one_problem is not null and one_problem <> ''
-- order by created_at desc;


-- ─────────────────────────────────────────────────────────────
-- 9. Beta user list: email, experience_years, role_type, industry
--    for all rows where update_optin = true, deduplicated by email
-- ─────────────────────────────────────────────────────────────
select distinct on (email)
  email, experience_years, role_type, industry, created_at
from worklife_survey_responses
where is_flagged_duplicate = false and update_optin = true and email is not null
order by email, created_at desc;

-- including duplicates:
-- select distinct on (email)
--   email, experience_years, role_type, industry, created_at
-- from worklife_survey_responses
-- where update_optin = true and email is not null
-- order by email, created_at desc;
