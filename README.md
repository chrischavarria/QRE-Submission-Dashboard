# QRE Variance Dashboard

Static Supabase-ready dashboard for pharmacy variance reporting, pharmacist approval, QRE metric tracking, CSV export, printing, and Slack department notifications.

## Local use

Open `index.html` in a browser. Until Supabase settings are saved, the app runs in local demo mode with:

- `staff@qre.local` / `staff123`
- `pharmacist@qre.local` / `rph123`
- `admin@qre.local` / `admin123`

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create users in Supabase Auth.
4. Set each user's profile role to `staff`, `pharmacist`, or `admin`.
5. Deploy `supabase/functions/slack-notify`.
6. Add Slack webhook secrets for the departments you use:

```bash
supabase secrets set SLACK_WEBHOOK_FRONT="https://hooks.slack.com/services/..."
supabase secrets set SLACK_WEBHOOK_LAB="https://hooks.slack.com/services/..."
supabase secrets set SLACK_WEBHOOK_CONTRACT_FULFILLMENT="https://hooks.slack.com/services/..."
supabase secrets set SLACK_WEBHOOK_FRONT_FULFILLMENT="https://hooks.slack.com/services/..."
supabase secrets set SLACK_WEBHOOK_RPH="https://hooks.slack.com/services/..."
supabase secrets set SLACK_WEBHOOK_OTHER="https://hooks.slack.com/services/..."
```

## App flow

- Staff submit the variance form modeled from Attachment 1.
- Reports land in Pharmacist Review as `pending`.
- Pharmacists classify the QRE using the Page 2 categories, select the department, mark documentation status, and approve.
- Approved records feed the metrics view and print layout.

## Deployment

This app has no build step. Host the folder with any static host, then enter the Supabase URL and anon key in the Admin view.
