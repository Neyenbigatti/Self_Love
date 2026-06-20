import { getResendClient } from './client';
import { passwordResetHtml } from './templates/password-reset';
import { env } from '@/lib/env';

/**
 * Send a password reset email to a user.
 * Logs errors but does NOT throw — the forgot-password flow continues regardless.
 */
export async function sendPasswordResetEmail(
  email: string,
  rawToken: string,
  userName: string,
): Promise<{ success: boolean }> {
  try {
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: email,
      subject: 'Restablecé tu contraseña — SelfLove',
      html: passwordResetHtml(rawToken, userName),
    });

    if (error) {
      console.error('[Email] Failed to send password reset email:', error);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] sendPasswordResetEmail error:', err);
    return { success: false };
  }
}
