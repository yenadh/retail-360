import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Product from "@/models/Product";
import Category from "@/models/Category";
import "@/models/Supplier";

export async function GET(request: NextRequest) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const stockStatus = searchParams.get("stockStatus") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { batchNumber: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("categoryId", "name slug")
      .populate("supplierId", "name")
      .sort({ createdAt: -1 });

    let filteredProducts = products;

    if (stockStatus === "low") {
      filteredProducts = products.filter(
        (product) => product.stockQuantity <= product.reorderLevel,
      );
    }

    if (stockStatus === "out") {
      filteredProducts = products.filter(
        (product) => product.stockQuantity === 0,
      );
    }

    if (stockStatus === "available") {
      filteredProducts = products.filter(
        (product) => product.stockQuantity > product.reorderLevel,
      );
    }

    const totalProducts = products.length;
    const totalStock = products.reduce(
      (sum, product) => sum + product.stockQuantity,
      0,
    );
    const lowStockItems = products.filter(
      (product) => product.stockQuantity <= product.reorderLevel,
    ).length;
    const outOfStockItems = products.filter(
      (product) => product.stockQuantity === 0,
    ).length;

    return NextResponse.json(
      {
        success: true,
        message: "Inventory loaded successfully",
        data: {
          summary: {
            totalProducts,
            totalStock,
            lowStockItems,
            outOfStockItems,
          },
          items: filteredProducts,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get inventory error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load inventory",
      },
      { status: 500 },
    );
  }
}
