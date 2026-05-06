// src/app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import User from "@/models/User";

const createSystemUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "INVENTORY_MANAGER", "SALES_STAFF", "DELIVERY_STAFF"]),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireRole([USER_ROLES.ADMIN]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (type === "customers") {
      filter.role = USER_ROLES.CUSTOMER;
    }

    if (type === "system") {
      filter.role = {
        $ne: USER_ROLES.CUSTOMER,
      };
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    const customers = users.filter((user) => user.role === USER_ROLES.CUSTOMER);
    const systemUsers = users.filter(
      (user) => user.role !== USER_ROLES.CUSTOMER,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Users loaded successfully",
        data: {
          customers,
          systemUsers,
          all: users,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load users",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([USER_ROLES.ADMIN]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const body = await request.json();
    const validatedData = createSystemUserSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email,
      isDeleted: false,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await User.create({
      fullName: validatedData.fullName.trim(),
      email,
      password: hashedPassword,
      role: validatedData.role,
      phone: validatedData.phone?.trim() || "",
      city: validatedData.city?.trim() || "",
      address: validatedData.address?.trim() || "",
      postalCode: validatedData.postalCode?.trim() || "",
      isEmailVerified: true,
      isActive: validatedData.isActive ?? true,
      createdBy: auth.user?.userId,
    });

    const safeUser = await User.findById(user._id).select("-password");

    return NextResponse.json(
      {
        success: true,
        message: "System user created successfully",
        data: safeUser,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid user data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Create system user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create system user",
      },
      { status: 500 },
    );
  }
}
