# 💊 Medication Tracker

A web app that helps users track their medications, build consistency through streak tracking, and get warned about potentially dangerous drug interactions using real FDA data.

🔗 **Live demo:** https://medicine-tracker-coral.vercel.app

## Why I built this

This is my first real project after learning the basics of web development. Instead of copying a tutorial, I wanted to build something actually useful — a way to keep track of medications and get warned if two of them are risky to take together.

## Features

- Add medications with name and dosage
- Mark doses as "taken" each day, with automatic streak tracking
- Persistent storage — your data is saved even after closing the browser
- **Real-time drug interaction warnings** — checks new medications against your existing list using the FDA's OpenFDA API, alerting you to potential interactions before you confirm adding them

## Tech Stack

- HTML, CSS, JavaScript (vanilla, no frameworks)
- Browser `localStorage` for data persistence
- [OpenFDA API](https://open.fda.gov/apis/) for drug label and interaction data
- Deployed on Vercel

## What I learned

I learned how to fetch data from external APIs and use that data to update the page live. I also learned that things don't always go as planned — I originally wanted to use one drug-interaction API, but found out partway through that it had been shut down. So I had to find a different API (FDA's OpenFDA) and rebuild that part of the feature. It taught me that a big part of coding is figuring things out when your first plan doesn't work.

## Known limitations

- Interaction detection works by checking if medication names appear in each other's FDA label text — this is a simplified approach, not a comprehensive clinical interaction database. **This tool is for educational purposes only and is not a substitute for professional medical advice.**
- Data is stored locally in the browser, not in a shared database — it won't sync across devices.

## Running locally

1. Clone this repo
2. Open `index.html` with a local server (e.g. VS Code's Live Server extension)