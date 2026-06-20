import { Resend } from 'resend';
import { env } from '@/lib/env';

let client: Resend | null = null;

/**
 * Get or create the Resend client singleton.
 * Uses lazy initialization so the API key is only loaded when email is actually sent.
 */
export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}
