// src/app/api/reports/inventory/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";
import "@/models/Category";
import "@/models/Supplier";

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

    const products = await Product.find({
      isDeleted: false,
    })
      .populate("categoryId", "name slug")
      .populate("supplierId", "name");

    const totalProducts = products.length;
    const activeProducts = products.filter(
      (product) => product.isActive,
    ).length;

    const totalStockUnits = products.reduce(
      (sum, product) => sum + product.stockQuantity,
      0,
    );

    const totalInventoryValue = products.reduce((sum, product) => {
      const sellingPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      return sum + sellingPrice * product.stockQuantity;
    }, 0);

    const lowStockProducts = products.filter(
      (product) => product.stockQuantity <= product.reorderLevel,
    );

    const outOfStockProducts = products.filter(
      (product) => product.stockQuantity === 0,
    );

    const categoryMap = new Map<
      string,
      {
        category: string;
        products: number;
        stockUnits: number;
        inventoryValue: number;
      }
    >();

    for (const product of products) {
      const categoryName =
        typeof product.categoryId === "string"
          ? "Unknown"
          : product.categoryId?.name || "Unknown";

      const current = categoryMap.get(categoryName) || {
        category: categoryName,
        products: 0,
        stockUnits: 0,
        inventoryValue: 0,
      };

      const sellingPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      current.products += 1;
      current.stockUnits += product.stockQuantity;
      current.inventoryValue += sellingPrice * product.stockQuantity;

      categoryMap.set(categoryName, current);
    }

    const inventoryByCategory = Array.from(categoryMap.values()).sort(
      (a, b) => b.inventoryValue - a.inventoryValue,
    );

    const recentMovements = await StockMovement.find({})
      .populate("productId", "name sku")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(15);

    return NextResponse.json(
      {
        success: true,
        message: "Inventory report loaded successfully",
        data: {
          totalProducts,
          activeProducts,
          totalStockUnits,
          totalInventoryValue,
          lowStockProducts,
          outOfStockProducts,
          inventoryByCategory,
          recentMovements,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get inventory report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load inventory report",
      },
      { status: 500 },
    );
  }
}
