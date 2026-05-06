// src/app/api/auth/forgot-password/reset/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verifyPasswordResetToken } from "@/lib/auth";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";

const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const decoded = await verifyPasswordResetToken(validatedData.resetToken);

    if (!decoded || decoded.purpose !== "PASSWORD_RESET_VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token",
        },
        { status: 401 },
      );
    }

    const email = decoded.email.toLowerCase().trim();

    const user = await User.findOne({
      email,
      isDeleted: false,
      isActive: true,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found",
        },
        { status: 404 },
      );
    }

    const verifiedReset = await PasswordReset.findOne({
      email,
      isVerified: true,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verifiedReset) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset request expired. Please start again",
        },
        { status: 400 },
      );
    }

    const isSamePassword = await bcrypt.compare(
      validatedData.password,
      user.password,
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be the same as your current password",
        },
        { status: 400 },
      );
    }

    user.password = await bcrypt.hash(validatedData.password, 10);
    user.isEmailVerified = true;

    await user.save();

    await PasswordReset.deleteMany({ email });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully. Please login",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid reset password data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password",
      },
      { status: 500 },
    );
  }
}
