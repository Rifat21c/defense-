-- AssessNova AI Supabase schema
-- AI-Powered Examination Platform with Desktop Integrity Monitoring System

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null check (role in ('student', 'professor', 'admin')),
  department text not null,
  created_at timestamptz default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  professor_id uuid references profiles(id) on delete cascade,
  join_code text unique not null,
  department text not null,
  created_at timestamptz default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(course_id, student_id)
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  description text,
  duration integer not null default 30,
  total_marks integer not null default 10,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  integrity_enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  marks integer not null default 1,
  topic text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard'))
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  answers jsonb not null,
  score integer not null default 0,
  ai_feedback text,
  submitted_at timestamptz default now()
);

create table if not exists integrity_logs (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'TAB_SWITCH',
      'COPY_PASTE',
      'FULLSCREEN_EXIT',
      'WINDOW_BLUR',
      'WINDOW_MINIMIZE',
      'BROWSER_FOCUS_LOSS',
      'BROWSER_TAB_CHANGE',
      'INACTIVITY',
      'BLOCKED_APP_OPEN',
      'EXAM_CLIENT_CLOSED',
      'MULTIPLE_MONITORS'
    )
  ),
  event_time timestamptz default now(),
  risk_points integer not null default 0,
  source text not null default 'web' check (source in ('web', 'desktop')),
  details text
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  weak_topics text[] default '{}',
  average_score numeric default 0,
  recommendation text
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- App state persistence used by the Next.js backend API.
-- This keeps the demo project's custom role/login flow, courses, quizzes,
-- submissions, analytics, and integrity logs saved in Supabase.
create table if not exists app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Live Electron monitor sessions, desktop/browser integrity logs, and monitor
-- commands are persisted here for project demonstration and defense review.
create table if not exists monitor_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table integrity_logs enable row level security;
alter table notifications enable row level security;
alter table analytics enable row level security;
alter table audit_logs enable row level security;
alter table app_state enable row level security;
alter table monitor_state enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on app_state to anon, authenticated, service_role;
grant select, insert, update, delete on monitor_state to anon, authenticated, service_role;

create policy "profiles read authenticated" on profiles
  for select to authenticated using (true);

create policy "profiles update own or admin" on profiles
  for update to authenticated using (
    auth.uid() = id or exists (
      select 1 from profiles admin_profile
      where admin_profile.id = auth.uid() and admin_profile.role = 'admin'
    )
  );

create policy "courses read authenticated" on courses
  for select to authenticated using (true);

create policy "professors manage own courses" on courses
  for all to authenticated using (
    professor_id = auth.uid() or exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "enrollments read authenticated" on enrollments
  for select to authenticated using (true);

create policy "students enroll themselves" on enrollments
  for insert to authenticated with check (student_id = auth.uid());

create policy "quizzes read authenticated" on quizzes
  for select to authenticated using (true);

create policy "professors manage course quizzes" on quizzes
  for all to authenticated using (
    exists (
      select 1 from courses c
      where c.id = quizzes.course_id
      and (
        c.professor_id = auth.uid()
        or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      )
    )
  );

create policy "questions read authenticated" on questions
  for select to authenticated using (true);

create policy "submissions scoped read" on submissions
  for select to authenticated using (
    student_id = auth.uid()
    or exists (
      select 1
      from quizzes q
      join courses c on c.id = q.course_id
      where q.id = submissions.quiz_id and c.professor_id = auth.uid()
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "students submit own exams" on submissions
  for insert to authenticated with check (student_id = auth.uid());

create policy "integrity logs scoped read" on integrity_logs
  for select to authenticated using (
    student_id = auth.uid()
    or exists (
      select 1
      from quizzes q
      join courses c on c.id = q.course_id
      where q.id = integrity_logs.quiz_id and c.professor_id = auth.uid()
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "students create own integrity logs" on integrity_logs
  for insert to authenticated with check (student_id = auth.uid());

create policy "notifications owner read" on notifications
  for select to authenticated using (user_id = auth.uid());

create policy "analytics scoped read" on analytics
  for select to authenticated using (
    student_id = auth.uid()
    or exists (
      select 1 from courses c
      where c.id = analytics.course_id and c.professor_id = auth.uid()
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "audit admin read" on audit_logs
  for select to authenticated using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "app state service read" on app_state
  for select using (true);

create policy "app state service insert" on app_state
  for insert with check (true);

create policy "app state service update" on app_state
  for update using (true);

create policy "monitor state service read" on monitor_state
  for select using (true);

create policy "monitor state service insert" on monitor_state
  for insert with check (true);

create policy "monitor state service update" on monitor_state
  for update using (true);
