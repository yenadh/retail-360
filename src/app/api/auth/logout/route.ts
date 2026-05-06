// src/app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { getAuthCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully",
    },
    { status: 200 },
  );

  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
