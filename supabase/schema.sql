create extension if not exists pgcrypto;

create type public.user_role as enum ('staff', 'pharmacist', 'admin');
create type public.report_status as enum ('pending', 'approved', 'returned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  title text not null default 'Staff',
  role public.user_role not null default 'staff',
  department text,
  created_at timestamptz not null default now()
);

create table public.variance_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_by uuid references auth.users(id),
  status public.report_status not null default 'pending',
  event_date date not null,
  event_time time,
  reported_by text not null,
  department text not null,
  patient_involved text,
  patient_identifier text,
  staff_involved text,
  staff_names text,
  nature text[] not null default '{}',
  source text[] not null default '{}',
  complaint_source text,
  shipped_to_state text,
  origin_of_complaint text,
  complainants text,
  drug_involved text,
  drug_details text,
  drug_recalled text,
  issue text[] not null default '{}',
  failure text[] not null default '{}',
  complaint text not null,
  investigation text,
  resolution text,
  follow_up text,
  patient_notified text,
  prescriber_notified text,
  completed_by text,
  qre_category text,
  qre_items text[] not null default '{}',
  review_department text,
  pharmacist_name text,
  pharmacist_notes text,
  documentation_complete text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

create index variance_reports_status_idx on public.variance_reports(status);
create index variance_reports_event_date_idx on public.variance_reports(event_date);
create index variance_reports_qre_category_idx on public.variance_reports(qre_category);

alter table public.profiles enable row level security;
alter table public.variance_reports enable row level security;

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "Users can read own profile"
on public.profiles for select
using (id = auth.uid() or public.current_user_role() in ('pharmacist', 'admin'));

create policy "Admins can manage profiles"
on public.profiles for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Staff can submit reports"
on public.variance_reports for insert
with check (submitted_by = auth.uid());

create policy "Submitters can read own reports"
on public.variance_reports for select
using (status = 'approved' or submitted_by = auth.uid() or public.current_user_role() in ('pharmacist', 'admin'));

create policy "Pharmacists can update reports"
on public.variance_reports for update
using (public.current_user_role() in ('pharmacist', 'admin'))
with check (public.current_user_role() in ('pharmacist', 'admin'));

create policy "Admins can delete reports"
on public.variance_reports for delete
using (public.current_user_role() = 'admin');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, title, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'title', 'Staff'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create view public.monthly_qre_metrics
with (security_invoker = true)
as
select
  date_trunc('month', event_date)::date as month,
  complaint_source,
  qre_category,
  item as qre_item,
  count(*) as total,
  count(*) filter (where documentation_complete = 'yes') as documentation_complete
from public.variance_reports
cross join unnest(qre_items) as item
where status = 'approved'
group by 1, 2, 3, 4;
