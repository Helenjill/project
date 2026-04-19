# Tulane Marketplace

Mobile-first web app for Tulane students to buy/sell items with offers, likes, messaging, AI-assisted listing drafts, and campus meetup workflows.

## Stack
- Next.js + TypeScript + Tailwind CSS
- Supabase (Auth + Postgres + Storage + RLS)
- Vercel deployment target

## Product highlights
- Tulane-only magic-link authentication (`@tulane.edu` enforced).
- Bottom tabs: Home, Search, Sell, Likes, Inbox, Profile.
- Listings with images, category/condition/tags, meetup location, and payment method (Cash or Venmo).
- Offer and counteroffer status tracking.
- Listing/user reporting with moderation flags.
- AI helper to suggest title/description/category/condition/tags from an uploaded item photo (fully editable before posting).

## Design system
- Times New Roman globally.
- No rounded corners anywhere.
- Clean, thin-border cards.
- Primary palette: Tulane green + white, subtle light blue accents.

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Create a Supabase project and run SQL:
   - Run `supabase/schema.sql` in the SQL editor.
   - Create storage bucket `listing-images` (public bucket for MVP).
   - Optionally run `supabase/seed.sql` after creating a test profile row.
4. Run app:
   ```bash
   npm run dev
   ```

## Supabase setup notes
- Auth provider: Email (magic link).
- Site URL: your local URL + production URL.
- Email confirm enabled.
- Trigger in `schema.sql` auto-creates `profiles` rows and rejects non-Tulane email domains.
- RLS policies restrict create/update actions to verified Tulane users and resource owners.

## Vercel deployment
1. Push repo to GitHub.
2. Import project in Vercel.
3. Add env vars from `.env.example`.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENAI_API_KEY` in Vercel dashboard.
5. Deploy.

## Folder map
- `app/` — Next.js app routes and UI pages
- `app/api/ai/suggest-listing/route.ts` — AI photo-to-listing endpoint
- `components/` — reusable UI components
- `lib/` — Supabase clients, shared types, meetup constants
- `supabase/schema.sql` — schema + RLS + auth trigger
- `supabase/seed.sql` — sample listing/image data
- `.env.example` — required environment variable template

## Current MVP flow
1. Sign in at `/auth` with Tulane email.
2. Browse feed on Home.
3. Search/filter/sort in Search.
4. Post in Sell (optional AI assist + photo uploads).
5. Like items and open listing detail.
6. Make offers or counter updates and message participants.
7. Manage profile settings + listing stats in Profile.

## Important note for production hardening
- Add stricter server-side validation for offer transitions.
- Move sensitive mutations to server actions/API routes only.
- Add robust image moderation + rate limiting.
- Add full test suite (unit + e2e).
