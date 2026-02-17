import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string
) {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/passwort-zuruecksetzen?token=${token}`;

  const resend = getResendClient();
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "HR Portal <noreply@hellbeck.de>",
    to: email,
    subject: "Passwort zurücksetzen – Hellbeck HR Portal",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4c6ef5, #364fc7); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Hellbeck HR Portal</h1>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #0f172a; font-size: 16px;">Hallo ${firstName},</p>
          <p style="color: #475569;">Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #4c6ef5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Passwort zurücksetzen</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Dieser Link ist <strong>1 Stunde</strong> gültig. Falls du kein Passwort-Reset angefordert hast, kannst du diese E-Mail ignorieren.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/><a href="${resetUrl}" style="color: #4c6ef5; word-break: break-all;">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Hellbeck GmbH &middot; HR Portal</p>
        </div>
      </div>
    `,
  });
}
