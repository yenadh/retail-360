// src/app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import User from "@/models/User";

const updateUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  role: z
    .enum([
      "ADMIN",
      "CUSTOMER",
      "INVENTORY_MANAGER",
      "SALES_STAFF",
      "DELIVERY_STAFF",
    ])
    .optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([USER_ROLES.ADMIN]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user id",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    }).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User loaded successfully",
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get user by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load user",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([USER_ROLES.ADMIN]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user id",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    if (validatedData.email) {
      const email = validatedData.email.toLowerCase().trim();

      const existingUser = await User.findOne({
        _id: { $ne: id },
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

      user.email = email;
    }

    if (validatedData.fullName !== undefined) {
      user.fullName = validatedData.fullName.trim();
    }

    if (validatedData.password !== undefined && validatedData.password) {
      user.password = await bcrypt.hash(validatedData.password, 10);
    }

    if (validatedData.role !== undefined) {
      user.role = validatedData.role;
    }

    if (validatedData.phone !== undefined) {
      user.phone = validatedData.phone.trim();
    }

    if (validatedData.city !== undefined) {
      user.city = validatedData.city.trim();
    }

    if (validatedData.address !== undefined) {
      user.address = validatedData.address.trim();
    }

    if (validatedData.postalCode !== undefined) {
      user.postalCode = validatedData.postalCode.trim();
    }

    if (validatedData.isEmailVerified !== undefined) {
      user.isEmailVerified = validatedData.isEmailVerified;
    }

    if (validatedData.isActive !== undefined) {
      user.isActive = validatedData.isActive;
    }

    user.updatedBy = auth.user?.userId;

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: safeUser,
      },
      { status: 200 },
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

    console.error("Update user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([USER_ROLES.ADMIN]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user id",
        },
        { status: 400 },
      );
    }

    if (auth.user?.userId === id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    user.isDeleted = true;
    user.isActive = false;
    user.updatedBy = auth.user?.userId;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user",
      },
      { status: 500 },
    );
  }
}
