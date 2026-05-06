// src/app/api/store/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import "@/models/Category";
import "@/models/Supplier";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    const filter: Record<string, unknown> = {
      isDeleted: false,
      isActive: true,
    };

    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = id;
    } else {
      filter.slug = id;
    }

    const product = await Product.findOne(filter)
      .populate("categoryId", "name slug")
      .populate("supplierId", "name")
      .select(
        "name slug sku description categoryId supplierId price discountPrice stockQuantity reorderLevel batchNumber images isFeatured createdAt",
      );

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
    console.error("Store product details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product",
      },
      { status: 500 },
    );
  }
}
