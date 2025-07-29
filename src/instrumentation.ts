export async function register() {
  // Instrumentation for monitoring and logging
  // No Sentry configuration needed
}

export const onRequestError = (error: Error) => {
  console.error('Request error:', error);
};
