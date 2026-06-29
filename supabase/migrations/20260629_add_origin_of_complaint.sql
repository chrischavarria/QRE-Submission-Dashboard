alter table public.variance_reports
add column if not exists origin_of_complaint text;
