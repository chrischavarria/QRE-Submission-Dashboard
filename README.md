# QRE Variance Dashboard

Static Supabase-ready dashboard for pharmacy variance reporting, pharmacist approval, QRE metric tracking, CSV export, printing, and Slack notifications through Google Apps Script.

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
5. Add your Supabase project URL and anon public key to the top of `app.js`.
6. Create the Google Apps Script Slack proxy from `apps-script/slack-notify.gs`.
7. Add the deployed Apps Script web app URL to `SLACK_APPS_SCRIPT_URL` at the top of `app.js`.

For existing Supabase projects created before pharmacist name tracking, run this once in the SQL editor:

```sql
alter table public.variance_reports
add column if not exists pharmacist_name text;
```

## Slack setup with Google Apps Script

1. Go to <https://script.google.com/> and create a new project.
2. Paste the contents of `apps-script/slack-notify.gs` into the script editor.
3. Open **Project Settings** and add a script property:
   - Property: `SLACK_WEBHOOK_URL`
   - Value: your Slack incoming webhook URL
4. Click **Deploy** → **New deployment**.
5. Choose **Web app**.
6. Set **Execute as** to `Me`.
7. Set **Who has access** to `Anyone`.
8. Deploy and copy the web app URL.
9. Paste that URL into `SLACK_APPS_SCRIPT_URL` at the top of `app.js`.

Slack notifications are sent only after the pharmacist clicks **Approve and track**.

## App flow

- Staff submit the variance form modeled from Attachment 1.
- Reports land in Pharmacist Review as `pending`.
- Pharmacists classify the QRE using the Page 2 categories, enter their first and last name, select the department, mark documentation status, and approve.
- Approved records feed the metrics view and print layout.

## Deployment

This app has no build step. Host the folder with any static host after adding the Supabase URL and anon public key to `app.js`.
