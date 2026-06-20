import { env } from '@/lib/env';

/**
 * Generate an inline HTML email for password reset.
 */
export function passwordResetHtml(rawToken: string, userName: string): string {
  const resetUrl = `${env.APP_URL}/auth/reset-password?token=${rawToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .logo { text-align: center; font-size: 24px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px; font-family: Georgia, serif; }
    .sub { text-align: center; font-size: 13px; color: #888; margin-bottom: 24px; }
    h1 { font-size: 20px; color: #1a1a2e; margin: 0 0 8px; text-align: center; }
    p { font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px; }
    .button { display: block; width: fit-content; margin: 24px auto; padding: 14px 32px; background: #1a1a2e; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500; }
    .fallback { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #666; word-break: break-all; margin: 16px 0; }
    .footer { font-size: 12px; color: #aaa; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">SelfLove</div>
    <div class="sub">Estética Médica Premium</div>

    <h1>Restablecé tu contraseña</h1>
    <p>Hola <strong>${escapeHtml(userName)}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón de abajo para crear una nueva:</p>

    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>

    <p style="text-align:center;font-size:13px;color:#888;">O copiá este enlace en tu navegador:</p>
    <div class="fallback">${resetUrl}</div>

    <p style="font-size:13px;color:#888;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignorá este mensaje.</p>

    <div class="footer">
      SelfLove &mdash; Estética Médica Premium
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
