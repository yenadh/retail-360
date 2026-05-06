// src/lib/email.ts

import nodemailer from "nodemailer";

type SendVerificationEmailParams = {
  to: string;
  fullName: string;
  code: string;
};

export async function sendVerificationEmail({
  to,
  fullName,
  code,
}: SendVerificationEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP environment variables are missing");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Verify your Retail360 account",
    html: `
      <div style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 30px;">
        <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #1c334f, #0453a7); padding: 24px; color: #ffffff;">
            <h2 style="margin: 0;">Retail360 Email Verification</h2>
            <p style="margin: 8px 0 0;">Secure your account before continuing.</p>
          </div>

          <div style="padding: 28px;">
            <p style="font-size: 16px;">Hi ${fullName},</p>
            <p style="font-size: 15px; color: #374151;">
              Use the verification code below to continue creating your Retail360 account.
            </p>

            <div style="margin: 24px 0; text-align: center;">
              <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #0453a7; background: #eef6ff; padding: 16px 24px; border-radius: 12px;">
                ${code}
              </div>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              This code will expire in 10 minutes. If you did not request this, you can ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
