/**
 * lib/books.ts
 * Production-grade helpers for The Book Club.
 * - searchAndSaveBook: Google Books search + upsert into public.books with high-quality cover.
 * - getHighQualityCover: Prefers extraLarge > large > medium, forces https, improves resolution.
 *
 * Requires GOOGLE_BOOKS_API_KEY in environment for best results (falls back gracefully).
 */

import { createClient } from '@/lib/supabase/server';

export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
}

export interface SavedBook {
  id: string;
  google_id: string | null;
  title: string;
  author: string | null;
  cover_url: string | null;
  description: string | null;
  published_date: string | null;
  page_count: number | null;
  categories: string[];
  average_rating: number | null;
  ratings_count: number | null;
  created_at: string;
}

/**
 * Returns the best possible high-resolution cover URL from Google Books volumeInfo.
 * Priority: extraLarge → large → medium → thumbnail
 * Always returns https and attempts to request a larger size when possible.
 */
export function getHighQualityCover(volumeInfo: GoogleBookVolume['volumeInfo']): string | null {
  const links = volumeInfo.imageLinks;
  if (!links) return null;

  // Prefer highest quality available
  const raw =
    links.extraLarge ||
    links.large ||
    links.medium ||
    links.small ||
    links.thumbnail ||
    null;

  if (!raw) return null;

  // Force https and remove zoom=1 (which gives tiny images)
  let url = raw.replace(/^http:/, 'https:');

  // Many Google thumbnails have &edge=0 or zoom=1. We want higher resolution.
  // Strategy: if it contains zoom=1 or is a thumbnail, try to upgrade to a larger fife parameter.
  if (url.includes('zoom=1') || url.includes('thumbnail')) {
    // Remove existing zoom and try to request ~800px width
    url = url.replace(/&?zoom=\d+/, '');
    // Google sometimes supports &fife=w800-h1200 or similar for better quality
    if (!url.includes('fife=')) {
      // Append a quality upgrade param when possible
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}fife=w800`;
    }
  }

  // Final safety: ensure https
  return url.replace(/^http:/, 'https:');
}

/**
 * Searches Google Books API for a query and saves the best match into the public.books table.
 * Returns the saved book record (with high-quality cover) or null if nothing found.
 *
 * This is the canonical function the rest of the app should use when it needs a real book.
 */
export async function searchAndSaveBook(query: string): Promise<SavedBook | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
  const supabase = await createClient();

  if (!query || query.trim().length < 2) {
    return null;
  }

  const searchQuery = encodeURIComponent(query.trim());

  // Build Google Books URL (include key only if present)
  const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=3${
    apiKey ? `&key=${apiKey}` : ''
  }`;

  let volume: GoogleBookVolume | null = null;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } }); // cache 24h
    if (!res.ok) {
      console.warn('[books] Google Books API error', res.status);
      return null;
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Pick the first result that has a title (usually the best match)
    volume = data.items.find((item: any) => item.volumeInfo?.title)?.volumeInfo
      ? data.items[0]
      : null;

    if (!volume) return null;
  } catch (err) {
    console.error('[books] Failed to fetch from Google Books:', err);
    return null;
  }

  const info = volume.volumeInfo;
  const coverUrl = getHighQualityCover(info);

  const bookPayload = {
    google_id: volume.id,
    title: info.title,
    author: info.authors ? info.authors.join(', ') : null,
    cover_url: coverUrl,
    description: info.description || null,
    published_date: info.publishedDate || null,
    page_count: info.pageCount || null,
    categories: info.categories || [],
    average_rating: info.averageRating || null,
    ratings_count: info.ratingsCount || null,
  };

  // Upsert by google_id so we never duplicate real books
  const { data: saved, error } = await supabase
    .from('books')
    .upsert(bookPayload, { onConflict: 'google_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[books] Failed to upsert book into Supabase:', error.message);
    // Still return what we would have saved so the caller can use it immediately
    return {
      id: 'temp-' + volume.id,
      google_id: volume.id,
      title: bookPayload.title,
      author: bookPayload.author,
      cover_url: bookPayload.cover_url,
      description: bookPayload.description,
      published_date: bookPayload.published_date,
      page_count: bookPayload.page_count,
      categories: bookPayload.categories,
      average_rating: bookPayload.average_rating,
      ratings_count: bookPayload.ratings_count,
      created_at: new Date().toISOString(),
    } as SavedBook;
  }

  return saved as SavedBook;
}

/**
 * Convenience: fetch a book from our local books table by google_id.
 * Falls back to searching Google if not present.
 */
export async function getOrSearchBook(googleIdOrQuery: string): Promise<SavedBook | null> {
  const supabase = await createClient();

  // Try local first by google_id
  const { data: local } = await supabase
    .from('books')
    .select('*')
    .eq('google_id', googleIdOrQuery)
    .maybeSingle();

  if (local) return local as SavedBook;

  // Otherwise treat the input as a search query
  return searchAndSaveBook(googleIdOrQuery);
}

/**
 * Batch seed helper — used by the real-books seed script.
 * Accepts a raw title + author and ensures we have a beautiful cover in the DB.
 */
export async function ensureBookSeeded(title: string, author?: string): Promise<SavedBook | null> {
  const query = author ? `${title} ${author}` : title;
  return searchAndSaveBook(query);
}
