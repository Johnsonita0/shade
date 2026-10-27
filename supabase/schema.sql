create table if not exists public.dinner_choices (
  id uuid primary key default gen_random_uuid(),
  selected_date date not null,
  selected_time time not null,
  time_zone text check (time_zone is null or length(time_zone) <= 64),
  created_at timestamptz not null default now()
);

alter table public.dinner_choices
  add column if not exists time_zone text check (time_zone is null or length(time_zone) <= 64);

alter table public.dinner_choices
  add column if not exists response text not null default 'date_selected';

alter table public.dinner_choices
  add column if not exists reason text;

alter table public.dinner_choices
  drop constraint if exists dinner_choices_response_check;

alter table public.dinner_choices
  add constraint dinner_choices_response_check
  check (response in ('date_selected', 'maybe_later', 'reschedule_requested'));

alter table public.dinner_choices
  alter column selected_date drop not null,
  alter column selected_time drop not null;

alter table public.dinner_choices
  drop constraint if exists dinner_choices_response_details_check;

alter table public.dinner_choices
  add constraint dinner_choices_response_details_check
  check (
    (
      response = 'date_selected'
      and selected_date is not null
      and selected_time is not null
      and reason is null
    )
    or (
      response in ('maybe_later', 'reschedule_requested')
      and selected_date is null
      and selected_time is null
      and (reason is null or length(reason) <= 500)
    )
  );

create index if not exists dinner_choices_created_at_idx
  on public.dinner_choices (created_at desc);

alter table public.dinner_choices enable row level security;

grant insert on public.dinner_choices to anon, authenticated;
grant select on public.dinner_choices to authenticated;
grant delete on public.dinner_choices to authenticated;

drop policy if exists "Visitors can submit date choices" on public.dinner_choices;
drop policy if exists "Visitors can submit dinner choices" on public.dinner_choices;
create policy "Visitors can submit date choices"
  on public.dinner_choices
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Only admins can read dinner choices" on public.dinner_choices;
create policy "Only admins can read dinner choices"
  on public.dinner_choices
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Only admins can delete dinner choices" on public.dinner_choices;
create policy "Only admins can delete dinner choices"
  on public.dinner_choices
  for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'da203c72-1962-4830-964c-7ae6cfb014b6'
  and lower(email) = lower('imeobongj@gmail.com')
returning id, email;
