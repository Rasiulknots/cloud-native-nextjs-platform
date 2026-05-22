<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the DevEvent cloud-native Next.js platform. Here is a summary of all changes made:

- **`instrumentation-client.ts`** (new): Initializes PostHog client-side using `posthog-js` via Next.js 15.3+ instrumentation. Configured with a reverse proxy path (`/ingest`), error tracking (`capture_exceptions: true`), and debug mode in development.
- **`next.config.ts`** (updated): Added reverse proxy rewrites routing `/ingest/*` traffic to PostHog US servers (`us.i.posthog.com` and `us-assets.i.posthog.com`), plus `skipTrailingSlashRedirect: true`.
- **`components/ExploreBtn.tsx`** (updated): Added `posthog.capture('explore_events_clicked')` to the button's click handler.
- **`components/EventCard.tsx`** (updated): Converted to a client component (`'use client'`) and added `posthog.capture('event_card_clicked', { event_title, event_slug, event_location, event_date })` on link click.
- **`.env.local`** (new): Created with `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables (covered by `.gitignore`).

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `explore_events_clicked` | User clicked the "Explore Events" button on the homepage hero section | `components/ExploreBtn.tsx` |
| `event_card_clicked` | User clicked on an event card to view event details (includes `event_title`, `event_slug`, `event_location`, `event_date` properties) | `components/EventCard.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1614768)
- [Explore Events button clicks](/insights/pZHLFndL) — daily trend of explore button clicks
- [Event card clicks](/insights/0U4ysvTM) — daily trend of event card clicks
- [Unique users engaging with events](/insights/X2PbSLsf) — DAU comparison across both events
- [Most clicked events](/insights/IsztQb4Z) — bar chart broken down by `event_title`
- [Explore to event click funnel](/insights/RsupWpma) — conversion funnel from explore click → event card click

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
