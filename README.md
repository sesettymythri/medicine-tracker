# 💊 Medication Tracker

A web app that helps users track their medications, build consistency through streak tracking, get reminded at scheduled times, and stay informed about potentially dangerous drug interactions using real FDA data.

🔗 **Live demo:** https://medicine-tracker-coral.vercel.app

## Why I built this

This is my first real project after learning the basics of web development. Instead of copying a tutorial, I wanted to build something actually useful — a way to keep track of medications, get reminded to take them, and get warned if two of them are risky to take together.

## Features

- Add, edit, and delete medications (name, dosage, scheduled time)
- Duplicate prevention — warns if you try to add a medication you already have
- Mark doses as "taken" each day, with automatic streak tracking
- **Scheduled reminders** — get a real browser notification at the medication's scheduled time, with **Snooze (10 min)** and **Mark as taken** actions built into the notification itself
- **Real-time drug interaction warnings** — checks new medications against your existing list using the FDA's OpenFDA API, with a styled in-app warning (not a browser popup)
- Persistent storage — your data is saved even after closing the browser

## Tech Stack

- HTML, CSS, JavaScript (vanilla, no frameworks)
- Browser `localStorage` for data persistence
- **Service Worker API** for background notification handling with interactive action buttons
- [OpenFDA API](https://open.fda.gov/apis/) for drug label and interaction data
- Deployed on Vercel

## What I learned

I learned how to fetch data from external APIs and use that data to update the page live. I also learned that things don't always go as planned — I originally wanted to use one drug-interaction API, but found out partway through that it had been shut down. So I had to find a different API (FDA's OpenFDA) and rebuild that part of the feature.

Building the reminder system taught me about Service Workers — background scripts that run independently of the page and can show notifications with interactive buttons (Snooze/Stop), even communicating back to the main app via message passing. This was a genuinely new browser concept for me and pushed past basic DOM manipulation into how modern web apps handle background tasks.

## Known limitations

- Interaction detection works by checking if medication names appear in each other's FDA label text — this is a simplified approach, not a comprehensive clinical interaction database. **This tool is for educational purposes only and is not a substitute for professional medical advice.**
- Reminders only work while the browser is open (even in the background) — they won't fire if the browser is fully closed. A production version would use a push notification service for true offline reminders.
- Data is stored locally in the browser, not in a shared database — it won't sync across devices. (Planned: Supabase integration for accounts + cloud storage.)

## Running locally

1. Clone this repo
2. Open `index.html` with a local server (e.g. VS Code's Live Server extension) — required for Service Worker and API calls to work correctly