// src/app/api/auth/register/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { createEmailVerificationToken } from "@/lib/auth";
import EmailVerification from "@/models/EmailVerification";

const verifyEmailSchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();

    const verification = await EmailVerification.findOne({
      email,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code expired or not found",
        },
        { status: 400 },
      );
    }

    if (verification.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed attempts. Please request a new code",
        },
        { status: 429 },
      );
    }

    const isCodeValid = await bcrypt.compare(
      validatedData.code,
      verification.codeHash,
    );

    if (!isCodeValid) {
      verification.attempts += 1;
      await verification.save();

      return NextResponse.json(
        {
          success: false,
          message: "Invalid verification code",
        },
        { status: 400 },
      );
    }

    verification.isVerified = true;
    await verification.save();

    const verificationToken = await createEmailVerificationToken({
      fullName: verification.fullName,
      email: verification.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        data: {
          verificationToken,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid verification data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Verify email error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Email verification failed",
      },
      { status: 500 },
    );
  }
}
