// src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Product from "@/models/Product";
import Category from "@/models/Category";

const updateProductSchema = z
  .object({
    name: z.string().min(2, "Product name is required").optional(),
    sku: z.string().min(2, "SKU is required").optional(),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required").optional(),
    supplierId: z.string().optional().nullable(),
    price: z.coerce.number().min(0, "Price must be 0 or greater").optional(),
    discountPrice: z.coerce.number().min(0).optional(),
    stockQuantity: z.coerce.number().min(0).optional(),
    reorderLevel: z.coerce.number().min(0).optional(),
    batchNumber: z.string().optional(),
    imageUrl: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.price !== undefined &&
        data.discountPrice !== undefined &&
        data.discountPrice > data.price
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Discount price cannot be greater than product price",
      path: ["discountPrice"],
    },
  );

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(name: string, currentProductId: string) {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await Product.findOne({
      slug,
      _id: { $ne: currentProductId },
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
    USER_ROLES.SALES_STAFF,
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
          message: "Invalid product id",
        },
        { status: 400 },
      );
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("categoryId", "name slug")
      .populate("supplierId", "name");

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product loaded successfully",
        data: product,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get product by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product",
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
          message: "Invalid product id",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    if (validatedData.categoryId) {
      const category = await Category.findOne({
        _id: validatedData.categoryId,
        isDeleted: false,
        isActive: true,
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected category was not found or inactive",
          },
          { status: 400 },
        );
      }

      product.categoryId = validatedData.categoryId;
    }

    if (validatedData.name) {
      product.name = validatedData.name.trim();
      product.slug = await generateUniqueSlug(validatedData.name, id);
    }

    if (validatedData.sku) {
      const sku = validatedData.sku.toUpperCase().trim();

      const existingProduct = await Product.findOne({
        _id: { $ne: id },
        sku,
        isDeleted: false,
      });

      if (existingProduct) {
        return NextResponse.json(
          {
            success: false,
            message: "Product SKU already exists",
          },
          { status: 409 },
        );
      }

      product.sku = sku;
    }

    if (validatedData.description !== undefined) {
      product.description = validatedData.description.trim();
    }

    if (validatedData.supplierId !== undefined) {
      product.supplierId = validatedData.supplierId || null;
    }

    if (validatedData.price !== undefined) {
      product.price = validatedData.price;
    }

    if (validatedData.discountPrice !== undefined) {
      product.discountPrice = validatedData.discountPrice;
    }

    if (validatedData.stockQuantity !== undefined) {
      product.stockQuantity = validatedData.stockQuantity;
    }

    if (validatedData.reorderLevel !== undefined) {
      product.reorderLevel = validatedData.reorderLevel;
    }

    if (validatedData.batchNumber !== undefined) {
      product.batchNumber = validatedData.batchNumber.trim();
    }

    if (validatedData.imageUrl !== undefined) {
      product.images = validatedData.imageUrl
        ? [
            {
              url: validatedData.imageUrl,
              publicId: "",
            },
          ]
        : [];
    }

    if (validatedData.isFeatured !== undefined) {
      product.isFeatured = validatedData.isFeatured;
    }

    if (validatedData.isActive !== undefined) {
      product.isActive = validatedData.isActive;
    }

    product.updatedBy = auth.user?.userId;

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("categoryId", "name slug")
      .populate("supplierId", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        data: populatedProduct,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid product data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Update product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
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
          message: "Invalid product id",
        },
        { status: 400 },
      );
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    product.isDeleted = true;
    product.isActive = false;
    product.updatedBy = auth.user?.userId;

    await product.save();

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 },
    );
  }
}
