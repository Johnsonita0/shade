# A note for Shade

A calm, mobile-friendly apology and optional sit-out or shawarma invitation built with React and Vite.

## Run locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Vite writes the production build to `dist/`.

## Deploy on Render

Create a Static Site for this repository with build command `npm run build` and publish directory `dist`.

Edit the message copy in `src/slides.js`.

The opening splash lasts 5.5 seconds before the apology appears. Six temporary stock portraits from Unsplash are included as full-screen backgrounds and a splash photo frame. Replace them with Shade's photos in `public/photos/` and list up to six filenames in `public/photos.json`; the background gently crossfades and zooms every three seconds.

## Private activity dashboard

1. Copy `.env.example` to `.env` and add your Supabase project URL and publishable anon key.
2. Run `supabase/schema.sql` in the Supabase SQL Editor. Re-run it after schema updates; it adds support for optional rescheduling / “Maybe later” follow-ups with a reason, plus admin-only deletion.
3. Create your dashboard user in Supabase Auth, then set its app metadata to `{"role":"admin"}`.
4. Open `/admin` and sign in with that account.

The site stores only a date/time she explicitly submits or a follow-up she chooses to send (including the reason she enters); browsing, slide views, and unsubmitted calendar picks are not logged. Follow-ups are separate records so the original date choice remains visible. A note beside each submit action explains what will be shared. Row-level security lets visitors submit responses, but only users with the `admin` app metadata role can read or delete them.

After a date is submitted, Shade can add it using a prefilled Google Calendar event link or download an `.ics` calendar file. The file requests alerts at the event time and 30 minutes beforehand. Google Calendar's prefilled event link does not support setting custom reminder offsets; it uses the account's calendar defaults. Google may also ignore alarms or external SVG attachments when importing an `.ics` file, so check the event's reminder settings and icon link after adding it. No Google OAuth, client secret, or Google account access is used. The event is one hour long, titled “Shawarma date with Shade,” and includes the shawarma SVG as a link and calendar-file attachment.

After an explicit response is saved, the same browser remembers it and opens directly to its confirmation screen on later visits. The stored date confirmation stays in that browser's local storage; it is not retrieved from Supabase on other devices.
