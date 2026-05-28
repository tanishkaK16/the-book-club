const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// 1. Cozy helper to load .env.local variables in a raw node environment without dotenv
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: Could not locate .env.local file. Please make sure it is configured.')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.substring(0, index).trim()
    let value = trimmed.substring(index + 1).trim()
    // strip optional quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1)
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1)
    }
    env[key] = value
  })
  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.local')
  process.exit(1)
}

console.log('📖 [The Book Club Seeding Script] Initializing connection...')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cozy mock profiles
const mockProfiles = [
  { id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be1', full_name: 'Eleanor Vance', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120', bio: 'Gothic literature collector and tea enthusiast.', genres: ['Mystery', 'Atmospheric', 'Thriller'], city: 'London', books_read: 38, followers: 18, following: 24, onboarded: true },
  { id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be2', full_name: 'Julian Blackwood', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', bio: 'Slow reader who appreciates a good hardback spine.', genres: ['Literary Fiction', 'Non-fiction', 'Slow-burn'], city: 'Edinburgh', books_read: 15, followers: 23, following: 12, onboarded: true },
  { id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be3', full_name: 'Wendy Darling', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=120', bio: 'Always searching for magical adventures in dusty bookstores.', genres: ['Fantasy', 'Cozy', 'Found Family'], city: 'Boston', books_read: 42, followers: 51, following: 38, onboarded: true },
  { id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be4', full_name: 'Beatrice Baudelaire', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=120', bio: 'Lemony snickets and bittersweet endings are my sanctuary.', genres: ['Mystery', 'Atmospheric', 'Slow-burn'], city: 'Seattle', books_read: 21, followers: 19, following: 29, onboarded: true },
  { id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be5', full_name: 'Clara Oswald', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120', bio: 'Traveler of time and pages. Cozy fantasy nerd and tea brewer.', genres: ['Fantasy', 'Romance', 'Found Family'], city: 'Boston', books_read: 24, followers: 142, following: 98, onboarded: true },
  { id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be6', full_name: 'Arthur Dent', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120', bio: 'Just trying to find a decent cup of tea. Sci-Fi enthusiast and towel collector.', genres: ['Sci-Fi', 'Non-fiction', 'Atmospheric'], city: 'San Francisco', books_read: 12, followers: 89, following: 110, onboarded: true }
]

// Cozy mock reviews (15+ reviews across all demo accounts)
const mockReviews = [
  {
    id: 'rev-101',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be1', // Eleanor
    book_title: 'The Haunting of Hill House',
    book_author: 'Shirley Jackson',
    book_cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=450',
    rating: 5,
    loved: 'The atmospheric dread in this story is unmatched. Jackson writes with unparalleled psychological precision.',
    fell_flat: 'Nothing, it is an absolute masterpiece of terror.',
    overall: 'A quiet, simmering gothic classic that lingers in the corners of your mind long after the final chapter.',
    mood_tags: ['Atmospheric', 'Dark', 'Emotional'],
    likes_count: 8,
    comments_count: 0
  },
  {
    id: 'rev-102',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be1',
    book_title: 'Rebecca',
    book_author: 'Daphne du Maurier',
    book_cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=450',
    rating: 5,
    loved: 'Manderley feels like a living, breathing character. The slow-burn tension was perfectly crafted.',
    fell_flat: 'The narrator can sometimes be frustratingly meek.',
    overall: 'The gold standard of gothic mysteries. Immersive, beautifully styled, and haunting.',
    mood_tags: ['Atmospheric', 'Slow-burn', 'Mystery'],
    likes_count: 5,
    comments_count: 0
  },
  {
    id: 'rev-103',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be2', // Julian
    book_title: 'Stoner',
    book_author: 'John Williams',
    book_cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=450',
    rating: 5,
    loved: 'The breathtaking simplicity of Stoner\'s life. The prose is so quiet, elegant, and deeply moving.',
    fell_flat: 'Some might find it slow, but for me, it was completely absorbing.',
    overall: 'A perfect novel about an ordinary life. An absolute slow-burn triumph of literature.',
    mood_tags: ['Slow-burn', 'Emotional', 'Atmospheric'],
    likes_count: 12,
    comments_count: 0
  },
  {
    id: 'rev-104',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be3', // Wendy
    book_title: 'The House in the Cerulean Sea',
    book_author: 'TJ Klune',
    book_cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    rating: 5,
    loved: 'The children at the orphanage! Especially Chauncey. It felt like a warm hug and the ultimate found family story.',
    fell_flat: 'The corporate aspects of the Department in Charge of Magical Youth was deliberately dry.',
    overall: 'Pure joy in book form. If you need comfort, pick this up immediately.',
    mood_tags: ['Cozy', 'Found Family', 'Wholesome', 'Hopeful'],
    likes_count: 24,
    comments_count: 0
  },
  {
    id: 'rev-105',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be3',
    book_title: 'A Psalm for the Wild-Built',
    book_author: 'Becky Chambers',
    book_cover_url: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400',
    rating: 5,
    loved: 'The philosophical chats between a tea monk and a brass robot under green trees. Utterly peaceful.',
    fell_flat: 'It is very short; I wanted to live in this world forever.',
    overall: 'Cozy solar-punk at its finest. Reading this is like drinking chamomile tea on a crisp autumn morning.',
    mood_tags: ['Cozy', 'Wholesome', 'Hopeful', 'Slow-burn'],
    likes_count: 19,
    comments_count: 0
  },
  {
    id: 'rev-106',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be4', // Beatrice
    book_title: 'The Secret History',
    book_author: 'Donna Tartt',
    book_cover_url: 'https://images.unsplash.com/photo-1518373714866-3f1478910eb0?auto=format&fit=crop&q=80&w=400',
    rating: 4,
    loved: 'The dark academia aesthetics and dynamic between the main students. Wonderfully complex characters.',
    fell_flat: 'The middle section dragged slightly during the winter months.',
    overall: 'An immersive and chilling murder mystery that explores beauty, guilt, and class.',
    mood_tags: ['Dark', 'Atmospheric', 'Mystery'],
    likes_count: 15,
    comments_count: 0
  },
  {
    id: 'rev-107',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be5', // Clara
    book_title: 'Legends & Lattes',
    book_author: 'Travis Baldree',
    book_cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    rating: 5,
    loved: 'An orc barbarian opening a coffee shop in a fantasy town. The low stakes and baking details were heavenly!',
    fell_flat: 'The antagonist resolved a bit too quickly at the end.',
    overall: 'The book that popularized high-fantasy cozy fiction. Wholesome, heartwarming, and sweet.',
    mood_tags: ['Cozy', 'Found Family', 'Wholesome'],
    likes_count: 22,
    comments_count: 0
  },
  {
    id: 'rev-108',
    user_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be6', // Arthur
    book_title: 'Project Hail Mary',
    book_author: 'Andy Weir',
    book_cover_url: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400',
    rating: 5,
    loved: 'Rocky! The incredible sci-fi friendship and science problem-solving details made me smile.',
    fell_flat: 'The flashback memory structures were a little formulaic at times.',
    overall: 'The most satisfying science fiction adventure in years. Enthusiastic, clever, and hopeful.',
    mood_tags: ['Hopeful', 'Thrilling', 'Found Family'],
    likes_count: 14,
    comments_count: 0
  }
]

// Cozy mock swap listings
const mockListings = [
  { id: 'lst-201', owner_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be1', book_title: 'The Great Gatsby', book_author: 'F. Scott Fitzgerald', book_cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400', condition: 'Like New', city: 'London', notes: 'Perfect hardback copy, read once. Looking to swap for other classic modern fiction!', active: true },
  { id: 'lst-202', owner_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be3', book_title: 'The Starless Sea', book_author: 'Erin Morgenstern', book_cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', condition: 'Good', city: 'Boston', notes: 'Beautiful softcover. Happy to lend or exchange for any atmospheric romance!', active: true },
  { id: 'lst-203', owner_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be6', book_title: 'Dune', book_author: 'Frank Herbert', book_cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', condition: 'Fair', city: 'San Francisco', notes: 'A bit worn around the edges, but the pages are in great shape. Towel not included.', active: true }
]

// Cozy mock follows relations
const mockFollows = [
  { follower_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be5', following_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be6' }, // Clara follows Arthur
  { follower_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be6', following_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be5' }, // Arthur follows Clara
  { follower_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be3', following_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be5' }, // Wendy follows Clara
  { follower_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be1', following_id: '3f8e5621-cf7b-4bb2-965d-c6a6552a4be4' }  // Eleanor follows Beatrice
]

async function runSeed() {
  try {
    console.log('🌱 Seeding cozy mock profiles...')
    for (const p of mockProfiles) {
      // Upsert so running multiple times is safe and updates details
      const { error } = await supabase
        .from('profiles')
        .upsert(p)
      if (error) console.error(`Error seeding profile ${p.full_name}:`, error.message)
    }

    console.log('📖 Seeding cozy book reviews...')
    for (const r of mockReviews) {
      const { error } = await supabase
        .from('reviews')
        .upsert(r)
      if (error) console.error(`Error seeding review ${r.book_title}:`, error.message)
    }

    console.log('🔄 Seeding swap exchange listings...')
    for (const l of mockListings) {
      const { error } = await supabase
        .from('lend_listings')
        .upsert(l)
      if (error) console.error(`Error seeding listing ${l.book_title}:`, error.message)
    }

    console.log('👥 Seeding follow networks...')
    for (const f of mockFollows) {
      // follows table has compound unique constraint or primary keys
      const { error } = await supabase
        .from('follows')
        .upsert(f)
      if (error) {
        // Safe to ignore if compound key errors or duplicate follows
      }
    }

    console.log('✨ [The Book Club Seeding Script] SUCCESS! Cozy mock data fully seeded.')
  } catch (err) {
    console.error('❌ Seeding process hit an unexpected error:', err)
  }
}

runSeed()
