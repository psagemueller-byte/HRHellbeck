import { Resend } from "resend";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, firstName, newPassword } = await request.json();

    if (!to || !firstName || !newPassword) {
      return NextResponse.json({ error: "Fehlende Felder." }, { status: 400 });
    }

    // Update password hash in database
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const user = await prisma.user.findUnique({ where: { email: to.toLowerCase() } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    const { error } = await resend.emails.send({
      from: "Hellbeck HR Portal <onboarding@resend.dev>",
      to,
      subject: "Neues Passwort - Hellbeck HR Portal",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="background: linear-gradient(135deg, #1e40af, #1e3a5f); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Hellbeck HR Portal</h1>
          </div>
          <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin-top: 0;">Hallo ${firstName},</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Dein Passwort wurde zurückgesetzt. Hier ist dein neues Passwort:
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                <strong>Neues Passwort:</strong><br/>
                <code style="background: #e5e7eb; padding: 4px 12px; border-radius: 4px; font-size: 18px; letter-spacing: 1px;">${newPassword}</code>
              </p>
            </div>
            <p style="color: #ef4444; font-size: 13px; margin-bottom: 24px;">
              Bitte ändere dein Passwort nach der Anmeldung.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0; text-align: center;">
              Falls du kein neues Passwort angefordert hast, kontaktiere bitte die HR-Abteilung.
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
