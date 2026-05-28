# 📖 The Book Club: Slow Reading Circle & Exchange

Welcome to **The Book Club**, a premium, cozy, and highly tactile web platform designed for reader communities to catalog physical and digital libraries, review books, coordinate physical swaps, and consult personalized AI book curators.

Built with **Next.js 16 (App Router)**, **Supabase (PostgreSQL with RLS policies and automatic triggers)**, and **Framer Motion spring-physics animations**.

---

## ✨ Features & Architecture

### 1. Slow Reading Circle Feed (`/feed`)
- Browse organic activity reviews posted by other members.
- Like and comment on reviews with optimistic state updates.
- Toggle between **All Activities** and **Following Only** to filter feed views.

### 2. My Library Shelf (`/shelf`)
- Interactive **virtual wooden bookshelf** system.
- Add books to shelf utilizing real-time Google Books search.
- Badge items as **Read** or **TBR** (To Be Read).
- Post reviews directly from book shelf volumes.

### 3. Literature Discovery (`/discover`)
- Beautiful curated monthly highlights (e.g. *The House in the Cerulean Sea*, *Piranesi*).
- Interactive **Trending This Week** panel with real-time genre filtering.
- Recently reviewed scroll systems.

### 4. AI Book Recommender (`/recommend`)
- Cozy natural language assistant to request specific tropes, atmospheres, and lengths.
- Connects to AI models to generate exactly 3 real matches.
- Enriches AI recommendations with live page counts and covers from Google Books.
- Protected by a built-in client-side rate limiter.

### 5. Book Swap Exchange (`/exchange`)
- Local community swap exchange system.
- Browse listings with badges indicating book conditions (New, Like New, Good, Fair).
- Send borrow request messages directly to book owners.
- Active tabs to lend your own shelf items or manage incoming/outgoing requests.

### 6. Public Reader Rooms (`/profile/[username]`)
- Exquisite member profiles showing bookshelves, favorite genre tags, and stats.
- Integrated optimistic **Follow/Unfollow** system.
- Tab panels displaying public reviews.

---

## 🛠️ Tech Stack

- **Core**: Next.js (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS (cozy color token systems)
- **Database / Auth**: Supabase (PostgreSQL, triggers, compound indexing, Row-Level Security)
- **Animations**: Framer Motion (page transitions, tactile lifts, and tilts on hover)
- **Notifications**: Polling & dynamic toast notifications using Sonner & canvas-confetti

---

## 🔑 How to Acquire API Keys

### 1. Supabase URL & Anon Key
1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Spin up a new project named `The Book Club`.
3. Once created, go to **Project Settings > API** in the sidebar.
4. Copy the **Project URL** and **anon public key**.

### 2. Google Books API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable the **Google Books API** from the API Library.
4. Go to **APIs & Services > Credentials** and generate an API key.

### 3. OpenAI API Key
1. Go to the [OpenAI Developer Platform](https://platform.openai.com/).
2. Navigate to **API Keys** and click **Create new secret key**.
3. Allocate sufficient credits for testing `gpt-4o-mini` calls.

---

## 📋 Environment Variables Table

Configure these in a `.env.local` file inside the root directory:

| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | The API endpoint URL of your Supabase instance. | `https://x.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | The anonymous public key for secure client operations. | `eyJhbGciOi...` |
| `OPENAI_API_KEY` | Yes | Secure API key for AI book recommendations. | `sk-proj-...` |
| `GOOGLE_BOOKS_API_KEY` | Yes | Key to authenticate search & card covers enrichment. | `AIzaSyC...` |

---

## 📦 Getting Started & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Schema Setup
Run the SQL definitions file inside `supabase/schema.sql` on your Supabase SQL editor to instantiate all the database tables, triggers, and Row Level Security policies.

### 3. Phase 1: Clean Database + Seed Real Books (MANDATORY FIRST STEP)
The app currently contains a lot of dummy data (Unsplash covers, fake users, fake reviews).  
**Phase 1 removes all of it and replaces it with 28 real, popular books with beautiful high-resolution covers from Google Books.**

#### Step A — Run the SQL Migration (paste into Supabase SQL Editor)
Copy and run the **entire** contents of this file:

```
supabase/migrations/202604_phase1_books_table.sql
```

(Or copy the block below if you prefer one file.)

<details>
<summary><strong>Click to expand the full SQL you can paste directly</strong></summary>

```sql
-- ============================================================================
-- PHASE 1: The Book Club — Create centralized `books` table + safe cleanup
-- ============================================================================

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  google_id text unique,
  title text not null,
  author text,
  cover_url text,
  description text,
  published_date text,
  page_count integer,
  categories text[] default '{}',
  average_rating numeric(3,2),
  ratings_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists books_title_idx on public.books using gin (to_tsvector('english', title));
create index if not exists books_author_idx on public.books (author);
create index if not exists books_google_id_idx on public.books (google_id);

alter table public.books enable row level security;

drop policy if exists "Books are publicly readable" on public.books;
create policy "Books are publicly readable" on public.books for select using (true);

drop policy if exists "Authenticated users can insert books" on public.books;
create policy "Authenticated users can insert books" on public.books for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update books" on public.books;
create policy "Authenticated users can update books" on public.books for update using (auth.role() = 'authenticated');

-- SAFE CLEANUP of all previous dummy data
delete from public.reviews
where book_cover_url like '%unsplash.com%'
   or id like 'rev-%'
   or id like 'mock-%'
   or book_title in ('The Haunting of Hill House', 'Rebecca', 'Stoner', 'The House in the Cerulean Sea', 'A Psalm for the Wild-Built', 'The Secret History', 'Legends & Lattes', 'Project Hail Mary');

delete from public.lend_listings
where book_cover_url like '%unsplash.com%'
   or id like 'lst-%'
   or id like 'mock-lend-%'
   or book_title in ('The Great Gatsby', 'The Starless Sea', 'Dune', 'A Court of Thorns and Roses', 'The Alchemist');

delete from public.bookshelf
where book_cover_url like '%unsplash.com%'
   or id like 'shelf-mock-%'
   or book_title in ('The Midnight Library', 'The Hobbit', 'Normal People');

delete from public.follows
where follower_id like '3f8e5621-%' or following_id like '3f8e5621-%';

delete from public.profiles
where id like '3f8e5621-%';

comment on table public.books is 'Centralized catalog of real books with high-quality Google Books covers.';
```

</details>

#### Step B — Install dependencies (one time)
```bash
npm install
```

#### Step C — Seed 28 Real Books with Beautiful Covers
This script calls the Google Books API for every title, extracts the highest-resolution cover available (extraLarge/large), and saves them into the new `books` table.

```bash
npm run seed:real
```

**Expected output:** 25–28 books successfully seeded with real covers.

#### Step D — Verify
1. Go to your Supabase project → **Table Editor** → `books` table.
2. You should see ~28 rows with real titles, authors, and proper `cover_url` values (not Unsplash).
3. Run the app — you will still see some old UI dummy data (this will be removed in Phase 4).

**Important:** The `GOOGLE_BOOKS_API_KEY` in `.env.local` is now used by the seed script. Without it the covers will be lower quality or missing for some titles.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your reading sanctuary.

### 5. Production Build Check
```bash
npm run build
```

---

## ☁️ Vercel Deployment Steps

1. **Push your repository** to GitHub, GitLab, or Bitbucket.
2. **Import the project** in Vercel.
3. Configure the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `GOOGLE_BOOKS_API_KEY`) inside Vercel Project Settings.
4. Set the build command to `npm run build` and output directory to `.next`.
5. Deploy! Enjoy your new cozy reading room community space.

---

## 🔮 Future Improvement Ideas

- **Thematic Group Rooms**: Support real-time reading rooms with shared chat feeds and chapter sync milestones.
- **Physical Book Barcode Scanner**: Let users scan their books' ISBN barcodes with their phone cameras to instantly add them to their virtual bookshelf.
- **Enhanced Offline Reading Logs**: Support local storage persistence for offline reviews with dynamic database syncing once network connection returns.
