drop policy if exists "Submitters can read own reports"
on public.variance_reports;

create policy "Submitters can read own reports"
on public.variance_reports for select
using (
  status = 'approved'
  or submitted_by = auth.uid()
  or public.current_user_role() in ('pharmacist', 'admin')
);
