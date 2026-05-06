// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ROUTE_ROLE_ACCESS, UserRole } from "./src/lib/roles";

const TOKEN_COOKIE_NAME = "retail360_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      fullName: payload.fullName as string,
    };
  } catch {
    return null;
  }
}

function getAllowedRoles(pathname: string): UserRole[] | null {
  const matchedRoute = Object.keys(ROUTE_ROLE_ACCESS)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(route));

  if (!matchedRoute) {
    return null;
  }

  return ROUTE_ROLE_ACCESS[matchedRoute];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const authUser = token ? await verifyToken(token) : null;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerProtectedRoute =
    pathname.startsWith("/my-orders") || pathname.startsWith("/checkout");

  if (isAuthPage && authUser) {
    if (authUser.role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if ((isAdminRoute || isCustomerProtectedRoute) && !authUser) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && authUser) {
    const allowedRoles = getAllowedRoles(pathname);

    if (!allowedRoles || !allowedRoles.includes(authUser.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/checkout/:path*",
    "/my-orders/:path*",
  ],
};
