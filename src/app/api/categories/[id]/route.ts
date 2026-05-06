// src/app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Category from "@/models/Category";

const updateCategorySchema = z.object({
  name: z.string().min(2, "Category name is required").optional(),
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

async function generateUniqueSlug(name: string, currentCategoryId: string) {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await Category.findOne({
      slug,
      _id: { $ne: currentCategoryId },
      isDeleted: false,
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

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
          message: "Invalid category id",
        },
        { status: 400 },
      );
    }

    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category loaded successfully",
        data: category,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get category by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load category",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

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
          message: "Invalid category id",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    if (validatedData.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
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

      category.name = validatedData.name.trim();
      category.slug = await generateUniqueSlug(validatedData.name, id);
    }

    if (validatedData.description !== undefined) {
      category.description = validatedData.description.trim();
    }

    if (validatedData.isActive !== undefined) {
      category.isActive = validatedData.isActive;
    }

    await category.save();

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        data: category,
      },
      { status: 200 },
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

    console.error("Update category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

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
          message: "Invalid category id",
        },
        { status: 400 },
      );
    }

    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    category.isDeleted = true;
    category.isActive = false;

    await category.save();

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
      },
      { status: 500 },
    );
  }
}
