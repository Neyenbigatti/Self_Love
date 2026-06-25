import { getResendClient } from './client';
import { passwordResetHtml } from './templates/password-reset';
import { env } from '@/lib/env';

/**
 * Send a password reset email to a user.
 * Logs errors but does NOT throw — the forgot-password flow continues regardless.
 *
 * ═══ DEBUG INSTRUMENTATION ═══════════════════════════════════════════
 * Added 2026-06-25 — logs each step to diagnose Resend in production.
 * Remove after root cause is found and fixed.
 * ═════════════════════════════════════════════════════════════════════
 */
export async function sendPasswordResetEmail(
  email: string,
  rawToken: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  console.log('[Email:DEBUG] sendPasswordResetEmail — ENTRY', {
    email,
    userName,
    APP_URL: env.APP_URL,
    RESEND_FROM: env.RESEND_FROM,
    hasApiKey: !!env.RESEND_API_KEY,
    apiKeyLength: env.RESEND_API_KEY?.length ?? 0,
  });

  try {
    const resend = getResendClient();

    console.log('[Email:DEBUG] sendPasswordResetEmail — BEFORE resend.emails.send');

    const response = await resend.emails.send({
      from: env.RESEND_FROM,
      to: email,
      subject: 'Restablecé tu contraseña — SelfLove',
      html: passwordResetHtml(rawToken, userName),
    });

    console.log('[Email:DEBUG] sendPasswordResetEmail — AFTER resend.emails.send', {
      hasData: !!response.data,
      hasError: !!response.error,
      responseData: response.data,
      responseError: response.error,
    });

    if (response.error) {
      console.error('[Email:DEBUG] sendPasswordResetEmail — RESEND API ERROR (non-2xx)', {
        errorName: response.error.name,
        errorMessage: response.error.message,
        errorStatusCode: response.error.statusCode,
        fullError: JSON.stringify(response.error),
      });
      return { success: false, error: JSON.stringify(response.error) };
    }

    console.log('[Email:DEBUG] sendPasswordResetEmail — SUCCESS', {
      data: response.data,
    });
    return { success: true };
  } catch (err) {
    console.error('[Email:DEBUG] sendPasswordResetEmail — UNCAUGHT EXCEPTION', {
      errorType: typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      fullError: err,
    });
    return { success: false, error: String(err) };
  }
}
