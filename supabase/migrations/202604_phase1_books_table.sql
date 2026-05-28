-- ============================================================================
-- PHASE 1: The Book Club — Create centralized `books` table + safe cleanup
-- ============================================================================
-- Run this entire script in the Supabase SQL Editor (or via psql).
-- This creates a real books catalog with high-quality cover support.
-- It also includes safe cleanup statements for all previous dummy data.
-- ============================================================================

-- 1. Create the books table (central source of truth for real book metadata)
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

-- Helpful indexes
create index if not exists books_title_idx on public.books using gin (to_tsvector('english', title));
create index if not exists books_author_idx on public.books (author);
create index if not exists books_google_id_idx on public.books (google_id);

-- Enable RLS
alter table public.books enable row level security;

-- RLS Policies: Everyone can read books (public catalog). Only service/admin can insert/update for now.
drop policy if exists "Books are publicly readable" on public.books;
create policy "Books are publicly readable"
  on public.books for select
  using (true);

-- Allow authenticated users to insert books (via our seed script / future features)
drop policy if exists "Authenticated users can insert books" on public.books;
create policy "Authenticated users can insert books"
  on public.books for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update books" on public.books;
create policy "Authenticated users can update books"
  on public.books for update
  using (auth.role() = 'authenticated');

-- 2. Safe cleanup of all previous dummy / fake data
--    (Only removes obvious dummy rows — never touches real user profiles or their content)

-- Remove dummy reviews (those with Unsplash covers or classic mock ids)
delete from public.reviews
where 
  book_cover_url like '%unsplash.com%'
  or id like 'rev-%'
  or id like 'mock-%'
  or book_title in ('The Haunting of Hill House', 'Rebecca', 'Stoner', 'The House in the Cerulean Sea', 'A Psalm for the Wild-Built', 'The Secret History', 'Legends & Lattes', 'Project Hail Mary');

-- Remove dummy lend listings
delete from public.lend_listings
where 
  book_cover_url like '%unsplash.com%'
  or id like 'lst-%'
  or id like 'mock-lend-%'
  or book_title in ('The Great Gatsby', 'The Starless Sea', 'Dune', 'A Court of Thorns and Roses', 'The Alchemist');

-- Remove dummy bookshelf entries
delete from public.bookshelf
where 
  book_cover_url like '%unsplash.com%'
  or id like 'shelf-mock-%'
  or book_title in ('The Midnight Library', 'The Hobbit', 'Normal People');

-- Remove any old fake follows that pointed to the hardcoded fake UUIDs from seed.js
delete from public.follows
where follower_id like '3f8e5621-%' or following_id like '3f8e5621-%';

-- Remove notifications that came from the fake seed data (optional but clean)
delete from public.notifications
where message like '%Cozy%' or message like '%mock%';

-- 3. Optional: also clean the old fake profiles table rows that were never real auth users
--    (These had hardcoded UUIDs and will never have auth.users rows)
delete from public.profiles
where id like '3f8e5621-%';

-- 4. (Optional but recommended) Add a small comment for future migrations
comment on table public.books is 'Centralized catalog of real books with high-quality Google Books covers. Populated via seed script and Google Books API.';

-- Success message
select '✅ Phase 1 schema migration complete. books table created. Dummy data cleaned.' as status;
