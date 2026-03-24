import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, firstName, lastName, password } = await request.json();

    if (!to || !firstName || !password) {
      return NextResponse.json({ error: "Fehlende Felder." }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "Hellbeck HR Portal <onboarding@resend.dev>",
      to,
      subject: "Deine Zugangsdaten - Hellbeck HR Portal",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="background: linear-gradient(135deg, #1e40af, #1e3a5f); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Hellbeck HR Portal</h1>
          </div>
          <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin-top: 0;">Hallo ${firstName}${lastName ? " " + lastName : ""},</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              dein Zugang zum Hellbeck HR Portal wurde erstellt. Hier sind deine Anmeldedaten:
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
                <strong>E-Mail:</strong> ${to}
              </p>
              <p style="margin: 0; color: #374151; font-size: 14px;">
                <strong>Passwort:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</code>
              </p>
            </div>
            <p style="color: #ef4444; font-size: 13px; margin-bottom: 24px;">
              Bitte ändere dein Passwort nach der ersten Anmeldung.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0; text-align: center;">
              Diese E-Mail wurde automatisch vom Hellbeck HR Portal generiert.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Serverfehler beim E-Mail-Versand." }, { status: 500 });
  }
}
