import { PostHog } from 'posthog-node';

type EventName =
  | 'staff_logged_in'
  | 'session_started'
  | 'recommendations_generated'
  | 'dress_viewed'
  | 'tryon_generated'
  | 'bill_created'
  | 'return_recorded';

export async function captureServerEvent(
  distinctId: string,
  event: EventName,
  properties: Record<string, unknown>,
): Promise<void> {
  const ph = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  });
  try {
    ph.capture({ distinctId, event, properties });
    await ph.shutdown();
  } catch {
    // PostHog must never block the user response
  }
}
