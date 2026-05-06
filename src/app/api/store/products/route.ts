// src/app/api/store/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import "@/models/Category";
import "@/models/Supplier";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const featured = searchParams.get("featured") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
      isActive: true,
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

    if (featured === "true") {
      filter.isFeatured = true;
    }

    const products = await Product.find(filter)
      .populate("categoryId", "name slug")
      .select(
        "name slug sku description categoryId price discountPrice stockQuantity reorderLevel images isFeatured createdAt",
      )
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
    console.error("Store products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load products",
      },
      { status: 500 },
    );
  }
}
