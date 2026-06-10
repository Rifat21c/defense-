# AssessNova AI

AssessNova AI is a full-stack academic assessment platform with a companion desktop integrity monitor. It is built for internship/project demonstration with a professional role-based web application, backend persistence, a Supabase-ready database schema, and an Electron monitor for Windows assessment sessions.

## Modules

- Website: Next.js, React, Tailwind CSS, role dashboards, course management, quiz workflow, results, analytics, admin controls, and monitoring APIs.
- Desktop monitor: Electron app that connects to the website backend and reports integrity events during an active quiz.
- Backend APIs: health check, AI feedback, monitor login, live session polling, integrity logs, and auto-submit commands.
- Database/backend: Next.js API persistence for users, courses, enrollments, quizzes, questions, submissions, analytics, activity logs, and integrity logs. Supabase is used when configured; `.data/app-store.json` is the local fallback.

## Main Features

- Student: register/login, join course by code, take quizzes, autosave answers, submit exams, view feedback and results.
- Professor: create courses, create quizzes, add manual or generated questions, review submissions, monitor integrity reports.
- Admin: manage users, assign roles/departments, view health status, audit activity, inspect all reports.
- Integrity detection: tab switch, copy/paste, fullscreen exit, focus loss, minimize, inactivity, blocked app open, close attempt, and multiple monitors.
- Risk scoring: Low `0-3`, Medium `4-7`, High `8+`, with auto-submit command after risk exceeds `15`.
- Reporting: results, weak-topic analytics, suspicious activity timeline, live monitoring sessions.

## Requirements

- Node.js 20+
- npm
- Windows for the packaged desktop monitor

## Run Website

```powershell
cd C:\Users\Lenovo\Downloads\assessnova-ai-starter\assessnova-ai-starter
npm install
npm run dev -- -p 3001
```

Open:

```text
http://localhost:3001
```

## Seeded Accounts

```text
Professor: professor@assessnova.edu / password123
Student:   student@assessnova.edu / password123
Admin:     admin@assessnova.edu / password123
```

## Run Desktop Monitor

Keep the website running on port `3001`, then run one of these options.

Development mode:

```powershell
npm run monitor:install
npm run monitor:dev
```

Packaged Windows app:

```text
monitor\dist\win-unpacked\AssessNova Monitor.exe
```

Monitor login:

```text
Backend URL: http://localhost:3001
Email: student@assessnova.edu
Password: password123
```

Start a quiz on the website as the same student. The desktop client will detect the active session and send events to the website backend.

## Build

Website production build:

```powershell
npm run build
```

TypeScript check:

```powershell
npm run typecheck
```

Desktop unpacked build:

```powershell
npm run build:dir --prefix monitor
```

Desktop installer/portable build:

```powershell
npm run build --prefix monitor
```

## Important URLs

- `/` landing page
- `/login`
- `/register`
- `/student`
- `/professor`
- `/admin`
- `/admin/users`
- `/courses/[id]`
- `/quizzes/create`
- `/quizzes/[id]`
- `/quizzes/[id]/questions`
- `/results`
- `/results/[id]`
- `/analytics`
- `/integrity`
- `/api/health`
- `/api/app-data`

## Monitoring API

- `POST /api/monitor/login`: desktop monitor login.
- `GET /api/monitor/session`: desktop client polls for active session.
- `POST /api/monitor/session`: website opens/updates a session.
- `DELETE /api/monitor/session`: website ends a session.
- `GET /api/monitor/logs`: professor/admin live monitoring snapshot.
- `POST /api/monitor/logs`: website or desktop client records an event.
- `GET /api/monitor/commands`: website checks for auto-submit commands.

## Supabase Production Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=optional_server_side_service_role_key
GEMINI_API_KEY=optional_server_side_gemini_key
OPENAI_API_KEY=optional_server_side_openai_key
```

The current project saves academic data through `/api/app-data`. With Supabase keys and the `app_state` table from `supabase/schema.sql`, accounts, courses, quizzes, questions, submissions, analytics, activity logs, and integrity logs persist in Supabase. Without Supabase, the same backend API persists data in `.data/app-store.json` for local demonstration. Monitor session data is stored in `.data/monitor-store.json`.

## Suggested Report Sections

- Problem statement: online exam integrity and academic feedback gaps.
- Objectives: secure quiz workflow, role dashboards, risk scoring, analytics, desktop monitoring.
- System architecture: Next.js website, Electron monitor, API bridge, Supabase-ready schema.
- User roles: student, professor, admin.
- Implementation: quiz lifecycle, integrity event capture, risk engine, result analytics.
- Testing: login flows, quiz submission, monitor event reporting, auto-submit threshold.
- Limitations: local development storage, Windows-focused monitor, provider AI keys optional.
- Future scope: Supabase realtime, hardened kiosk mode, signed installer, richer AI grading rubrics.
