// src/app/api/store/categories/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({
      isDeleted: false,
      isActive: true,
    }).sort({ name: 1 });

    return NextResponse.json(
      {
        success: true,
        message: "Categories loaded successfully",
        data: categories,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Store categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load categories",
      },
      { status: 500 },
    );
  }
}
