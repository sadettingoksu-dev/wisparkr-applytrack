# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**ApplyTrack** (product domain: wisparkr.com) — an AI-powered job-application tracking
platform. A user pastes a job-posting URL; the app scrapes company / position / description,
lets them upload a CV, computes an AI fit score and suggestions, tracks applications on a
Pending / Interview / Offer / Rejected kanban, and helps them prepare with AI mock interviews.
The product UI and AI output are in **Turkish**.

## Commands

```bash
npm install
npm run dev      # Next.js dev server on http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # next lint (ESLint)
```

There is **no test suite**. Verify changes via `npm run build` / `npm run lint` and manual testing.

The app boots without `.env.local`: missing Supabase/Claude/Lemon Squeezy keys make the
relevant API routes return `503 "not configured"` instead of crashing. Auth/DB calls do error
until a Supabase project is wired up — that is expected.

## Tech stack

- **Next.js 14** App Router + TypeScript, **Tailwind CSS**
- **Supabase** — Postgres + auth (email & GitHub/Google OAuth), accessed via `@supabase/ssr`
- **Anthropic Claude API** (`@anthropic-ai/sdk`) — all AI features
- **Lemon Squeezy** — subscriptions/billing (webhook-driven)
- **Vercel** — deploy target
- Chrome extension (MV3) under `extension/` for autofilling applications from LinkedIn/Indeed

## Architecture & layout

- `app/(auth)/**` — login, signup, OAuth callback
- `app/(dashboard)/**` — authenticated pages: dashboard, applications, board (kanban),
  calendar, analytics, compare, cv-builder, documents, settings/billing, mock-interview
- `app/api/**` — all backend route handlers (REST-ish). Groups: `ai/*`, `applications/*`,
  `cv/*`, `billing/*`, `mock-interview/*`, `extension/*`, `jobs/parse`, `webhooks/*`,
  `notifications`
- `app/cv/[token]/**` — public shared-CV pages (no auth)
- `components/**` — UI, grouped by feature (kanban, cv, chat, interview, analytics, …)
- `lib/**` — server logic: `anthropic.ts` (all Claude calls), `supabase/{client,server,admin,middleware}.ts`,
  `plans.ts` (pricing/feature flags), `usage.ts` (monthly AI quota), `lemonsqueezy.ts`,
  `jobParser.ts` (scrape job postings via cheerio), `cv*.ts`, `pdf.ts`, `i18n*.ts`, `types.ts`
- `utils/` — `constants.ts` (kanban columns, status labels/colors), `format.ts`
- `supabase/migrations/**` — ordered SQL; run in Supabase SQL Editor. RLS is in `0002`
- `middleware.ts` — Supabase session refresh on requests
- `types/database.types.ts` — generated Supabase types

## Domain model (see `supabase/migrations/0001_init_schema.sql`)

- `profiles` (1:1 with `auth.users`, auto-created by trigger) — holds `plan`, `cv_text`, trial
- `applications` — company/position/url/description, `status`, `fit_score` (0-100), `fit_suggestions`
- `ai_messages` — interview-prep chat history per application
- `subscriptions` — synced from Lemon Squeezy webhooks
- `ai_usage` — per-user, per-month counters enforcing plan limits

## Plans & gating

Three tiers in `lib/plans.ts`: **free** (5 apps, 10 AI Q/mo), **pro** ($9: unlimited apps,
200 AI Q/mo, fit score, tailoring, cover letter, mock interview), **career_coach** ($29:
unlimited AI + coaching features). New signups get a 5-day trial at `pro` level
(`getEffectivePlanId` / `isTrialActive`). Feature flags and quotas should always be read
through `lib/plans.ts` + `lib/usage.ts`, never hard-coded in routes.

## AI conventions (`lib/anthropic.ts`)

- Default model from `ANTHROPIC_MODEL` env, falling back to `claude-haiku-4-5-20251001`.
- Every helper builds a Turkish prompt, demands a strict JSON-only reply, extracts the first
  `{...}` block, and validates it with a **Zod** schema — throwing `invalid AI response shape`
  on mismatch. Follow this pattern (prompt → `messages.create` → regex JSON → `safeParse`)
  when adding new AI calls.
- Prompts append `TURKISH_WRITING_RULE` and instruct the model never to invent CV facts.
- Use `isAnthropicConfigured()` / `getAnthropicClient()` and return `503` when unset.

## Team conventions (from CONTRIBUTING.md / README.md, written in Turkish)

The repo is split by ownership:
- **Backend (Sadettin):** `app/api/**`, `lib/**`, `utils/**`, `supabase/**`, `middleware.ts`,
  `.env*`, root config. Treat these as the source of truth for contracts.
- **Frontend (Taha):** `components/**`, `app/**/page.tsx` (non-API), dashboard layout, styling.

Shared contracts live in `lib/types.ts`, `utils/constants.ts`, `lib/plans.ts` — add new shared
types/constants there rather than inlining. Branch model: `main` is protected; work on
`feature/<name>-<slug>` and open a PR. Brand color is purple (`purple-600`).
