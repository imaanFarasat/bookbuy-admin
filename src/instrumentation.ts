import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Sentry is now configured through instrumentation-client.ts
  // No need to import separate config files
}

export const onRequestError = Sentry.captureRequestError;
