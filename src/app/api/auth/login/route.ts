// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { createAuthToken, getAuthCookieName } from "@/lib/auth";
import User from "@/models/User";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    console.log("LOGIN BODY:", {
      email: body.email,
      hasPassword: !!body.password,
      passwordLength: body.password?.length,
    });

    const validatedData = loginSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();
    const password = validatedData.password;

    console.log("LOGIN EMAIL AFTER FORMAT:", email);

    const user = await User.findOne({
      email,
      isDeleted: false,
    });

    console.log("USER FOUND:", !!user);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password - user not found",
        },
        { status: 401 },
      );
    }

    console.log("USER STATUS:", {
      email: user.email,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      isEmailVerified: user.isEmailVerified,
      passwordExists: !!user.password,
      passwordStartsWithBcrypt:
        typeof user.password === "string" && user.password.startsWith("$2"),
    });

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been disabled",
        },
        { status: 403 },
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email before logging in",
        },
        { status: 403 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log("PASSWORD VALID:", isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password - password not matched",
        },
        { status: 401 },
      );
    }

    const authToken = await createAuthToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
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

    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
      },
      { status: 500 },
    );
  }
}
