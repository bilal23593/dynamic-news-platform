# Redwire Daily

Redwire Daily is a production-minded newsroom platform built with Next.js 16, TypeScript, Tailwind CSS, Prisma, and PostgreSQL. It includes a public news site, protected admin CMS, editorial workflow controls, SEO foundations, media management, comments, newsletter capture, ad slots, redirects, and a WordPress-import-ready architecture.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Server Actions + route handlers
- React Hook Form + Zod
- TipTap rich text editing
- Framer Motion

## What’s Included

- Public routes for homepage, latest news, article pages, categories, subcategories, tags, authors, videos, search, and static pages
- Admin routes for dashboard, articles, taxonomy, authors, media, pages, homepage builder, comments, subscribers, redirects, ads, settings, imports, and users
- Role-based authentication with session cookies
- Modular homepage section system
- SEO metadata, sitemap, robots, article schema, breadcrumbs, internal linking
- Local-first media storage abstraction with future S3 / Cloudinary swap support
- WordPress import module scaffolding for XML, JSON, CSV, dry runs, mapping, redirects, and legacy tracking
- Realistic seed data with 25+ newsroom stories and admin content

## Environment

Copy `.env.example` to `.env` and adjust values for your machine:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dynamic_news?schema=public"
APP_URL="http://localhost:3000"
SESSION_COOKIE_NAME="dynamic_news_session"
SESSION_TTL_DAYS="14"
DEFAULT_ADMIN_EMAIL="editor@redwire.local"
DEFAULT_ADMIN_PASSWORD="Newsroom123!"
MEDIA_DISK_ROOT="public/uploads"
MEDIA_PUBLIC_BASE="/uploads"
```

## Setup

1. Install dependencies.

```bash
npm install
```

2. Generate the Prisma client.

```bash
npm run db:generate
```

3. Push the schema to PostgreSQL.

```bash
npm run db:push
```

4. Seed the newsroom demo content.

```bash
npm run db:seed
```

5. Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Default Admin Login

- Email: `editor@redwire.local`
- Password: `Newsroom123!`

These values come from `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` during seeding.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:seed
npm run db:studio
```

## Project Structure

```text
prisma/
src/app/
src/components/
src/config/
src/features/
src/hooks/
src/lib/
src/lib/wordpress-import/
src/server/
src/types/
```

## WordPress Migration Readiness

The importer foundation lives in `src/lib/wordpress-import/` and includes:

- `parsers/` for WordPress XML, REST JSON, and CSV
- `mappers/` for categories and authors
- `transformers/` for HTML cleanup and media extraction
- `services/` for dry runs, import orchestration, media import planning, and redirect creation
- `validators/` for input validation

Current service contracts include:

- `parseWordpressXml()`
- `importPostsFromWordpress()`
- `mapWordpressCategories()`
- `mapWordpressAuthors()`
- `importWordpressMedia()`
- `transformWordpressHtmlToEditorBlocks()`
- `createLegacyRedirects()`
- `runDryImport()`
- `finalizeImport()`

## Notes

- The app is designed to run against PostgreSQL. If the database is unavailable, some public data helpers fall back to seeded demo newsroom content.
- Media uploads use local disk storage first through `src/server/media/`, but the storage layer is intentionally abstracted for future cloud providers.
- This project targets the local Next.js 16 behavior in this repo, including the newer App Router type conventions.
