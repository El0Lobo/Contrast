# Contrast calendar format

`assets/data/events.ics` is the source for dated special events. Every `VEVENT` becomes a permanent, indexable page at `https://contrast-kn.de/events/<X-CONTRAST-SLUG>/` during the site build. Keep an event’s UID and slug stable once it has been published; changing either creates a new URL and loses the SEO history of the original page.

The calendar always adds the standing programme itself: Queer-Kneipe on the first Monday of each month, regular Kneipe on every other Monday, Das Labor every Tuesday, and Punk-Kneipe every Thursday. Add `CATEGORIES` (or the fallback `X-CONTRAST-SERIES`) to a dated special so its calendar row also links back to the related programme page.

## Closure periods

To close the venue for a break, add one `VEVENT` that spans the closed dates. Set `X-CONTRAST-CLOSURE:TRUE`; use `X-CONTRAST-CLOSURE-NAME` for the label shown in the modal and calendar sticker. `DTEND` is exclusive, so a closure through 6 August must end on 7 August. The calendar replaces ordinary programme rows during that period, opens the notice while it is active, and keeps the slanted label visible after visitors close it.

```ics
BEGIN:VEVENT
DTSTART;VALUE=DATE:20270801
DTEND;VALUE=DATE:20270815
SUMMARY:Sommerpause
X-CONTRAST-CLOSURE:TRUE
X-CONTRAST-CLOSURE-NAME:Sommerpause
END:VEVENT
```

## Required standard ICS fields

```ics
UID:the-same-id-every-time@your-domain
DTSTART;TZID=Europe/Berlin:20261113T220000
DTEND;TZID=Europe/Berlin:20261114T040000
SUMMARY:Event name — short hook
DESCRIPTION:Two or three useful sentences. Use \n for a paragraph break.
LOCATION:Contrast\, Joseph-Belli-Weg 11\, 78467 Konstanz\, Germany
URL:https://contrast-kn.de/events/event-slug/
```

Use `TZID=Europe/Berlin`; events that run past midnight must have a next-day `DTEND`. Escape commas with `\,` and line breaks with `\n` as normal iCalendar requires.

## Contrast fields for rich pages and artist SEO

```ics
X-CONTRAST-SLUG:event-slug
X-CONTRAST-TYPE:Concert
X-CONTRAST-PRICE:8–15 € sliding scale
X-CONTRAST-IMAGE:https://contrast-kn.de/assets/images/venue/contrast-venue-04.jpg
X-CONTRAST-ARTISTS:Artist name|Short artist bio/genre|https://artist.example
X-CONTRAST-ARTISTS:Second artist|Another short bio|https://artist.example
X-CONTRAST-TAGS:punk,live music,Konstanz
```

`X-CONTRAST-SLUG`, `X-CONTRAST-TYPE`, `X-CONTRAST-PRICE`, `X-CONTRAST-IMAGE` and at least one `X-CONTRAST-ARTISTS` line are strongly recommended. The artist lines are repeatable. Include an official artist URL whenever possible—the generated page links to it and includes the act in Event structured data.

For an event belonging to a recurring Contrast format, add standard ICS `CATEGORIES`, for example `CATEGORIES:Info-Kneipe` or `CATEGORIES:Kunst-Kneipe`. This is what the site uses to identify and show the next occurrence; unlike a custom field it is preserved by ordinary calendar software. `X-CONTRAST-SERIES` remains a fallback.

## Importing a calendar later

The static site deliberately does not fetch a third-party calendar in visitors’ browsers: that would require CORS, make programme content disappear when the external service is down, and would not reliably create SEO pages. Instead, sync the remote ICS into `assets/data/events.ics` during deployment (GitHub Action, scheduled job or CMS export), then run `node scripts/build-clean-routes.mjs`. The generated event pages and sitemap are ready before Google or visitors reach the site.

For a calendar service that cannot emit these `X-CONTRAST-*` properties, use its normal fields for the basics and enrich the exported ICS in a small sync script before building. Do not rely on Instagram captions alone for artist bios, pricing or event details.

## Calendar update and Git commands

After exporting or syncing the calendar into `assets/data/events.ics`, build and publish it with these commands:

```bash
# Check the latest remote changes before editing.
git pull --rebase

# Replace this file with the exported/enriched ICS, then validate the static site.
node scripts/build-clean-routes.mjs

# Review exactly what will be published.
git status
git diff -- assets/data/events.ics

# Commit the calendar source. dist/ is generated during deployment and stays untracked.
git add assets/data/events.ics
git commit -m "Update programme calendar"
git push
```

If the ICS is downloaded by an automated sync job, it should write to the same file and run the same build command before committing or deploying. GitHub Pages then publishes the generated event pages and fresh sitemap from `dist/`.

### Automated daily sync

`.github/workflows/sync-calendar.yml` runs once per day at 03:17 UTC and can also be started manually from the Actions tab. Add the remote public/private ICS URL as a repository secret named `CALENDAR_ICS_URL` (Settings → Secrets and variables → Actions). A repository variable with that name also works for a public URL.

The sync writes into `assets/data/events.ics`, keeps matching `X-CONTRAST-*` fields, and retains manually maintained closure events. It commits only when the calendar source actually changes; the normal Pages workflow then rebuilds the public event pages and sitemap.
