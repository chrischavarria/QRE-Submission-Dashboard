alter table public.variance_reports
add column if not exists complaint_source text,
add column if not exists shipped_to_state text;

drop view if exists public.monthly_qre_metrics;

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
