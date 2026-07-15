# 💊 Medication Tracker

A full-stack web app that helps users track their medications, build consistency through streak tracking, get reminded at scheduled times, and stay informed about potentially dangerous drug interactions using real FDA data. Includes user accounts, so your data is securely saved and accessible from any device.

🔗 **Live demo:** https://medicine-tracker-coral.vercel.app

## Why I built this

This is my first real project after learning the basics of web development. Instead of copying a tutorial, I wanted to build something actually useful — a way to keep track of medications, get reminded to take them, and get warned if two of them are risky to take together.

## Features

- **User accounts** — sign up and log in securely; your medications are tied to your account and accessible from any device
- Add, edit, and delete medications (name, dosage, scheduled time, daily/weekly/monthly frequency)
- Duplicate prevention — warns if you try to add a medication you already have
- Mark doses as "taken" each day, with automatic streak tracking and a 14-day adherence heatmap
- **Scheduled reminders** — real browser notifications at the medication's scheduled time, respecting daily/weekly/monthly frequency, with **Snooze (10 min)** and **Mark as taken** actions built into the notification itself
- **Real-time drug interaction warnings** — checks new medications against your existing list using the FDA's OpenFDA API, with a styled in-app warning (not a browser popup)
- Dark mode, mobile-responsive design, installable as a PWA
- **Caregiver sharing** — invite a caregiver to view your medications and reports (read-only), enforced via database-level security
## Caregiver Sharing
Patients can invite a caregiver (by email) to view their medications and adherence reports in read-only mode — caregivers cannot add, edit, or delete a patient's data. This is enforced at the database level using Supabase Row Level Security, not just in the frontend, so the restriction holds even if there were a bug in the UI.
**Known limitation:** invites are not currently sent by email — the invited person must log into the app themselves and check the Caregivers section to see and accept a pending invite. A production version would send an email notification via a service like Resend, triggered through a Supabase Edge Function.

## Tech Stack

- HTML, CSS, JavaScript (vanilla, no frameworks)
- **Supabase** — PostgreSQL database and authentication, with Row Level Security ensuring users can only access their own data
- **Service Worker API** for background notification handling with interactive action buttons
- [OpenFDA API](https://open.fda.gov/apis/) for drug label and interaction data
- Deployed on Vercel

## What I learned

I learned how to fetch data from external APIs and use that data to update the page live. I also learned that things don't always go as planned — I originally wanted to use one drug-interaction API, but found out partway through that it had been shut down. So I had to find a different API (FDA's OpenFDA) and rebuild that part of the feature.

Building the reminder system taught me about Service Workers — background scripts that run independently of the page and can show notifications with interactive buttons (Snooze/Stop), even communicating back to the main app via message passing. This was a genuinely new browser concept for me and pushed past basic DOM manipulation into how modern web apps handle background tasks.

Adding Supabase taught me the difference between client-side storage and a real backend — setting up a database schema, writing authentication flows, and understanding Row Level Security (a database-level rule ensuring users can only ever see their own data, enforced even if there were a bug in my frontend code). I also learned to debug across systems — tracing an issue from a browser console error, to Supabase's dashboard logs, to their public status page, when a platform-wide outage turned out to be the actual root cause of something I initially assumed was my own bug.

## Known limitations

- Interaction detection works by checking if medication names appear in each other's FDA label text — this is a simplified approach, not a comprehensive clinical interaction database. **This tool is for educational purposes only and is not a substitute for professional medical advice.**
- Reminders only work while the browser is open (even in the background) — they won't fire if the browser is fully closed. A production version would use a push notification service for true offline reminders.

## Running locally

1. Clone this repo
2. Create a Supabase project and set up a `medications` table (see schema in `script.js`) with Row Level Security enabled
3. Add your Supabase project URL and public API key to `script.js`
4. Open `index.html` with a local server (e.g. VS Code's Live Server extension) — required for Service Worker, Supabase, and API calls to work correctly