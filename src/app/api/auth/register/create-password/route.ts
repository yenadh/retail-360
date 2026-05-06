// src/app/api/auth/register/create-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import {
  createAuthToken,
  getAuthCookieName,
  verifyEmailVerificationToken,
} from "@/lib/auth";
import User from "@/models/User";
import EmailVerification from "@/models/EmailVerification";

const createPasswordSchema = z
  .object({
    verificationToken: z.string().min(1, "Verification token is required"),
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
    const validatedData = createPasswordSchema.parse(body);

    const decoded = await verifyEmailVerificationToken(
      validatedData.verificationToken,
    );

    if (!decoded || decoded.purpose !== "EMAIL_VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification token",
        },
        { status: 401 },
      );
    }

    const email = decoded.email.toLowerCase().trim();

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

    const verification = await EmailVerification.findOne({
      email,
      isVerified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "Email verification expired. Please start again",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await User.create({
      fullName: decoded.fullName,
      email,
      password: hashedPassword,
      role: "CUSTOMER",
      isEmailVerified: true,
    });

    await EmailVerification.deleteMany({ email });

    const authToken = await createAuthToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );

    response.cookies.set(getAuthCookieName(), authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid request data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Create password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create account",
      },
      { status: 500 },
    );
  }
}
