import { getResendClient } from './client';
import { verificationEmailHtml } from './templates/verification';
import { env } from '@/lib/env';

/**
 * Send a verification email to a newly registered user.
 * Logs errors but does NOT throw — the registration flow continues regardless.
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  rawToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: email,
      subject: 'Verificá tu email — SelfLove',
      html: verificationEmailHtml(userName, rawToken),
    });

    if (error) {
      console.error('[Email] Failed to send verification email:', error);
      return { success: false, error: String(error) };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] sendVerificationEmail error:', err);
    return { success: false, error: String(err) };
  }
}
