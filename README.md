# GTA Centre Atfal – Gamified Youth Web App

Next.js 14 app with TypeScript, Tailwind, Supabase (PostgreSQL), and NextAuth (member code + password).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com). Note:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`) – Project Settings → API

2. **Run migrations** in the Supabase SQL Editor (Dashboard → SQL Editor), in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_seed_majlis.sql`

3. **Environment variables** – copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
   - `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`)

4. **Seed the first Regional Nazim** (one-time). Either:
   - Run the seed script (from project root):
     - Set `SEED_REGIONAL_MEMBER_CODE` and `SEED_REGIONAL_PASSWORD` in env, then:
     - `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed.ts`
   - Or in Supabase SQL Editor, insert a user with a bcrypt hash of your password:
     - Use an online bcrypt generator for your password, then:
     - `INSERT INTO users (member_code, password_hash, role, profile_completed, name) VALUES ('admin1', '<hash>', 'regional_nazim', true, 'Regional Nazim Atfal');`

5. **Install and run**
   - `npm install`
   - `npm run dev`
   - Open `http://localhost:3000`. Log in with the Regional Nazim member code and password.

## Roles

- **Tifl**: Youth (7–15). Completes profile (name, age, age group, Majlis), does homework and lessons, earns points, sees leaderboard and events.
- **Local Nazim Atfal (Majlis Name)**: Admin for one Majlis. Creates homework, approves submissions, creates local events, views Tifls and leaderboard.
- **Regional Nazim Atfal**: Super admin. Creates Tifl/Local Nazim accounts, moves/deletes Tifls, creates lesson activities and grades long-answer submissions, creates regional/national events.

## Majlis (groups)

Ahmadiyya Abode of Peace, Rexdale, Weston North West, Weston North East, Weston South, Weston Islington, Emery Village.

## Features

- **Auth**: Login and signup with member code + password (assigned by admin). Tifl signup redirects to profile completion.
- **Profile**: Name, age, age group (7–9, 10–12, 13–15 / Mayar e Sagheer, Mayar e Kabeer), Majlis.
- **Homework**: Local Nazim creates homework (title, description, due by, links) per Majlis. Tifl submits; Local Nazim approves and awards points.
- **Lesson activities**: Regional Nazim creates video/article lessons with short quiz (auto-grade) or long answer (manual grade). Tifl watches/reads and submits answers.
- **Leaderboard**: Global top 25 by total points (homework + lessons), with name, points, age and Majlis as subscript.
- **Events**: Regional, local, national. Dashboard widget shows upcoming events with labels.
- **Tifl management**: Regional Nazim can move Tifls between Majlis and soft-delete (disable) accounts.
