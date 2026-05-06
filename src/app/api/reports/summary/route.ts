// src/app/api/reports/summary/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Delivery from "@/models/Delivery";
import StockMovement from "@/models/StockMovement";
import "@/models/User";
import "@/models/Category";
import "@/models/Supplier";

export async function GET() {
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

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalDeliveries,
      pendingDeliveries,
      deliveredDeliveries,
      recentOrders,
      recentStockMovements,
    ] = await Promise.all([
      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({ isDeleted: false, isActive: true }),

      Product.countDocuments({
        isDeleted: false,
        $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
      }),

      Product.countDocuments({
        isDeleted: false,
        stockQuantity: 0,
      }),

      Order.countDocuments({ isDeleted: false }),
      Order.countDocuments({ isDeleted: false, orderStatus: "PENDING" }),
      Order.countDocuments({ isDeleted: false, orderStatus: "DELIVERED" }),
      Order.countDocuments({ isDeleted: false, orderStatus: "CANCELLED" }),

      Delivery.countDocuments({ isDeleted: false }),
      Delivery.countDocuments({
        isDeleted: false,
        deliveryStatus: { $in: ["PENDING", "READY_FOR_DISPATCH"] },
      }),
      Delivery.countDocuments({
        isDeleted: false,
        deliveryStatus: "DELIVERED",
      }),

      Order.find({ isDeleted: false })
        .populate("customerId", "fullName email")
        .sort({ createdAt: -1 })
        .limit(8),

      StockMovement.find({})
        .populate("productId", "name sku")
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    const paidOrders = await Order.find({
      isDeleted: false,
      paymentStatus: "PAID",
    });

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const inventoryProducts = await Product.find({
      isDeleted: false,
      isActive: true,
    });

    const totalInventoryValue = inventoryProducts.reduce((sum, product) => {
      const sellingPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      return sum + sellingPrice * product.stockQuantity;
    }, 0);

    const totalStockUnits = inventoryProducts.reduce(
      (sum, product) => sum + product.stockQuantity,
      0,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Report summary loaded successfully",
        data: {
          sales: {
            totalRevenue,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
          },
          inventory: {
            totalProducts,
            activeProducts,
            lowStockProducts,
            outOfStockProducts,
            totalInventoryValue,
            totalStockUnits,
          },
          deliveries: {
            totalDeliveries,
            pendingDeliveries,
            deliveredDeliveries,
          },
          recentOrders,
          recentStockMovements,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get report summary error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load report summary",
      },
      { status: 500 },
    );
  }
}
