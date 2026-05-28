/**
 * scripts/seed-real-books.ts
 *
 * PHASE 1 — The Book Club
 * Production-grade seed script: removes all dummy data and seeds 28 real books
 * with high-quality covers from the Google Books API into the new `public.books` table.
 *
 * Usage:
 *   npx tsx scripts/seed-real-books.ts
 *
 * Requirements:
 *   - GOOGLE_BOOKS_API_KEY in .env.local (strongly recommended for quality + rate limits)
 *   - Supabase URL + Anon key (or Service Role key for best results)
 *
 * The script is idempotent — running it multiple times is safe.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 1. Load environment (same cozy loader as the old seed.js)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found. Please create it with your Supabase keys.');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    let key = trimmed.substring(0, idx).trim();
    let value = trimmed.substring(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY; // Best for seeding
const googleApiKey = env.GOOGLE_BOOKS_API_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in .env.local');
  process.exit(1);
}

// Use service role if available (bypasses RLS for inserts) — recommended for seeding
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  { auth: { persistSession: false } }
);

console.log('📚 [The Book Club] Phase 1 Real Books Seeder starting...\n');

// ---------------------------------------------------------------------------
// 2. Curated list of 28 real, beautiful books (cozy + literary + popular)
//    These have excellent covers and fit the app's slow-reading, warm aesthetic.
// ---------------------------------------------------------------------------
const REAL_BOOKS_TO_SEED = [
  { title: 'The House in the Cerulean Sea', author: 'TJ Klune' },
  { title: 'A Psalm for the Wild-Built', author: 'Becky Chambers' },
  { title: 'Legends & Lattes', author: 'Travis Baldree' },
  { title: 'The Midnight Library', author: 'Matt Haig' },
  { title: 'Piranesi', author: 'Susanna Clarke' },
  { title: 'Before the Coffee Gets Cold', author: 'Toshikazu Kawaguchi' },
  { title: 'The Secret History', author: 'Donna Tartt' },
  { title: 'Project Hail Mary', author: 'Andy Weir' },
  { title: 'Dune', author: 'Frank Herbert' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien' },
  { title: 'Normal People', author: 'Sally Rooney' },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { title: 'Rebecca', author: 'Daphne du Maurier' },
  { title: 'Stoner', author: 'John Williams' },
  { title: 'The Alchemist', author: 'Paulo Coelho' },
  { title: 'Circe', author: 'Madeline Miller' },
  { title: 'The Vanishing Half', author: 'Brit Bennett' },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro' },
  { title: 'The Overstory', author: 'Richard Powers' },
  { title: 'Pachinko', author: 'Min Jin Lee' },
  { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid' },
  { title: 'Remarkably Bright Creatures', author: 'Shelby Van Pelt' },
  { title: 'The Silent Patient', author: 'Alex Michaelides' },
  { title: 'Educated', author: 'Tara Westover' },
  { title: 'Sapiens', author: 'Yuval Noah Harari' },
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'The Thursday Murder Club', author: 'Richard Osman' },
];

// ---------------------------------------------------------------------------
// 3. High-quality cover helper (same logic as lib/books.ts but standalone for seed)
// ---------------------------------------------------------------------------
function getHighQualityCover(imageLinks: any): string | null {
  if (!imageLinks) return null;
  const raw =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail ||
    null;
  if (!raw) return null;

  let url = raw.replace(/^http:/, 'https:');
  if (url.includes('zoom=1') || url.includes('thumbnail')) {
    url = url.replace(/&?zoom=\d+/, '');
    if (!url.includes('fife=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}fife=w800`;
    }
  }
  return url.replace(/^http:/, 'https:');
}

// ---------------------------------------------------------------------------
// 4. Core seeding logic
// ---------------------------------------------------------------------------
async function seedRealBooks() {
  console.log('🧹 Step 1: Cleaning all previous dummy/fake data (safe — only obvious mocks)...\n');

  // Safe cleanup — only remove rows that are clearly from the old dummy seed
  const { error: delReviewsErr } = await supabase
    .from('reviews')
    .delete()
    .or('book_cover_url.ilike.%unsplash.com%,id.like.rev-%,id.like.mock-%');

  const { error: delListingsErr } = await supabase
    .from('lend_listings')
    .delete()
    .or('book_cover_url.ilike.%unsplash.com%,id.like.lst-%,id.like.mock-lend-%');

  const { error: delShelfErr } = await supabase
    .from('bookshelf')
    .delete()
    .or('book_cover_url.ilike.%unsplash.com%,id.like.shelf-mock-%');

  // Clean up the old fake profile rows (they used hardcoded UUIDs that never existed in auth.users)
  const { error: delProfilesErr } = await supabase
    .from('profiles')
    .delete()
    .like('id', '3f8e5621-%');

  if (delReviewsErr || delListingsErr || delShelfErr || delProfilesErr) {
    console.warn('⚠️  Some cleanup warnings (non-fatal):');
    if (delReviewsErr) console.warn('   reviews:', delReviewsErr.message);
    if (delListingsErr) console.warn('   lend_listings:', delListingsErr.message);
    if (delShelfErr) console.warn('   bookshelf:', delShelfErr.message);
    if (delProfilesErr) console.warn('   profiles:', delProfilesErr.message);
  } else {
    console.log('   ✅ Dummy reviews, listings, shelf items, and fake profiles removed.\n');
  }

  console.log(`📖 Step 2: Seeding ${REAL_BOOKS_TO_SEED.length} real books from Google Books API...\n`);

  let success = 0;
  let failed: string[] = [];

  for (const book of REAL_BOOKS_TO_SEED) {
    const query = `${book.title} ${book.author}`;
    const encoded = encodeURIComponent(query);

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=1${
      googleApiKey ? `&key=${googleApiKey}` : ''
    }`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`   ❌ ${book.title} — Google API error ${res.status}`);
        failed.push(book.title);
        continue;
      }

      const data = await res.json();
      const item = data.items?.[0];
      if (!item) {
        console.log(`   ⚠️  ${book.title} — No Google Books result`);
        failed.push(book.title);
        continue;
      }

      const info = item.volumeInfo;
      const cover = getHighQualityCover(info.imageLinks);

      const payload = {
        google_id: item.id,
        title: info.title || book.title,
        author: info.authors ? info.authors.join(', ') : book.author,
        cover_url: cover,
        description: info.description || null,
        published_date: info.publishedDate || null,
        page_count: info.pageCount || null,
        categories: info.categories || [],
        average_rating: info.averageRating || null,
        ratings_count: info.ratingsCount || null,
      };

      const { error: upsertErr } = await supabase
        .from('books')
        .upsert(payload, { onConflict: 'google_id' });

      if (upsertErr) {
        console.log(`   ❌ ${book.title} — DB upsert failed: ${upsertErr.message}`);
        failed.push(book.title);
      } else {
        console.log(`   ✅ ${book.title} — ${cover ? 'beautiful cover saved' : 'no cover found'}`);
        success++;
      }

      // Small delay to be nice to Google Books rate limits
      await new Promise((r) => setTimeout(r, 180));
    } catch (err: any) {
      console.log(`   ❌ ${book.title} — ${err.message}`);
      failed.push(book.title);
    }
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log(`✨ Phase 1 seeding complete!`);
  console.log(`   Successfully seeded: ${success} / ${REAL_BOOKS_TO_SEED.length} real books`);
  if (failed.length > 0) {
    console.log(`   Failed / skipped: ${failed.length} — ${failed.join(', ')}`);
  }
  console.log('────────────────────────────────────────────────────────\n');

  console.log('📌 Next steps:');
  console.log('   1. Verify in Supabase → Table Editor → "books" table (you should see 20–28 rows with real covers).');
  console.log('   2. Run the app and visit /discover, /shelf, /feed, /exchange — they still show some old UI mocks (Phase 4 will remove them).');
  console.log('   3. When ready, say "proceed" to start Phase 2 (Real-time Messaging).\n');
}

// Run it
seedRealBooks().catch((err) => {
  console.error('💥 Fatal error during seeding:', err);
  process.exit(1);
});
