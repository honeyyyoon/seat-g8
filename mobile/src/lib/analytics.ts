import PostHog from 'posthog-react-native';

const posthog = new PostHog('phc_r5RLLzdziJbrMDoNCHr9Axjw5EvcfGAx7pgVgsGuDxWE', {
  host: 'https://eu.i.posthog.com',
  disabled: process.env.NODE_ENV === 'test',
  disableGeoip: true,
  enableSessionReplay: false,
  captureAppLifecycleEvents: true,
});

type Events = {
  screen_opened: { chain: string; screen_id: string };
  visit_saved: { chain: string; verdict: string; has_movie: boolean; discomforts: number };
};

export function track<E extends keyof Events>(event: E, properties: Events[E]) {
  posthog.capture(event, properties);
}

export function isAnalyticsOn() {
  return !posthog.optedOut;
}

export function setAnalyticsOn(on: boolean) {
  return on ? posthog.optIn() : posthog.optOut();
}
