-- ============================================================
-- Tingyu Resume Screener — Supabase schema
-- 复制到 Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- enable required extension
create extension if not exists "uuid-ossp";

-- ---------- jobs ----------
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  department text not null default '',
  location text not null default '',
  description text not null default '',
  -- ScreeningCriteria from src/types/index.ts
  criteria jsonb not null default '{"hard":[],"skills":[],"bonus":[],"custom":[]}'::jsonb,
  push_threshold int not null default 80 check (push_threshold between 0 and 100),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on jobs(status);

-- update timestamp trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_jobs_updated_at on jobs;
create trigger trg_jobs_updated_at before update on jobs
  for each row execute procedure set_updated_at();

-- ---------- applications ----------
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_name text not null,
  candidate_email text not null,
  candidate_phone text not null default '',
  resume_file_path text not null,
  parsed_resume jsonb,
  score jsonb,
  status text not null default 'received'
    check (status in ('received','parsing','scoring','scored','pushed','failed')),
  pushed_to_feishu_at timestamptz,
  fail_reason text,
  created_at timestamptz not null default now()
);

create index if not exists applications_job_id_idx on applications(job_id);
create index if not exists applications_status_idx on applications(status);
-- 用于按总分排序的索引（jsonb 表达式索引）
create index if not exists applications_total_score_idx
  on applications(((score->>'total')::int) desc);

-- 同岗位 + 同邮箱 30 天去重（应用层判断，DB 不做硬约束以便允许重投）
-- 如想强约束：
-- create unique index applications_dedupe_idx on applications(job_id, lower(candidate_email))
--   where created_at > now() - interval '30 days';

-- ---------- feishu_logs ----------
create table if not exists feishu_logs (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references applications(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  ok boolean not null,
  response text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists feishu_logs_app_idx on feishu_logs(application_id);

-- ---------- Storage bucket ----------
-- run in Supabase dashboard → Storage → New bucket
--   name: resumes
--   public: NO
-- 然后在 SQL editor 跑下面的 policy（可选，如果用 service_role_key 走后端则不需要）

-- ---------- Row Level Security ----------
-- jobs: 公开 read open 状态（候选人侧）
alter table jobs enable row level security;
drop policy if exists "public read open jobs" on jobs;
create policy "public read open jobs" on jobs
  for select using (status = 'open');

-- applications: 不公开。HR 通过 service_role 后端访问。
alter table applications enable row level security;
drop policy if exists "deny anon" on applications;
create policy "deny anon" on applications
  for all using (false);

-- feishu_logs: 同上
alter table feishu_logs enable row level security;
drop policy if exists "deny anon" on feishu_logs;
create policy "deny anon" on feishu_logs
  for all using (false);

-- ---------- Seed sample job ----------
insert into jobs (title, department, location, description, criteria, push_threshold, status)
values (
  '前端工程师',
  '技术部',
  '杭州',
  '负责庭宇产品 Web 端开发，参与从 0 到 1 的功能落地。',
  '{
    "hard": [
      {"kind":"education","label":"本科及以上","value":"本科"},
      {"kind":"min_years","label":"3 年以上前端经验","value":3}
    ],
    "skills": [
      {"name":"React","weight":5,"level":"must"},
      {"name":"TypeScript","weight":5,"level":"must"},
      {"name":"Next.js","weight":4,"level":"preferred"},
      {"name":"Tailwind","weight":3,"level":"preferred"}
    ],
    "bonus": ["有 SaaS 产品经验","有开源贡献"],
    "custom": [
      {"name":"工程素养","weight":3,"description":"代码可读性、测试意识、CI/CD 经验"}
    ]
  }'::jsonb,
  80,
  'open'
) on conflict do nothing;
