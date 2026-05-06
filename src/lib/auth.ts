// src/lib/auth.ts

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { UserRole } from "./roles";

export type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  fullName?: string;
};

export type EmailVerificationTokenPayload = {
  fullName: string;
  email: string;
  purpose: "EMAIL_VERIFIED";
};

export type PasswordResetTokenPayload = {
  email: string;
  purpose: "PASSWORD_RESET_VERIFIED";
};

const TOKEN_COOKIE_NAME = "retail360_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return new TextEncoder().encode(secret);
}

function getEmailVerificationSecret() {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error("EMAIL_VERIFICATION_SECRET is missing");
  }

  return new TextEncoder().encode(secret);
}

function getPasswordResetSecret() {
  const secret = process.env.PASSWORD_RESET_SECRET;

  if (!secret) {
    throw new Error("PASSWORD_RESET_SECRET is missing");
  }

  return new TextEncoder().encode(secret);
}

export async function createAuthToken(user: AuthUser) {
  return await new SignJWT({
    userId: user.userId,
    email: user.email,
    role: user.role,
    fullName: user.fullName || "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
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

export async function getAuthUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export async function getAuthUserFromRequest(
  request: NextRequest,
): Promise<AuthUser | null> {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export function getAuthCookieName() {
  return TOKEN_COOKIE_NAME;
}

export async function createEmailVerificationToken({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  return await new SignJWT({
    fullName,
    email: email.toLowerCase().trim(),
    purpose: "EMAIL_VERIFIED",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getEmailVerificationSecret());
}

export async function verifyEmailVerificationToken(
  token: string,
): Promise<EmailVerificationTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEmailVerificationSecret());

    if (payload.purpose !== "EMAIL_VERIFIED") {
      return null;
    }

    return {
      fullName: payload.fullName as string,
      email: payload.email as string,
      purpose: payload.purpose as "EMAIL_VERIFIED",
    };
  } catch {
    return null;
  }
}

export async function createPasswordResetToken({ email }: { email: string }) {
  return await new SignJWT({
    email: email.toLowerCase().trim(),
    purpose: "PASSWORD_RESET_VERIFIED",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getPasswordResetSecret());
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<PasswordResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getPasswordResetSecret());

    if (payload.purpose !== "PASSWORD_RESET_VERIFIED") {
      return null;
    }

    return {
      email: payload.email as string,
      purpose: payload.purpose as "PASSWORD_RESET_VERIFIED",
    };
  } catch {
    return null;
  }
}
