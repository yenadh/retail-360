// src/app/api/auth/me/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromCookies } from "@/lib/auth";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const authUser = await getAuthUserFromCookies();

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const user = await User.findOne({
      _id: authUser.userId,
      isDeleted: false,
      isActive: true,
    }).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User loaded successfully",
        data: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load user",
      },
      { status: 500 },
    );
  }
}
