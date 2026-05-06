// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Product from "@/models/Product";
import Category from "@/models/Category";
import "@/models/Supplier";

const productSchema = z
  .object({
    name: z.string().min(2, "Product name is required"),
    sku: z.string().min(2, "SKU is required"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    supplierId: z.string().optional().nullable(),
    price: z.coerce.number().min(0, "Price must be 0 or greater"),
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
      if (!data.discountPrice) return true;
      return data.discountPrice <= data.price;
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

async function generateUniqueSlug(name: string) {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await Product.findOne({
      slug,
      isDeleted: false,
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    const products = await Product.find(filter)
      .populate("categoryId", "name slug")
      .populate("supplierId", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: "Products loaded successfully",
        data: products,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load products",
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
    const validatedData = productSchema.parse(body);

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

    const sku = validatedData.sku.toUpperCase().trim();

    const existingProduct = await Product.findOne({
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

    const slug = await generateUniqueSlug(validatedData.name);

    const images = validatedData.imageUrl
      ? [
          {
            url: validatedData.imageUrl,
            publicId: "",
          },
        ]
      : [];

    const product = await Product.create({
      name: validatedData.name.trim(),
      slug,
      sku,
      description: validatedData.description?.trim() || "",
      categoryId: validatedData.categoryId,
      supplierId: validatedData.supplierId || null,
      price: validatedData.price,
      discountPrice: validatedData.discountPrice || 0,
      stockQuantity: validatedData.stockQuantity || 0,
      reorderLevel: validatedData.reorderLevel || 10,
      batchNumber: validatedData.batchNumber?.trim() || "",
      images,
      isFeatured: validatedData.isFeatured ?? false,
      isActive: validatedData.isActive ?? true,
      createdBy: auth.user?.userId,
    });

    const populatedProduct = await Product.findById(product._id)
      .populate("categoryId", "name slug")
      .populate("supplierId", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: populatedProduct,
      },
      { status: 201 },
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

    console.error("Create product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      { status: 500 },
    );
  }
}
