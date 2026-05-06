// src/lib/authorize.ts

import { NextResponse } from "next/server";
import { getAuthUserFromCookies } from "./auth";
import { UserRole } from "./roles";

export async function requireAuth() {
  const authUser = await getAuthUserFromCookies();

  if (!authUser) {
    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      ),
    };
  }

  return {
    user: authUser,
    error: null,
  };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const authResult = await requireAuth();

  if (authResult.error || !authResult.user) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to perform this action",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user: authResult.user,
    error: null,
  };
}
