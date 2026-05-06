// src/app/api/auth/register/request-verification/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { sendVerificationEmail } from "@/lib/email";
import User from "@/models/User";
import EmailVerification from "@/models/EmailVerification";

const requestVerificationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
});

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = requestVerificationSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email,
      isDeleted: false,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 },
      );
    }

    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);

    await EmailVerification.deleteMany({ email });

    await EmailVerification.create({
      fullName: validatedData.fullName.trim(),
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationEmail({
      to: email,
      fullName: validatedData.fullName.trim(),
      code,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent to your email",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Request verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send verification code",
      },
      { status: 500 },
    );
  }
}
