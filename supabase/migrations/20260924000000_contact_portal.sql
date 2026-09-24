-- Contact portal: customer enquiries, threaded replies, admin role.
-- Safe to run once on a fresh project. All access is enforced with Row Level
-- Security; the publishable key in the browser can only do what these policies allow.

-- ---------------------------------------------------------------------------
-- Admins (managed by SQL only; never writable or readable through the API)
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles (one row per signed-up customer, created automatically)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), ''),
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), 20), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enquiries and messages
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references auth.users (id) on delete set null,
  contact_name  text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 254),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 20),
  subject       text not null check (char_length(subject) between 1 and 150),
  status        text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index enquiries_customer_idx on public.enquiries (customer_id);
create index enquiries_email_idx    on public.enquiries (lower(contact_email));
create index enquiries_updated_idx  on public.enquiries (updated_at desc);

create table public.enquiry_messages (
  id          uuid primary key default gen_random_uuid(),
  enquiry_id  uuid not null references public.enquiries (id) on delete cascade,
  sender_id   uuid references auth.users (id) on delete set null,
  sender_role text not null check (sender_role in ('customer', 'admin', 'guest')),
  body        text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index enquiry_messages_thread_idx on public.enquiry_messages (enquiry_id, created_at);

alter table public.enquiries        enable row level security;
alter table public.enquiry_messages enable row level security;

-- Enquiries: customers see their own, the admin sees everything.
create policy enquiries_select on public.enquiries
  for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());

create policy enquiries_update_admin on public.enquiries
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy enquiries_delete_admin on public.enquiries
  for delete to authenticated
  using (public.is_admin());

-- Messages: readable inside your own enquiry (or by the admin); customers can
-- reply only to their own open enquiry.
create policy messages_select on public.enquiry_messages
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_messages.enquiry_id and e.customer_id = auth.uid()
    )
  );

create policy messages_insert on public.enquiry_messages
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_messages.enquiry_id
        and e.customer_id = auth.uid()
        and e.status <> 'closed'
    )
  );

-- The sender identity is always taken from the session, never from the client.
create or replace function public.set_message_sender()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.sender_id := auth.uid();
  new.sender_role := case
    when auth.uid() is null then 'guest'
    when public.is_admin()  then 'admin'
    else 'customer'
  end;
  return new;
end;
$$;

create trigger enquiry_messages_set_sender
  before insert on public.enquiry_messages
  for each row execute function public.set_message_sender();

-- A new message moves the enquiry: admin reply => answered, anything else => open.
create or replace function public.touch_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.enquiries
     set updated_at = now(),
         status = case when new.sender_role = 'admin' then 'answered' else 'open' end
   where id = new.enquiry_id;
  return new;
end;
$$;

create trigger enquiry_messages_touch
  after insert on public.enquiry_messages
  for each row execute function public.touch_enquiry();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Creates an enquiry plus its first message. Works for guests and signed-in
-- customers; a signed-in customer's email is always taken from their account.
create or replace function public.create_enquiry(
  p_name    text,
  p_email   text,
  p_phone   text,
  p_subject text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_subj  text := btrim(coalesce(p_subject, ''));
  v_msg   text := btrim(coalesce(p_message, ''));
  v_id    uuid;
begin
  if v_uid is not null then
    select lower(email) into v_email from auth.users where id = v_uid;
  end if;

  if char_length(v_name) not between 1 and 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if v_phone is not null and char_length(v_phone) > 20 then
    raise exception 'Phone number is too long.' using errcode = '22023';
  end if;
  if char_length(v_subj) not between 1 and 150 then
    raise exception 'Please choose a topic.' using errcode = '22023';
  end if;
  if char_length(v_msg) not between 1 and 4000 then
    raise exception 'Please enter a message (up to 4000 characters).' using errcode = '22023';
  end if;

  -- Basic abuse limits for the public form.
  if (select count(*) from public.enquiries
       where lower(contact_email) = v_email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many messages from this email. Please try again later.' using errcode = '54000';
  end if;
  if v_uid is null and (select count(*) from public.enquiries
       where customer_id is null and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many requests right now. Please try again shortly.' using errcode = '54000';
  end if;

  insert into public.enquiries (customer_id, contact_name, contact_email, contact_phone, subject)
  values (v_uid, v_name, v_email, v_phone, v_subj)
  returning id into v_id;

  insert into public.enquiry_messages (enquiry_id, body) values (v_id, v_msg);

  return v_id;
end;
$$;
revoke all on function public.create_enquiry(text, text, text, text, text) from public;
grant execute on function public.create_enquiry(text, text, text, text, text) to anon, authenticated;

-- Links earlier guest enquiries to a customer once their email is confirmed.
create or replace function public.claim_guest_enquiries()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_count integer;
begin
  if v_uid is null then
    return 0;
  end if;

  select lower(email) into v_email
    from auth.users
   where id = v_uid and email_confirmed_at is not null;
  if v_email is null then
    return 0;
  end if;

  update public.enquiries
     set customer_id = v_uid
   where customer_id is null and lower(contact_email) = v_email;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.claim_guest_enquiries() from public;
grant execute on function public.claim_guest_enquiries() to authenticated;

-- ---------------------------------------------------------------------------
-- Table privileges (RLS above decides which rows)
-- ---------------------------------------------------------------------------
revoke all on public.admins, public.profiles, public.enquiries, public.enquiry_messages from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant select, delete on public.enquiries to authenticated;
grant update (status) on public.enquiries to authenticated;

grant select on public.enquiry_messages to authenticated;
grant insert (enquiry_id, body) on public.enquiry_messages to authenticated;

-- ---------------------------------------------------------------------------
-- Live updates in the portal (respects the policies above)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.enquiries, public.enquiry_messages;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Make Sangeetha the admin. Run this ONCE, after she has created her account
-- on the website's "Create account" tab and confirmed her email:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'srsakthi2014@gmail.com';
-- ---------------------------------------------------------------------------
