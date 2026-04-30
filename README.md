# BandJam Nuxt App

This project is a Nuxt 4 app for classroom Band Jam warm-ups.

Students can:

- choose a musical style, instrument, and part number
- view the matching sheet music (image or PDF)
- play available demo and backing audio

Teachers can:

- log in
- upload style-level audio, part-level audio, and sheet music
- store and retrieve uploaded assets from Supabase

## Tech Stack

- Nuxt 4
- Vue 3
- Tailwind CSS 4 (via `@import "tailwindcss"` in global CSS)
- Supabase (`@supabase/supabase-js`)

## Project Structure

Nuxt app code is centralized under `app/`:

- `app/pages/` route pages
- `app/layouts/` layouts
- `app/components/` reusable components
- `app/composables/` app state and asset helpers
- `app/middleware/` route guards
- `app/plugins/` client plugins (Supabase)
- `app/assets/main/css/style.css` global styles

Static files are in `public/`.

## Setup

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file (or export env vars) for Supabase, Better-Auth, and Google Credentials.

See `.env.local`.

If Supabase values are omitted, the app still runs, but upload/retrieval from Supabase is disabled.

## Development

Run dev server:

```bash
npm run dev
```

## Quality Checks

Typecheck:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```
