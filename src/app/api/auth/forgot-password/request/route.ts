// src/app/api/auth/forgot-password/request/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { sendEmail } from "@/lib/sendMail";
const requestResetSchema = z.object({
  email: z.string().email("Valid email is required"),
});

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getPasswordResetEmailTemplate({
  fullName,
  code,
}: {
  fullName: string;
  code: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:linear-gradient(135deg,#2E1065,#7C3AED,#EC4899);border-radius:24px 24px 0 0;padding:32px;color:#ffffff;">
          <h1 style="margin:0;font-size:28px;font-weight:800;">Retail360</h1>
          <p style="margin:8px 0 0;color:#ede9fe;font-size:14px;">
            Password Reset Verification
          </p>
        </div>

        <div style="background:#ffffff;border:1px solid #ede9fe;border-top:0;border-radius:0 0 24px 24px;padding:32px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:22px;">
            Reset your password
          </h2>

          <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.7;">
            Hi ${fullName || "there"}, we received a request to reset your Retail360 account password.
            Use the verification code below to continue.
          </p>

          <div style="margin:28px 0;text-align:center;">
            <div style="display:inline-block;background:#f3e8ff;color:#7C3AED;border-radius:18px;padding:18px 28px;font-size:32px;font-weight:800;letter-spacing:8px;">
              ${code}
            </div>
          </div>

          <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.7;">
            This code will expire in <strong>10 minutes</strong>.
          </p>

          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
            If you did not request this password reset, you can safely ignore this email.
          </p>

          <div style="margin-top:28px;border-top:1px solid #e2e8f0;padding-top:18px;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Retail360 Online Retail Management
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = requestResetSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();

    const user = await User.findOne({
      email,
      isDeleted: false,
    });

    /*
      Security note:
      For non-existing emails, we still return success.
      This prevents people from checking which emails are registered.
    */
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this email, a reset code has been sent",
        },
        { status: 200 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This account is disabled. Please contact support",
        },
        { status: 403 },
      );
    }

    await PasswordReset.deleteMany({ email });

    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.create({
      email,
      codeHash,
      expiresAt,
      attempts: 0,
      isVerified: false,
    });

    await sendEmail({
      to: email,
      subject: "Retail360 Password Reset Code",
      html: getPasswordResetEmailTemplate({
        fullName: user.fullName,
        code,
      }),
    });

    console.log("PASSWORD RESET CODE SENT:", {
      email,
      code: process.env.NODE_ENV === "development" ? code : "hidden",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset code sent successfully",
        data: {
          developmentCode:
            process.env.NODE_ENV === "development" ? code : undefined,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid email",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Forgot password request error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to request password reset",
      },
      { status: 500 },
    );
  }
}
