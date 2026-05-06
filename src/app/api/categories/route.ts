// src/app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Category from "@/models/Category";

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(name: string) {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await Category.findOne({
      slug,
      isDeleted: false,
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function GET() {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const categories = await Category.find({
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: "Categories loaded successfully",
        data: categories,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load categories",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${validatedData.name.trim()}$`,
        $options: "i",
      },
      isDeleted: false,
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name already exists",
        },
        { status: 409 },
      );
    }

    const slug = await generateUniqueSlug(validatedData.name);

    const category = await Category.create({
      name: validatedData.name.trim(),
      slug,
      description: validatedData.description?.trim() || "",
      isActive: validatedData.isActive ?? true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: category,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid category data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Create category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 },
    );
  }
}
