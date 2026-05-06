// src/lib/email.ts

import nodemailer from "nodemailer";

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing in environment variables`);
  }

  return value;
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const from = process.env.SMTP_FROM;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
});

export async function sendMail({ to, subject, html, text }: SendMailParams) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Send mail error:", error);

    throw new Error("Failed to send email");
  }
}

// Optional alias if some APIs use sendEmail instead of sendMail
export const sendEmail = sendMail;
