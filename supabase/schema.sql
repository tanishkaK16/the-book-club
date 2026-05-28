-- Create profiles table (if it doesn't exist)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  bio text,
  genres text[] default '{}',
  city text,
  onboarded boolean default false
);

-- Enable RLS for profiles table
alter table public.profiles enable row level security;

-- Create policies for profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);


-- Create a function and trigger to automatically create a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, onboarded)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create storage bucket for review photos
insert into storage.buckets (id, name, public) 
values ('reviews', 'reviews', true)
on conflict (id) do nothing;

-- Set up storage RLS policies
create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Review images are publicly accessible" on storage.objects
  for select using (bucket_id = 'reviews');

create policy "Authenticated users can upload review photos" on storage.objects
  for insert with check (
    bucket_id = 'reviews' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete their own review photos" on storage.objects
  for delete using (
    bucket_id = 'reviews' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- REVIEWS AND SOCIAL SCHEMAS

-- Create reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_google_id text,
  book_title text not null,
  book_author text,
  book_cover_url text,
  rating integer not null check (rating >= 1 and rating <= 5),
  loved text not null,
  fell_flat text,
  overall text,
  mood_tags text[] default '{}',
  photo_urls text[] default '{}',
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create likes table
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  review_id uuid references public.reviews on delete cascade not null,
  unique(user_id, review_id)
);

-- Create comments table
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  review_id uuid references public.reviews on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for feed tables
alter table public.reviews enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Setup RLS Policies
create policy "Everyone can view reviews" on public.reviews
  for select using (true);

create policy "Authenticated users can insert reviews" on public.reviews
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can update their own reviews" on public.reviews
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reviews" on public.reviews
  for delete using (auth.uid() = user_id);

create policy "Everyone can view likes" on public.likes
  for select using (true);

create policy "Authenticated users can toggle likes" on public.likes
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can remove their own likes" on public.likes
  for delete using (auth.uid() = user_id);

create policy "Everyone can view comments" on public.comments
  for select using (true);

create policy "Authenticated users can post comments" on public.comments
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);


-- COUNTERS SYNC FUNCTIONS AND TRIGGERS

-- Review likes count function & trigger
create or replace function public.handle_review_like()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.reviews
    set likes_count = likes_count + 1
    where id = new.review_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.reviews
    set likes_count = likes_count - 1
    where id = old.review_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_review_like_change
  after insert or delete on public.likes
  for each row execute procedure public.handle_review_like();

-- Review comments count function & trigger
create or replace function public.handle_review_comment()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.reviews
    set comments_count = comments_count + 1
    where id = new.review_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.reviews
    set comments_count = comments_count - 1
    where id = old.review_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_review_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.handle_review_comment();

-- Create bookshelf table
create table if not exists public.bookshelf (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_google_id text,
  book_title text not null,
  book_author text,
  book_cover_url text,
  status text not null check (status in ('Read', 'TBR')),
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_google_id)
);

-- Enable RLS for bookshelf
alter table public.bookshelf enable row level security;

-- Policies for bookshelf
drop policy if exists "Everyone can view bookshelf" on public.bookshelf;
create policy "Everyone can view bookshelf" on public.bookshelf
  for select using (true);

drop policy if exists "Authenticated users can insert to shelf" on public.bookshelf;
create policy "Authenticated users can insert to shelf" on public.bookshelf
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

drop policy if exists "Users can update their shelf items" on public.bookshelf;
create policy "Users can update their shelf items" on public.bookshelf
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete shelf items" on public.bookshelf;
create policy "Users can delete shelf items" on public.bookshelf
  for delete using (auth.uid() = user_id);

-- Create lend_listings table
create table if not exists public.lend_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_google_id text,
  book_title text not null,
  book_author text,
  book_cover_url text,
  condition text not null check (condition in ('New', 'Like New', 'Good', 'Fair')),
  city text not null,
  notes text,
  available_date date,
  status text not null default 'Available' check (status in ('Available', 'Borrowed', 'Returned')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create borrow_requests table
create table if not exists public.borrow_requests (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.lend_listings on delete cascade not null,
  message text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for exchange tables
alter table public.lend_listings enable row level security;
alter table public.borrow_requests enable row level security;

-- Setup RLS Policies for lend_listings
drop policy if exists "Everyone can view lend listings" on public.lend_listings;
create policy "Everyone can view lend listings" on public.lend_listings
  for select using (true);

drop policy if exists "Authenticated users can insert lend listings" on public.lend_listings;
create policy "Authenticated users can insert lend listings" on public.lend_listings
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

drop policy if exists "Users can update their own lend listings" on public.lend_listings;
create policy "Users can update their own lend listings" on public.lend_listings
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own lend listings" on public.lend_listings;
create policy "Users can delete their own lend listings" on public.lend_listings
  for delete using (auth.uid() = user_id);

-- Setup RLS Policies for borrow_requests
drop policy if exists "Users can view relevant borrow requests" on public.borrow_requests;
create policy "Users can view relevant borrow requests" on public.borrow_requests
  for select using (
    auth.uid() = borrower_id 
    or auth.uid() in (
      select user_id from public.lend_listings where id = listing_id
    )
  );

drop policy if exists "Authenticated users can insert borrow requests" on public.borrow_requests;
create policy "Authenticated users can insert borrow requests" on public.borrow_requests
  for insert with check (auth.role() = 'authenticated' and auth.uid() = borrower_id);

drop policy if exists "Users can update relevant borrow requests" on public.borrow_requests;
create policy "Users can update relevant borrow requests" on public.borrow_requests
  for update using (
    auth.uid() = borrower_id 
    or auth.uid() in (
      select user_id from public.lend_listings where id = listing_id
    )
  );

drop policy if exists "Users can delete their own borrow requests" on public.borrow_requests;
create policy "Users can delete their own borrow requests" on public.borrow_requests
  for delete using (auth.uid() = borrower_id);

-- Create follows table
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key(follower_id, following_id)
);

-- Enable RLS for follows
alter table public.follows enable row level security;

-- Policies for follows
drop policy if exists "Everyone can view follows" on public.follows;
create policy "Everyone can view follows" on public.follows
  for select using (true);

drop policy if exists "Authenticated users can follow" on public.follows;
create policy "Authenticated users can follow" on public.follows
  for insert with check (auth.role() = 'authenticated' and auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow" on public.follows
  for delete using (auth.uid() = follower_id);


-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  notifier_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('Like', 'Comment', 'Borrow', 'Follow')),
  source_id uuid,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notifications
alter table public.notifications enable row level security;

-- Policies for notifications
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);


-- NOTIFICATIONS SYNCHRONIZATION TRIGGERS

-- Trigger for Likes
create or replace function public.notify_on_like()
returns trigger as $$
declare
  target_user_id uuid;
  book_title_val text;
  notifier_name text;
begin
  select user_id, book_title into target_user_id, book_title_val from public.reviews where id = new.review_id;
  select full_name into notifier_name from public.profiles where id = new.user_id;
  
  if (target_user_id != new.user_id) then
    insert into public.notifications (user_id, notifier_id, type, source_id, message)
    values (
      target_user_id,
      new.user_id,
      'Like',
      new.review_id,
      coalesce(notifier_name, 'Someone') || ' liked your review of "' || coalesce(book_title_val, 'a book') || '"'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_like_notify on public.likes;
create trigger on_new_like_notify
  after insert on public.likes
  for each row execute procedure public.notify_on_like();

-- Trigger for Comments
create or replace function public.notify_on_comment()
returns trigger as $$
declare
  target_user_id uuid;
  book_title_val text;
  notifier_name text;
begin
  select user_id, book_title into target_user_id, book_title_val from public.reviews where id = new.review_id;
  select full_name into notifier_name from public.profiles where id = new.user_id;

  if (target_user_id != new.user_id) then
    insert into public.notifications (user_id, notifier_id, type, source_id, message)
    values (
      target_user_id,
      new.user_id,
      'Comment',
      new.review_id,
      coalesce(notifier_name, 'Someone') || ' commented on your review of "' || coalesce(book_title_val, 'a book') || '"'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_comment_notify on public.comments;
create trigger on_new_comment_notify
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();

-- Trigger for Borrow Requests
create or replace function public.notify_on_borrow()
returns trigger as $$
declare
  target_user_id uuid;
  book_title_val text;
  notifier_name text;
begin
  select user_id, book_title into target_user_id, book_title_val from public.lend_listings where id = new.listing_id;
  select full_name into notifier_name from public.profiles where id = new.borrower_id;

  insert into public.notifications (user_id, notifier_id, type, source_id, message)
  values (
    target_user_id,
    new.borrower_id,
    'Borrow',
    new.listing_id,
    coalesce(notifier_name, 'A neighbor') || ' requested to borrow your book "' || coalesce(book_title_val, 'a book') || '"'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_borrow_notify on public.borrow_requests;
create trigger on_new_borrow_notify
  after insert on public.borrow_requests
  for each row execute procedure public.notify_on_borrow();

-- Trigger for Follows
create or replace function public.notify_on_follow()
returns trigger as $$
declare
  notifier_name text;
begin
  select full_name into notifier_name from public.profiles where id = new.follower_id;

  insert into public.notifications (user_id, notifier_id, type, source_id, message)
  values (
    new.following_id,
    new.follower_id,
    'Follow',
    new.following_id,
    coalesce(notifier_name, 'Someone') || ' started following your reading room!'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_follow_notify on public.follows;
create trigger on_new_follow_notify
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();


-- Create messages table for 1:1 real-time messaging
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for messages
alter table public.messages enable row level security;

-- Policies for messages
drop policy if exists "Users can view their own sent or received messages" on public.messages;
create policy "Users can view their own sent or received messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can insert their own messages" on public.messages;
create policy "Users can insert their own messages" on public.messages
  for insert with check (auth.uid() = sender_id);

drop policy if exists "Users can update read status of received messages" on public.messages;
create policy "Users can update read status of received messages" on public.messages
  for update using (auth.uid() = receiver_id);



