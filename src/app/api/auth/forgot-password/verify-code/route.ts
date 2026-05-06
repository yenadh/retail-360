// src/app/api/auth/forgot-password/verify-code/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { createPasswordResetToken } from "@/lib/auth";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";

const verifyResetCodeSchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Reset code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = verifyResetCodeSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();

    const user = await User.findOne({
      email,
      isDeleted: false,
      isActive: true,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reset request",
        },
        { status: 400 },
      );
    }

    const passwordReset = await PasswordReset.findOne({
      email,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!passwordReset) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset code expired or not found",
        },
        { status: 400 },
      );
    }

    if (passwordReset.attempts >= 5) {
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
      passwordReset.codeHash,
    );

    if (!isCodeValid) {
      passwordReset.attempts += 1;
      await passwordReset.save();

      return NextResponse.json(
        {
          success: false,
          message: "Invalid reset code",
        },
        { status: 400 },
      );
    }

    passwordReset.isVerified = true;
    await passwordReset.save();

    const resetToken = await createPasswordResetToken({
      email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Reset code verified successfully",
        data: {
          resetToken,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid reset code data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Verify reset code error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify reset code",
      },
      { status: 500 },
    );
  }
}
